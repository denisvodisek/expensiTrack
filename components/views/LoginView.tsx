
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LoginView: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(username, password);
        if (!success) {
            setError('Invalid username or password.');
            setPassword('');
        }
    };

    return (
        <div className="h-screen w-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-4xl font-bold font-display mb-2">ExpensiTrak</h1>
                <p className="text-muted-foreground mb-6">Please sign in to continue</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        required
                        className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground text-center"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground text-center"
                    />
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-md hover:opacity-90 transition-opacity">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginView;
