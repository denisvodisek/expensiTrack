
import type { Transaction, Category, CreditCard, Goal, Asset, AppSettings } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
    return apiRequest<Transaction[]>('/transactions');
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    return apiRequest<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction),
    });
};

export const updateTransaction = async (updatedTransaction: Transaction): Promise<Transaction> => {
    return apiRequest<Transaction>(`/transactions/${updatedTransaction.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTransaction),
    });
};

export const deleteTransaction = async (id: string): Promise<void> => {
    return apiRequest<void>(`/transactions/${id}`, {
        method: 'DELETE',
    });
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
    return apiRequest<Category[]>('/categories');
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    return apiRequest<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(category),
    });
};

// Credit Cards
export const getCards = async (): Promise<CreditCard[]> => {
    return apiRequest<CreditCard[]>('/cards');
};

export const addCard = async (card: Omit<CreditCard, 'id' | 'balance' | 'archived'>): Promise<CreditCard> => {
    return apiRequest<CreditCard>('/cards', {
        method: 'POST',
        body: JSON.stringify(card),
    });
};

export const updateCard = async (updatedCard: CreditCard): Promise<CreditCard> => {
    return apiRequest<CreditCard>(`/cards/${updatedCard.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedCard),
    });
};

// Goals
export const getGoals = async (): Promise<Goal[]> => {
    return apiRequest<Goal[]>('/goals');
};

export const addGoal = async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
    return apiRequest<Goal>('/goals', {
        method: 'POST',
        body: JSON.stringify(goal),
    });
};

export const updateGoal = async (updatedGoal: Goal): Promise<Goal> => {
    return apiRequest<Goal>(`/goals/${updatedGoal.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedGoal),
    });
};

export const deleteGoal = async (id: string): Promise<void> => {
    return apiRequest<void>(`/goals/${id}`, {
        method: 'DELETE',
    });
};

// Assets
export const getAssets = async (): Promise<Asset[]> => {
    return apiRequest<Asset[]>('/assets');
};

export const addAsset = async (asset: Omit<Asset, 'id' | 'lastUpdated'>): Promise<Asset> => {
    return apiRequest<Asset>('/assets', {
        method: 'POST',
        body: JSON.stringify(asset),
    });
};

export const updateAsset = async (updatedAsset: Asset): Promise<Asset> => {
    return apiRequest<Asset>(`/assets/${updatedAsset.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedAsset),
    });
};

export const deleteAsset = async (id: string): Promise<void> => {
    return apiRequest<void>(`/assets/${id}`, {
        method: 'DELETE',
    });
};


// Settings
export const getSettings = async (): Promise<AppSettings> => {
    return apiRequest<AppSettings>('/settings');
};

export const updateSettings = async (newSettings: Partial<AppSettings>): Promise<AppSettings> => {
    return apiRequest<AppSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
    });
};
