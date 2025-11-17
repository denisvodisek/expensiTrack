import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteIcon, CheckCircleIcon, SunIcon, MoonIcon, PrivacyOnIcon, PrivacyOffIcon, CloseIcon, EditIcon } from '@/components/Icons';
import PrivacyWrapper from '@/components/PrivacyWrapper';
import { downloadDataAsJson, importDataFromFile } from '@/services/api';
import { formatCurrency } from '@/lib/currency';
import type { Category } from '@/types';
import AnimatedBackground from '@/components/AnimatedBackground';


const currencyFormatter = new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD' });

// Category Editor Modal
const CategoryEditorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { categories, addCategory, updateCategory, reorderCategories } = useAppContext();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setShowEditModal(true);
    };

    const handleMoveUp = async (categoryId: string, type: 'expense' | 'income') => {
        const categoryList = categories.filter(c => c.type === type).sort((a, b) => (a.order || 0) - (b.order || 0));
        const currentIndex = categoryList.findIndex(c => c.id === categoryId);
        if (currentIndex > 0) {
            const prevCategory = categoryList[currentIndex - 1];
            await reorderCategories(categoryId, prevCategory.id);
        }
    };

    const handleMoveDown = async (categoryId: string, type: 'expense' | 'income') => {
        const categoryList = categories.filter(c => c.type === type).sort((a, b) => (a.order || 0) - (b.order || 0));
        const currentIndex = categoryList.findIndex(c => c.id === categoryId);
        if (currentIndex < categoryList.length - 1) {
            const nextCategory = categoryList[currentIndex + 1];
            await reorderCategories(categoryId, nextCategory.id);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-start z-50 p-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg w-full max-w-md mx-auto max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg sm:text-xl font-bold font-display">Category Editor</h2>
                        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">Customize your categories</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                                Add Category
                            </button>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Expense Categories</h3>
                        <div className="grid gap-2">
                            {categories.filter(c => c.type === 'expense').sort((a, b) => (a.order || 0) - (b.order || 0)).map((category, index, arr) => (
                                        <div key={category.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{category.emoji}</span>
                                                <span className="font-medium">{category.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleMoveUp(category.id, 'expense')}
                                                    disabled={index === 0}
                                                    className={`p-1 rounded text-xs ${index === 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-background'}`}
                                                    title="Move up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(category.id, 'expense')}
                                                    disabled={index === arr.length - 1}
                                                    className={`p-1 rounded text-xs ${index === arr.length - 1 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-background'}`}
                                                    title="Move down"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Income Categories</h3>
                        <div className="grid gap-2">
                            {categories.filter(c => c.type === 'income').sort((a, b) => (a.order || 0) - (b.order || 0)).map((category, index, arr) => (
                                        <div key={category.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{category.emoji}</span>
                                                <span className="font-medium">{category.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleMoveUp(category.id, 'income')}
                                                    disabled={index === 0}
                                                    className={`p-1 rounded text-xs ${index === 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-background'}`}
                                                    title="Move up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(category.id, 'income')}
                                                    disabled={index === arr.length - 1}
                                                    className={`p-1 rounded text-xs ${index === arr.length - 1 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-background'}`}
                                                    title="Move down"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Category Modal */}
                    {showAddModal && (
                <CategoryModal
                    onClose={() => setShowAddModal(false)}
                    onSave={async (categoryData) => {
                        await addCategory(categoryData);
                        setShowAddModal(false);
                    }}
                />
            )}

            {/* Edit Category Modal */}
            {showEditModal && editingCategory && (
                <CategoryModal
                    category={editingCategory}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingCategory(null);
                    }}
                    onSave={async (categoryData) => {
                        if (editingCategory) {
                            // For updates, include the existing order
                            await updateCategory({ ...editingCategory, ...categoryData, order: editingCategory.order });
                        } else {
                            await addCategory(categoryData);
                        }
                        setShowEditModal(false);
                        setEditingCategory(null);
                    }}
                />
                    )}
                </div>
            </div>
        </>
    );
};

// Category Modal Component
interface CategoryModalProps {
    category?: Category | null;
    onClose: () => void;
    onSave: (category: Omit<Category, 'id' | 'order'>) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        emoji: category?.emoji || '',
        type: category?.type || 'expense' as 'expense' | 'income'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() && formData.emoji.trim()) {
            onSave({
                name: formData.name.trim(),
                emoji: formData.emoji.trim(),
                type: formData.type
            });
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-2">
                <div className="bg-card backdrop-blur-sm border border-border rounded-lg p-6 w-full max-w-md relative">
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                        <CloseIcon className="w-6 h-6" />
                    </button>

                    <h2 className="text-xl font-bold text-center text-foreground font-display mb-6">
                        {category ? 'Edit Category' : 'Add Category'}
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-1">Emoji</label>
                                <input
                                    type="text"
                                    value={formData.emoji}
                                    onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                                    placeholder="😊"
                                    maxLength={2}
                                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-center text-2xl text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Category name"
                                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-2">Type</label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-md">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                                    className={`w-full py-1.5 rounded text-sm font-semibold ${formData.type === 'expense' ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground'}`}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                                    className={`w-full py-1.5 rounded text-sm font-semibold ${formData.type === 'income' ? 'bg-green-600 text-white' : 'text-muted-foreground'}`}
                                >
                                    Income
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-md hover:opacity-90 transition-opacity">
                                {category ? 'Update Category' : 'Add Category'}
                            </button>
                            <button type="button" onClick={onClose} className="flex-1 bg-secondary text-foreground font-bold py-2 rounded-md hover:opacity-90 transition-opacity">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

// Main Profile View Component
const ProfileView: React.FC = () => {
    const { settings, updateSettings, categories } = useAppContext();
    const [showCategoryEditor, setShowCategoryEditor] = useState(false);

    if (!settings) return null;

    return (
        <>
            <AnimatedBackground page="profile" />
            <div className="p-3 sm:p-4 space-y-6 sm:space-y-8">
                <header className="flex justify-between items-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-display">Profile & Settings</h1>
                     <button onClick={() => updateSettings({ privacyMode: !settings.privacyMode })} className="text-muted-foreground hover:text-foreground p-2 rounded-full">
                        {settings.privacyMode ? <PrivacyOnIcon className="w-6 h-6" /> : <PrivacyOffIcon className="w-6 h-6" />}
                    </button>
                </header>
                <NetWorthSection />
                <GoalsSection />
                <CardsSection />
                <SettingsSection />
{/* Category Editor Button */}
<section className="space-y-4">
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4">
                        <button
                            onClick={() => setShowCategoryEditor(true)}
                            className="w-full flex items-center justify-between p-2 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Category Editor</h3>
                                    <p className="text-sm text-muted-foreground">Customize categories</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                                    {categories.length} categories
                                </div>
                                <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </button>
                    </div>
                </section>
                
            </div>

            {/* Category Editor Modal */}
            {showCategoryEditor && (
                <CategoryEditorModal onClose={() => setShowCategoryEditor(false)} />
            )}
        </>
    );
};

// Net Worth Section
const NetWorthSection: React.FC = () => {
    const { assets, cards, settings, addAsset, updateAsset, deleteAsset, updateSettings } = useAppContext();
    
    const [showAddAssetForm, setShowAddAssetForm] = useState(false);
    const [assetName, setAssetName] = useState('');
    const [assetValue, setAssetValue] = useState('');

    const totalAssetsValue = useMemo(() => assets.reduce((sum, a) => sum + a.value, 0), [assets]);
    const totalLiabilities = useMemo(() => cards.filter(c => !c.archived).reduce((sum, c) => sum + c.balance, 0), [cards]);
    const netWorth = (settings?.totalSavings || 0) + totalAssetsValue - totalLiabilities;
    
    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (assetName && assetValue) {
            await addAsset({ name: assetName, value: parseFloat(assetValue) });
            setAssetName('');
            setAssetValue('');
            setShowAddAssetForm(false);
        }
    };
    
    if(!settings) return null;

    return (
        <section className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold font-display">Net Worth</h2>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 sm:p-6 rounded-lg text-center">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Net Worth</h3>
                <PrivacyWrapper>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 tracking-tight font-numbers break-words">{formatCurrency(netWorth).display}</p>
                    <p className="text-xs opacity-70 font-numbers">{formatCurrency(netWorth).exact}</p>
                </PrivacyWrapper>
            </div>
             <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm text-green-400 font-semibold">Total Assets</h3>
                    <PrivacyWrapper>
                        <p className="text-sm sm:text-base md:text-lg font-bold font-numbers break-words">{formatCurrency(settings.totalSavings + totalAssetsValue).display}</p>
                        <p className="text-[10px] opacity-70 font-numbers">{formatCurrency(settings.totalSavings + totalAssetsValue).exact}</p>
                    </PrivacyWrapper>
                </div>
                 <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm text-red-400 font-semibold">Total Liabilities</h3>
                    <PrivacyWrapper>
                        <p className="text-sm sm:text-base md:text-lg font-bold font-numbers break-words">{formatCurrency(totalLiabilities).display}</p>
                        <p className="text-[10px] opacity-70 font-numbers">{formatCurrency(totalLiabilities).exact}</p>
                    </PrivacyWrapper>
                </div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">Total Savings (Liquid Cash)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                     <input type="number" value={settings.totalSavings} onChange={e => updateSettings({ totalSavings: parseFloat(e.target.value) || 0 })} className={`w-full bg-input p-2 rounded-md font-semibold pl-6 font-numbers text-sm sm:text-base ${settings.privacyMode ? 'blur' : ''}`}/>
                </div>
                <p className="text-xs text-muted-foreground">This is your central savings pool for all goals.</p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Other Assets</h3>
                    <button onClick={() => setShowAddAssetForm(!showAddAssetForm)} className="text-sm font-semibold text-primary">{showAddAssetForm ? 'Cancel' : '+ Add Asset'}</button>
                </div>
                {showAddAssetForm && (
                     <form onSubmit={handleAddAsset} className="bg-card p-2 sm:p-3 rounded-lg space-y-2 border border-border">
                        <input type="text" placeholder="Asset Name" value={assetName} onChange={e => setAssetName(e.target.value)} required className="w-full bg-input p-2 rounded-md text-xs sm:text-sm"/>
                        <div className="flex gap-2">
                            <input type="number" placeholder="Value" value={assetValue} onChange={e => setAssetValue(e.target.value)} required className="flex-1 bg-input p-2 rounded-md text-xs sm:text-sm font-numbers min-w-0"/>
                            <button type="submit" className="bg-primary text-primary-foreground font-bold px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Add</button>
                            <button type="button" onClick={() => { setShowAddAssetForm(false); setAssetName(''); setAssetValue(''); }} className="bg-secondary text-foreground px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Cancel</button>
                        </div>
                    </form>
                )}
                {assets.map(asset => (
                    <div key={asset.id} className="bg-card/50 backdrop-blur-sm border border-border/50 p-3 rounded-lg flex justify-between items-center">
                       <div>
                            <p className="font-semibold">{asset.name}</p>
                            {/* FIX: Corrected typo from toLocaleDateDateString to toLocaleDateString */}
                            <p className="text-xs text-muted-foreground">Updated: {new Date(asset.lastUpdated).toLocaleDateString()}</p>
                       </div>
                       <div className="flex items-center gap-2">
                        <input type="number" value={asset.value} onChange={(e) => updateAsset({...asset, value: parseFloat(e.target.value) || 0})} className={`w-24 sm:w-28 bg-input p-2 rounded-md text-right text-xs sm:text-sm font-numbers ${settings.privacyMode ? 'blur' : ''}`}/>
                        <button onClick={() => deleteAsset(asset.id)} className="text-muted-foreground hover:text-destructive"><DeleteIcon className="w-4 h-4"/></button>
                       </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

// Goals Section
const GoalCard: React.FC<{ goal: any }> = ({ goal }) => {
    const { settings, assets, deleteGoal } = useAppContext();
    const totalAssetsValue = useMemo(() => assets.reduce((sum, a) => sum + a.value, 0), [assets]);
    
    if (!settings) return null;

    const totalFundable = settings.totalSavings + totalAssetsValue;

    const { progressSavings, progressAssets, monthlySaving, status, insights } = useMemo(() => {
        const remainingAmount = Math.max(0, goal.targetAmount - settings.totalSavings);
        const daysLeft = (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        const monthsLeft = Math.max(1, daysLeft / 30.44); // Ensure at least 1 month

        let statusText = 'On Track';
        let statusColor = 'text-green-500';
        let monthly = 0;
        let explanation = '';
        let recommendations: string[] = [];

        if (remainingAmount <= 0) {
            statusText = 'Achieved';
            statusColor = 'text-green-500';
            explanation = 'Congratulations! You\'ve reached your savings goal. Consider setting a new goal or investing your savings.';
        } else if (daysLeft <= 0) {
            statusText = 'Overdue';
            statusColor = 'text-red-500';
            explanation = 'The deadline has passed. Consider adjusting your target date or reassessing the goal amount.';
            recommendations = [
                'Extend the deadline to a more realistic timeframe',
                'Reduce the target amount if possible',
                'Consider breaking this into smaller, achievable milestones'
            ];
        } else {
            // Calculate monthly savings needed
            if (daysLeft <= 0) {
                // Deadline is past - spread remaining over 12 months
                monthly = remainingAmount / 12;
            } else if (daysLeft > 365 * 10) {
                // Deadline is more than 10 years away - cap at reasonable timeframe
                monthly = remainingAmount / (365 * 10 / 30.44); // 10 years in months
            } else {
                monthly = remainingAmount / monthsLeft;
            }

            const incomePercentage = settings.monthlyIncome > 0 ? (monthly / settings.monthlyIncome) * 100 : 0;
            
            if (settings.monthlyIncome > 0 && monthly > settings.monthlyIncome) {
                statusText = 'At Risk';
                statusColor = 'text-red-500';
                const progressPct = (settings.totalSavings / goal.targetAmount) * 100;
                const additionalIncomeNeeded = monthly - settings.monthlyIncome;
                const increasePercentage = (additionalIncomeNeeded / settings.monthlyIncome) * 100;
                explanation = `You need to save ${formatCurrency(monthly).display} per month, but your monthly income is only ${formatCurrency(settings.monthlyIncome).display}. You would need to earn ${increasePercentage.toFixed(0)}% more (${formatCurrency(additionalIncomeNeeded).display}) to make this goal achievable.`;
                recommendations = [
                    `Extend deadline: Moving the deadline by ${Math.ceil(monthsLeft * 0.5)} months would reduce monthly savings to ${formatCurrency(remainingAmount / (monthsLeft * 1.5)).display}`,
                    `Reduce target: Lowering the goal by 20% would require ${formatCurrency(goal.targetAmount * 0.8 * (1 - progressPct / 100) / monthsLeft).display} per month`,
                    `Increase income: Consider side income or negotiate a raise to make this goal achievable`,
                    `Break it down: Split into smaller milestones (e.g., save 50% now, rest later)`
                ];
            } else if (settings.monthlyIncome > 0 && monthly > settings.monthlyIncome * 0.5) {
                statusText = 'Ambitious';
                statusColor = 'text-yellow-500';
                const savingsPercentage = (monthly / settings.monthlyIncome) * 100;
                explanation = `You need to save ${formatCurrency(monthly).display} per month (${savingsPercentage.toFixed(0)}% of your income). This requires significant savings but is achievable with budgeting.`;
                recommendations = [
                    `Track expenses: Review spending to find ${formatCurrency(monthly * 0.3).display}-${formatCurrency(monthly * 0.5).display} in potential savings`,
                    `Automate savings: Set up automatic transfers of ${formatCurrency(monthly).display} on payday`,
                    `Reduce non-essentials: Cut back on dining out, subscriptions, or entertainment temporarily`,
                    `Consider assets: Your other assets (${formatCurrency(totalAssetsValue).display}) could help if liquidated`
                ];
            } else {
                statusText = 'On Track';
                statusColor = 'text-green-500';
                const progressPct = (settings.totalSavings / goal.targetAmount) * 100;
                const savingsPercentage = (monthly / settings.monthlyIncome) * 100;
                explanation = `You're making great progress! Save ${formatCurrency(monthly).display} per month (${savingsPercentage.toFixed(0)}% of income) to reach your goal on time.`;
                recommendations = [
                    `Stay consistent: Automate ${formatCurrency(monthly).display} monthly savings`,
                    `Monitor progress: You're ${progressPct.toFixed(0)}% there - keep it up!`,
                    `Consider accelerating: If possible, save extra to finish early`
                ];
            }
        }

        return {
            progressSavings: (settings.totalSavings / goal.targetAmount) * 100,
            progressAssets: (totalFundable / goal.targetAmount) * 100,
            monthlySaving: monthly,
            status: { text: statusText, color: statusColor },
            insights: { explanation, recommendations, monthsLeft: Math.ceil(monthsLeft), remainingAmount }
        };
    }, [goal, settings.totalSavings, settings.monthlyIncome, totalFundable, totalAssetsValue]);

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold">{goal.name}</h3>
                    <p className={`text-sm font-semibold ${status.color}`}>{status.text}</p>
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="text-muted-foreground hover:text-destructive"><DeleteIcon className="w-4 h-4"/></button>
            </div>
            <PrivacyWrapper>
                <p className="text-base sm:text-lg font-semibold font-numbers break-words">
                    {formatCurrency(settings.totalSavings).display}
                    <span className="text-xs sm:text-sm text-muted-foreground"> / {formatCurrency(goal.targetAmount).display}</span>
                </p>
                <p className="text-[10px] opacity-70 font-numbers">
                    {formatCurrency(settings.totalSavings).exact} / {formatCurrency(goal.targetAmount).exact}
                </p>
            </PrivacyWrapper>
            
            <div>
                <ProgressBar label="Savings Pool" percentage={progressSavings} />
                <div className="block h-2"></div>
                <ProgressBar label="Total Assets" percentage={progressAssets} colorClass="bg-blue-500" />
            </div>

            {status.text !== 'Achieved' && (
                <div className="space-y-3 pt-2 border-t border-border">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-secondary/50 p-2 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">Remaining</p>
                            <PrivacyWrapper>
                                <p className="font-bold text-sm font-numbers">{formatCurrency(insights.remainingAmount).display}</p>
                                <p className="text-[9px] opacity-70 font-numbers">{formatCurrency(insights.remainingAmount).exact}</p>
                            </PrivacyWrapper>
                        </div>
                        <div className="bg-secondary/50 p-2 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">Time Left</p>
                            <p className="font-bold text-sm">{insights.monthsLeft} {insights.monthsLeft === 1 ? 'month' : 'months'}</p>
                        </div>
                    </div>

                    {/* Monthly Savings Required */}
                    {monthlySaving > 0 && (
                        <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold">Monthly Savings Needed</p>
                                <PrivacyWrapper>
                                    <p className="font-bold text-base font-numbers">{formatCurrency(monthlySaving).display}</p>
                                </PrivacyWrapper>
                            </div>
                            {settings.monthlyIncome > 0 && (
                                <div className="text-[10px] text-muted-foreground">
                                    <p>{((monthlySaving / settings.monthlyIncome) * 100).toFixed(0)}% of your monthly income</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Explanation & Recommendations */}
                    <div className={`p-3 rounded-lg border ${status.color === 'text-red-500' ? 'bg-red-500/10 border-red-500/20' : status.color === 'text-yellow-500' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                        <p className={`text-xs font-semibold mb-2 ${status.color}`}>{status.text}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{insights.explanation}</p>
                        {insights.recommendations.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Recommendations:</p>
                                <ul className="space-y-1">
                                    {insights.recommendations.map((rec, idx) => (
                                        <li key={idx} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                                            <span className="text-primary mt-0.5">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProgressBar: React.FC<{label: string, percentage: number, colorClass?: string}> = ({label, percentage, colorClass = 'bg-primary'}) => (
    <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{label}</span>
            <span>{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
            <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        </div>
    </div>
);


const GoalsSection: React.FC = () => {
    const { goals, addGoal } = useAppContext();
    const [showAddForm, setShowAddForm] = useState(false);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetAmount && deadline) {
            await addGoal({ name, targetAmount: parseFloat(targetAmount), deadline });
            setName(''); setTargetAmount(''); setDeadline('');
            setShowAddForm(false);
        }
    };
    
    return (
        <section className="space-y-4">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold font-display">Savings Goals</h2>
                 <button onClick={() => setShowAddForm(!showAddForm)} className="text-sm font-semibold text-primary">{showAddForm ? 'Cancel' : '+ New Goal'}</button>
            </div>
             {showAddForm && (
                <form onSubmit={handleSubmit} className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg space-y-3">
                    <input type="text" placeholder="Goal Name (e.g., New Laptop)" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-input p-2 rounded-md"/>
                    <input type="number" placeholder="Target Amount (HKD)" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required className="w-full bg-input p-2 rounded-md font-numbers text-sm sm:text-base"/>
                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required className="w-full bg-input p-2 rounded-md"/>
                    <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-md text-sm">Add Goal</button>
                </form>
            )}

            {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </section>
    );
};

// Cards Section
const CardsSection: React.FC = () => {
    const { cards, addCard, archiveCard, addTransaction, settings } = useAppContext();
    const [showAddForm, setShowAddForm] = useState(false);
    const [name, setName] = useState('');
    const [limit, setLimit] = useState('');
    const [payingCardId, setPayingCardId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const activeCards = cards.filter(c => !c.archived);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && limit) {
            await addCard({ name, limit: parseFloat(limit) });
            setName(''); setLimit(''); setShowAddForm(false);
        }
    };

    const handlePayCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (payingCardId && paymentAmount && settings) {
            const amount = parseFloat(paymentAmount);
            const card = cards.find(c => c.id === payingCardId);
            if (card && amount > 0 && amount <= card.balance && amount <= settings.totalSavings) {
                await addTransaction({
                    type: 'credit_card_payment',
                    amount,
                    category: 'Credit Card Payment',
                    description: `Payment for ${card.name}`,
                    paymentMethod: 'Bank',
                    cardId: payingCardId,
                    date: new Date().toISOString().split('T')[0],
                });
                setPayingCardId(null);
                setPaymentAmount('');
            }
        }
    };

    return (
        <section className="space-y-4">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold font-display">Credit Cards</h2>
                 <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">{showAddForm ? 'Cancel' : '+ New Card'}</button>
            </div>
            {showAddForm && (
                <form onSubmit={handleSubmit} className="bg-card/50 backdrop-blur-sm border border-border/50 p-3 sm:p-4 rounded-lg space-y-2">
                    <input type="text" placeholder="Card Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-input p-2 rounded-md text-sm"/>
                    <div className="flex gap-2">
                        <input type="number" placeholder="Limit (HKD)" value={limit} onChange={e => setLimit(e.target.value)} required className="flex-1 bg-input p-2 rounded-md font-numbers text-xs sm:text-sm min-w-0"/>
                        <button type="submit" className="bg-primary text-primary-foreground font-bold px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Add</button>
                        <button type="button" onClick={() => { setShowAddForm(false); setName(''); setLimit(''); }} className="bg-secondary text-foreground px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Cancel</button>
                    </div>
                </form>
            )}
             {activeCards.map(card => {
                    const utilization = card.limit > 0 ? (card.balance / card.limit) * 100 : 0;
                    return (
                        <div key={card.id} className="bg-card/50 backdrop-blur-sm border border-border/50 p-3 sm:p-4 rounded-lg space-y-2">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-sm sm:text-base">{card.name}</h3>
                                <button onClick={() => archiveCard(card.id)} className="text-xs text-destructive">Archive</button>
                            </div>
                             <div className="w-full bg-secondary rounded-full h-2 my-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${utilization}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                                <div className="font-numbers">
                                    <span>Bal: </span>
                                    <PrivacyWrapper>
                                        <div>{formatCurrency(card.balance).display}</div>
                                        <div className="text-[10px] opacity-70">{formatCurrency(card.balance).exact}</div>
                                    </PrivacyWrapper>
                                </div>
                                <div className="font-numbers">
                                    <span>Limit: </span>
                                    <PrivacyWrapper>
                                        <div>{formatCurrency(card.limit).display}</div>
                                        <div className="text-[10px] opacity-70">{formatCurrency(card.limit).exact}</div>
                                    </PrivacyWrapper>
                                </div>
                            </div>
                            {card.balance > 0 && (
                                <div className="pt-2 border-t border-border">
                                    {payingCardId === card.id ? (
                                        <form onSubmit={handlePayCard} className="flex gap-2">
                                            <input 
                                                type="number" 
                                                placeholder="Amount" 
                                                value={paymentAmount} 
                                                onChange={e => setPaymentAmount(e.target.value)} 
                                                required 
                                                min="0.01"
                                                max={Math.min(card.balance, settings?.totalSavings || 0)}
                                                step="0.01"
                                                className="flex-1 bg-input p-2 rounded-md font-numbers text-xs sm:text-sm"
                                            />
                                            <button type="submit" className="bg-green-600 text-white font-bold px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap">Pay</button>
                                            <button type="button" onClick={() => { setPayingCardId(null); setPaymentAmount(''); }} className="bg-secondary text-foreground px-3 py-2 rounded-md text-xs sm:text-sm">Cancel</button>
                                        </form>
                                    ) : (
                                        <button 
                                            onClick={() => setPayingCardId(card.id)} 
                                            className="w-full bg-green-600 text-white font-bold py-2 rounded-md text-xs sm:text-sm"
                                        >
                                            Pay Credit Card
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
        </section>
    );
};

// General Settings Section
const SettingsSection: React.FC = () => {
    const { settings, updateSettings } = useAppContext();
    const { logout } = useAuth();
    const [monthlyIncome, setMonthlyIncome] = useState(settings?.monthlyIncome.toString() || '');
    const [saved, setSaved] = useState(false);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    if(!settings) return null;
    
    const handleUpdateIncome = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings({ monthlyIncome: parseFloat(monthlyIncome) || 0 });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleTheme = () => {
        updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setImportStatus({ type: 'error', message: 'Please select a JSON file' });
            setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
            return;
        }

        const result = await importDataFromFile(file);
        if (result.success) {
            setImportStatus({ type: 'success', message: 'Data imported successfully! Reloading...' });
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            setImportStatus({ type: 'error', message: result.error || 'Failed to import data' });
            setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 font-display">General Settings</h2>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg flex justify-between items-center">
                <label className="font-medium text-sm">Appearance</label>
                <div className="flex items-center gap-2 p-1 bg-secondary rounded-md">
                    <button onClick={toggleTheme} disabled={settings.theme === 'light'} className={`px-2 py-1 rounded-sm text-muted-foreground disabled:text-foreground disabled:bg-background`}>
                        <SunIcon className="w-5 h-5"/>
                    </button>
                     <button onClick={toggleTheme} disabled={settings.theme === 'dark'} className={`px-2 py-1 rounded-sm text-muted-foreground disabled:text-foreground disabled:bg-background`}>
                        <MoonIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <form onSubmit={handleUpdateIncome} className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg space-y-2">
                <label htmlFor="income" className="block text-sm font-medium text-muted-foreground">Monthly Income (for goal projections)</label>
                <div className="flex gap-2">
                    <input id="income" type="number" placeholder="e.g., 30000" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className={`flex-1 bg-input p-2 rounded-md font-numbers text-sm sm:text-base ${settings.privacyMode ? 'blur' : ''}`}/>
                    <button type="submit" className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md text-sm w-24">
                        {saved ? <CheckCircleIcon className="w-5 h-5 mx-auto"/> : 'Save'}
                    </button>
                </div>
            </form>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg space-y-2">
                <div className="space-y-2">
                    <button 
                        onClick={downloadDataAsJson} 
                        className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-2 px-4 rounded-md text-sm"
                    >
                        Export All Data (JSON)
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button 
                        onClick={handleImportClick}
                        className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-2 px-4 rounded-md text-sm"
                    >
                        Import Data (JSON)
                    </button>
                    {importStatus.type && (
                        <div className={`p-2 rounded-md text-sm ${
                            importStatus.type === 'success' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                        }`}>
                            {importStatus.message}
                        </div>
                    )}
                </div>
                <div className="pt-2 border-t border-border">
                    <button onClick={logout} className="w-full text-center text-destructive font-semibold py-2">
                        Logout
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ProfileView;