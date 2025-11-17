import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PINLoginView: React.FC = () => {
    const { login } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const handleNumberClick = (number: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + number);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    useEffect(() => {
        if (pin.length === 4) {
            const success = login(pin);
            if (!success) {
                setError('Incorrect PIN');
                setShake(true);
                setPin('');
                setTimeout(() => setShake(false), 600);
            }
        }
    }, [pin, login]);

    const numbers = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'delete']
    ];

    return (
        <div className="h-screen w-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-3xl font-bold font-display mb-2">ExpensiTrak</h1>
                <p className="text-muted-foreground mb-8">Enter your PIN</p>

                {/* PIN dots */}
                <div className={`flex justify-center space-x-3 mb-8 ${shake ? 'animate-pulse' : ''}`}>
                    {[0, 1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 rounded-full border-2 border-border transition-colors duration-200 ${
                                index < pin.length ? 'bg-foreground' : 'bg-transparent'
                            }`}
                        />
                    ))}
                </div>

                {error && <p className="text-destructive text-sm mb-4">{error}</p>}

                {/* Number grid */}
                <div className="space-y-4">
                    {numbers.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center space-x-6">
                            {row.map((number, colIndex) => {
                                if (number === '') return <div key={colIndex} className="w-16 h-16" />;
                                if (number === 'delete') {
                                    return (
                                        <button
                                            key={colIndex}
                                            onClick={handleDelete}
                                            disabled={pin.length === 0}
                                            className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold transition-all duration-200 ${
                                                pin.length > 0
                                                    ? 'bg-secondary text-foreground hover:bg-secondary/80 active:scale-95'
                                                    : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                                            }`}
                                        >
                                            ⌫
                                        </button>
                                    );
                                }
                                return (
                                    <button
                                        key={colIndex}
                                        onClick={() => handleNumberClick(number)}
                                        className="w-16 h-16 rounded-full bg-secondary text-foreground text-xl font-semibold hover:bg-secondary/80 active:scale-95 transition-all duration-200"
                                    >
                                        {number}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PINLoginView;
