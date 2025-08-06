import React from 'react';

interface HeaderProps {
    activeView: string;
}

export const Header: React.FC<HeaderProps> = ({ activeView }) => {
    const titles: { [key: string]: string } = {
        'dashboard': 'Content Calendar',
        'new-thread': 'Create New Thread',
        'integrations': 'Integrations & Marketplace'
    };
    return (
      <header className="header">
        <h1>{titles[activeView]}</h1>
      </header>
    );
};
