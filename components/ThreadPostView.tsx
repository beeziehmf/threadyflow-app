import React from 'react';
import { HeartIcon, ChatBubbleIcon, ArrowsRightLeftIcon, PaperAirplaneIcon } from './icons.tsx';
import type { Post, Account } from '../types/types.tsx';

interface ThreadPostViewProps {
    post: Post;
    index: number;
    totalPosts: number;
    account: Account | undefined;
    onPostChange: (id: number, value: string) => void;
    readOnly?: boolean;
}

export const ThreadPostView: React.FC<ThreadPostViewProps> = ({ post, index, totalPosts, account, onPostChange, readOnly = false }) => {
    const displayName = account ? account.name : "@your_account";
    const avatarInitial = account ? account.platform.charAt(0).toUpperCase() : "U";
    const avatarClass = account ? `thread-view-avatar ${account.platform.toLowerCase()}` : "thread-view-avatar";

    return (
        <div className="thread-view-post">
            <div className="thread-view-gutter">
                <div className={avatarClass}>
                    {account?.platform === 'Instagram' ? '' : avatarInitial}
                </div>
                {index < totalPosts - 1 && <div className="thread-view-line"></div>}
            </div>
            <div className="thread-view-content">
                <div className="thread-view-header">
                    <strong>{displayName}</strong>
                </div>
                <textarea
                    value={post.text}
                    onChange={(e) => onPostChange(post.id, e.target.value)}
                    className="thread-view-text-editor"
                    rows={4}
                    aria-label={`Post ${index + 1} content`}
                    readOnly={readOnly}
                />
                <div className="thread-view-actions">
                    <button className="thread-view-action-button" aria-label="Like"><HeartIcon /></button>
                    <button className="thread-view-action-button" aria-label="Comment"><ChatBubbleIcon /></button>
                    <button className="thread-view-action-button" aria-label="Repost"><ArrowsRightLeftIcon /></button>
                    <button className="thread-view-action-button" aria-label="Share"><PaperAirplaneIcon /></button>
                </div>
            </div>
        </div>
    );
};