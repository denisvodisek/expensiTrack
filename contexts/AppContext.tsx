'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Transaction, Category, CreditCard, Goal, Asset, Subscription, AppSettings } from '@/types';
import * as api from '@/services/api';

interface AppContextType {
    transactions: Transaction[];
    categories: Category[];
    cards: CreditCard[];
    goals: Goal[];
    assets: Asset[];
    subscriptions: Subscription[];
    settings: AppSettings | null;
    loading: boolean;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (transaction: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addCategory: (category: Omit<Category, 'id' | 'order'>) => Promise<void>;
    updateCategory: (category: Category) => Promise<void>;
    reorderCategories: (categoryId1: string, categoryId2: string) => Promise<void>;
    addCard: (card: Omit<CreditCard, 'id' | 'balance' | 'archived'>) => Promise<void>;
    updateCard: (card: CreditCard) => Promise<void>;
    archiveCard: (id: string) => Promise<void>;
    addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
    updateGoal: (goal: Goal) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    addAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => Promise<void>;
    updateAsset: (asset: Asset) => Promise<void>;
    deleteAsset: (id: string) => Promise<void>;
    addSubscription: (subscription: Omit<Subscription, 'id'>) => Promise<void>;
    updateSubscription: (subscription: Subscription) => Promise<void>;
    deleteSubscription: (id: string) => Promise<void>;
    updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
    getCardById: (id: string) => CreditCard | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    const themeColor = theme === 'dark' ? '#000000' : '#ffffff';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Recalculate credit card balances from all transactions
    const recalculateCardBalances = useCallback((transactions: Transaction[], cards: CreditCard[]): CreditCard[] => {
        return cards.map(card => {
            // Sum all expenses with this cardId (regardless of month)
            const totalExpenses = transactions
                .filter(t => t.type === 'expense' && t.cardId === card.id)
                .reduce((sum, t) => sum + t.amount, 0);
            
            // Sum all payments for this cardId (regardless of month)
            const totalPayments = transactions
                .filter(t => t.type === 'credit_card_payment' && t.cardId === card.id)
                .reduce((sum, t) => sum + t.amount, 0);
            
            // Balance = expenses - payments
            const calculatedBalance = Math.max(0, totalExpenses - totalPayments);
            
            // Only update if balance changed (to avoid unnecessary API calls)
            if (card.balance !== calculatedBalance) {
                return { ...card, balance: calculatedBalance };
            }
            return card;
        });
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const currentSettings = await api.getSettings();
            const [transactionsData, categoriesData, cardsData, goalsData, assetsData, subscriptionsData] = await Promise.all([
                api.getTransactions(),
                api.getCategories(),
                api.getCards(),
                api.getGoals(),
                api.getAssets(),
                api.getSubscriptions()
            ]);
            
            // Recalculate card balances from all transactions
            const recalculatedCards = recalculateCardBalances(transactionsData, cardsData);
            
            // Update cards in storage if balances changed
            for (const card of recalculatedCards) {
                if (card.balance !== cardsData.find(c => c.id === card.id)?.balance) {
                    await api.updateCard(card);
                }
            }
            
            setTransactions(transactionsData);
            setCategories(categoriesData);
            setCards(recalculatedCards);
            setGoals(goalsData);
            setAssets(assetsData);
            setSettings(currentSettings);
            applyTheme(currentSettings.theme);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    }, [recalculateCardBalances]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
        const newTransaction = await api.addTransaction(transactionData);
        setTransactions(prev => [...prev, newTransaction]);
        
        if (transactionData.type === 'expense' && transactionData.cardId) {
            // Credit card expense: increase card balance
            const card = cards.find(c => c.id === transactionData.cardId);
            if (card) {
                const updatedCard = { ...card, balance: card.balance + transactionData.amount };
                await api.updateCard(updatedCard);
                setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
            }
        } else if (transactionData.type === 'credit_card_payment' && transactionData.cardId) {
            // Credit card payment: reduce card balance only (does NOT affect savings - expense was already counted)
            const card = cards.find(c => c.id === transactionData.cardId);
            if (card) {
                const updatedCard = { ...card, balance: Math.max(0, card.balance - transactionData.amount) };
                await api.updateCard(updatedCard);
                setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
            }
        } else if (transactionData.type === 'income' && settings) {
            await updateSettings({ totalSavings: settings.totalSavings + transactionData.amount });
        }
    };
    
    const updateTransaction = async (transactionData: Transaction) => {
        const oldTransaction = transactions.find(t => t.id === transactionData.id);
        if (!oldTransaction) return;

        const updatedTransaction = await api.updateTransaction(transactionData);
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
        
        // This logic requires careful state management. For simplicity, we refetch cards. A more optimized approach would calculate the deltas.
        await loadData();
    };

    const deleteTransaction = async (id: string) => {
        const transactionToDelete = transactions.find(e => e.id === id);
        if (!transactionToDelete) return;

        await api.deleteTransaction(id);
        setTransactions(prev => prev.filter(e => e.id !== id));
        if (transactionToDelete.type === 'expense' && transactionToDelete.cardId) {
            // Revert credit card expense: decrease card balance
            const card = cards.find(c => c.id === transactionToDelete.cardId);
            if (card) {
                const updatedCard = { ...card, balance: Math.max(0, card.balance - transactionToDelete.amount) };
                await api.updateCard(updatedCard);
                setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
            }
        } else if (transactionToDelete.type === 'credit_card_payment' && transactionToDelete.cardId) {
            // Revert credit card payment: increase card balance only (does NOT affect savings)
            const card = cards.find(c => c.id === transactionToDelete.cardId);
            if (card) {
                const updatedCard = { ...card, balance: card.balance + transactionToDelete.amount };
                await api.updateCard(updatedCard);
                setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
            }
        } else if (transactionToDelete.type === 'income' && settings) {
             await updateSettings({ totalSavings: settings.totalSavings - transactionToDelete.amount });
        }
    };

    const addCategory = async (categoryData: Omit<Category, 'id'>) => {
        const newCategory = await api.addCategory(categoryData);
        setCategories(prev => [...prev, newCategory]);
    };

    const updateCategory = async (categoryData: Category) => {
        const updatedCategory = await api.updateCategory(categoryData);
        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    };

    const reorderCategories = async (categoryId1: string, categoryId2: string) => {
        await api.reorderCategories(categoryId1, categoryId2);
        // Refetch categories to get updated order
        const updatedCategories = await api.getCategories();
        setCategories(updatedCategories);
    };

    const addCard = async (cardData: Omit<CreditCard, 'id' | 'balance' | 'archived'>) => {
        const newCard = await api.addCard(cardData);
        setCards(prev => [...prev, newCard]);
    };
    
    const updateCard = async (cardData: CreditCard) => {
        const updatedCard = await api.updateCard(cardData);
        setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    };

    const archiveCard = async (id: string) => {
        const cardToArchive = cards.find(c => c.id === id);
        if (cardToArchive) {
            const updatedCard = { ...cardToArchive, archived: true };
            await api.updateCard(updatedCard);
            setCards(prev => prev.map(c => c.id === id ? updatedCard : c));
        }
    };

    const addGoal = async (goalData: Omit<Goal, 'id'>) => {
        const newGoal = await api.addGoal(goalData);
        setGoals(prev => [...prev, newGoal]);
    };

    const updateGoal = async (goalData: Goal) => {
        const updatedGoal = await api.updateGoal(goalData);
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    };
    
    const deleteGoal = async (id: string) => {
        await api.deleteGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    const addAsset = async (assetData: Omit<Asset, 'id' | 'lastUpdated'>) => {
        const newAsset = await api.addAsset(assetData);
        setAssets(prev => [...prev, newAsset]);
    };

    const updateAsset = async (assetData: Asset) => {
        const updatedAsset = await api.updateAsset({ ...assetData, lastUpdated: new Date().toISOString() });
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    };
    
    const deleteAsset = async (id: string) => {
        await api.deleteAsset(id);
        setAssets(prev => prev.filter(a => a.id !== id));
    };

    const addSubscription = async (subscription: Omit<Subscription, 'id'>) => {
        const newSubscription = await api.addSubscription(subscription);
        setSubscriptions(prev => [...prev, newSubscription]);
    };

    const updateSubscription = async (subscription: Subscription) => {
        const updatedSubscription = await api.updateSubscription(subscription);
        setSubscriptions(prev => prev.map(s => s.id === subscription.id ? updatedSubscription : s));
    };

    const deleteSubscription = async (id: string) => {
        await api.deleteSubscription(id);
        setSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        const updatedSettings = await api.updateSettings(newSettings);
        setSettings(updatedSettings);
        if (newSettings.theme) {
            applyTheme(newSettings.theme);
        }
    };

    const getCardById = useCallback((id: string) => cards.find(c => c.id === id), [cards]);

    return (
        <AppContext.Provider value={{
            transactions, categories, cards, goals, assets, subscriptions, settings, loading,
            addTransaction, updateTransaction, deleteTransaction,
            addCategory, updateCategory, reorderCategories,
            addCard, updateCard, archiveCard,
            addGoal, updateGoal, deleteGoal,
            addAsset, updateAsset, deleteAsset,
            addSubscription, updateSubscription, deleteSubscription,
            updateSettings, getCardById
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
