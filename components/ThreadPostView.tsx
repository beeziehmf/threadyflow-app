import React, { useState } from 'react';
import { HeartIcon, ChatBubbleIcon, ArrowsRightLeftIcon, PaperAirplaneIcon, SparklesIcon } from './icons.tsx';
import type { Post, Account, ImprovementSuggestion } from '../types/types.tsx';

interface ThreadPostViewProps {
    post: Post;
    index: number;
    totalPosts: number;
    account: Account | undefined;
    onPostChange: (id: number, value: string) => void;
    onSuggestImprovements: (postId: number, improvementType: ImprovementSuggestion['type']) => Promise<void>;
    readOnly?: boolean;
}

export const ThreadPostView: React.FC<ThreadPostViewProps> = ({ post, index, totalPosts, account, onPostChange, onSuggestImprovements, readOnly = false }) => {
    const displayName = account ? account.name : "@your_account";
    const avatarInitial = account ? account.platform.charAt(0).toUpperCase() : "U";
    const avatarClass = account ? `thread-view-avatar ${account.platform.toLowerCase()}` : "thread-view-avatar";
    const [showImprovementOptions, setShowImprovementOptions] = useState(false);
    const [selectedImprovementType, setSelectedImprovementType] = useState<ImprovementSuggestion['type']>('other');

    const handleImprovementClick = async () => {
        await onSuggestImprovements(post.id, selectedImprovementType);
        setShowImprovementOptions(false);
    };

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
                    <div className="relative">
                        <button 
                            className="button-secondary px-3 py-1 text-sm flex items-center gap-1"
                            onClick={() => setShowImprovementOptions(!showImprovementOptions)}
                        >
                            <SparklesIcon /> Improve
                        </button>
                        {showImprovementOptions && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <div className="p-2">
                                    <label htmlFor="improvement-type" className="block text-xs font-medium text-gray-500 mb-1">Improvement Type:</label>
                                    <select 
                                        id="improvement-type" 
                                        value={selectedImprovementType} 
                                        onChange={(e) => setSelectedImprovementType(e.target.value as ImprovementSuggestion['type'])}
                                        className="w-full p-1 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="conciseness">Make more concise</option>
                                        <option value="cta">Add Call to Action</option>
                                        <option value="tone">Adjust Tone</option>
                                        <option value="seo">Optimize for SEO</option>
                                        <option value="other">General Improvement</option>
                                    </select>
                                    <button 
                                        onClick={handleImprovementClick} 
                                        className="button w-full mt-2 py-1 text-sm"
                                    >
                                        Apply Suggestion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};