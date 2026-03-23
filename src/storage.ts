import { AppData, DEFAULT_DATA, SCHEMA_VERSION, DEFAULT_CATEGORIES } from './types';

const STORAGE_KEY = 'xpensesregister_data_v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA, categories: [...DEFAULT_CATEGORIES] };
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
      return migrateData(parsed);
    }
    return parsed;
  } catch {
    return { ...DEFAULT_DATA, categories: [...DEFAULT_CATEGORIES] };
  }
}

function migrateData(old: Partial<AppData>): AppData {
  const migrated: AppData = {
    schemaVersion: SCHEMA_VERSION,
    expenses: old.expenses || [],
    categories: old.categories?.length ? old.categories : [...DEFAULT_CATEGORIES],
    settings: {
      monthlyBudget: old.settings?.monthlyBudget ?? null,
      currency: old.settings?.currency ?? '₪',
    },
  };
  saveData(migrated);
  return migrated;
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('Failed to save data');
  }
}

export function exportDataAsJSON(data: AppData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xpensesregister_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDataFromJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppData;
        if (!parsed.expenses || !parsed.categories) {
          reject(new Error('קובץ לא תקין'));
          return;
        }
        const data: AppData = {
          schemaVersion: SCHEMA_VERSION,
          expenses: parsed.expenses,
          categories: parsed.categories?.length ? parsed.categories : [...DEFAULT_CATEGORIES],
          settings: {
            monthlyBudget: parsed.settings?.monthlyBudget ?? null,
            currency: parsed.settings?.currency ?? '₪',
          },
        };
        resolve(data);
      } catch {
        reject(new Error('שגיאה בקריאת הקובץ'));
      }
    };
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsText(file);
  });
}
