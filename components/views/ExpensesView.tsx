import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Transaction } from '@/types';
import { EditIcon, DeleteIcon } from '@/components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import PrivacyWrapper from '@/components/PrivacyWrapper';
import { formatCurrency } from '@/lib/currency';

const currencyFormatter = new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD' });
const PIE_COLORS = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#fde047', '#22d3ee'];


interface TransactionsViewProps {
    onEditTransaction: (transaction: Transaction) => void;
}

const TransactionListItem: React.FC<{ transaction: Transaction; onEdit: () => void; onDelete: () => void; }> = ({ transaction, onEdit, onDelete }) => {
    const { getCardById, categories } = useAppContext();
    const paymentDetail = transaction.paymentMethod === 'Credit Card' && transaction.cardId ? getCardById(transaction.cardId)?.name : transaction.paymentMethod;
    const category = categories.find(c => c.name === transaction.category);

    return (
        <div className="bg-card p-2.5 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="bg-secondary p-1.5 rounded-md text-base flex-shrink-0">
                    <span>{category?.emoji || '-'}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{transaction.category}</p>
                    <p className="text-xs text-muted-foreground truncate">{transaction.description || (transaction.type === 'expense' ? paymentDetail : transaction.type === 'credit_card_payment' ? 'Credit Card Payment' : 'Income')}</p>
                </div>
            </div>
            <div className="text-right flex items-center space-x-2 flex-shrink-0">
                <div>
                    <p className={`font-bold text-sm font-numbers whitespace-nowrap ${transaction.type === 'income' ? 'text-green-400' : transaction.type === 'credit_card_payment' ? 'text-blue-400' : 'text-foreground'}`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'credit_card_payment' ? '↻' : '-'}
                        {formatCurrency(transaction.amount).display}
                    </p>
                    <p className={`text-[10px] opacity-70 font-numbers ${transaction.type === 'income' ? 'text-green-400' : transaction.type === 'credit_card_payment' ? 'text-blue-400' : 'text-foreground'}`}>
                        {formatCurrency(transaction.amount).exact}
                    </p>
                </div>
                <div className="flex items-center space-x-1.5">
                   <button onClick={onEdit} className="text-muted-foreground hover:text-blue-400"><EditIcon className="w-3.5 h-3.5"/></button>
                   <button onClick={onDelete} className="text-muted-foreground hover:text-red-400"><DeleteIcon className="w-3.5 h-3.5"/></button>
                </div>
            </div>
        </div>
    );
};

const TransactionsView: React.FC<TransactionsViewProps> = ({ onEditTransaction }) => {
    const { transactions, deleteTransaction, loading } = useAppContext();
    const [filterPeriod, setFilterPeriod] = useState('month');
    const [customFromDate, setCustomFromDate] = useState('');
    const [customToDate, setCustomToDate] = useState('');

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let startDate = new Date(0);
        let endDate: Date | null = todayEnd;

        switch (filterPeriod) {
            case 'week':
                startDate = new Date();
                startDate.setDate(now.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month': // This Month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last-month':
                 startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                 endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'quarter': // Last 3 Months
                startDate = new Date();
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'custom':
                if (customFromDate) {
                    startDate = new Date(customFromDate);
                    startDate.setHours(0, 0, 0, 0);
                }
                if (customToDate) {
                    endDate = new Date(customToDate);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    endDate = todayEnd;
                }
                break;
        }

        return transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return tDate >= startDate && tDate <= (endDate || todayEnd);
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filterPeriod, customFromDate, customToDate]);

    const handleResetCustom = () => {
        setCustomFromDate('');
        setCustomToDate('');
        setFilterPeriod('month');
    };
    
    const groupedTransactions = useMemo(() => {
        return filteredTransactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(transaction);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [filteredTransactions]);

    return (
        <div className="p-3 sm:p-4 space-y-6 sm:space-y-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-display">Transactions</h1>
            
            <div className="space-y-3">
                <div className="flex space-x-2 bg-secondary p-1 rounded-md">
                    <FilterButton label="This Mnth" period="month" activePeriod={filterPeriod} setPeriod={setFilterPeriod} />
                    <FilterButton label="Last Mnth" period="last-month" activePeriod={filterPeriod} setPeriod={setFilterPeriod} />
                    <FilterButton label="Last 3 Mths" period="quarter" activePeriod={filterPeriod} setPeriod={setFilterPeriod} />
                    <FilterButton label="Custom" period="custom" activePeriod={filterPeriod} setPeriod={setFilterPeriod} />
                </div>

                {filterPeriod === 'custom' && (
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-3 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Custom Date Range</p>
                            <button
                                onClick={handleResetCustom}
                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">From</label>
                                <input
                                    type="date"
                                    value={customFromDate}
                                    onChange={(e) => setCustomFromDate(e.target.value)}
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm"
                                    max={customToDate || undefined}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">To</label>
                                <input
                                    type="date"
                                    value={customToDate}
                                    onChange={(e) => setCustomToDate(e.target.value)}
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm"
                                    min={customFromDate || undefined}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ChartsView transactions={filteredTransactions} />

            {loading ? (
                <p>Loading transactions...</p>
            ) : Object.keys(groupedTransactions).length === 0 ? (
                <div className="text-center text-muted-foreground mt-16">
                    <p className="text-4xl mb-2">📄</p>
                    <p>No transactions found for this period.</p>
                </div>
            ) : (
                Object.keys(groupedTransactions).map((date) => (
                    <div key={date}>
                        <h2 className="text-muted-foreground font-semibold my-2 text-sm">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                        <div className="space-y-2">
                            {groupedTransactions[date].map(transaction => (
                                <TransactionListItem
                                    key={transaction.id}
                                    transaction={transaction}
                                    onEdit={() => onEditTransaction(transaction)}
                                    onDelete={() => deleteTransaction(transaction.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const FilterButton: React.FC<{label: string; period: string; activePeriod: string; setPeriod: (p: string) => void}> = 
    ({label, period, activePeriod, setPeriod}) => (
    <button onClick={() => setPeriod(period)} className={`flex-1 py-1.5 px-2 rounded text-[10px] font-semibold transition-colors ${activePeriod === period ? 'bg-background shadow' : 'text-muted-foreground'}`}>{label}</button>
);


const ChartsView: React.FC<{transactions: Transaction[]}> = ({ transactions }) => {
    const { categories } = useAppContext();
    const { income, expense, flow } = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        // Note: credit_card_payment is excluded from income/expense calculations
        return { income, expense, flow: income - expense };
    }, [transactions]);
    
    const categorySpending = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        // Exclude credit_card_payment from category spending
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>), [transactions]);

    const pieChartData = useMemo(() => Object.entries(categorySpending).map(([name, value], index) => {
        const category = categories.find(c => c.name === name);
        return { 
            name, 
            value,
            emoji: category?.emoji || '',
            color: PIE_COLORS[index % PIE_COLORS.length]
        };
    }), [categorySpending, categories]);

    const dailyFlowData = useMemo(() => {
        const grouped = transactions.reduce((acc, t) => {
            const date = new Date(t.date).toLocaleDateString();
             if (!acc[date]) {
                acc[date] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') acc[date].income += t.amount;
            else if (t.type === 'expense') acc[date].expense += t.amount;
            // credit_card_payment is excluded from income/expense calculations
            return acc;
        }, {} as Record<string, {income: number; expense: number}>);

        return Object.keys(grouped).map(date => ({
            name: new Date(date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
            date: new Date(date),
            Income: grouped[date].income,
            Expense: grouped[date].expense
        })).sort((a,b) => a.date.getTime() - b.date.getTime());
    }, [transactions]);
    
    if (transactions.length === 0) return null;

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <StatCard title="Income" amount={income} color="text-green-500" />
                <StatCard title="Expense" amount={expense} color="text-red-500" />
                <StatCard title="Net Flow" amount={flow} color={flow >= 0 ? 'text-green-500' : 'text-red-500'} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold font-display mb-2">Category Breakdown</h2>
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
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                            <p>No expenses to show.</p>
                        </div>
                    )}
                </div>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold font-display mb-2">Daily Flow</h2>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyFlowData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                                <Tooltip 
                                    cursor={{fill: 'hsl(var(--secondary))'}} 
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} 
                                    itemStyle={{ fontWeight: 'bold' }} 
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                                    formatter={(value: number) => {
                                        const formatted = new Intl.NumberFormat('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2,
                                        }).format(value);
                                        return `$${formatted}`;
                                    }}
                                />
                                <Legend wrapperStyle={{fontSize: "12px"}}/>
                                <Bar dataKey="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{title: string; amount: number; color?: string}> = ({ title, amount, color }) => {
    const formatted = formatCurrency(amount);
    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-2 sm:p-3 rounded-lg col-span-1 text-center">
            <h3 className="text-xs font-medium text-muted-foreground truncate">{title}</h3>
            <PrivacyWrapper>
                <p className={`text-base sm:text-lg md:text-xl font-bold font-numbers break-words ${color || 'text-foreground'}`}>{formatted.display}</p>
                <p className={`text-[10px] opacity-70 font-numbers ${color || 'text-foreground'}`}>{formatted.exact}</p>
            </PrivacyWrapper>
        </div>
    );
};


export default TransactionsView;