
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const USERNAME = import.meta.env.VITE_USERNAME || 'admin';
const PASSWORD = import.meta.env.VITE_PASSWORD || 'password';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (user: string, pass: string) => boolean;
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

    const login = (user: string, pass: string): boolean => {
        if (user === USERNAME && pass === PASSWORD) {
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
