import { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AppData, getPeriodByOffset, getExpensesInPeriod } from '../types';
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
            {d.total > 0 ? formatCurrency(d.total, currency).replace('₪', '') : ''}
          </p>
          <div
            className="w-full rounded-t-lg transition-all"
            style={{ height: `${Math.max(4, (d.total / max) * 96)}px`, backgroundColor: '#f59e0b', opacity: 0.5 + 0.5 * (i / Math.max(data.length - 1, 1)) }}
          />
          <p className="text-xs text-gray-500">{d.label}</p>
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
    <circle
      cx="50" cy="50" r={r}
      fill="none"
      stroke={color}
      strokeWidth="14"
      strokeDasharray={`${dash} ${circ - dash}`}
      strokeDashoffset={-offset * circ / 100}
      strokeLinecap="round"
      style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
    />
  );
}

export default function Statistics({ data }: Props) {
  const [periodOffset, setPeriodOffset] = useState(0);
  const currency = data.settings.currency || '₪';
  const period = getPeriodByOffset(periodOffset);
  const periodExpenses = getExpensesInPeriod(data.expenses, period.start, period.end);
  const total = getTotalForExpenses(periodExpenses);

  const byCat = useMemo(() => getExpensesByCategory(periodExpenses, data.categories), [periodExpenses, data.categories]);
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
          <button
            onClick={() => setPeriodOffset(o => o + 1)}
            disabled={periodOffset >= 0}
            className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-20 transition"
          >
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
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-500 text-xs">סה"כ החודש</p>
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
                    <p className="text-xs font-bold text-gray-300" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {byCat.length}
                    </p>
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

          {monthly.length > 1 && (
            <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">השוואה חודשית</h2>
              <SimpleBarChart data={monthly} currency={currency} />
            </div>
          )}

          <div className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">פירוט קטגוריות</h2>
            <div className="flex flex-col gap-3">
              {byCat.map(({ category, total: t, count }) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{category.emoji} {category.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">{count} פעולות</span>
                      <span className="text-sm font-mono font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {formatCurrency(t, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${total > 0 ? (t / total) * 100 : 0}%`, backgroundColor: category.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
