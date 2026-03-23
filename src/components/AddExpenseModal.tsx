import { useState, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { Expense, Category } from '../types';
import { generateId } from '../utils';

interface Props {
  categories: Category[];
  expense: Expense | null;
  currency?: string;
  onSave: (expense: Expense) => void;
  onClose: () => void;
}

export default function AddExpenseModal({ categories, expense, currency = '₪', onSave, onClose }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId || categories[0]?.id || '');
  const [note, setNote] = useState(expense?.note || '');
  const [date, setDate] = useState(expense?.date || today);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    const exp: Expense = {
      id: expense?.id || generateId(),
      amount: num,
      categoryId,
      note,
      date,
      createdAt: expense?.createdAt || Date.now(),
    };
    onSave(exp);
  };

  const handleScanReceipt = async (file: File) => {
    setScanning(true);
    setScanError('');
    try {
      // Resize image client-side before sending
      const canvas = document.createElement('canvas');
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const base64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
      });
      const data = await res.json() as { amount?: number; categoryId?: string; note?: string };
      if (data.amount) setAmount(String(data.amount));
      if (data.categoryId && categories.find(c => c.id === data.categoryId)) setCategoryId(data.categoryId!);
      if (data.note) setNote(data.note);
    } catch {
      setScanError('שגיאה בניתוח הקבלה. נסה שוב.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl p-6 pb-8 shadow-2xl border-t border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {expense ? 'עריכת הוצאה' : 'הוצאה חדשה'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">סכום</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl text-amber-400 font-mono">{currency}</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-gray-800 text-white text-2xl font-mono rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none"
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">קטגוריה</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  categoryId === cat.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">הערה (אופציונלי)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="לדוגמה: ארוחת צהריים"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Date */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">תאריך</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {scanError && <p className="text-red-400 text-sm mb-3 text-center">{scanError}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold py-3.5 rounded-xl transition-all text-base"
          >
            {expense ? 'שמור שינויים' : 'הוסף הוצאה'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            title="סרוק קבלה"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 rounded-xl border border-gray-700 transition flex items-center gap-2"
          >
            {scanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            {!scanning && <span className="text-sm">סרוק</span>}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleScanReceipt(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}
