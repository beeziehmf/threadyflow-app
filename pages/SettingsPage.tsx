import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import type { ContentPillar, QueueSchedule, UserVoiceSample, AnalyzedVoice } from '../types/types.tsx';

export const SettingsPage: React.FC = () => {
    const { 
        contentPillars, addPillar, updatePillar, deletePillar, 
        queueSchedule, setQueueSchedule,
        userVoiceSamples, addUserVoiceSample, updateUserVoiceSample, deleteUserVoiceSample,
        analyzedVoice, handleAnalyzeVoice, applyAnalyzedVoiceToDefaults,
        isLoading, error, setTone, setStyle
    } = useAppContext();
    const [newPillarName, setNewPillarName] = useState('');
    const [newPillarColor, setNewPillarColor] = useState('#4A90E2');
    const [newVoiceSampleText, setNewVoiceSampleText] = useState('');

    const handleAddPillar = () => {
        if (newPillarName.trim()) {
            const newPillar: ContentPillar = {
                id: `pillar_${Date.now()}`,
                name: newPillarName.trim(),
                color: newPillarColor,
            };
            addPillar(newPillar);
            setNewPillarName('');
            setNewPillarColor('#4A90E2');
        }
    };

    const handleAddVoiceSample = () => {
        if (newVoiceSampleText.trim()) {
            const newSample: UserVoiceSample = {
                id: `sample_${Date.now()}`,
                text: newVoiceSampleText.trim(),
            };
            addUserVoiceSample(newSample);
            setNewVoiceSampleText('');
        }
    };

    const handleQueueDayChange = (day: number) => {
        const newDays = queueSchedule.days.includes(day)
            ? queueSchedule.days.filter(d => d !== day)
            : [...queueSchedule.days, day];
        setQueueSchedule({ ...queueSchedule, days: newDays });
    };

    const handleQueueTimeChange = (index: number, time: string) => {
        const newTimes = [...queueSchedule.times];
        newTimes[index] = time;
        setQueueSchedule({ ...queueSchedule, times: newTimes });
    };

    const addQueueTime = () => {
        setQueueSchedule({ ...queueSchedule, times: [...queueSchedule.times, "10:00"] });
    };

    const removeQueueTime = (index: number) => {
        const newTimes = queueSchedule.times.filter((_, i) => i !== index);
        setQueueSchedule({ ...queueSchedule, times: newTimes });
    };

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="settings-page">
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">Content Pillars</h2>
                    <p className="card-description">Define categories to organize your content strategy. Each pillar helps you balance your content themes.</p>
                </div>
                <div className="space-y-4">
                    {contentPillars.map(pillar => (
                        <div key={pillar.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                            <input 
                                type="color" 
                                value={pillar.color} 
                                onChange={(e) => updatePillar({...pillar, color: e.target.value})} 
                                className="w-8 h-8 rounded-full border-none cursor-pointer"
                                title="Pillar Color"
                            />
                            <input 
                                type="text" 
                                value={pillar.name} 
                                onChange={(e) => updatePillar({...pillar, name: e.target.value})} 
                                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => deletePillar(pillar.id)} className="button-secondary px-3 py-1 text-sm">
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex items-center space-x-3 mt-6 p-4 border-t border-gray-200 pt-6">
                    <input 
                        type="text" 
                        placeholder="New Pillar Name" 
                        value={newPillarName} 
                        onChange={(e) => setNewPillarName(e.target.value)} 
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input 
                        type="color" 
                        value={newPillarColor} 
                        onChange={(e) => setNewPillarColor(e.target.value)} 
                        className="w-8 h-8 rounded-full border-none cursor-pointer"
                        title="New Pillar Color"
                    />
                    <button onClick={handleAddPillar} className="button px-4 py-2 text-sm">
                        Add Pillar
                    </button>
                </div>
            </div>

            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">Analyze Your Voice</h2>
                    <p className="card-description">Provide samples of your writing to let AI analyze your unique tone and style.</p>
                </div>
                <div className="space-y-4">
                    {userVoiceSamples.length === 0 && <p className="text-gray-500">Add some text samples below to get started.</p>}
                    {userVoiceSamples.map(sample => (
                        <div key={sample.id} className="flex items-center space-x-3">
                            <textarea 
                                value={sample.text} 
                                onChange={(e) => updateUserVoiceSample({...sample, text: e.target.value})} 
                                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                                rows={2}
                            />
                            <button onClick={() => deleteUserVoiceSample(sample.id)} className="button-secondary px-3 py-1 text-sm">
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex items-center space-x-3 mt-6 p-4 border-t border-gray-200 pt-6">
                    <textarea 
                        placeholder="Paste a text sample here (e.g., a social media post, a paragraph from an article)" 
                        value={newVoiceSampleText} 
                        onChange={(e) => setNewVoiceSampleText(e.target.value)} 
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        rows={3}
                    />
                    <button onClick={handleAddVoiceSample} className="button px-4 py-2 text-sm self-start">
                        Add Sample
                    </button>
                </div>
                <div className="mt-6 text-center">
                    <button onClick={handleAnalyzeVoice} className="button" disabled={userVoiceSamples.length === 0 || isLoading}>
                        {isLoading ? 'Analyzing...' : 'Analyze My Voice'}
                    </button>
                </div>

                {analyzedVoice && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
                        <h3 className="text-lg font-semibold mb-2">Analyzed Voice:</h3>
                        <p><strong>Tone:</strong> {analyzedVoice.tone}</p>
                        <p><strong>Style:</strong> {analyzedVoice.style}</p>
                        <p className="mt-2">{analyzedVoice.description}</p>
                        <button onClick={applyAnalyzedVoiceToDefaults} className="button mt-4">
                            Set as Default Tone & Style
                        </button>
                    </div>
                )}

                {error && <div className="error-message mt-4">{error}</div>}

            </div>

            <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Queue Schedule</h2>
                        <p className="card-description">Define when your queued content should be automatically published.</p>
                    </div>
                    <div className="space-y-6">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Publishing Days:</label>
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map((day, index) => (
                                    <button 
                                        key={index} 
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${queueSchedule.days.includes(index) ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        onClick={() => handleQueueDayChange(index)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Publishing Times:</label>
                            <div className="space-y-3">
                                {queueSchedule.times.map((time, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <input 
                                            type="time" 
                                            value={time} 
                                            onChange={(e) => handleQueueTimeChange(index, e.target.value)} 
                                            className="w-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button onClick={() => removeQueueTime(index)} className="button-secondary px-3 py-1 text-sm">
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addQueueTime} className="button-secondary px-4 py-2 text-sm">
                                    Add Another Time
                                </button>
                            </div>
                        </div>
                        <div className="queue-summary p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                            <h3 className="text-lg font-semibold mb-2">Current Schedule Summary:</h3>
                            {queueSchedule.days.length === 0 || queueSchedule.times.length === 0 ? (
                                <p className="text-blue-700">No schedule defined. Please select days and times to activate automated publishing.</p>
                            ) : (
                                <p className="text-blue-700">
                                    Your content queue will publish automatically on 
                                    <strong className="font-bold"> {queueSchedule.days.map(dayIndex => daysOfWeek[dayIndex]).join(', ')}</strong>,
                                    at 
                                    <strong className="font-bold"> {queueSchedule.times.join(', ')}</strong>.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
        </div>
    );
};