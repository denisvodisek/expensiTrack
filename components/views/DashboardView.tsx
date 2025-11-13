
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import PrivacyWrapper from '../PrivacyWrapper';
import { PrivacyOnIcon, PrivacyOffIcon, CreditCardIcon } from '../Icons';

const currencyFormatter = new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD' });
const PIE_COLORS = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#fde047', '#22d3ee'];


const DashboardView: React.FC = () => {
    const { transactions, settings, cards, updateSettings, loading } = useAppContext();

    if (loading || !settings) {
        return <div className="p-4 text-center">Loading...</div>;
    }
    
    // --- Data processing ---
    const now = new Date();
    const currentMonthTransactions = transactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
    
    const monthlyIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netFlow = monthlyIncome - monthlyExpense;

    const categorySpending = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
    }, {} as Record<string, number>);

    const pieChartData = Object.entries(categorySpending).map(([name, value]) => ({ name, value }));
    
    const activeCards = cards.filter(c => !c.archived);

    const dailyFlowData = currentMonthTransactions
        .reduce((acc, t) => {
            const day = new Date(t.date).getDate();
            if (!acc[day]) {
                acc[day] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                acc[day].income += t.amount;
            } else {
                acc[day].expense += t.amount;
            }
            return acc;
        }, {} as Record<number, { income: number, expense: number }>);

    const barChartData = Array.from({length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}, (_, i) => i + 1)
        .map(day => ({
            name: String(day),
            Income: dailyFlowData[day]?.income || 0,
            Expense: dailyFlowData[day]?.expense || 0,
        }));

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
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <StatCard title="Income" value={currencyFormatter.format(monthlyIncome)} color="text-green-500" />
                <StatCard title="Expense" value={currencyFormatter.format(monthlyExpense)} color="text-red-500" />
                <StatCard title="Net Flow" value={currencyFormatter.format(netFlow)} color={netFlow >= 0 ? 'text-green-500' : 'text-red-500'} />
            </div>

             <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                <h2 className="text-base sm:text-lg font-semibold font-display mb-2">Daily Flow (This Month)</h2>
                <div className="h-48">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                            <Tooltip
                                cursor={{fill: 'hsl(var(--secondary))'}}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            <Bar dataKey="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card border border-border p-3 sm:p-4 rounded-lg">
                    <h2 className="text-base sm:text-lg font-semibold font-display mb-2">Category Breakdown</h2>
                    {pieChartData.length > 0 ? (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={50} fill="#8884d8" paddingAngle={5} stroke="none">
                                        {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
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
                                    <span className="font-numbers"><PrivacyWrapper>{currencyFormatter.format(card.balance)}</PrivacyWrapper></span>
                                    <span className="font-numbers"><PrivacyWrapper>{currencyFormatter.format(card.limit)}</PrivacyWrapper></span>
                                </div>
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

const StatCard: React.FC<{title: string; value: string; color?: string}> = ({ title, value, color }) => (
    <div className="bg-card border border-border p-2 sm:p-4 rounded-lg col-span-1">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</h3>
        <p className={`text-lg sm:text-xl md:text-2xl font-bold mt-1 font-numbers break-words ${color || 'text-foreground'}`}><PrivacyWrapper>{value}</PrivacyWrapper></p>
    </div>
);

export default DashboardView;
