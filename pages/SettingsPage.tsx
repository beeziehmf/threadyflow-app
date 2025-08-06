import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { UserCircleIcon, SparklesIcon, PlusCircleIcon, PuzzleIcon } from '../components/icons.tsx';
import type { User } from '../types/types.tsx';

export const SettingsPage: React.FC = () => {
    const { user, updateUser, activityLog } = useAppContext();
    const [formData, setFormData] = useState<User>(user);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser(formData);
        alert('Profile updated successfully!');
    };

    const getActivityIcon = (text: string) => {
        if (text.toLowerCase().includes('generate')) return <SparklesIcon />;
        if (text.toLowerCase().includes('connect')) return <PuzzleIcon />;
        if (text.toLowerCase().includes('schedule')) return <PlusCircleIcon />;
        return <UserCircleIcon />;
    };

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Profile</h2>
                    <p className="card-description">Manage your personal information.</p>
                </div>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="profile-card-footer">
                        <button type="submit" className="button">Save Changes</button>
                    </div>
                </form>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Activity Log</h2>
                    <p className="card-description">A log of recent activities in your account.</p>
                </div>
                <ul className="activity-log-list">
                    {activityLog.length > 0 ? (
                        activityLog.map(log => (
                            <li key={log.id} className="activity-item">
                                <div className="activity-icon">
                                    {getActivityIcon(log.text)}
                                </div>
                                <p className="activity-text">{log.text}</p>
                                <time className="activity-time">{log.timestamp}</time>
                            </li>
                        ))
                    ) : (
                         <p className="card-description">No recent activity.</p>
                    )}
                </ul>
            </div>
        </>
    );
};