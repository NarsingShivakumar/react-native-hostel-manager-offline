import notifee, { 
  AndroidImportance, 
  TriggerType, 
  EventType 
} from '@notifee/react-native';
import { navigate } from '../navigation/navigationRef';
import { database } from '../database';

class NotificationService {
  async initialize() {
    try {
      // Request permission
      await notifee.requestPermission();
      
      // Create notification channels (Android)
      await notifee.createChannel({
        id: 'payment-reminders',
        name: 'Payment Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      
      await notifee.createChannel({
        id: 'payment-received',
        name: 'Payment Received',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      });
      
      // Handle background notification tap
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const { guestId } = detail.notification.data || {};
          if (guestId) {
            navigate('GuestDetails', { guestId });
          }
        }
      });
      
      // Handle foreground notification tap
      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          const { guestId } = detail.notification.data || {};
          if (guestId) {
            navigate('GuestDetails', { guestId });
          }
        }
      });
      
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }
  
  // Send immediate notification
  async sendNotification(guest, title, message) {
    try {
      await notifee.displayNotification({
        title,
        body: message,
        android: {
          channelId: 'payment-received',
          importance: AndroidImportance.DEFAULT,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_launcher',
          color: '#6200ee',
        },
        ios: {
          sound: 'default',
        },
        data: {
          guestId: guest.id,
        },
      });
      
      // Log notification
      await database.write(async () => {
        await database.get('notification_logs').create(log => {
          log.guestId = guest.id;
          log.title = title;
          log.message = message;
          log.sentAt = new Date();
          log.clicked = false;
        });
      });
      
      console.log('Notification sent:', title);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
  
  // Schedule payment reminder (3 days before due)
  async schedulePaymentReminder(guest, daysBeforeDue = 3) {
    try {
      const reminderDate = new Date(guest.paymentDueDate);
      reminderDate.setDate(reminderDate.getDate() - daysBeforeDue);
      
      // Only schedule if in future
      if (reminderDate > new Date()) {
        const notificationId = await notifee.createTriggerNotification(
          {
            id: `reminder-${guest.id}`,
            title: '💰 Payment Reminder',
            body: `${guest.fullName}'s payment of ₹${guest.paymentAmount.toLocaleString()} is due in ${daysBeforeDue} days`,
            android: {
              channelId: 'payment-reminders',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
              smallIcon: 'ic_launcher',
              color: '#6200ee',
            },
            ios: {
              sound: 'default',
            },
            data: {
              guestId: guest.id,
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: reminderDate.getTime(),
          }
        );
        
        console.log('Payment reminder scheduled:', notificationId);
      }
    } catch (error) {
      console.error('Error scheduling payment reminder:', error);
    }
  }
  
  // Schedule overdue notification
  async scheduleOverdueNotification(guest) {
    try {
      const overdueDate = new Date(guest.paymentDueDate);
      overdueDate.setDate(overdueDate.getDate() + 1); // Day after due date
      
      if (overdueDate > new Date()) {
        const notificationId = await notifee.createTriggerNotification(
          {
            id: `overdue-${guest.id}`,
            title: '⚠️ Payment Overdue!',
            body: `${guest.fullName}'s payment of ₹${guest.paymentAmount.toLocaleString()} is now overdue`,
            android: {
              channelId: 'payment-reminders',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
              smallIcon: 'ic_launcher',
              color: '#f44336',
            },
            ios: {
              sound: 'default',
              criticalVolume: 1.0,
            },
            data: {
              guestId: guest.id,
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: overdueDate.getTime(),
          }
        );
        
        console.log('Overdue notification scheduled:', notificationId);
      }
    } catch (error) {
      console.error('Error scheduling overdue notification:', error);
    }
  }
  
  // Cancel all notifications for a guest
  async cancelGuestNotifications(guestId) {
    try {
      await notifee.cancelNotification(`reminder-${guestId}`);
      await notifee.cancelNotification(`overdue-${guestId}`);
      console.log('Cancelled notifications for guest:', guestId);
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }
  
  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }
  
  // Get scheduled notifications
  async getScheduledNotifications() {
    try {
      const notifications = await notifee.getTriggerNotifications();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export default new NotificationService();
