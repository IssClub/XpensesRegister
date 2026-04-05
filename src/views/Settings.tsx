import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Plus, X, Save } from 'lucide-react';
import { AppData, DEFAULT_CATEGORIES, Category } from '../types';
import { exportDataAsJSON, importDataFromJSON } from '../storage';
import { generateId } from '../utils';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const CATEGORY_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#a3e635'];
const CATEGORY_EMOJIS = ['🍔', '⛽', '🎉', '🛒', '☕', '🏥', '👕', '📦', '✈️', '🎮', '📱', '🏠', '💊', '🍕', '🚗', '🎵'];
const CURRENCIES = [
  { symbol: '₪', label: 'שקל' },
  { symbol: '$', label: 'דולר' },
  { symbol: '€', label: 'יורו' },
  { symbol: '£', label: 'פאונד' },
  { symbol: '¥', label: 'ין' },
];

export default function Settings({ data, setData }: Props) {
  const [budgetInput, setBudgetInput] = useState(
    data.settings.monthlyBudget != null ? String(data.settings.monthlyBudget) : ''
  );
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveBudget = () => {
    const val = budgetInput === '' ? null : parseFloat(budgetInput);
    setData(prev => ({ ...prev, settings: { ...prev.settings, monthlyBudget: val } }));
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 1500);
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await importDataFromJSON(file);
      setData(imported);
      setImportMsg('✅ הנתונים יובאו בהצלחה!');
    } catch (e) {
      setImportMsg(`❌ ${(e as Error).message}`);
    }
    setTimeout(() => setImportMsg(''), 3000);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const cat: Category = {
      id: generateId(),
      name: newCatName.trim(),
      emoji: newCatEmoji,
      color: newCatColor,
    };
    setData(prev => ({ ...prev, categories: [...prev.categories, cat] }));
    setNewCatName('');
    setNewCatEmoji('📦');
    setShowAddCat(false);
  };

  const removeCategory = (id: string) => {
    setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  };

  return (
    <div className="min-h-screen bg-gray-950 px-4">
      <div className="pt-10 pb-6">
        <h1 className="text-xl font-black text-white">הגדרות</h1>
      </div>

      {/* Currency */}
      <section className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">מטבע</h2>
        <div className="flex gap-2 flex-wrap">
          {CURRENCIES.map(({ symbol, label }) => (
            <button
              key={symbol}
              onClick={() => setData(prev => ({ ...prev, settings: { ...prev.settings, currency: symbol } }))}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                (data.settings.currency || '₪') === symbol
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <span className="font-mono font-bold">{symbol}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Budget */}
      <section className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">מכסה חודשית</h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold">{data.settings.currency || '₪'}</span>
            <input
              type="number"
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              placeholder="ללא מכסה"
              className="w-full bg-gray-800 text-white rounded-xl pr-8 pl-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none"
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </div>
          <button
            onClick={saveBudget}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
              budgetSaved ? 'bg-green-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            <Save size={16} />
            {budgetSaved ? 'נשמר!' : 'שמור'}
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">קטגוריות</h2>
          <button onClick={() => setShowAddCat(!showAddCat)} className="text-amber-400 hover:text-amber-300 transition">
            <Plus size={18} />
          </button>
        </div>

        {showAddCat && (
          <div className="bg-gray-800 rounded-2xl p-4 mb-4 border border-gray-700">
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="שם הקטגוריה"
              className="w-full bg-gray-700 text-white rounded-xl px-3 py-2 border border-gray-600 focus:border-amber-500 focus:outline-none mb-3 text-sm"
            />
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">אמוג׳י</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_EMOJIS.map(em => (
                  <button
                    key={em}
                    onClick={() => setNewCatEmoji(em)}
                    className={`w-9 h-9 rounded-lg text-lg transition border ${
                      newCatEmoji === em ? 'border-amber-500 bg-amber-500/20' : 'border-gray-600 bg-gray-700'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">צבע</p>
              <div className="flex gap-2">
                {CATEGORY_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={`w-7 h-7 rounded-full transition border-2 ${
                      newCatColor === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={addCategory}
              disabled={!newCatName.trim()}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition"
            >
              הוסף קטגוריה
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {data.categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '20' }}>
                {cat.emoji}
              </div>
              <span className="flex-1 text-sm text-gray-300">{cat.name}</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <button onClick={() => removeCategory(cat.id)} className="text-gray-600 hover:text-red-400 transition p-1">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => setResetConfirm(true)} className="mt-3 text-xs text-gray-600 hover:text-gray-400 underline transition">
          אפס לברירות מחדל
        </button>
        {resetConfirm && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { setData(prev => ({ ...prev, categories: [...DEFAULT_CATEGORIES] })); setResetConfirm(false); }}
              className="text-xs text-red-400 border border-red-800 rounded-lg px-3 py-1.5"
            >
              אפס
            </button>
            <button onClick={() => setResetConfirm(false)} className="text-xs text-gray-500 border border-gray-700 rounded-lg px-3 py-1.5">
              ביטול
            </button>
          </div>
        )}
      </section>

      {/* Data management */}
      <section className="bg-gray-900 rounded-3xl p-5 border border-gray-800 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">גיבוי ושחזור</h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => exportDataAsJSON(data)}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl px-4 py-3.5 border border-gray-700 transition"
          >
            <Download size={18} className="text-amber-400" />
            <div className="text-right">
              <p className="text-sm font-medium">ייצוא נתונים</p>
              <p className="text-xs text-gray-500">שמירה לקובץ JSON</p>
            </div>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl px-4 py-3.5 border border-gray-700 transition"
          >
            <Upload size={18} className="text-amber-400" />
            <div className="text-right">
              <p className="text-sm font-medium">ייבוא נתונים</p>
              <p className="text-xs text-gray-500">שחזור מקובץ JSON</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
          {importMsg && <p className="text-sm text-center">{importMsg}</p>}
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-gray-900 rounded-3xl p-5 border border-red-900/30 mb-8">
        <h2 className="text-sm font-semibold text-red-500/70 uppercase tracking-wider mb-4">אזור מסוכן</h2>
        <button
          onClick={() => {
            if (window.confirm('האם אתה בטוח? כל הנתונים יימחקו לצמיתות.')) {
              setData(prev => ({ ...prev, expenses: [] }));
            }
          }}
          className="flex items-center gap-3 bg-red-950/30 hover:bg-red-950/50 text-red-400 rounded-xl px-4 py-3.5 border border-red-900/40 transition w-full"
        >
          <Trash2 size={18} />
          <div className="text-right">
            <p className="text-sm font-medium">מחק את כל ההוצאות</p>
            <p className="text-xs text-red-500/60">פעולה בלתי הפיכה</p>
          </div>
        </button>
      </section>
    </div>
  );
}
