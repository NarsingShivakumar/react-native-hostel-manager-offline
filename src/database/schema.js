import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'guests',
      columns: [
        { name: 'first_name', type: 'string' },
        { name: 'last_name', type: 'string' },
        { name: 'age', type: 'number' },
        { name: 'gender', type: 'string' },
        { name: 'mobile_number', type: 'string', isIndexed: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'aadhar_number', type: 'string' },
        { name: 'photo_uri', type: 'string', isOptional: true },
        { name: 'room_number', type: 'string' },
        { name: 'bed_number', type: 'string', isOptional: true },
        { name: 'payment_type', type: 'string' }, // daily, weekly, monthly
        { name: 'payment_amount', type: 'number' },
        { name: 'payment_due_date', type: 'number' },
        { name: 'join_date', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'guardians',
      columns: [
        { name: 'guest_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'relationship', type: 'string' },
        { name: 'mobile_number', type: 'string' },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'payments',
      columns: [
        { name: 'guest_id', type: 'string', isIndexed: true },
        { name: 'amount', type: 'number' },
        { name: 'payment_date', type: 'number' },
        { name: 'payment_type', type: 'string' }, // daily, weekly, monthly
        { name: 'payment_method', type: 'string' }, // cash, upi, card, bank_transfer
        { name: 'receipt_number', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'period_start', type: 'number' },
        { name: 'period_end', type: 'number' },
        { name: 'status', type: 'string' }, // paid, pending, partial
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notification_logs',
      columns: [
        { name: 'guest_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'sent_at', type: 'number' },
        { name: 'clicked', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
