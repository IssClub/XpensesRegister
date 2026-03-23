import { useState, useEffect, useCallback } from 'react';
import { AppData, Expense, getCurrentPeriod, getExpensesInPeriod } from './types';
import { loadData, saveData } from './storage';
import Dashboard from './views/Dashboard';
import ExpensesList from './views/ExpensesList';
import Statistics from './views/Statistics';
import Settings from './views/Settings';
import AddExpenseModal from './components/AddExpenseModal';
import BottomNav from './components/BottomNav';

export type Tab = 'dashboard' | 'expenses' | 'stats' | 'settings';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const period = getCurrentPeriod();
  const periodExpenses = getExpensesInPeriod(data.expenses, period.start, period.end);

  const handleAddExpense = useCallback((expense: Expense) => {
    setData(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));
    setShowAddModal(false);
    setEditingExpense(null);
  }, []);

  const handleEditExpense = useCallback((expense: Expense) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === expense.id ? expense : e),
    }));
    setShowAddModal(false);
    setEditingExpense(null);
  }, []);

  const handleDeleteExpense = useCallback((id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }, []);

  const openEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col" style={{ fontFamily: "'Heebo', sans-serif" }}>

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            periodExpenses={periodExpenses}
            period={period}
            onAddExpense={() => setShowAddModal(true)}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesList
            data={data}
            onEdit={openEdit}
            onDelete={handleDeleteExpense}
            onAdd={() => setShowAddModal(true)}
          />
        )}
        {activeTab === 'stats' && (
          <Statistics data={data} />
        )}
        {activeTab === 'settings' && (
          <Settings data={data} setData={setData} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showAddModal && (
        <AddExpenseModal
          categories={data.categories}
          expense={editingExpense}
          currency={data.settings.currency}
          onSave={editingExpense ? handleEditExpense : handleAddExpense}
          onClose={() => { setShowAddModal(false); setEditingExpense(null); }}
        />
      )}
    </div>
  );
}
