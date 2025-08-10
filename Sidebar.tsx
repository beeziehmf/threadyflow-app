import React from 'react';
import { HomeIcon, PlusCircleIcon, PuzzleIcon } from './icons.tsx';
import { useAppContext } from './context/AppContext.tsx'; // Import useAppContext

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { accounts } = useAppContext(); // Get accounts from context

  return (
    <aside className="sidebar">
      <div className="sidebar-header">ThreadFlow</div>
      <nav>
        <ul className="sidebar-nav">
          <li className="nav-item">
            <a href="#" className={activeView === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}>
              <HomeIcon /> Dashboard
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className={activeView === 'new-thread' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveView('new-thread'); }}>
              <PlusCircleIcon /> New Thread
            </a>
          </li>
          <li className="nav-item">
              <a href="#" className={activeView === 'integrations' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveView('integrations'); }}>
                  <PuzzleIcon /> Integrations
              </a>
          </li>
        </ul>
        {accounts.length > 0 && (
          <div className="connected-accounts-sidebar">
            <h3>Connected Accounts</h3>
            <ul>
              {accounts.map(account => (
                <li key={account.id} className="connected-account-item-sidebar">
                  <span className={`integration-icon small ${account.platform.toLowerCase()}`}>{account.platform === 'Instagram' ? '' : account.platform.charAt(0)}</span>
                  {account.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
};