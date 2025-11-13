
import type { Transaction, Category, CreditCard, Goal, Asset, AppSettings } from '../types';

const SIMULATED_DELAY = 50; // ms
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const defaultCategories: Category[] = [
    { id: 'cat-exp-1', name: 'Food', type: 'expense', emoji: '🍔' },
    { id: 'cat-exp-2', name: 'Transport', type: 'expense', emoji: '🚗' },
    { id: 'cat-exp-3', name: 'Entertainment', type: 'expense', emoji: '🎬' },
    { id: 'cat-exp-4', name: 'Shopping', type: 'expense', emoji: '🛍️' },
    { id: 'cat-exp-5', name: 'Health', type: 'expense', emoji: '❤️‍🩹' },
    { id: 'cat-exp-6', name: 'Utilities', type: 'expense', emoji: '💡' },
    { id: 'cat-inc-1', name: 'Salary', type: 'income', emoji: '💰' },
    { id: 'cat-inc-2', name: 'Gift', type: 'income', emoji: '🎁' },
    { id: 'cat-inc-3', name: 'Payback', type: 'income', emoji: '🤝' },
];

const get = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    const value = localStorage.getItem(key);
    if (!value) return defaultValue;
    try {
        return JSON.parse(value) as T;
    } catch {
        return defaultValue;
    }
};

const set = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
};

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
    await delay(SIMULATED_DELAY);
    return get<Transaction[]>('transactions', []);
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    await delay(SIMULATED_DELAY);
    const transactions = get<Transaction[]>('transactions', []);
    const newTransaction = { ...transaction, id: `txn-${Date.now()}` };
    set('transactions', [...transactions, newTransaction]);
    return newTransaction;
};

export const updateTransaction = async (updatedTransaction: Transaction): Promise<Transaction> => {
    await delay(SIMULATED_DELAY);
    let transactions = get<Transaction[]>('transactions', []);
    transactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    set('transactions', transactions);
    return updatedTransaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
    await delay(SIMULATED_DELAY);
    const transactions = get<Transaction[]>('transactions', []);
    set('transactions', transactions.filter(t => t.id !== id));
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
    await delay(SIMULATED_DELAY);
    const categories = get<Category[]>('categories', []);
    if (categories.length === 0) {
        set('categories', defaultCategories);
        return defaultCategories;
    }
    return categories;
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    await delay(SIMULATED_DELAY);
    const categories = get<Category[]>('categories', []);
    const newCategory = { ...category, id: `cat-${Date.now()}` };
    set('categories', [...categories, newCategory]);
    return newCategory;
};

// Credit Cards
export const getCards = async (): Promise<CreditCard[]> => {
    await delay(SIMULATED_DELAY);
    return get<CreditCard[]>('cards', []);
};

export const addCard = async (card: Omit<CreditCard, 'id' | 'balance' | 'archived'>): Promise<CreditCard> => {
    await delay(SIMULATED_DELAY);
    const cards = get<CreditCard[]>('cards', []);
    const newCard: CreditCard = { ...card, id: `card-${Date.now()}`, balance: 0, archived: false };
    set('cards', [...cards, newCard]);
    return newCard;
};

export const updateCard = async (updatedCard: CreditCard): Promise<CreditCard> => {
    await delay(SIMULATED_DELAY);
    let cards = get<CreditCard[]>('cards', []);
    cards = cards.map(c => c.id === updatedCard.id ? updatedCard : c);
    set('cards', cards);
    return updatedCard;
};

// Goals
export const getGoals = async (): Promise<Goal[]> => {
    await delay(SIMULATED_DELAY);
    return get<Goal[]>('goals', []);
};

export const addGoal = async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
    await delay(SIMULATED_DELAY);
    const goals = get<Goal[]>('goals', []);
    const newGoal = { ...goal, id: `goal-${Date.now()}` };
    set('goals', [...goals, newGoal]);
    return newGoal;
};

export const updateGoal = async (updatedGoal: Goal): Promise<Goal> => {
    await delay(SIMULATED_DELAY);
    let goals = get<Goal[]>('goals', []);
    goals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    set('goals', goals);
    return updatedGoal;
};

export const deleteGoal = async (id: string): Promise<void> => {
    await delay(SIMULATED_DELAY);
    const goals = get<Goal[]>('goals', []);
    set('goals', goals.filter(g => g.id !== id));
};

// Assets
export const getAssets = async (): Promise<Asset[]> => {
    await delay(SIMULATED_DELAY);
    return get<Asset[]>('assets', []);
};

export const addAsset = async (asset: Omit<Asset, 'id' | 'lastUpdated'>): Promise<Asset> => {
    await delay(SIMULATED_DELAY);
    const assets = get<Asset[]>('assets', []);
    const newAsset = { ...asset, id: `asset-${Date.now()}`, lastUpdated: new Date().toISOString() };
    set('assets', [...assets, newAsset]);
    return newAsset;
};

export const updateAsset = async (updatedAsset: Asset): Promise<Asset> => {
    await delay(SIMULATED_DELAY);
    let assets = get<Asset[]>('assets', []);
    assets = assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
    set('assets', assets);
    return updatedAsset;
};

export const deleteAsset = async (id: string): Promise<void> => {
    await delay(SIMULATED_DELAY);
    const assets = get<Asset[]>('assets', []);
    set('assets', assets.filter(a => a.id !== id));
};


// Settings
export const getSettings = async (): Promise<AppSettings> => {
    await delay(SIMULATED_DELAY);
    return get<AppSettings>('settings', {
        privacyMode: false,
        userName: 'User',
        monthlyIncome: 0,
        totalSavings: 0,
        theme: 'dark',
    });
};

export const updateSettings = async (newSettings: Partial<AppSettings>): Promise<AppSettings> => {
    await delay(SIMULATED_DELAY);
    const currentSettings = get<AppSettings>('settings', {
        privacyMode: false, userName: 'User', monthlyIncome: 0, totalSavings: 0, theme: 'dark'
    });
    const updatedSettings = { ...currentSettings, ...newSettings };
    set('settings', updatedSettings);
    return updatedSettings;
};

// Export all data to JSON
export const exportAllData = async (): Promise<string> => {
    const data = {
        transactions: get<Transaction[]>('transactions', []),
        categories: get<Category[]>('categories', []),
        cards: get<CreditCard[]>('cards', []),
        goals: get<Goal[]>('goals', []),
        assets: get<Asset[]>('assets', []),
        settings: get<AppSettings>('settings', {
            privacyMode: false,
            userName: 'User',
            monthlyIncome: 0,
            totalSavings: 0,
            theme: 'dark',
        }),
        exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
};

// Download data as JSON file
export const downloadDataAsJson = async (): Promise<void> => {
    const jsonData = await exportAllData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expensitrak-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Import data from JSON file
export const importDataFromJson = async (jsonString: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const data = JSON.parse(jsonString);
        
        // Validate data structure
        if (typeof data !== 'object' || data === null) {
            return { success: false, error: 'Invalid JSON format' };
        }

        // Import data (only if present in the JSON)
        if (Array.isArray(data.transactions)) {
            set('transactions', data.transactions);
        }
        if (Array.isArray(data.categories)) {
            set('categories', data.categories);
        }
        if (Array.isArray(data.cards)) {
            set('cards', data.cards);
        }
        if (Array.isArray(data.goals)) {
            set('goals', data.goals);
        }
        if (Array.isArray(data.assets)) {
            set('assets', data.assets);
        }
        if (data.settings && typeof data.settings === 'object') {
            set('settings', data.settings);
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to parse JSON' };
    }
};

// Read JSON file from file input
export const importDataFromFile = async (file: File): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) {
                resolve({ success: false, error: 'Failed to read file' });
                return;
            }
            const result = await importDataFromJson(text);
            resolve(result);
        };
        reader.onerror = () => {
            resolve({ success: false, error: 'Failed to read file' });
        };
        reader.readAsText(file);
    });
};
