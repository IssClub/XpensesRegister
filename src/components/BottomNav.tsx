import { LayoutDashboard, List, BarChart2, Settings, Plus } from 'lucide-react';
import type { Tab } from '../App';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAdd: () => void;
}

const leftTabs: Array<{ id: Tab; label: string; icon: React.FC<{ size?: number; strokeWidth?: number }> }> = [
  { id: 'dashboard', label: 'ראשי', icon: LayoutDashboard },
  { id: 'expenses', label: 'הוצאות', icon: List },
];
const rightTabs: Array<{ id: Tab; label: string; icon: React.FC<{ size?: number; strokeWidth?: number }> }> = [
  { id: 'stats', label: 'סטטיסטיקות', icon: BarChart2 },
  { id: 'settings', label: 'הגדרות', icon: Settings },
];

export default function BottomNav({ activeTab, onTabChange, onAdd }: Props) {
  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 bg-gray-900 border-t border-gray-800">
      <div className="flex items-center justify-around px-2 py-2">
        {leftTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
              activeTab === id ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}

        {/* FAB */}
        <button
          onClick={onAdd}
          aria-label="הוסף הוצאה"
          className="flex items-center justify-center w-14 h-14 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-2xl shadow-lg shadow-amber-500/30 transition-all -mt-6"
        >
          <Plus size={28} strokeWidth={2.5} className="text-black" />
        </button>

        {rightTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
              activeTab === id ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
