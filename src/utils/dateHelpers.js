import { 
  format, 
  addDays, 
  addWeeks, 
  addMonths,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
  isThisWeek,
  isThisMonth,
  isPast,
  isFuture,
} from 'date-fns';

// Format date for display
export const formatDate = (date, formatString = 'dd MMM yyyy') => {
  return format(new Date(date), formatString);
};

export const formatDateTime = (date) => {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
};

export const formatTime = (date) => {
  return format(new Date(date), 'hh:mm a');
};

// Calculate next due date
export const calculateNextDueDate = (paymentType, fromDate = new Date()) => {
  const baseDate = new Date(fromDate);
  
  switch (paymentType) {
    case 'daily':
      return addDays(baseDate, 1);
    case 'weekly':
      return addWeeks(baseDate, 1);
    case 'monthly':
    default:
      return addMonths(baseDate, 1);
  }
};

// Calculate days difference
export const getDaysDifference = (date1, date2 = new Date()) => {
  return differenceInDays(new Date(date1), new Date(date2));
};

// Check if date is overdue
export const isOverdue = (date) => {
  return isPast(new Date(date)) && !isToday(new Date(date));
};

// Get date range
export const getTodayRange = () => ({
  start: startOfDay(new Date()),
  end: endOfDay(new Date()),
});

export const getWeekRange = () => ({
  start: startOfWeek(new Date()),
  end: endOfWeek(new Date()),
});

export const getMonthRange = () => ({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date()),
});

// Relative time
export const getRelativeTime = (date) => {
  const days = getDaysDifference(new Date(date), new Date());
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `In ${days} days`;
  if (days < -1) return `${Math.abs(days)} days ago`;
  
  return formatDate(date);
};

// Get payment period label
export const getPaymentPeriodLabel = (paymentType) => {
  switch (paymentType) {
    case 'daily':
      return 'Day';
    case 'weekly':
      return 'Week';
    case 'monthly':
      return 'Month';
    default:
      return 'Period';
  }
};

// Get reminder date
export const getReminderDate = (dueDate, daysBefore = 3) => {
  return addDays(new Date(dueDate), -daysBefore);
};
