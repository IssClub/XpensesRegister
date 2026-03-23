import { useEffect, useRef } from 'react';
import { Share2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AppData, Expense, getCurrentPeriod, getExpensesInPeriod } from '../types';
import { formatCurrency, getBudgetPercent, getBudgetColor, getTotalForExpenses, buildWhatsAppSummary, playBudgetExceededSound } from '../utils';

interface Props {
  data: AppData;
  periodExpenses: Expense[];
  period: ReturnType<typeof getCurrentPeriod>;
  onAddExpense: () => void;
}

export default function Dashboard({ data, periodExpenses, period, onAddExpense }: Props) {
  const total = getTotalForExpenses(periodExpenses);
  const budget = data.settings.monthlyBudget;
  const percent = getBudgetPercent(total, budget);
  const barColor = getBudgetColor(percent);
  const currency = data.settings.currency || '₪';

  // Previous period comparison
  const prevPeriodStart = new Date(period.start);
  prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
  const prevPeriod = getCurrentPeriod(prevPeriodStart);
  const prevExpenses = getExpensesInPeriod(data.expenses, prevPeriod.start, prevPeriod.end);
  const prevTotal = getTotalForExpenses(prevExpenses);
  const diffPct = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  // Play sound when budget is exceeded
  const prevExceededRef = useRef<boolean | null>(null);
  useEffect(() => {
    const exceeded = budget !== null && budget > 0 && total > budget;
    if (prevExceededRef.current === null) {
      if (exceeded) playBudgetExceededSound();
    } else if (exceeded && prevExceededRef.current === false) {
      playBudgetExceededSound();
    }
    prevExceededRef.current = exceeded;
  }, [total, budget]);

  const recentExpenses = [...periodExpenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 5);

  const handleShare = () => {
    const text = buildWhatsAppSummary(periodExpenses, data.categories, data.settings, period.label);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black tracking-tight text-white">Kispex</h1>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium border border-gray-700 transition"
          >
            <Share2 size={15} />
            שתף
          </button>
        </div>
        <p className="text-gray-500 text-sm">{period.label}</p>
      </div>

      {/* Main card */}
      <div className="mx-4 mb-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">סה"כ הוצאות</p>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
              {formatCurrency(total, currency)}
            </span>
            {prevTotal > 0 && (
              <div className={`flex items-center gap-1 text-sm font-medium pb-2 ${
                diffPct > 10 ? 'text-red-400' : diffPct < -10 ? 'text-green-400' : 'text-gray-400'
              }`}>
                {diffPct > 5 ? <TrendingUp size={16} /> : diffPct < -5 ? <TrendingDown size={16} /> : <Minus size={16} />}
                {Math.abs(Math.round(diffPct))}%
              </div>
            )}
          </div>

          {/* Budget bar */}
          {budget ? (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{Math.round(percent)}% מהמכסה</span>
                <span>נותר {formatCurrency(Math.max(0, budget - total), currency)}</span>
              </div>
              <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${percent}%`, backgroundColor: barColor }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5">מכסה: {formatCurrency(budget, currency)}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-600">הגדר מכסה חודשית בהגדרות</p>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="px-4 mb-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-500 text-xs mb-1">מ"מ יומי</p>
          <p className="text-xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
            {periodExpenses.length > 0
              ? formatCurrency(Math.round(total / Math.max(1, Math.ceil((Date.now() - period.start.getTime()) / 86400000))), currency)
              : `${currency}0`}
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-500 text-xs mb-1">מס׳ פעולות</p>
          <p className="text-xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
            {periodExpenses.length}
          </p>
        </div>
      </div>

      {/* Recent expenses */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">פעולות אחרונות</h2>
          <button
            onClick={onAddExpense}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-4 py-2 rounded-xl transition"
          >
            <Plus size={16} />
            הוסף
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-4xl mb-3">💸</p>
            <p className="font-medium">אין הוצאות עדיין</p>
            <p className="text-sm mt-1">לחץ "הוסף" כדי להתחיל</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentExpenses.map(exp => {
              const cat = data.categories.find(c => c.id === exp.categoryId);
              return (
                <div key={exp.id} className="bg-gray-900 rounded-2xl px-4 py-3.5 border border-gray-800 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: cat ? cat.color + '20' : '#ffffff10' }}
                  >
                    {cat?.emoji || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{cat?.name || 'אחר'}</p>
                    {exp.note && <p className="text-gray-500 text-xs truncate">{exp.note}</p>}
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {formatCurrency(exp.amount, currency)}
                    </p>
                    <p className="text-gray-600 text-xs">{exp.date.slice(5).replace('-', '/')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
