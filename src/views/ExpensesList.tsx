import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Pencil, ChevronRight, ChevronLeft } from 'lucide-react';
import { AppData, Expense, getPeriodByOffset, getExpensesInPeriod } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface Props {
  data: AppData;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function ExpensesList({ data, onEdit, onDelete, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [periodOffset, setPeriodOffset] = useState(0);

  useEffect(() => {
    if (!deleteConfirm) return;
    const t = setTimeout(() => setDeleteConfirm(null), 3000);
    return () => clearTimeout(t);
  }, [deleteConfirm]);

  const currency = data.settings.currency || '₪';

  const period = getPeriodByOffset(periodOffset);
  const periodExpenses = getExpensesInPeriod(data.expenses, period.start, period.end);

  const filtered = useMemo(() => {
    return [...periodExpenses]
      .filter(e => {
        if (filterCat !== 'all' && e.categoryId !== filterCat) return false;
        if (search) {
          const cat = data.categories.find(c => c.id === e.categoryId);
          const term = search.toLowerCase();
          if (
            !e.note.toLowerCase().includes(term) &&
            !cat?.name.toLowerCase().includes(term) &&
            !String(e.amount).includes(term)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [periodExpenses, filterCat, search, data.categories]);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-white">הוצאות</h1>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-4 py-2 rounded-xl transition"
          >
            <Plus size={16} /> הוסף
          </button>
        </div>

        {/* Period navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPeriodOffset(o => o - 1)}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition"
          >
            <ChevronRight size={18} />
          </button>
          <p className="text-sm text-gray-400 font-medium">{period.label}</p>
          <button
            onClick={() => setPeriodOffset(o => o + 1)}
            disabled={periodOffset >= 0}
            className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-20 transition"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש..."
            className="w-full bg-gray-900 text-white rounded-xl pr-9 pl-4 py-2.5 border border-gray-800 focus:border-amber-500 focus:outline-none text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCat('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              filterCat === 'all' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            הכל
          </button>
          {data.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filterCat === cat.id ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">{search || filterCat !== 'all' ? 'לא נמצאו תוצאות' : 'אין הוצאות עדיין'}</p>
          </div>
        ) : (
          filtered.map(exp => {
            const cat = data.categories.find(c => c.id === exp.categoryId);
            return (
              <div key={exp.id} className="bg-gray-900 rounded-2xl px-4 py-3.5 border border-gray-800">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: cat ? cat.color + '20' : '#ffffff10' }}
                  >
                    {cat?.emoji || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{cat?.name || 'אחר'}</p>
                    {exp.note && <p className="text-gray-500 text-xs truncate">{exp.note}</p>}
                    <p className="text-gray-600 text-xs">{formatDate(exp.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {formatCurrency(exp.amount, currency)}
                    </p>
                    <button onClick={() => onEdit(exp)} className="p-1.5 text-gray-500 hover:text-amber-400 transition">
                      <Pencil size={14} />
                    </button>
                    {deleteConfirm === exp.id ? (
                      <button
                        onClick={() => { onDelete(exp.id); setDeleteConfirm(null); }}
                        className="p-1.5 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(exp.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
