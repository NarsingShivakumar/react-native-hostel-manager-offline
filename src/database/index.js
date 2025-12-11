import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
// import schema from './schema'
import { migrations } from './migrations';
import Guest from './models/Guest';
import Payment from './models/Payment';
import Guardian from './models/Guardian';
import NotificationLog from './models/NotificationLog';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // JSI mode for better performance
  onSetUpError: error => {
    console.error('Database setup error:', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Guest, Payment, Guardian, NotificationLog],
});
console.log('✅ Database initialized successfully');
export default database;
