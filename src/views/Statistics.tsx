import { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AppData, getPeriodByOffset, getExpensesInPeriod, Expense, localDateStr } from '../types';
import { formatCurrency, getExpensesByCategory, getMonthlyComparison, getTotalForExpenses } from '../utils';

interface Props {
  data: AppData;
}

function SimpleBarChart({ data, currency = '₪' }: { data: Array<{ label: string; total: number }>; currency?: string }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-500" style={{ fontFamily: "'DM Mono', monospace" }}>
            {d.total > 0 ? formatCurrency(d.total, currency).replace(currency, '') : ''}
          </p>
          <div className="w-full rounded-t-lg transition-all"
            style={{ height: `${Math.max(4, (d.total / max) * 96)}px`, backgroundColor: '#f59e0b', opacity: 0.4 + 0.6 * (i / Math.max(data.length - 1, 1)) }} />
          <p className="text-xs text-gray-500 text-center leading-tight">{d.label}</p>
        </div>
      ))}
    </div>
  );
}

function DonutSlice({ pct, color, offset }: { pct: number; color: string; offset: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="14"
      strokeDasharray={`${dash} ${circ - dash}`}
      strokeDashoffset={-offset * circ / 100}
      strokeLinecap="round"
      style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }} />
  );
}

function DailyLineChart({ expenses, period }: { expenses: Expense[]; period: { start: Date; end: Date } }) {
  const today = new Date();
  const endDate = today < period.end ? today : period.end;

  const days = useMemo(() => {
    const result: { dateStr: string; cumulative: number }[] = [];
    let cumulative = 0;
    const d = new Date(period.start);
    while (d <= endDate) {
      const dateStr = localDateStr(d);
      cumulative += expenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
      result.push({ dateStr, cumulative });
      d.setDate(d.getDate() + 1);
    }
    return result;
  }, [expenses, period.start, endDate]);

  if (days.length < 2) return null;

  const maxVal = Math.max(...days.map(d => d.cumulative), 1);
  const W = 300;
  const H = 80;
  const pts = days.map((d, i) => ({
    x: (i / (days.length - 1)) * W,
    y: H - (d.cumulative / maxVal) * H,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill="#f59e0b" />
    </svg>
  );
}

export default function Statistics({ data }: Props) {
  const [periodOffset, setPeriodOffset] = useState(0);
  const currency = data.settings.currency || '₪';
  const period = getPeriodByOffset(periodOffset);
  const periodExpenses = getExpensesInPeriod(data.expenses, period.start, period.end);
  const total = getTotalForExpenses(periodExpenses);

  const prevPeriod = getPeriodByOffset(periodOffset - 1);
  const prevExpenses = getExpensesInPeriod(data.expenses, prevPeriod.start, prevPeriod.end);

  const byCat = useMemo(() => getExpensesByCategory(periodExpenses, data.categories), [periodExpenses, data.categories]);
  const prevByCat = useMemo(() => getExpensesByCategory(prevExpenses, data.categories), [prevExpenses, data.categories]);
  const monthly = useMemo(() => getMonthlyComparison(data.expenses), [data.expenses]);

  let offset = 0;
  const segments = byCat.map(({ category, total: t }) => {
    const pct = total > 0 ? (t / total) * 100 : 0;
    const seg = { category, pct, offset };
    offset += pct;
    return seg;
  });

  const avgDaily = useMemo(() => {
    if (periodExpenses.length === 0) return 0;
    const daysSoFar = Math.max(1, Math.ceil((Date.now() - period.start.getTime()) / 86400000));
    return total / daysSoFar;
  }, [periodExpenses, period.start, total]);

  return (
    <div className="min-h-screen bg-gray-950 px-4">
      <div className="pt-10 pb-4">
        <h1 className="text-xl font-black text-white">סטטיסטיקות</h1>
        <div className="flex items-center gap-3 mt-1">
          <button onClick={() => setPeriodOffset(o => o - 1)} className="p-1 text-gray-500 hover:text-gray-300 transition">
            <ChevronRight size={18} />
          </button>
          <p className="text-gray-400 text-sm font-medium">{period.label}</p>
          <button onClick={() => setPeriodOffset(o => o + 1)} disabled={periodOffset >= 0}
            className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-20 transition">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {data.expenses.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-5xl mb-3">📊</p>
          <p className="font-medium">אין נתונים עדיין</p>
          <p className="text-sm mt-1">הוסף הוצאות כדי לראות סטטיסטיקות</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-500 text-xs">סה"כ התקופה</p>
              <p className="text-xl font-black text-white mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                {formatCurrency(total, currency)}
              </p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-500 text-xs">ממוצע יומי</p>
              <p className="text-xl font-black text-white mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                {formatCurrency(Math.round(avgDaily), currency)}
              </p>
            </div>
          </div>

          {/* Daily line chart */}
          {periodExpenses.length > 0 && (
            <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">הוצאות יומיות</h2>
              <DailyLineChart expenses={periodExpenses} period={period} />
            </div>
          )}

          {byCat.length > 0 && (
            <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">לפי קטגוריה</h2>
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="14" />
                    {segments.map(({ category, pct, offset: off }) => (
                      <DonutSlice key={category.id} pct={pct} color={category.color} offset={off} />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs font-bold text-gray-300" style={{ fontFamily: "'DM Mono', monospace" }}>{byCat.length}</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {byCat.map(({ category, total: t }) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                      <span className="text-xs text-gray-400 flex-1">{category.emoji} {category.name}</span>
                      <span className="text-xs font-mono text-gray-300" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {formatCurrency(t, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category breakdown with trends + budgets */}
          {byCat.length > 0 && (
            <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">פירוט קטגוריות</h2>
              <div className="flex flex-col gap-4">
                {byCat.map(({ category, total: t, count }) => {
                  const prevTotal = prevByCat.find(p => p.category.id === category.id)?.total ?? 0;
                  const diffPct = prevTotal > 0 ? ((t - prevTotal) / prevTotal) * 100 : null;
                  const catBudget = data.settings.categoryBudgets?.[category.id];
                  const budgetPct = catBudget ? Math.min(100, (t / catBudget) * 100) : null;

                  return (
                    <div key={category.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{category.emoji} {category.name}</span>
                        <div className="flex items-center gap-2">
                          {diffPct !== null && (
                            <span className={`flex items-center gap-0.5 text-xs ${
                              diffPct > 10 ? 'text-red-400' : diffPct < -10 ? 'text-green-400' : 'text-gray-500'
                            }`}>
                              {diffPct > 5 ? <TrendingUp size={11} /> : diffPct < -5 ? <TrendingDown size={11} /> : <Minus size={11} />}
                              {Math.abs(Math.round(diffPct))}%
                            </span>
                          )}
                          <span className="text-xs text-gray-600">{count} פעולות</span>
                          <span className="text-sm font-mono font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {formatCurrency(t, currency)}
                          </span>
                        </div>
                      </div>
                      {/* Budget bar if set, otherwise spend-share bar */}
                      {catBudget ? (
                        <>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${budgetPct}%`, backgroundColor: budgetPct! > 90 ? '#ef4444' : budgetPct! > 70 ? '#f97316' : category.color }} />
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {formatCurrency(t, currency)} מתוך {formatCurrency(catBudget, currency)} ({Math.round(budgetPct!)}%)
                          </p>
                        </>
                      ) : (
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${total > 0 ? (t / total) * 100 : 0}%`, backgroundColor: category.color }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {monthly.length > 1 && (
            <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">השוואה תקופות</h2>
              <SimpleBarChart data={monthly} currency={currency} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
