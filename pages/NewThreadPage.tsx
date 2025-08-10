import React, { useState, useRef, ChangeEvent, useCallback } from 'react';
import {
    LightBulbIcon, SparklesIcon, UploadCloudIcon,
    DocumentTextIcon, XCircleIcon
} from '../components/icons.tsx';
import { ThreadPostView } from '../components/ThreadPostView.tsx';
import { useAppContext } from '../context/AppContext.tsx';
import type { ImprovementSuggestion } from '../types/types.tsx';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const NewThreadPage: React.FC = () => {
    const {
        idea, setIdea, 
        theme, setTheme,
        generatedIdeas, handleGenerateIdeas,
        tone, setTone,
        style, setStyle,
        contentPillars,
        selectedPillarId, setSelectedPillarId,
        isLoading, error, generatedThread, handleGenerateThread, handlePostChange,
        csvData, csvFileName, handleFileUpload, handleRemoveFile, handleUseRandomIdea,
        accounts, currentAccountId, user, addActivity,
        scheduleDate, setScheduleDate, scheduleTime, setScheduleTime, handleSchedule,
        addToQueue,
        showApiLimitExceeded,
        analyzedVoice, useAnalyzedVoiceForGeneration, setUseAnalyzedVoiceForGeneration,
        handleSuggestImprovements
    } = useAppContext();

    const account = accounts.find(a => a.id === currentAccountId);
    const threadsAccount = accounts.find(acc => acc.platform === 'Threads');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPosting, setIsPosting] = useState(false); // New state for posting loading

    const functions = getFunctions();
    const publishThread = httpsCallable(functions, 'publishThreadPost');

    const handlePostNow = useCallback(async () => {
        if (!generatedThread || !user || !user.uid) {
            alert("Please generate a thread and ensure you are logged in.");
            return;
        }

        const threadsAccount = accounts.find(acc => acc.platform === 'Threads');
        if (!threadsAccount) {
            alert("No Threads account connected. Please connect one in Integrations.");
            return;
        }

        setIsPosting(true);
        addActivity(`Attempting to publish thread: "${generatedThread.threadTitle}"`);

        try {
            // The publishThreadPost Cloud Function will retrieve the accessToken and threadsUserId from Firestore
            await publishThread({
                posts: generatedThread.posts.map(p => p.text),
                hashtags: generatedThread.hashtags,
                userId: user.uid, // Pass userId for the function to retrieve token
            });
            addActivity(`SUCCESS: Thread "${generatedThread.threadTitle}" published to Threads!`);
            // Clear generated thread after successful post
            // setGeneratedThread(null);
            // setIdea('');
            // setSelectedPillarId(undefined);
            // setActiveView('dashboard'); // Optionally redirect
        } catch (e: any) {
            console.error("Error publishing thread:", e);
            addActivity(`ERROR: Failed to publish thread: ${e.message || 'Unknown error'}`);
            alert(`Failed to publish thread: ${e.message || 'Unknown error'}`);
        } finally {
            setIsPosting(false);
        }
    }, [generatedThread, user, accounts, addActivity, publishThread]);

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
                    <p className="card-description">Enter a topic, get AI-generated ideas, or import a list from a CSV file.</p>
                </div>

                <div className="idea-input-wrapper">
                    <textarea 
                        id="theme-input" className="textarea" 
                        placeholder="e.g., 'AI in marketing'"
                        value={theme} onChange={(e) => setTheme(e.target.value)} disabled={isLoading}
                        rows={2}
                    />
                    <button className="button generate-button" onClick={handleGenerateIdeas} disabled={isLoading || !theme.trim()}>
                        <SparklesIcon />
                        {isLoading ? 'Getting Ideas...' : 'Get Ideas'}
                    </button>
                </div>

                {generatedIdeas.length > 0 && (
                    <div className="generated-ideas-list">
                        <p>Click an idea to use it:</p>
                        <ul>
                            {generatedIdeas.map((idea, index) => (
                                <li key={index} onClick={() => setIdea(idea)}>{idea}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="or-divider-small">OR</div>

                <div className="generation-controls">
                    {analyzedVoice && (
                        <div className="form-group flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id="use-analyzed-voice" 
                                checked={useAnalyzedVoiceForGeneration}
                                onChange={(e) => setUseAnalyzedVoiceForGeneration(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="use-analyzed-voice" className="text-sm font-medium text-gray-700">
                                Use Analyzed Voice ({analyzedVoice.tone} / {analyzedVoice.style})
                            </label>
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="tone-select">Tone</label>
                        <select 
                            id="tone-select" 
                            value={useAnalyzedVoiceForGeneration && analyzedVoice ? analyzedVoice.tone : tone} 
                            onChange={(e) => setTone(e.target.value)} 
                            disabled={isLoading || (useAnalyzedVoiceForGeneration && analyzedVoice !== null)}
                        >
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="humorous">Humorous</option>
                            <option value="inspirational">Inspirational</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="style-select">Style</label>
                        <select 
                            id="style-select" 
                            value={useAnalyzedVoiceForGeneration && analyzedVoice ? analyzedVoice.style : style} 
                            onChange={(e) => setStyle(e.target.value)} 
                            disabled={isLoading || (useAnalyzedVoiceForGeneration && analyzedVoice !== null)}
                        >
                            <option value="informative">Informative</option>
                            <option value="storytelling">Storytelling</option>
                            <option value="list">List</option>
                            <option value="question">Question</option>
                        </select>
                    </div>
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
                        {isLoading ? 'Generating...' : 'Generate Thread'}
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
        {showApiLimitExceeded && (
            <div className="error-message">
                <p>You have reached the generation limit for this session (30 generations).</p>
                <p>To continue generating content, please provide your own Gemini API key in the <code>.env.local</code> file.</p>
            </div>
        )}

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
                            onSuggestImprovements={handleSuggestImprovements}
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
                        <div className="form-group">
                            <label htmlFor="pillar-select">Content Pillar</label>
                            <select id="pillar-select" value={selectedPillarId || ''} onChange={(e) => setSelectedPillarId(e.target.value)}>
                                <option value="">None</option>
                                {contentPillars.map(pillar => (
                                    <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="button" onClick={handleSchedule} disabled={!currentAccountId || !scheduleDate || !scheduleTime}>Schedule Thread</button>
                    <button className="button-secondary" onClick={addToQueue} disabled={!currentAccountId || !generatedThread}>Add to Queue</button>
                    <button 
                        className="button" 
                        onClick={handlePostNow} 
                        disabled={!generatedThread || !user || !user.uid || !threadsAccount || isPosting || isLoading}
                        style={{ marginLeft: '10px' }} // Add some spacing
                    >
                        {isPosting ? 'Posting...' : 'Post Now'}
                    </button>
                </div>
            </div>
        )}
    </>
)};