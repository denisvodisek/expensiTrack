'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const PIN = '1379';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (pin: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check session storage on initial load
        const sessionActive = sessionStorage.getItem('is-authenticated') === 'true';
        if (sessionActive) {
            setIsAuthenticated(true);
        }
    }, []);

    const login = (pin: string): boolean => {
        if (pin === PIN) {
            sessionStorage.setItem('is-authenticated', 'true');
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        sessionStorage.removeItem('is-authenticated');
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
