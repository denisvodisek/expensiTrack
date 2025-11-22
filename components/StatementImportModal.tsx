import React, { useState, useRef } from 'react';
import { CloseIcon, CheckCircleIcon } from './Icons';
import { useAppContext } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/currency';

interface ImportedTransaction {
    date: string;
    description: string;
    amount: number;
    currency: string;
    selected: boolean;
    isDuplicate?: boolean;
}

interface StatementImportModalProps {
    cardId: string;
    onClose: () => void;
}

const StatementImportModal: React.FC<StatementImportModalProps> = ({ cardId, onClose }) => {
    const { addTransaction, categories, transactions: existingTransactions } = useAppContext();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Prevent closing during processing
    const isProcessing = loading || importing;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        // Pass categories and existing transactions from client-side storage to the API route
        formData.append('categories', JSON.stringify(categories));
        formData.append('existingTransactions', JSON.stringify(existingTransactions));

        try {
            const response = await fetch('/api/parse-statement', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process file');
            }

            const parsedTransactions = data.transactions.map((t: any) => ({
                ...t,
                selected: true // Default to selected
            }));

            setTransactions(parsedTransactions);
            setStep('review');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleTransaction = (index: number) => {
        setTransactions(prev => prev.map((t, i) => 
            i === index ? { ...t, selected: !t.selected } : t
        ));
    };

    const handleImport = async () => {
        const selectedTransactions = transactions.filter(t => t.selected);
        
        if (selectedTransactions.length === 0) {
            setError('Please select at least one transaction to import');
            return;
        }

        setImporting(true);
        setError(null);

        try {
            for (const t of selectedTransactions) {
                const isExpense = t.amount > 0;
                const isPayment = t.amount < 0; // Credit/Payment
                
                // Simple category logic - default to Uncategorized or first matching type
                let category = 'Uncategorized';
                let type: 'expense' | 'income' | 'credit_card_payment' = 'expense';

                if (isPayment) {
                    type = 'credit_card_payment';
                    category = 'Credit Card Payment';
                }

                const finalAmount = Math.abs(t.amount);

                await addTransaction({
                    type,
                    amount: finalAmount,
                    category: category,
                    description: t.description,
                    date: t.date,
                    paymentMethod: 'Credit Card',
                    cardId: cardId
                });
            }

            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to import transactions');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl relative">
                {/* Loading Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {loading ? 'Processing PDF...' : 'Importing transactions...'}
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold font-display">Import Statement</h2>
                    <button 
                        onClick={onClose} 
                        disabled={isProcessing}
                        className={`text-muted-foreground hover:text-foreground ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {step === 'upload' ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 py-10">
                            <div className="w-full max-w-md text-center space-y-4">
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="text-4xl mb-4">📄</div>
                                    <p className="font-semibold">Click to upload PDF statement</p>
                                    <p className="text-sm text-muted-foreground mt-2">Supports .pdf files</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf"
                                    className="hidden"
                                />
                                {file && (
                                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        {file.name}
                                    </div>
                                )}
                                {error && (
                                    <p className="text-destructive text-sm">{error}</p>
                                )}
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>}
                                    {loading ? 'Processing PDF...' : 'Process Statement'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                    <p className="text-destructive text-sm">{error}</p>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Found {transactions.length} transactions. Select ones to import.
                                    </p>
                                    {transactions.some(t => t.isDuplicate) && (
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                            ⚠️ {transactions.filter(t => t.isDuplicate).length} potential duplicate(s) detected
                                        </p>
                                    )}
                                </div>
                                <div className="space-x-2">
                                    <button 
                                        onClick={() => setTransactions(prev => prev.map(t => ({ ...t, selected: true })))}
                                        className="text-xs text-primary font-medium hover:underline"
                                    >
                                        Select All
                                    </button>
                                    <button 
                                        onClick={() => setTransactions(prev => prev.map(t => ({ ...t, selected: false })))}
                                        className="text-xs text-primary font-medium hover:underline"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-secondary">
                                        <tr>
                                            <th className="p-3 text-left w-10"></th>
                                            <th className="p-3 text-left">Date</th>
                                            <th className="p-3 text-left">Description</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-center w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {transactions.map((t, i) => (
                                            <tr 
                                                key={i} 
                                                className={`hover:bg-secondary/30 cursor-pointer ${t.selected ? 'bg-primary/5' : ''} ${t.isDuplicate ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : ''}`}
                                                onClick={() => toggleTransaction(i)}
                                            >
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={t.selected}
                                                        onChange={() => {}} // Handled by row click
                                                        className="rounded border-muted-foreground"
                                                    />
                                                </td>
                                                <td className="p-3 whitespace-nowrap text-muted-foreground">{t.date}</td>
                                                <td className="p-3 font-medium">{t.description}</td>
                                                <td className={`p-3 text-right font-numbers ${t.amount < 0 ? 'text-green-500' : ''}`}>
                                                    {formatCurrency(t.amount).display}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {t.isDuplicate && (
                                                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold" title="Potential duplicate - matches existing transaction">
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {step === 'review' && (
                    <div className="p-4 border-t border-border flex justify-end gap-3">
                        <button 
                            onClick={() => setStep('upload')}
                            disabled={importing}
                            className={`px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleImport}
                            disabled={importing}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {importing && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>}
                            {importing ? 'Importing...' : `Import ${transactions.filter(t => t.selected).length} Transactions`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatementImportModal;

