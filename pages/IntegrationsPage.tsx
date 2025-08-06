import React from 'react';
import type { Account } from '../types/types.tsx';
import { useAppContext } from '../context/AppContext.tsx';

export const IntegrationsPage: React.FC = () => {
    const { accounts, setAccounts, addActivity } = useAppContext();

    const handleConnect = (platform: 'Threads' | 'Instagram' | 'Facebook') => {
        const newName = `@${platform.toLowerCase()}_user_${Math.floor(Math.random() * 1000)}`;
        const newAccount: Account = { id: Date.now(), platform, name: newName };
        setAccounts((prevAccounts: Account[]) => [...prevAccounts, newAccount]);
        addActivity(`Connected new ${platform} account: ${newName}`);
    };

    const handleDisconnect = (id: number) => {
        const account = accounts.find(acc => acc.id === id);
        if (account) {
            setAccounts((prevAccounts: Account[]) => prevAccounts.filter(acc => acc.id !== id));
            addActivity(`Disconnected ${account.platform} account: ${account.name}`);
        }
    };
    
    return (
    <>
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Connect New Account</h2>
                <p className="card-description">Expand your reach by connecting more social media platforms.</p>
            </div>
            <div className="integration-marketplace">
                <div className="integration-card">
                    <span className="integration-icon threads">T</span>
                    <h3 className="integration-name">Meta Threads</h3>
                    <button className="button" style={{width: '100%'}} onClick={() => handleConnect('Threads')}>Connect</button>
                </div>
                <div className="integration-card">
                    <span className="integration-icon instagram"></span>
                    <h3 className="integration-name">Instagram</h3>
                    <button className="button" style={{width: '100%'}} onClick={() => handleConnect('Instagram')}>Connect</button>
                </div>
                <div className="integration-card">
                    <span className="integration-icon facebook">f</span>
                    <h3 className="integration-name">Facebook</h3>
                    <button className="button" style={{width: '100%'}} onClick={() => handleConnect('Facebook')}>Connect</button>
                </div>
            </div>
        </div>
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Connected Accounts</h2>
                <p className="card-description">Manage your currently connected accounts.</p>
            </div>
            <ul className="connected-accounts-list">
                 {accounts.length === 0 ? (
                    <p className="card-description">No accounts connected yet. Use the marketplace above to add one.</p>
                ) : (
                    accounts.map(account => (
                        <li key={account.id} className="connected-account-item">
                            <div className="account-info">
                                <span className={`integration-icon small ${account.platform.toLowerCase()}`}>{account.platform === 'Instagram' ? '' : account.platform.charAt(0)}</span>
                                <div>
                                    <div className="account-name">{account.name}</div>
                                    <div className="account-platform">{account.platform}</div>
                                </div>
                            </div>
                            <button className="button-secondary" onClick={() => handleDisconnect(account.id)}>Disconnect</button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    </>
    );
};