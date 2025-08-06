import React from 'react';
import { useAppContext } from '../context/AppContext.tsx';

export const Header: React.FC = () => {
    const { activeView, accounts, currentAccountId } = useAppContext();
    
    const baseTitles: { [key: string]: string } = {
        'dashboard': 'Content Calendar',
        'new-thread': 'Create New Thread',
        'integrations': 'Integrations & Accounts',
        'settings': 'Settings'
    };

    const getTitle = () => {
        const currentAccount = accounts.find(acc => acc.id === currentAccountId);
        const baseTitle = baseTitles[activeView] || 'Dashboard';
        
        if (currentAccount && (activeView === 'dashboard' || activeView === 'new-thread')) {
            return `${baseTitle} for ${currentAccount.name}`;
        }
        return baseTitle;
    };

    return (
      <header className="header">
        <h1>{getTitle()}</h1>
      </header>
    );
};