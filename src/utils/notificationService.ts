import { supabase } from '../supabaseClient';
import { SMSService } from './smsService';
import { NotificationPreferences, Notification } from '../types';

export interface NotificationEvent {
  userId: string;
  type: 'match_found' | 'profile_viewed' | 'reminder' | 'message_received';
  data?: {
    matchName?: string;
    matchId?: string;
    messagePreview?: string;
    viewerName?: string;
    viewerId?: string;
  };
}

export class NotificationService {
  /**
   * Get phone number for user (handles demo mode)
   */
  private static async getPhoneNumber(userId: string): Promise<string | null> {
    // Handle demo user
    if (userId === 'demo-user') {
      return '+16504416163'; // Demo phone number
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', userId)
        .single();

      if (error || !user?.phone_number) {
        console.error('Error getting user phone number:', error);
        return null;
      }

      return user.phone_number;
    } catch (error) {
      console.error('Error in getPhoneNumber:', error);
      return null;
    }
  }

  /**
   * Check if user should receive notifications (handles demo mode)
   */
  private static async shouldSendNotificationForUser(
    userId: string, 
    notificationType: 'new_matches' | 'profile_views' | 'messages' | 'activity_reminders'
  ): Promise<boolean> {
    // For demo user, always allow notifications
    if (userId === 'demo-user') {
      return true;
    }

    return await this.shouldSendNotification(userId, notificationType);
  }

  /**
   * Create default notification preferences for a new user
   */
  static async createDefaultPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          sms_notifications: true,
          new_matches: true,
          profile_views: true,
          messages: true,
          activity_reminders: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'America/Los_Angeles' // California time
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createDefaultPreferences:', error);
      return null;
    }
  }

  /**
   * Get user's notification preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      // If no preferences exist, create default ones
      if (!data) {
        return await this.createDefaultPreferences(userId);
      }

      return data;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  /**
   * Update user's notification preferences
   */
  static async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      return false;
    }
  }

  /**
   * Check if user should receive notifications (considering quiet hours)
   */
  static async shouldSendNotification(
    userId: string, 
    notificationType: 'new_matches' | 'profile_views' | 'messages' | 'activity_reminders'
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences || !preferences.sms_notifications) {
        return false;
      }

      // Check if this type of notification is enabled
      if (!preferences[notificationType]) {
        return false;
      }

      // Check quiet hours
      if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
        const now = new Date();
        const timezone = preferences.timezone || 'America/Los_Angeles';
        
        // Convert current time to user's timezone
        const userTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        // Parse quiet hours
        const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
        const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
        const quietStart = startHour * 60 + startMinute;
        const quietEnd = endHour * 60 + endMinute;

        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (quietStart > quietEnd) {
          if (currentTime >= quietStart || currentTime <= quietEnd) {
            return false; // In quiet hours
          }
        } else {
          if (currentTime >= quietStart && currentTime <= quietEnd) {
            return false; // In quiet hours
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error in shouldSendNotification:', error);
      return false;
    }
  }

  /**
   * Log a notification to the database
   */
  static async logNotification(
    userId: string,
    type: string,
    phoneNumber: string,
    messageBody: string,
    status: 'sent' | 'delivered' | 'failed' = 'sent',
    data?: any
  ): Promise<void> {
    try {
      // Skip database logging for demo user
      if (userId === 'demo-user') {
        console.log(`Demo notification logged: ${type} to ${phoneNumber} - ${status}`);
        return;
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          phone_number: phoneNumber,
          message_body: messageBody,
          status,
          data
        });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Send a new match notification
   */
  static async sendMatchNotification(event: NotificationEvent): Promise<boolean> {
    try {
      const canSend = await this.shouldSendNotificationForUser(event.userId, 'new_matches');
      if (!canSend) {
        return false;
      }

      // Get user's phone number
      const phoneNumber = await this.getPhoneNumber(event.userId);
      if (!phoneNumber) {
        console.error('Could not get phone number for user:', event.userId);
        return false;
      }

      const matchName = event.data?.matchName || 'Someone';
      const success = await SMSService.sendNewMatchNotification(phoneNumber, matchName);

      // Log the notification
      await this.logNotification(
        event.userId,
        'match_found',
        phoneNumber,
        `🎉 You have a new match on Matching! ${matchName} is interested in you. Open the app to connect! 💕`,
        success ? 'sent' : 'failed',
        event.data
      );

      return success;
    } catch (error) {
      console.error('Error sending match notification:', error);
      return false;
    }
  }

  /**
   * Send a profile view notification
   */
  static async sendProfileViewNotification(event: NotificationEvent): Promise<boolean> {
    try {
      const canSend = await this.shouldSendNotificationForUser(event.userId, 'profile_views');
      if (!canSend) {
        return false;
      }

      // Get user's phone number
      const phoneNumber = await this.getPhoneNumber(event.userId);
      if (!phoneNumber) {
        console.error('Could not get phone number for user:', event.userId);
        return false;
      }

      const viewerName = event.data?.viewerName || 'Someone';
      const success = await SMSService.sendProfileViewNotification(phoneNumber, viewerName);

      // Log the notification
      await this.logNotification(
        event.userId,
        'profile_viewed',
        phoneNumber,
        `👀 ${viewerName} viewed your profile on Matching! Check them out in the app.`,
        success ? 'sent' : 'failed',
        event.data
      );

      return success;
    } catch (error) {
      console.error('Error sending profile view notification:', error);
      return false;
    }
  }

  /**
   * Send a message notification
   */
  static async sendMessageNotification(event: NotificationEvent): Promise<boolean> {
    try {
      const canSend = await this.shouldSendNotificationForUser(event.userId, 'messages');
      if (!canSend) {
        return false;
      }

      // Get user's phone number
      const phoneNumber = await this.getPhoneNumber(event.userId);
      if (!phoneNumber) {
        console.error('Could not get phone number for user:', event.userId);
        return false;
      }

      const matchName = event.data?.matchName || 'Someone';
      const messagePreview = event.data?.messagePreview || 'sent you a message';
      const success = await SMSService.sendNewMessageNotification(
        phoneNumber, 
        matchName, 
        messagePreview
      );

      // Log the notification
      await this.logNotification(
        event.userId,
        'message_received',
        phoneNumber,
        `💬 New message from ${matchName}: "${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}" Reply in the Matching app!`,
        success ? 'sent' : 'failed',
        event.data
      );

      return success;
    } catch (error) {
      console.error('Error sending message notification:', error);
      return false;
    }
  }

  /**
   * Send an activity reminder
   */
  static async sendActivityReminder(userId: string): Promise<boolean> {
    try {
      const canSend = await this.shouldSendNotificationForUser(userId, 'activity_reminders');
      if (!canSend) {
        return false;
      }

      // Get user's phone number
      const phoneNumber = await this.getPhoneNumber(userId);
      if (!phoneNumber) {
        console.error('Could not get phone number for user:', userId);
        return false;
      }

      const success = await SMSService.sendActivityReminderNotification(phoneNumber);

      // Log the notification
      await this.logNotification(
        userId,
        'reminder',
        phoneNumber,
        '✨ Your perfect match might be waiting! You have potential matches on Matching. Open the app to see who\'s interested in you! 💕',
        success ? 'sent' : 'failed'
      );

      return success;
    } catch (error) {
      console.error('Error sending activity reminder:', error);
      return false;
    }
  }

  /**
   * Process a notification event (main entry point)
   */
  static async processNotificationEvent(event: NotificationEvent): Promise<boolean> {
    switch (event.type) {
      case 'match_found':
        return await this.sendMatchNotification(event);
      case 'profile_viewed':
        return await this.sendProfileViewNotification(event);
      case 'message_received':
        return await this.sendMessageNotification(event);
      case 'reminder':
        return await this.sendActivityReminder(event.userId);
      default:
        console.error('Unknown notification type:', event.type);
        return false;
    }
  }

  /**
   * Get notification history for a user
   */
  static async getNotificationHistory(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notification history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNotificationHistory:', error);
      return [];
    }
  }
} 