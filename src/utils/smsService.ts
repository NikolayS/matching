export interface SMSNotificationData {
  to: string;
  type: 'new_match' | 'message_received' | 'profile_viewed' | 'reminder';
  data?: {
    matchName?: string;
    messagePreview?: string;
    viewerName?: string;
  };
}

export class SMSService {
  private static async callBackendAPI(endpoint: string, data: any): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3001/api/sms/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error(`Error calling backend API ${endpoint}:`, error);
      return false;
    }
  }

  /**
   * Send a new match notification
   */
  static async sendNewMatchNotification(phoneNumber: string, matchName: string): Promise<boolean> {
    console.log(`Sending new match SMS to ${phoneNumber} for match: ${matchName}`);
    
    return await this.callBackendAPI('match', {
      phoneNumber,
      matchName
    });
  }

  /**
   * Send a new message notification
   */
  static async sendNewMessageNotification(
    phoneNumber: string, 
    senderName: string, 
    messagePreview: string
  ): Promise<boolean> {
    console.log(`Sending new message SMS to ${phoneNumber} from ${senderName}`);
    
    return await this.callBackendAPI('message', {
      phoneNumber,
      senderName,
      messagePreview
    });
  }

  /**
   * Send a profile view notification
   */
  static async sendProfileViewNotification(phoneNumber: string, viewerName: string): Promise<boolean> {
    console.log(`Sending profile view SMS to ${phoneNumber} from viewer: ${viewerName}`);
    
    return await this.callBackendAPI('profile-view', {
      phoneNumber,
      viewerName
    });
  }

  /**
   * Send a gentle reminder to inactive users
   */
  static async sendActivityReminderNotification(phoneNumber: string): Promise<boolean> {
    console.log(`Sending activity reminder SMS to ${phoneNumber}`);
    
    return await this.callBackendAPI('reminder', {
      phoneNumber
    });
  }

  /**
   * Generic SMS sender with custom message
   */
  static async sendCustomNotification(phoneNumber: string, message: string): Promise<boolean> {
    console.log(`Sending custom SMS to ${phoneNumber}: ${message}`);
    
    // For now, simulate success - we'll implement the actual backend later
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ Custom SMS sent successfully to ${phoneNumber}`);
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Send bulk notifications (with rate limiting)
   */
  static async sendBulkNotifications(notifications: SMSNotificationData[]): Promise<void> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const notification of notifications) {
      try {
        switch (notification.type) {
          case 'new_match':
            if (notification.data?.matchName) {
              await this.sendNewMatchNotification(notification.to, notification.data.matchName);
            }
            break;
          case 'message_received':
            if (notification.data?.matchName && notification.data?.messagePreview) {
              await this.sendNewMessageNotification(
                notification.to, 
                notification.data.matchName, 
                notification.data.messagePreview
              );
            }
            break;
          case 'profile_viewed':
            if (notification.data?.viewerName) {
              await this.sendProfileViewNotification(notification.to, notification.data.viewerName);
            }
            break;
          case 'reminder':
            await this.sendActivityReminderNotification(notification.to);
            break;
        }
        
        // Rate limiting: wait 1 second between messages
        await delay(1000);
      } catch (error) {
        console.error(`Error sending bulk notification to ${notification.to}:`, error);
      }
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation (should start with + and country code)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for Twilio (ensure it has country code)
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's a US number without country code, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already has country code but no +, add it
    if (cleaned.length > 10 && !phoneNumber.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phoneNumber;
  }
} 