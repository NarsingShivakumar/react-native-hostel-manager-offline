import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class Guardian extends Model {
  static table = 'guardians';
  
  static associations = {
    guest: { type: 'belongs_to', key: 'guest_id' },
  };
  
  @field('guest_id') guestId;
  @field('name') name;
  @field('relationship') relationship;
  @field('mobile_number') mobileNumber;
  @field('address') address;
  @readonly @date('created_at') createdAt;
  
  @relation('guests', 'guest_id') guest;
}
