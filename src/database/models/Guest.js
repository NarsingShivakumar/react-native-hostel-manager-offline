import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children, writer } from '@nozbe/watermelondb/decorators';

export default class Guest extends Model {
  static table = 'guests';
  
  static associations = {
    guardians: { type: 'has_many', foreignKey: 'guest_id' },
    payments: { type: 'has_many', foreignKey: 'guest_id' },
    notification_logs: { type: 'has_many', foreignKey: 'guest_id' },
  };
  
  @field('first_name') firstName;
  @field('last_name') lastName;
  @field('age') age;
  @field('gender') gender;
  @field('mobile_number') mobileNumber;
  @field('email') email;
  @field('aadhar_number') aadharNumber;
  @field('photo_uri') photoUri;
  @field('room_number') roomNumber;
  @field('bed_number') bedNumber;
  @field('payment_type') paymentType;
  @field('payment_amount') paymentAmount;
  @date('payment_due_date') paymentDueDate;
  @date('join_date') joinDate;
  @field('is_active') isActive;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
  
  @children('guardians') guardians;
  @children('payments') payments;
  @children('notification_logs') notificationLogs;
  
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  
  get isPaymentOverdue() {
    return this.paymentDueDate < Date.now();
  }
  
  get daysOverdue() {
    if (!this.isPaymentOverdue) return 0;
    return Math.floor((Date.now() - this.paymentDueDate) / (1000 * 60 * 60 * 24));
  }
  
  @writer async markInactive() {
    await this.update(guest => {
      guest.isActive = false;
    });
  }
  
  @writer async updateDueDate(newDate) {
    await this.update(guest => {
      guest.paymentDueDate = newDate;
    });
  }
}
