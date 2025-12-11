import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class Payment extends Model {
  static table = 'payments';
  
  static associations = {
    guest: { type: 'belongs_to', key: 'guest_id' },
  };
  
  @field('guest_id') guestId;
  @field('amount') amount;
  @date('payment_date') paymentDate;
  @field('payment_type') paymentType;
  @field('payment_method') paymentMethod;
  @field('receipt_number') receiptNumber;
  @field('notes') notes;
  @date('period_start') periodStart;
  @date('period_end') periodEnd;
  @field('status') status;
  @readonly @date('created_at') createdAt;
  
  @relation('guests', 'guest_id') guest;
  
  get formattedAmount() {
    return `₹${this.amount.toLocaleString('en-IN')}`;
  }
}
