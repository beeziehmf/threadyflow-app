import React from 'react';
import type { Account } from './types.tsx';
import { auth, facebookProvider } from '../services/firebaseConfig';
import { signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface IntegrationsViewProps {
    accounts: Account[];
    setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
    addActivity: (text: string) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ accounts, setAccounts, addActivity }) => {
    const functions = getFunctions();
    const exchangeToken = httpsCallable(functions, 'exchangeFacebookTokenForThreadsInfo');

    const handleConnect = async (platform: 'Threads' | 'Instagram' | 'Facebook') => {
        if (platform === 'Threads') {
            try {
                facebookProvider.addScope('threads_basic');
                facebookProvider.addScope('threads_content_publish');
                // Requesting 'pages_show_list' and 'instagram_basic' for getting Instagram Business Account ID
                facebookProvider.addScope('pages_show_list');
                facebookProvider.addScope('instagram_basic');

                const result = await signInWithPopup(auth, facebookProvider);
                const user = result.user;
                const credential = FacebookAuthProvider.credentialFromResult(result);
                const accessToken = credential?.accessToken; // This is the short-lived Facebook Access Token

                if (accessToken) {
                    addActivity("Exchanging token for Threads info...");
                    const response = await exchangeToken({ accessToken });
                    const threadsAccountId = response.data.instagramBusinessAccountId;
                    const threadsUsername = response.data.username;

                    if (threadsAccountId && threadsUsername) {
                        const newAccount: Account = { id: Date.now(), platform: 'Threads', name: `@${threadsUsername}` };
                        setAccounts((prevAccounts: Account[]) => [...prevAccounts, newAccount]);
                        addActivity(`Connected new Threads account: ${newAccount.name}`);
                        console.log('Threads Account Connected:', threadsAccountId, threadsUsername);
                    } else {
                        throw new Error("Could not retrieve Threads account ID.");
                    }
                } else {
                    throw new Error("Facebook Access Token not found.");
                }
            } catch (error: any) {
                console.error("Error connecting to Threads:", error);
                addActivity(`Failed to connect Threads account: ${error.message}`);
            }
        } else {
            const newName = `@${platform.toLowerCase()}_user_${Math.floor(Math.random() * 1000)}`;
            const newAccount: Account = { id: Date.now(), platform, name: newName };
            setAccounts((prevAccounts: Account[]) => [...prevAccounts, newAccount]);
            addActivity(`Connected new ${platform} account: ${newName}`);
        }
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
