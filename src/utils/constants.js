// App Constants

export const PAYMENT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
};

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  PARTIAL: 'partial',
};

export const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Spouse',
  'Guardian',
  'Other',
];

export const COLORS = {
  primary: '#6200ee',
  secondary: '#03dac6',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
};

export const NOTIFICATION_CHANNELS = {
  PAYMENT_REMINDERS: 'payment-reminders',
  PAYMENT_RECEIVED: 'payment-received',
};

export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMM yyyy, hh:mm a',
  ISO: 'yyyy-MM-dd',
  TIME: 'hh:mm a',
};

export const FILE_TYPES = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'xlsx',
};
