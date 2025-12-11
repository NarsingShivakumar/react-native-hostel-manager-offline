import { database } from '../database';
import { Q } from '@nozbe/watermelondb';
import NotificationService from './NotificationService';

class PaymentReminderService {
  // Schedule reminders for all active guests
  async scheduleAllReminders() {
    try {
      const activeGuests = await database
      .get('guests')
      .query(Q.where('is_active', true))
      .fetch();
      
      console.log(`Scheduling reminders for ${activeGuests.length} active guests`);
      
      for (const guest of activeGuests) {
        // Cancel existing notifications
        await NotificationService.cancelGuestNotifications(guest.id);
        
        // Schedule new notifications
        await NotificationService.schedulePaymentReminder(guest, 3);
        await NotificationService.scheduleOverdueNotification(guest);
      }
      
      console.log('All reminders scheduled successfully');
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }
  
  // Send immediate reminder to specific guest
  async sendImmediateReminder(guest) {
    try {
      const message = guest.isPaymentOverdue
        ? `Your payment of ₹${guest.paymentAmount.toLocaleString()} is ${guest.daysOverdue} days overdue. Please pay at the earliest.`
        : `Reminder: Your payment of ₹${guest.paymentAmount.toLocaleString()} is due soon.`;
      
      await NotificationService.sendNotification(
        guest,
        'Payment Reminder',
        message
      );
    } catch (error) {
      console.error('Error sending immediate reminder:', error);
    }
  }
  
  // Send reminder to all overdue guests
  async sendOverdueReminders() {
    try {
      const activeGuests = await database.get('guests')
        .query(Q.where('is_active', true))
        .fetch();
      
      const overdueGuests = activeGuests.filter(g => g.isPaymentOverdue);
      
      console.log(`Sending reminders to ${overdueGuests.length} overdue guests`);
      
      for (const guest of overdueGuests) {
        await this.sendImmediateReminder(guest);
      }
      
      console.log('Overdue reminders sent successfully');
    } catch (error) {
      console.error('Error sending overdue reminders:', error);
    }
  }
  
  // Update reminder after payment
  async updateReminderAfterPayment(guest) {
    try {
      // Cancel old notifications
      await NotificationService.cancelGuestNotifications(guest.id);
      
      // Schedule new notifications with updated due date
      await NotificationService.schedulePaymentReminder(guest, 3);
      await NotificationService.scheduleOverdueNotification(guest);
      
      console.log('Reminders updated for guest:', guest.fullName);
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  }
}

export default new PaymentReminderService();
