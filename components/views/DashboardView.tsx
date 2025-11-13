
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import PrivacyWrapper from '@/components/PrivacyWrapper';
import { PrivacyOnIcon, PrivacyOffIcon, CreditCardIcon } from '@/components/Icons';
import { formatCurrency } from '@/lib/currency';

const currencyFormatter = new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD' });
const PIE_COLORS = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#fde047', '#22d3ee'];


const DashboardView: React.FC = () => {
    const { transactions, settings, cards, updateSettings, loading, addTransaction, categories, goals } = useAppContext();
    const [payingCardId, setPayingCardId] = React.useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = React.useState('');

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

    if (loading || !settings) {
        return <div className="p-4 text-center">Loading...</div>;
    }
    
    // --- Data processing ---
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());

    const monthlyIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    // Note: credit_card_payment is excluded from income/expense calculations
    const netFlow = monthlyIncome - monthlyExpense;

    // Calculate monthly savings progress
    const monthlySavingsProgress = useMemo(() => {
        if (!settings || goals.length === 0) return null;

        // Find active goals (not achieved, not overdue)
        const activeGoals = goals.filter(goal => {
            const remainingAmount = Math.max(0, goal.targetAmount - settings.totalSavings);
            const daysLeft = (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
            return remainingAmount > 0 && daysLeft > 0;
        });

        if (activeGoals.length === 0) return null;

        // Calculate total monthly savings needed across all goals
        const totalMonthlyNeeded = activeGoals.reduce((total, goal) => {
            const remainingAmount = Math.max(0, goal.targetAmount - settings.totalSavings);
            const daysLeft = (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
            const monthsLeft = Math.max(1, daysLeft / 30.44);

            // Cap at 10 years for reasonable calculations
            const cappedMonths = Math.min(monthsLeft, 365 * 10 / 30.44);
            return total + (remainingAmount / cappedMonths);
        }, 0);

        // Calculate what they've saved so far this month (income - expenses)
        const monthlySavings = monthlyIncome - monthlyExpense;

        const progress = (monthlySavings / totalMonthlyNeeded) * 100;
        const remaining = Math.max(0, totalMonthlyNeeded - monthlySavings);

        return {
            target: totalMonthlyNeeded,
            current: monthlySavings,
            remaining: remaining,
            progress: Math.min(100, progress),
            isOnTrack: monthlySavings >= totalMonthlyNeeded * 0.8 // 80% of target
        };
    }, [goals, settings, monthlyIncome, monthlyExpense]);

    const categorySpending = currentMonthTransactions
        .filter(t => t.type === 'expense') // Exclude credit_card_payment from spending calculations
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
    }, {} as Record<string, number>);

    const pieChartData = Object.entries(categorySpending).map(([name, value], index) => {
        const category = categories.find(c => c.name === name);
        return { 
            name, 
            value,
            emoji: category?.emoji || '',
            color: PIE_COLORS[index % PIE_COLORS.length]
        };
    });
    
    const activeCards = cards.filter(c => !c.archived);

    const dailyFlowData = currentMonthTransactions
        .reduce((acc, t) => {
            const day = new Date(t.date).getDate();
            if (!acc[day]) {
                acc[day] = { income: 0, expense: 0 };
            }
                if (t.type === 'income') {
                    acc[day].income += t.amount;
                } else if (t.type === 'expense') {
                    // Exclude credit_card_payment from expense calculations
                    acc[day].expense += t.amount;
                }
            return acc;
        }, {} as Record<number, { income: number, expense: number }>);

    // Only show days that have transactions
    const barChartData = Object.keys(dailyFlowData)
        .map(dayStr => {
            const day = parseInt(dayStr);
            const date = new Date(now.getFullYear(), now.getMonth(), day);
            return {
                name: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                day: day,
                date: date,
                Income: dailyFlowData[day].income || 0,
                Expense: dailyFlowData[day].expense || 0,
            };
        })
        .sort((a, b) => a.day - b.day);

    return (
        <div className="p-4 space-y-6">
            <header className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold font-display truncate">Hello, {settings.userName}</h1>
                    <p className="text-sm text-muted-foreground">Here's your financial overview.</p>
                </div>
                <button onClick={() => updateSettings({ privacyMode: !settings.privacyMode })} className="text-muted-foreground hover:text-foreground p-2 rounded-full">
                    {settings.privacyMode ? <PrivacyOnIcon className="w-6 h-6" /> : <PrivacyOffIcon className="w-6 h-6" />}
                </button>
            </header>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <StatCard title="Income" amount={monthlyIncome} color="text-green-500" />
                <StatCard title="Expense" amount={monthlyExpense} color="text-red-500" />
                <StatCard title="Net Flow" amount={netFlow} color={netFlow >= 0 ? 'text-green-500' : 'text-red-500'} className="col-span-2 md:col-span-1" />
            </div>

            {/* Monthly Savings Progress */}
            {monthlySavingsProgress && (
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm sm:text-base font-semibold font-display">Monthly Savings Goal</h3>
                        <div className="text-right">
                            <div className="text-sm font-bold font-numbers">{formatCurrency(monthlySavingsProgress.current).display}</div>
                            <div className="text-xs text-muted-foreground">of {formatCurrency(monthlySavingsProgress.target).display}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="w-full bg-secondary rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all duration-300 ${monthlySavingsProgress.isOnTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.max(5, monthlySavingsProgress.progress)}%` }}
                            ></div>
                        </div>

                        {monthlySavingsProgress.remaining > 0 ? (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                    {monthlySavingsProgress.isOnTrack ? 'Great progress!' : 'Need to save more this month'}
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(monthlySavingsProgress.remaining).display} remaining
                                </span>
                            </div>
                        ) : (
                            <div className="text-xs text-green-600 font-semibold text-center">
                                🎉 Monthly savings goal achieved!
                            </div>
                        )}
                    </div>
                </div>
            )}

             <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                <h2 className="text-base sm:text-lg font-semibold font-display mb-4">Daily Flow (This Month)</h2>
                {barChartData.length === 0 ? (
                    <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground">
                        <p className="text-center">No transactions this month</p>
                    </div>
                ) : (
                <div className="h-64 sm:h-80">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                                angle={-45}
                                textAnchor="end"
                                height={50}
                                interval={barChartData.length > 10 ? Math.floor(barChartData.length / 6) : 0}
                            />
                            <YAxis 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                                width={45}
                                tickFormatter={(value) => {
                                    if (value >= 1000) {
                                        return `$${(value / 1000).toFixed(1)}k`;
                                    }
                                    return `$${value}`;
                                }}
                            />
                            <Tooltip
                                cursor={{fill: 'hsl(var(--secondary))', opacity: 0.3}}
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--card))', 
                                    border: '1px solid hsl(var(--border))', 
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                                formatter={(value: number) => {
                                    const formatted = new Intl.NumberFormat('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                    }).format(value);
                                    return `$${formatted}`;
                                }}
                            />
                            <Legend 
                                wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}
                                iconType="square"
                            />
                            <Bar 
                                dataKey="Income" 
                                fill="#16a34a" 
                                radius={[6, 6, 0, 0]} 
                                name="Income"
                            />
                            <Bar 
                                dataKey="Expense" 
                                fill="#ef4444" 
                                radius={[6, 6, 0, 0]} 
                                name="Expense"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h2 className="text-base sm:text-lg font-semibold font-display mb-2">Category Breakdown</h2>
                    {pieChartData.length > 0 ? (
                        <>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={50} fill="#8884d8" paddingAngle={5} stroke="none">
                                            {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            formatter={(value: number) => {
                                                const formatted = new Intl.NumberFormat('en-US', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                }).format(value);
                                                return `$${formatted}`;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-3 space-y-1">
                                {pieChartData.map((entry, index) => {
                                    const formatted = new Intl.NumberFormat('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                    }).format(entry.value);
                                    return (
                                        <div key={index} className="flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                                                <span>{entry.emoji}</span>
                                                <span className="text-muted-foreground">{entry.name}</span>
                                            </div>
                                            <span className="font-numbers font-semibold">${formatted}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground h-48 flex items-center justify-center">No expenses this month to show.</p>
                    )}
                </div>

                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg space-y-3">
                    <h2 className="text-base sm:text-lg font-semibold font-display">Credit Cards</h2>
                    {activeCards.length > 0 ? activeCards.map(card => {
                        const utilization = card.limit > 0 ? (card.balance / card.limit) * 100 : 0;
                        return (
                             <div key={card.id}>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <CreditCardIcon className="w-4 h-4"/> {card.name}
                                    </div>
                                    <span className="font-mono">{utilization.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${utilization}%` }}></div>
                                </div>
                                 <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <div className="font-numbers">
                                        <PrivacyWrapper>
                                            <div>{formatCurrency(card.balance).display}</div>
                                            <div className="text-[10px] opacity-70">{formatCurrency(card.balance).exact}</div>
                                        </PrivacyWrapper>
                                    </div>
                                    <div className="font-numbers">
                                        <PrivacyWrapper>
                                            <div>{formatCurrency(card.limit).display}</div>
                                            <div className="text-[10px] opacity-70">{formatCurrency(card.limit).exact}</div>
                                        </PrivacyWrapper>
                                    </div>
                                </div>
                                {card.balance > 0 && (
                                    <div className="pt-2 border-t border-border mt-2">
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
                        )
                    }) : (
                         <p className="text-center text-muted-foreground h-48 flex items-center justify-center">No active credit cards.</p>
                    )}
                </div>
            </div>

        </div>
    );
};

const StatCard: React.FC<{title: string; amount: number; color?: string; className?: string}> = ({ title, amount, color, className = '' }) => {
    const formatted = formatCurrency(amount);
    return (
        <div className={`bg-card border border-border p-2 sm:p-4 rounded-lg col-span-1 ${className}`}>
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</h3>
            <PrivacyWrapper>
                <p className={`text-lg sm:text-xl md:text-2xl font-bold mt-1 font-numbers break-words ${color || 'text-foreground'}`}>{formatted.display}</p>
                <p className={`text-[8px] opacity-70 font-numbers ${color || 'text-foreground'}`}>{formatted.exact}</p>
            </PrivacyWrapper>
        </div>
    );
};

export default DashboardView;
