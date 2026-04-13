import { Expense, Category, AppSettings, getCurrentPeriod } from './types';

export function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatCurrency(amount: number, currency = '₪'): string {
  return `${currency}${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getTotalForExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getBudgetPercent(total: number, budget: number | null): number {
  if (!budget || budget <= 0) return 0;
  return Math.min(100, (total / budget) * 100);
}

export function getBudgetColor(percent: number): string {
  if (percent < 50) return '#22c55e';
  if (percent < 75) return '#f59e0b';
  if (percent < 90) return '#f97316';
  return '#ef4444';
}

export function getExpensesByCategory(expenses: Expense[], categories: Category[]): Array<{ category: Category; total: number; count: number }> {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const existing = map.get(e.categoryId) || { total: 0, count: 0 };
    map.set(e.categoryId, { total: existing.total + e.amount, count: existing.count + 1 });
  }
  return categories
    .map(cat => ({ category: cat, ...(map.get(cat.id) || { total: 0, count: 0 }) }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function buildWhatsAppSummary(expenses: Expense[], categories: Category[], settings: AppSettings, periodLabel: string): string {
  const total = getTotalForExpenses(expenses);
  const byCat = getExpensesByCategory(expenses, categories);
  const currency = settings.currency || '₪';

  let msg = `💰 *סיכום הוצאות – ${periodLabel}*\n\n`;
  msg += `סה"כ: *${formatCurrency(total, currency)}*`;
  if (settings.monthlyBudget) {
    const pct = getBudgetPercent(total, settings.monthlyBudget);
    const remaining = settings.monthlyBudget - total;
    msg += ` מתוך ${formatCurrency(settings.monthlyBudget, currency)} (${Math.round(pct)}%)`;
    msg += `\nנותר: ${remaining > 0 ? formatCurrency(remaining, currency) : '⚠️ חריגה!'}`;
  }
  msg += `\n\n📊 *לפי קטגוריה:*\n`;
  for (const { category, total: catTotal } of byCat) {
    msg += `${category.emoji} ${category.name}: ${formatCurrency(catTotal, currency)}\n`;
  }
  msg += `\n_נשלח מ-XpensesRegister 💙_`;
  return msg;
}

export function getMonthlyComparison(expenses: Expense[]): Array<{ label: string; total: number }> {
  // Use billing periods (10th–9th) instead of calendar months
  const periodMap = new Map<string, { total: number; label: string }>();
  for (const e of expenses) {
    const d = new Date(e.date + 'T00:00:00');
    const period = getCurrentPeriod(d);
    const key = toLocalDateStr(period.start);
    const existing = periodMap.get(key);
    periodMap.set(key, { total: (existing?.total ?? 0) + e.amount, label: period.label });
  }
  return Array.from(periodMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([, { total, label }]) => ({ label, total }));
}

export function playBudgetExceededSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const playBeep = (freq: number, start: number, duration: number, gain = 0.4) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };
    playBeep(880, 0,    0.15);
    playBeep(740, 0.18, 0.15);
    playBeep(600, 0.36, 0.25);
  } catch {
    // Audio not supported – fail silently
  }
}
