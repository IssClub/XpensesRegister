export const SCHEMA_VERSION = 2;

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  note: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: number; // timestamp
  isRecurring?: boolean;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface AppSettings {
  monthlyBudget: number | null;
  currency: string;
}

export interface AppData {
  schemaVersion: number;
  expenses: Expense[];
  categories: Category[];
  settings: AppSettings;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'אוכל', emoji: '🍔', color: '#f59e0b' },
  { id: 'fuel', name: 'דלק', emoji: '⛽', color: '#3b82f6' },
  { id: 'entertainment', name: 'בילוי', emoji: '🎉', color: '#8b5cf6' },
  { id: 'shopping', name: 'קניות', emoji: '🛒', color: '#ec4899' },
  { id: 'coffee', name: 'קפה', emoji: '☕', color: '#d97706' },
  { id: 'health', name: 'בריאות', emoji: '🏥', color: '#10b981' },
  { id: 'clothing', name: 'ביגוד', emoji: '👕', color: '#6366f1' },
  { id: 'other', name: 'אחר', emoji: '📦', color: '#6b7280' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  monthlyBudget: null,
  currency: '₪',
};

export const DEFAULT_DATA: AppData = {
  schemaVersion: SCHEMA_VERSION,
  expenses: [],
  categories: DEFAULT_CATEGORIES,
  settings: DEFAULT_SETTINGS,
};

// Billing period: 10th of month to 9th of next month
export function getCurrentPeriod(date = new Date()): { start: Date; end: Date; label: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (day >= 10) {
    periodStart = new Date(year, month, 10);
    periodEnd = month === 11
      ? new Date(year + 1, 0, 9)
      : new Date(year, month + 1, 9);
  } else {
    periodStart = month === 0
      ? new Date(year - 1, 11, 10)
      : new Date(year, month - 1, 10);
    periodEnd = new Date(year, month, 9);
  }

  const months = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
  const label = `${periodStart.getDate()} ${months[periodStart.getMonth()]} – ${periodEnd.getDate()} ${months[periodEnd.getMonth()]}`;

  return { start: periodStart, end: periodEnd, label };
}

export function getPeriodByOffset(offset: number): ReturnType<typeof getCurrentPeriod> {
  if (offset === 0) return getCurrentPeriod();
  const current = getCurrentPeriod();
  const shifted = new Date(current.start);
  shifted.setMonth(shifted.getMonth() + offset);
  shifted.setDate(15); // safely inside the target period
  return getCurrentPeriod(shifted);
}

export function getExpensesInPeriod(expenses: Expense[], start: Date, end: Date): Expense[] {
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  return expenses.filter(e => e.date >= startStr && e.date <= endStr);
}
