import { NotificationService } from './notificationService';

export class NotificationTester {
  /**
   * Test match notification
   */
  static async testMatchNotification(userId: string): Promise<boolean> {
    console.log('🧪 Testing match notification...');
    
    const result = await NotificationService.processNotificationEvent({
      userId,
      type: 'match_found',
      data: {
        matchName: 'Alex',
        matchId: 'test-match-id'
      }
    });

    console.log(`Match notification result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
    return result;
  }

  /**
   * Test profile view notification
   */
  static async testProfileViewNotification(userId: string): Promise<boolean> {
    console.log('🧪 Testing profile view notification...');
    
    const result = await NotificationService.processNotificationEvent({
      userId,
      type: 'profile_viewed',
      data: {
        viewerName: 'Jordan',
        viewerId: 'test-viewer-id'
      }
    });

    console.log(`Profile view notification result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
    return result;
  }

  /**
   * Test message notification
   */
  static async testMessageNotification(userId: string): Promise<boolean> {
    console.log('🧪 Testing message notification...');
    
    const result = await NotificationService.processNotificationEvent({
      userId,
      type: 'message_received',
      data: {
        matchName: 'Sam',
        messagePreview: 'Hey! How are you doing today? Would you like to grab coffee sometime?'
      }
    });

    console.log(`Message notification result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
    return result;
  }

  /**
   * Test activity reminder
   */
  static async testActivityReminder(userId: string): Promise<boolean> {
    console.log('🧪 Testing activity reminder...');
    
    const result = await NotificationService.sendActivityReminder(userId);

    console.log(`Activity reminder result: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
    return result;
  }

  /**
   * Run all tests
   */
  static async runAllTests(userId: string): Promise<{ passed: number; total: number }> {
    console.log('🚀 Running all notification tests...');
    
    const tests = [
      () => this.testMatchNotification(userId),
      () => this.testProfileViewNotification(userId),
      () => this.testMessageNotification(userId),
      () => this.testActivityReminder(userId)
    ];

    let passed = 0;
    const total = tests.length;

    for (const test of tests) {
      try {
        const result = await test();
        if (result) passed++;
        
        // Wait 2 seconds between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Test failed with error:', error);
      }
    }

    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    return { passed, total };
  }
} 