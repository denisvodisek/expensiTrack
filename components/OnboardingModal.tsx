
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

interface OnboardingModalProps {
    onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const { updateSettings } = useAppContext();
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            updateSettings({ userName: name.trim() });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm text-center">
                <h2 className="text-2xl font-bold text-foreground">Welcome to ExpensiTrak!</h2>
                <p className="text-muted-foreground mt-2 mb-4">What should we call you?</p>
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground text-center"
                    />
                    <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-md hover:opacity-90 transition-opacity">
                        Get Started
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingModal;
