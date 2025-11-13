
import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import DashboardView from './components/views/DashboardView';
import TransactionsView from './components/views/ExpensesView';
import ProfileView from './components/views/ProfileView';
import BottomNav from './components/BottomNav';
import { AddIcon } from './components/Icons';
import AddTransactionModal from './components/AddExpenseModal';
import OnboardingModal from './components/OnboardingModal';
import type { Transaction } from './types';
import { useAuth } from './contexts/AuthContext';
import LoginView from './components/views/LoginView';

const AppContent: React.FC = () => {
    const { settings, loading } = useAppContext();
    const [activeView, setActiveView] = useState('dashboard');
    const [isAddTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // A simple check to see if the user is new.
        if (settings && settings.userName === 'User') {
            setShowOnboarding(true);
        }
    }, [settings?.userName]);

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setAddTransactionModalOpen(true);
    };

    const handleCloseModal = () => {
        setAddTransactionModalOpen(false);
        setEditingTransaction(null);
    };

    const renderView = () => {
        if (loading || !settings) {
            return <div className="h-full flex items-center justify-center">Loading your financial data...</div>;
        }
        switch (activeView) {
            case 'dashboard':
                return <DashboardView />;
            case 'transactions':
                return <TransactionsView onEditTransaction={handleEditTransaction} />;
            case 'profile':
                return <ProfileView />;
            default:
                return <DashboardView />;
        }
    };
    
    const memoizedView = useMemo(() => renderView(), [activeView, loading, settings]);

    return (
        <div className="h-screen w-screen bg-background text-foreground flex flex-col hide-scrollbar">
            <main className="flex-1 overflow-y-auto pb-20 hide-scrollbar">
               {memoizedView}
            </main>
            
            {!loading && (
                <>
                    <div className="fixed bottom-20 right-4 z-50">
                        <button
                            onClick={() => setAddTransactionModalOpen(true)}
                            className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform duration-300"
                            aria-label="Add Transaction"
                        >
                            <AddIcon className="w-8 h-8" />
                        </button>
                    </div>

                    <BottomNav activeView={activeView} setActiveView={setActiveView} />

                    {isAddTransactionModalOpen && (
                        <AddTransactionModal
                            isOpen={isAddTransactionModalOpen}
                            onClose={handleCloseModal}
                            transactionToEdit={editingTransaction}
                        />
                    )}
                    {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
                </>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <LoginView />;
    }

    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
