import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteIcon, CheckCircleIcon, SunIcon, MoonIcon, PrivacyOnIcon, PrivacyOffIcon } from '@/components/Icons';
import PrivacyWrapper from '@/components/PrivacyWrapper';
import { downloadDataAsJson, importDataFromFile } from '@/services/api';
import { formatCurrency } from '@/lib/currency';

const currencyFormatter = new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD' });

// Main Profile View Component
const ProfileView: React.FC = () => {
    const { settings, updateSettings } = useAppContext();
    if (!settings) return null;
    return (
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
        </div>
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
            <div className="bg-card border border-border p-4 sm:p-6 rounded-lg text-center">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Net Worth</h3>
                <PrivacyWrapper>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 tracking-tight font-numbers break-words">{formatCurrency(netWorth).display}</p>
                    <p className="text-xs opacity-70 font-numbers">{formatCurrency(netWorth).exact}</p>
                </PrivacyWrapper>
            </div>
             <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm text-green-400 font-semibold">Total Assets</h3>
                    <PrivacyWrapper>
                        <p className="text-sm sm:text-base md:text-lg font-bold font-numbers break-words">{formatCurrency(settings.totalSavings + totalAssetsValue).display}</p>
                        <p className="text-[10px] opacity-70 font-numbers">{formatCurrency(settings.totalSavings + totalAssetsValue).exact}</p>
                    </PrivacyWrapper>
                </div>
                 <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h3 className="text-xs sm:text-sm text-red-400 font-semibold">Total Liabilities</h3>
                    <PrivacyWrapper>
                        <p className="text-sm sm:text-base md:text-lg font-bold font-numbers break-words">{formatCurrency(totalLiabilities).display}</p>
                        <p className="text-[10px] opacity-70 font-numbers">{formatCurrency(totalLiabilities).exact}</p>
                    </PrivacyWrapper>
                </div>
            </div>
            
            <div className="bg-card border border-border p-4 rounded-lg space-y-2">
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
                    <div key={asset.id} className="bg-card border border-border p-3 rounded-lg flex justify-between items-center">
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

    const { progressSavings, progressAssets, dailySaving, monthlySaving, status } = useMemo(() => {
        const remainingAmount = Math.max(0, goal.targetAmount - settings.totalSavings);
        const daysLeft = (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);

        let statusText = 'On Track';
        let statusColor = 'text-green-500';
        let daily = 0;
        let monthly = 0;

        if (remainingAmount <= 0) {
            statusText = 'Achieved';
            statusColor = 'text-green-500';
        } else if (daysLeft <= 0) {
            statusText = 'Overdue';
            statusColor = 'text-red-500';
        } else {
            daily = remainingAmount / daysLeft;
            monthly = daily * 30.44;
            if (settings.monthlyIncome > 0 && monthly > settings.monthlyIncome) {
                statusText = 'At Risk';
                statusColor = 'text-red-500';
            } else if (settings.monthlyIncome > 0 && monthly > settings.monthlyIncome * 0.5) {
                statusText = 'Ambitious';
                statusColor = 'text-yellow-500';
            }
        }

        return {
            progressSavings: (settings.totalSavings / goal.targetAmount) * 100,
            progressAssets: (totalFundable / goal.targetAmount) * 100,
            dailySaving: daily,
            monthlySaving: monthly,
            status: { text: statusText, color: statusColor }
        };
    }, [goal, settings.totalSavings, settings.monthlyIncome, totalFundable]);

    return (
        <div className="bg-card border border-border p-4 rounded-lg space-y-3">
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
                <ProgressBar label="Total Assets" percentage={progressAssets} colorClass="bg-blue-500" />
            </div>

            {status.text !== 'Achieved' && status.text !== 'Overdue' && (
                 <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 text-center pt-2">
                    <div className="bg-secondary p-1 rounded">
                        <p>Req. Daily Saving</p>
                        <PrivacyWrapper>
                            <p className="font-bold text-foreground">{formatCurrency(dailySaving).display}</p>
                            <p className="text-[10px] opacity-70 font-numbers">{formatCurrency(dailySaving).exact}</p>
                        </PrivacyWrapper>
                    </div>
                    <div className="bg-secondary p-1 rounded">
                        <p>Req. Monthly Saving</p>
                        <PrivacyWrapper>
                            <p className="font-bold text-foreground">{formatCurrency(monthlySaving).display}</p>
                            <p className="text-[10px] opacity-70 font-numbers">{formatCurrency(monthlySaving).exact}</p>
                        </PrivacyWrapper>
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
                <form onSubmit={handleSubmit} className="bg-card border border-border p-4 rounded-lg space-y-3">
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
                <form onSubmit={handleSubmit} className="bg-card border border-border p-3 sm:p-4 rounded-lg space-y-2">
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
                        <div key={card.id} className="bg-card border border-border p-3 sm:p-4 rounded-lg space-y-2">
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
            
            <div className="bg-card border border-border p-4 rounded-lg flex justify-between items-center">
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

            <form onSubmit={handleUpdateIncome} className="bg-card border border-border p-4 rounded-lg space-y-2">
                <label htmlFor="income" className="block text-sm font-medium text-muted-foreground">Monthly Income (for goal projections)</label>
                <div className="flex gap-2">
                    <input id="income" type="number" placeholder="e.g., 30000" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className={`flex-1 bg-input p-2 rounded-md font-numbers text-sm sm:text-base ${settings.privacyMode ? 'blur' : ''}`}/>
                    <button type="submit" className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md text-sm w-24">
                        {saved ? <CheckCircleIcon className="w-5 h-5 mx-auto"/> : 'Save'}
                    </button>
                </div>
            </form>

            <div className="bg-card border border-border p-4 rounded-lg space-y-2">
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
}

export default ProfileView;