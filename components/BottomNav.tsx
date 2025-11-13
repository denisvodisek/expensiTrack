
import React from 'react';
import { LayoutIcon, ExpensesIcon, UserIcon } from './Icons';

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    view: string;
    isActive: boolean;
    onClick: (view: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, view, isActive, onClick }) => (
    <button onClick={() => onClick(view)} className="flex flex-col items-center justify-center w-full h-full space-y-1 py-1">
        <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
        <span className={`text-xs transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
        {isActive && <div className="h-0.5 w-6 bg-foreground rounded-full mt-0.5"></div>}
    </button>
);

interface BottomNavProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
    const navItems = [
        { icon: LayoutIcon, label: 'Dashboard', view: 'dashboard' },
        { icon: ExpensesIcon, label: 'Transactions', view: 'transactions' },
        { icon: UserIcon, label: 'Profile', view: 'profile' },
    ];

    return (
        <nav className="fixed -bottom-3 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border flex justify-around items-center z-40" style={{ 
            height: 'calc(4rem + env(safe-area-inset-bottom, 0px))', 
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            minHeight: '4rem'
        }}>
            {navItems.map((item) => (
                <NavItem
                    key={item.view}
                    icon={item.icon}
                    label={item.label}
                    view={item.view}
                    isActive={activeView === item.view}
                    onClick={setActiveView}
                />
            ))}
        </nav>
    );
};

export default BottomNav;