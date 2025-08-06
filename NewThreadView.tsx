import React, { useState, useRef, ChangeEvent } from 'react';
import {
    LightBulbIcon, SparklesIcon, UploadCloudIcon,
    DocumentTextIcon, XCircleIcon
} from './icons.tsx';
import { ThreadPostView } from './ThreadPostView.tsx';
import type { GeneratedThread, Account } from './types.tsx';

interface NewThreadViewProps {
    idea: string;
    setIdea: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    error: string | null;
    generatedThread: GeneratedThread | null;
    onGenerate: () => void;
    onPostChange: (id: number, value: string) => void;
    csvData: string[] | null;
    csvFileName: string;
    onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: () => void;
    onUseRandomIdea: () => void;
    accounts: Account[];
    selectedAccount: number | null;
    setSelectedAccount: React.Dispatch<React.SetStateAction<number | null>>;
    scheduleDate: string;
    setScheduleDate: React.Dispatch<React.SetStateAction<string>>;
    scheduleTime: string;
    setScheduleTime: React.Dispatch<React.SetStateAction<string>>;
    onSchedule: () => void;
}

export const NewThreadView: React.FC<NewThreadViewProps> = ({ 
    idea, setIdea, 
    isLoading, error, generatedThread, onGenerate, onPostChange,
    csvData, csvFileName, onFileUpload, onRemoveFile, onUseRandomIdea,
    accounts, selectedAccount, setSelectedAccount,
    scheduleDate, setScheduleDate, scheduleTime, setScheduleTime, onSchedule
}) => {
    const account = accounts.find(a => a.id === selectedAccount);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const syntheticEvent = { target: { files } } as unknown as ChangeEvent<HTMLInputElement>;
            onFileUpload(syntheticEvent);
        }
    };

    return (
    <>
        <div className="card">
            <div className="idea-generator-section">
                <div className="card-header">
                    <h2 className="card-title">
                        <LightBulbIcon />
                        1. Start with an Idea
                    </h2>
                    <p className="card-description">Enter a topic, or import a list of ideas from a CSV file.</p>
                </div>

                <div className="idea-input-wrapper">
                    <textarea 
                        id="idea-input" className="textarea" 
                        placeholder="e.g., 'The top 5 AI trends that will shape marketing in 2025'"
                        value={idea} onChange={(e) => setIdea(e.target.value)} disabled={isLoading}
                        rows={5}
                    />
                    <button className="button generate-button" onClick={onGenerate} disabled={isLoading || !idea.trim()}>
                        {isLoading ? <div className="spinner" style={{width: '16px', height: '16px'}}></div> : <SparklesIcon />}
                        {isLoading ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>

                <div className="csv-import-area">
                    <div className="or-divider-small">OR</div>
                    <div 
                        className={`csv-dropzone ${isDragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            id="csv-upload" 
                            className="file-input-hidden" 
                            accept=".csv" 
                            onChange={onFileUpload}
                            ref={fileInputRef}
                        />
                         {csvData && csvFileName ? (
                            <div className="file-loaded-info" onClick={(e) => e.stopPropagation()}>
                                <DocumentTextIcon/>
                                <span className="file-name" title={csvFileName}>{csvFileName}</span>
                                <button className="remove-file-button" onClick={onRemoveFile} aria-label="Remove file"><XCircleIcon/></button>
                                <button className="button-secondary" onClick={onUseRandomIdea}>Use Random Idea</button>
                            </div>
                        ) : (
                            <div className="dropzone-prompt">
                                <UploadCloudIcon />
                                <p><strong>Drag & drop a CSV file here</strong> or click to upload</p>
                                <p className="dropzone-subtext">One idea per line</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {isLoading && <div className="loader-container card"><div className="spinner"></div><p>AI is crafting your thread...</p></div>}
        {error && <div className="error-message">{error}</div>}

        {generatedThread && (
            <div className="card thread-editor">
                <div className="card-header">
                    <h2 className="card-title">2. Review and Edit Your Thread</h2>
                    <p className="card-description">Fine-tune the generated content. Each post is ready for you to edit.</p>
                </div>
                <h3 className="thread-title-display">{generatedThread.threadTitle}</h3>
                
                <div className="thread-view-container">
                    {generatedThread.posts.map((post, index) => (
                       <ThreadPostView
                            key={post.id}
                            post={post}
                            index={index}
                            totalPosts={generatedThread.posts.length}
                            account={account}
                            onPostChange={onPostChange}
                       />
                    ))}
                </div>

                <div className="thread-hashtags">
                    {generatedThread.hashtags.map((tag) => (
                        <span key={tag} className="hashtag">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                    ))}
                </div>

                <div className="schedule-section">
                     <div className="card-header">
                        <h2 className="card-title" style={{fontSize: '1.125rem'}}>3. Schedule Publication</h2>
                        <p className="card-description">Choose when and where this thread will be published.</p>
                    </div>
                    <div className="schedule-controls">
                        <div className="form-group">
                            <label htmlFor="account-select">Post to Account</label>
                            <select id="account-select" value={selectedAccount || ''} onChange={e => setSelectedAccount(Number(e.target.value))} disabled={accounts.length === 0}>
                                {accounts.length === 0 ? (
                                    <option>No accounts connected</option>
                                ) : (
                                    accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.platform})</option>)
                                )}
                            </select>
                        </div>
                         <div className="form-group">
                            <label htmlFor="schedule-date">Date</label>
                            <input type="date" id="schedule-date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="schedule-time">Time</label>
                            <input type="time" id="schedule-time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                        </div>
                    </div>
                    <button className="button" onClick={onSchedule} disabled={!selectedAccount}>Schedule Thread</button>
                </div>
            </div>
        )}
    </>
)};
