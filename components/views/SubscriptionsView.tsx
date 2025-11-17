import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/currency';
import type { Subscription } from '@/types';
import { CloseIcon } from '@/components/Icons';

const SubscriptionsView: React.FC = () => {
    const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useAppContext();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

    // Calculate statistics
    const stats = useMemo(() => {
        const activeSubs = subscriptions.filter(s => s.active);
        const monthlyTotal = activeSubs
            .filter(s => s.frequency === 'monthly')
            .reduce((sum, s) => sum + s.amount, 0);
        const annualTotal = activeSubs
            .filter(s => s.frequency === 'annually')
            .reduce((sum, s) => sum + s.amount, 0);
        const quarterlyTotal = activeSubs
            .filter(s => s.frequency === 'quarterly')
            .reduce((sum, s) => sum + s.amount, 0);

        // Convert to monthly equivalents for total calculation
        const totalMonthly = monthlyTotal + (annualTotal / 12) + (quarterlyTotal / 3);

        return {
            totalSubscriptions: activeSubs.length,
            monthlyTotal,
            annualTotal,
            quarterlyTotal,
            totalMonthly
        };
    }, [subscriptions]);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this subscription?')) {
            await deleteSubscription(id);
        }
    };

    const handleToggleActive = async (subscription: Subscription) => {
        await updateSubscription({ ...subscription, active: !subscription.active });
    };

    const getCategoryEmoji = (category: Subscription['category']) => {
        const emojis = {
            'Entertainment': '🎬',
            'Software': '💻',
            'Health': '❤️‍🩹',
            'Productivity': '⚡',
            'News': '📰',
            'Other': '📦'
        };
        return emojis[category] || '📦';
    };

    const getMonthlyAmount = (subscription: Subscription) => {
        switch (subscription.frequency) {
            case 'monthly': return subscription.amount;
            case 'quarterly': return subscription.amount / 3;
            case 'semi-annually': return subscription.amount / 6;
            case 'annually': return subscription.amount / 12;
            default: return subscription.amount;
        }
    };

    return (
        <div className="p-4 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold font-display">Subscriptions</h1>
                    <p className="text-sm text-muted-foreground">Track your recurring expenses</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity"
                >
                    Add Subscription
                </button>
            </header>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Active</h3>
                    <p className="text-lg sm:text-xl font-bold font-numbers">{stats.totalSubscriptions}</p>
                </div>
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Monthly Total</h3>
                    <p className="text-lg sm:text-xl font-bold font-numbers text-green-500">
                        {formatCurrency(stats.monthlyTotal).display}
                    </p>
                    <p className="text-[8px] opacity-70 font-numbers text-green-500">
                        {formatCurrency(stats.monthlyTotal).exact}
                    </p>
                </div>
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Annual Total</h3>
                    <p className="text-lg sm:text-xl font-bold font-numbers text-blue-500">
                        {formatCurrency(stats.annualTotal).display}
                    </p>
                    <p className="text-[8px] opacity-70 font-numbers text-blue-500">
                        {formatCurrency(stats.annualTotal).exact}
                    </p>
                </div>
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Monthly</h3>
                    <p className="text-lg sm:text-xl font-bold font-numbers text-purple-500">
                        {formatCurrency(stats.totalMonthly).display}
                    </p>
                    <p className="text-[8px] opacity-70 font-numbers text-purple-500">
                        {formatCurrency(stats.totalMonthly).exact}
                    </p>
                </div>
            </div>

            {/* Subscriptions List */}
            <div className="space-y-3">
                {subscriptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg mb-2">No subscriptions yet</p>
                        <p className="text-sm">Add your first subscription to start tracking</p>
                    </div>
                ) : (
                    subscriptions.map(subscription => (
                        <div
                            key={subscription.id}
                            className={`bg-card border border-border p-4 rounded-lg ${!subscription.active ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{getCategoryEmoji(subscription.category)}</span>
                                    <div>
                                        <h3 className="font-semibold">{subscription.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {subscription.category} • {subscription.frequency} • {subscription.paymentMethod}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold font-numbers">
                                        {formatCurrency(subscription.amount).display}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(getMonthlyAmount(subscription)).display}/mo
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleToggleActive(subscription)}
                                        className={`px-3 py-1 rounded text-xs font-medium ${
                                            subscription.active
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-white'
                                        }`}
                                    >
                                        {subscription.active ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setEditingSubscription(subscription)}
                                        className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(subscription.id)}
                                        className="text-destructive hover:text-destructive/80 px-2 py-1 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || editingSubscription) && (
                <SubscriptionModal
                    subscription={editingSubscription}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingSubscription(null);
                    }}
                    onSave={async (subscription) => {
                        if (editingSubscription) {
                            await updateSubscription({ ...editingSubscription, ...subscription });
                        } else {
                            await addSubscription(subscription);
                        }
                        setShowAddModal(false);
                        setEditingSubscription(null);
                    }}
                />
            )}
        </div>
    );
};

// Subscription Modal Component
interface SubscriptionModalProps {
    subscription?: Subscription | null;
    onClose: () => void;
    onSave: (subscription: Omit<Subscription, 'id'>) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ subscription, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: subscription?.name || '',
        amount: subscription?.amount?.toString() || '',
        frequency: subscription?.frequency || 'monthly' as Subscription['frequency'],
        category: subscription?.category || 'Entertainment' as Subscription['category'],
        paymentMethod: subscription?.paymentMethod || 'Credit Card' as Subscription['paymentMethod'],
        cardId: subscription?.cardId || '',
        startDate: subscription?.startDate || new Date().toISOString().split('T')[0],
        active: subscription?.active ?? true,
        notes: subscription?.notes || ''
    });

    const { cards } = useAppContext();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (!formData.name.trim() || isNaN(amount) || amount <= 0) return;

        onSave({
            ...formData,
            amount
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto hide-scrollbar">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <CloseIcon className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-center text-foreground font-display mb-6">
                    {subscription ? 'Edit Subscription' : 'Add Subscription'}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Netflix, Spotify, etc."
                            required
                            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="0.00"
                                required
                                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1">Frequency</label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as Subscription['frequency'] }))}
                                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="semi-annually">Semi-Annually</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Subscription['category'] }))}
                            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                        >
                            <option value="Entertainment">Entertainment</option>
                            <option value="Software">Software</option>
                            <option value="Health">Health</option>
                            <option value="Productivity">Productivity</option>
                            <option value="News">News</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">Payment Method</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as Subscription['paymentMethod'] }))}
                            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="PayMe">PayMe</option>
                            <option value="Octopus">Octopus</option>
                            <option value="Bank">Bank</option>
                        </select>
                    </div>

                    {formData.paymentMethod === 'Credit Card' && (
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1">Credit Card</label>
                            <select
                                value={formData.cardId}
                                onChange={(e) => setFormData(prev => ({ ...prev, cardId: e.target.value }))}
                                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                            >
                                <option value="">Select card</option>
                                {cards.filter(c => !c.archived).map(card => (
                                    <option key={card.id} value={card.id}>{card.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">Start Date</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any additional notes..."
                            rows={2}
                            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground resize-none"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="active" className="text-sm text-muted-foreground">Active subscription</label>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-md hover:opacity-90 transition-opacity">
                            {subscription ? 'Update' : 'Add'} Subscription
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 bg-secondary text-foreground font-bold py-2 rounded-md hover:opacity-90 transition-opacity">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriptionsView;
