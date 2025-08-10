import React, { useEffect } from 'react';
import type { Account } from '../types/types.tsx';
import { useAppContext } from '../context/AppContext.tsx';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const IntegrationsPage: React.FC = () => {
    const { accounts, setAccounts, addActivity } = useAppContext();
    const functions = getFunctions();
    const exchangeThreadsToken = httpsCallable(functions, 'exchangeThreadsCodeForAccessToken');

    const THREADS_CLIENT_ID = "1812461859343676"; // Your Threads App ID
    const THREADS_REDIRECT_URI = window.location.origin + window.location.pathname; // Current page as redirect URI

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state'); // Not used for now, but good to capture

        if (code) {
            // Clear the code from the URL to prevent re-processing on refresh
            window.history.replaceState({}, document.title, window.location.pathname);

            addActivity("Exchanging Threads authorization code...");
            exchangeThreadsToken({ code, redirectUri: THREADS_REDIRECT_URI })
                .then((response: any) => {
                    const threadsUserId = response.data.threadsUserId;
                    const threadsUsername = response.data.username;

                    if (threadsUserId && threadsUsername) {
                        const newAccount: Account = { id: Date.now(), platform: 'Threads', name: `@${threadsUsername}` };
                        setAccounts((prevAccounts: Account[]) => [...prevAccounts, newAccount]);
                        addActivity(`Connected new Threads account: ${newAccount.name}`);
                        console.log('Threads Account Connected:', threadsUserId, threadsUsername);
                    } else {
                        throw new Error("Could not retrieve Threads account ID or username.");
                    }
                })
                .catch((error: any) => {
                    console.error("Error exchanging Threads code:", error);
                    addActivity(`Failed to connect Threads account: ${error.message}`);
                });
        }
    }, [exchangeThreadsToken, setAccounts, addActivity, THREADS_REDIRECT_URI]);

    const handleConnect = async (platform: 'Threads' | 'Instagram' | 'Facebook') => {
        if (platform === 'Threads') {
            // Redirect to Threads OAuth authorization URL
            const authUrl = `https://threads.net/oauth/authorize?client_id=${THREADS_CLIENT_ID}&redirect_uri=${encodeURIComponent(THREADS_REDIRECT_URI)}&scope=threads_basic,threads_content_publish`;
            // alert(authUrl); // Display the URL in an alert box for debugging
            window.location.href = authUrl; // Re-enabled redirect
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