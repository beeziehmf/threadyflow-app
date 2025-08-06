import React from 'react';
import { XMarkIcon } from './icons.tsx';
import { ThreadPostView } from './ThreadPostView.tsx';
import type { ScheduledPost, Account } from '../types/types.tsx';
import { useAppContext } from '../context/AppContext.tsx';

interface PostDetailModalProps {
    post: ScheduledPost | null;
    account: Account | undefined;
    onClose: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, account, onClose }) => {
    const { handleUnschedule } = useAppContext();

    if (!post) return null;

    const handleUnscheduleClick = () => {
        handleUnschedule(post.id);
        onClose();
    };

    return (
        <div className="post-detail-modal" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} aria-label="Close"><XMarkIcon /></button>
                <div className="modal-header">
                    <h2 className="modal-title">{post.threadTitle}</h2>
                    <p className="modal-subtitle">Scheduled for {new Date(post.date + 'T' + post.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} on {account?.name}</p>
                </div>
                <div className="modal-body">
                    <div className="thread-view-container modal-thread-preview">
                        {post.posts.map((p, index) => (
                           <ThreadPostView
                                key={p.id}
                                post={p}
                                index={index}
                                totalPosts={post.posts.length}
                                account={account}
                                onPostChange={() => {}} // Read-only in modal
                                readOnly={true}
                           />
                        ))}
                    </div>
                     <div className="thread-hashtags">
                        {post.hashtags.map((tag) => (
                            <span key={tag} className="hashtag">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                        ))}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="button-secondary" onClick={handleUnscheduleClick}>Unschedule</button>
                    <button className="button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};