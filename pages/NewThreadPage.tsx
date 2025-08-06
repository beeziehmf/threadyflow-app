import React, { useState, useRef, ChangeEvent } from 'react';
import {
    LightBulbIcon, SparklesIcon, UploadCloudIcon,
    DocumentTextIcon, XCircleIcon
} from '../components/icons.tsx';
import { ThreadPostView } from '../components/ThreadPostView.tsx';
import { useAppContext } from '../context/AppContext.tsx';

export const NewThreadPage: React.FC = () => {
    const {
        idea, setIdea, 
        isLoading, error, generatedThread, handleGenerateThread, handlePostChange,
        csvData, csvFileName, handleFileUpload, handleRemoveFile, handleUseRandomIdea,
        accounts, currentAccountId,
        scheduleDate, setScheduleDate, scheduleTime, setScheduleTime, handleSchedule
    } = useAppContext();

    const account = accounts.find(a => a.id === currentAccountId);
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
            handleFileUpload(syntheticEvent);
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
                    <button className="button generate-button" onClick={handleGenerateThread} disabled={isLoading || !idea.trim()}>
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
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                        />
                         {csvData && csvFileName ? (
                            <div className="file-loaded-info" onClick={(e) => e.stopPropagation()}>
                                <DocumentTextIcon/>
                                <span className="file-name" title={csvFileName}>{csvFileName}</span>
                                <button className="remove-file-button" onClick={handleRemoveFile} aria-label="Remove file"><XCircleIcon/></button>
                                <button className="button-secondary" onClick={handleUseRandomIdea}>Use Random Idea</button>
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
                            onPostChange={handlePostChange}
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
                        <p className="card-description">Choose when this thread will be published to <strong>{account?.name}</strong>.</p>
                    </div>
                    <div className="schedule-controls">
                         <div className="form-group">
                            <label htmlFor="schedule-date">Date</label>
                            <input type="date" id="schedule-date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="schedule-time">Time</label>
                            <input type="time" id="schedule-time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                        </div>
                    </div>
                    <button className="button" onClick={handleSchedule} disabled={!currentAccountId || !scheduleDate || !scheduleTime}>Schedule Thread</button>
                </div>
            </div>
        )}
    </>
)};