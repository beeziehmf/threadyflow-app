import React from 'react';
import { useAppContext } from '../context/AppContext.tsx';

export const QueuePage: React.FC = () => {
    const { queuedPosts, accounts, contentPillars } = useAppContext();

    return (
        <div className="queue-page">
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Content Queue</h2>
                    <p className="card-description">Threads waiting to be scheduled automatically.</p>
                </div>
                {queuedPosts.length === 0 ? (
                    <p>Your queue is empty. Generate some threads and add them to the queue!</p>
                ) : (
                    <div className="queued-posts-list">
                        {queuedPosts.map(post => {
                            const account = accounts.find(acc => acc.id === post.accountId);
                            const pillar = contentPillars.find(p => p.id === post.pillarId);
                            return (
                                <div key={post.id} className="queued-post-item">
                                    <div className="post-info">
                                        <h3>{post.threadTitle}</h3>
                                        <p>Account: {account?.name || 'N/A'}</p>
                                        {pillar && <p>Pillar: <span style={{ color: pillar.color }}>{pillar.name}</span></p>}
                                    </div>
                                    <div className="post-content-preview">
                                        {post.posts.map((p, idx) => (
                                            <p key={idx}>{p.text.substring(0, 100)}...</p>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};