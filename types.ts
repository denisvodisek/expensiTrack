
export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    paymentMethod: 'Cash' | 'Credit Card' | 'PayMe' | 'Octopus' | 'Bank';
    cardId?: string;
    date: string;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    emoji: string;
}

export interface CreditCard {
    id: string;
    name: string;
    limit: number;
    balance: number;
    archived: boolean;
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    deadline: string;
}

export interface Asset {
    id: string;
    name: string;
    value: number;
    lastUpdated: string;
}

export interface AppSettings {
    privacyMode: boolean;
    userName: string;
    monthlyIncome: number;
    totalSavings: number;
    theme: 'light' | 'dark';
}