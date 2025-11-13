
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface PrivacyWrapperProps {
    children: React.ReactNode;
}

const PrivacyWrapper: React.FC<PrivacyWrapperProps> = ({ children }) => {
    const { settings } = useAppContext();

    if (settings?.privacyMode) {
        return <span className="blur select-none">HK$ ****.**</span>;
    }

    return <>{children}</>;
};

export default PrivacyWrapper;
