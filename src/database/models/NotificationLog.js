import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class NotificationLog extends Model {
  static table = 'notification_logs';
  
  static associations = {
    guest: { type: 'belongs_to', key: 'guest_id' },
  };
  
  @field('guest_id') guestId;
  @field('title') title;
  @field('message') message;
  @date('sent_at') sentAt;
  @field('clicked') clicked;
  @readonly @date('created_at') createdAt;
  
  @relation('guests', 'guest_id') guest;
}
