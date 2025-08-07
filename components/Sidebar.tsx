import React from 'react';
import { HomeIcon, PlusCircleIcon, PuzzleIcon, SettingsIcon, ListBulletIcon } from './icons.tsx';
import { useAppContext } from '../context/AppContext.tsx';
import type { Account } from '../types/types.tsx';

export const Sidebar: React.FC = () => {
    const { activeView, setActiveView, accounts, currentAccountId, setCurrentAccountId } = useAppContext();

    const handleWorkspaceClick = (accountId: number) => {
        setCurrentAccountId(accountId);
        // If user is on a view that doesn't make sense without a workspace,
        // switch to the dashboard of the new workspace.
        if (activeView === 'integrations' || activeView === 'settings') {
            setActiveView('dashboard');
        }
    };

    const NavLink: React.FC<{view: string, icon: JSX.Element, text: string}> = ({view, icon, text}) => {
        const isWorkspaceRequired = view === 'dashboard' || view === 'new-thread';
        const isDisabled = isWorkspaceRequired && !currentAccountId;
        return (
            <li className="nav-item">
                <a
                    href="#"
                    className={`${activeView === view ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        if (!isDisabled) setActiveView(view);
                    }}
                    aria-disabled={isDisabled}
                >
                    {icon} {text}
                </a>
            </li>
        );
    };

    const WorkspaceLink: React.FC<{account: Account}> = ({account}) => {
        const avatarClass = `integration-icon small ${account.platform.toLowerCase()}`;
        return (
             <li className="nav-item">
                 <a href="#" className={currentAccountId === account.id ? 'active' : ''} onClick={(e) => {e.preventDefault(); handleWorkspaceClick(account.id);}}>
                    <span className={avatarClass}>{account.platform === 'Instagram' ? '' : account.platform.charAt(0)}</span>
                    <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{account.name}</span>
                 </a>
             </li>
        )
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">ThreadFlow</div>
            <nav>
                <ul className="sidebar-nav">
                    <NavLink view="dashboard" icon={<HomeIcon />} text="Dashboard" />
                    <NavLink view="new-thread" icon={<PlusCircleIcon />} text="New Thread" />
                </ul>
                <div className="sidebar-divider"></div>
                <div className="workspace-nav-header">Workspaces</div>
                 <ul className="sidebar-nav">
                    {accounts.map(acc => <WorkspaceLink key={acc.id} account={acc} />)}
                     <NavLink view="integrations" icon={<PuzzleIcon />} text="Integrations" />
                     <NavLink view="queue" icon={<ListBulletIcon />} text="Queue" />
                </ul>

                <div className="sidebar-footer">
                    <div className="sidebar-divider"></div>
                     <ul className="sidebar-nav">
                         <NavLink view="settings" icon={<SettingsIcon />} text="Settings" />
                    </ul>
                </div>
            </nav>
        </aside>
    );
};