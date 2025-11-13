
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { CloseIcon, CreditCardIcon } from './Icons';
import type { Transaction } from '../types';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionToEdit?: Transaction | null;
}

const paymentMethods: Transaction['paymentMethod'][] = ['Cash', 'Credit Card', 'PayMe', 'Octopus', 'Bank'];

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, transactionToEdit }) => {
    const { categories, cards, addTransaction, updateTransaction, addCategory } = useAppContext();
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [description, setDescription] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<Transaction['paymentMethod']>('Cash');
    const [cardId, setCardId] = useState<string | undefined>(undefined);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('');
    
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');
    const activeCategories = type === 'expense' ? expenseCategories : incomeCategories;

    const resetForm = () => {
        setType('expense');
        setAmount('');
        setSelectedCategory(expenseCategories.length > 0 ? expenseCategories[0].name : '');
        setDescription('');
        setPaymentMethod('Cash');
        setCardId(undefined);
        setDate(new Date().toISOString().split('T')[0]);
        setShowNewCategory(false);
        setNewCategoryName('');
        setNewCategoryEmoji('');
    };

    useEffect(() => {
        if (transactionToEdit) {
            setType(transactionToEdit.type);
            setAmount(String(transactionToEdit.amount));
            setSelectedCategory(transactionToEdit.category);
            setDescription(transactionToEdit.description);
            setPaymentMethod(transactionToEdit.paymentMethod);
            setCardId(transactionToEdit.cardId);
            setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
        } else {
            resetForm();
        }
    }, [transactionToEdit, isOpen, categories]);


    if (!isOpen) return null;

    const handleCategoryAdd = async () => {
        if (newCategoryName.trim() !== '' && newCategoryEmoji.trim() !== '') {
            const newCat = { name: newCategoryName.trim(), type, emoji: newCategoryEmoji.trim() };
            await addCategory(newCat);
            setSelectedCategory(newCat.name);
            setShowNewCategory(false);
            setNewCategoryName('');
            setNewCategoryEmoji('');
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount) || transactionAmount <= 0 || !selectedCategory) return;
        
        const transactionData = {
            type,
            amount: transactionAmount,
            category: selectedCategory,
            description,
            paymentMethod: type === 'income' ? 'Bank' : paymentMethod,
            cardId: type === 'expense' && paymentMethod === 'Credit Card' ? cardId : undefined,
            date,
        };
        
        if (transactionToEdit) {
            await updateTransaction({ ...transactionData, id: transactionToEdit.id });
        } else {
            await addTransaction(transactionData);
        }
        
        onClose();
    };

    const activeCards = cards.filter(c => !c.archived);
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md relative flex flex-col space-y-4 max-h-[90vh] overflow-y-auto hide-scrollbar">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-center text-foreground font-display">
                    {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
                </h2>
                
                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-md">
                    <button type="button" onClick={() => { setType('expense'); setSelectedCategory(expenseCategories[0]?.name || ''); }} className={`w-full py-1.5 rounded text-sm font-semibold ${type === 'expense' ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground'}`}>Expense</button>
                    <button type="button" onClick={() => { setType('income'); setSelectedCategory(incomeCategories[0]?.name || ''); }} className={`w-full py-1.5 rounded text-sm font-semibold ${type === 'income' ? 'bg-green-600 text-white' : 'text-muted-foreground'}`}>Income</button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg text-muted-foreground">HKD</span>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full bg-secondary border border-border rounded-md text-2xl sm:text-3xl font-bold text-right p-3 pr-4 pl-14 sm:pl-16 text-foreground focus:ring-1 focus:ring-ring font-numbers" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Category</h3>
                        <div className="flex flex-wrap gap-2">
                            {activeCategories.map(cat => (
                                <button type="button" key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedCategory === cat.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                                    {cat.emoji} {cat.name}
                                </button>
                            ))}
                            <button type="button" onClick={() => setShowNewCategory(true)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-muted-foreground">+</button>
                        </div>
                        {showNewCategory && (
                            <div className="flex gap-2 mt-2">
                                <input type="text" value={newCategoryEmoji} onChange={(e) => setNewCategoryEmoji(e.target.value)} placeholder="️️️emoji" className="w-14 bg-input border border-border rounded-md px-2 py-1.5 text-foreground text-center"/>
                                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category" className="flex-grow bg-input border border-border rounded-md px-3 py-1.5 text-foreground"/>
                                <button type="button" onClick={handleCategoryAdd} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm">Add</button>
                            </div>
                        )}
                    </div>
                    
                    {type === 'expense' && (
                         <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Payment Method</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {paymentMethods.map(method => (
                                    <button type="button" key={method} onClick={() => setPaymentMethod(method)} className={`py-2 rounded-md text-sm font-semibold transition ${paymentMethod === method ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{method}</button>
                                ))}
                            </div>
                            {paymentMethod === 'Credit Card' && activeCards.length > 0 && (
                               <div className="mt-3">
                                   <h4 className="text-xs font-semibold text-muted-foreground mb-2">Select Credit Card</h4>
                                   <div className="grid grid-cols-2 gap-2">
                                        {activeCards.map(card => (
                                            <button type="button" key={card.id} onClick={() => setCardId(card.id)} className={`p-3 border rounded-lg text-left text-sm transition-all flex items-center space-x-2 ${cardId === card.id ? 'border-primary bg-secondary ring-2 ring-primary' : 'border-border bg-card'}`}>
                                                <CreditCardIcon className="w-5 h-5 text-muted-foreground"/>
                                                <p className="font-semibold text-sm">{card.name}</p>
                                            </button>
                                        ))}
                                   </div>
                               </div>
                            )}
                        </div>
                    )}

                    <details className="space-y-3">
                         <summary className="text-sm text-muted-foreground cursor-pointer">Add more information</summary>
                         <div className="pt-2 space-y-3">
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground" />
                            <div className="relative">
                               <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground appearance-none" />
                            </div>
                        </div>
                    </details>

                    <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:opacity-90 transition-opacity font-display">
                        {transactionToEdit ? 'Update' : 'Add'} Transaction
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;
