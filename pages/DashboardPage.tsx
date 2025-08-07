import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons.tsx';
import { PostDetailModal } from '../components/PostDetailModal.tsx';
import type { ScheduledPost, ContentPillar } from '../types/types.tsx';
import { useAppContext } from '../context/AppContext.tsx';

export const DashboardPage: React.FC = () => {
    const { scheduledPosts, accounts, currentAccountId, contentPillars, processQueue, queuedPosts } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [modalPost, setModalPost] = useState<ScheduledPost | null>(null);

    const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToPrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const filteredPosts = useMemo(() => {
        return scheduledPosts.filter(p => p.accountId === currentAccountId);
    }, [scheduledPosts, currentAccountId]);

    const postsByDate = useMemo(() => {
        const grouped = new Map<string, ScheduledPost[]>();
        filteredPosts.forEach(post => {
            const dateKey = post.date;
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)?.push(post);
        });
        return grouped;
    }, [filteredPosts]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        let day = 1;
        for (let i = 0; i < 6; i++) { // 6 weeks for the grid
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfMonth) {
                    const prevMonthDays = new Date(year, month, 0).getDate();
                    const date = new Date(year, month - 1, prevMonthDays - firstDayOfMonth + j + 1);
                    days.push({ date, isCurrentMonth: false, posts: [] });
                } else if (day > daysInMonth) {
                    const date = new Date(year, month + 1, day - daysInMonth);
                    days.push({ date, isCurrentMonth: false, posts: [] });
                    day++;
                } else {
                    const date = new Date(year, month, day);
                    const dateKey = date.toISOString().split('T')[0];
                    days.push({ date, isCurrentMonth: true, posts: postsByDate.get(dateKey) || [] });
                    day++;
                }
            }
        }
        return days.slice(0, 42); // Ensure 6 weeks
    }, [currentDate, postsByDate]);
    
    const today = new Date();
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="calendar-dashboard">
            <div className="calendar-header">
                <div className="calendar-title">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div className="calendar-nav">
                    <button onClick={goToPrevMonth} className="button-secondary" aria-label="Previous month"><ChevronLeftIcon/></button>
                    <button onClick={goToToday} className="button-secondary">Today</button>
                    <button onClick={goToNextMonth} className="button-secondary" aria-label="Next month"><ChevronRightIcon/></button>
                </div>
            </div>
            <div className="calendar-grid-container">
                <div className="calendar-grid">
                    {dayHeaders.map(day => <div key={day} className="day-heading">{day}</div>)}
                    {calendarGrid.map(({ date, isCurrentMonth, posts }, index) => {
                        const isToday = isCurrentMonth && date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                        return (
                            <div key={index} className={`calendar-day ${!isCurrentMonth ? 'not-current-month' : ''} ${isToday ? 'is-today' : ''}`}>
                                <div className="day-content">
                                    <span className="day-number">{date.getDate()}</span>
                                    <div className="day-posts">
                                        {posts.map(post => {
                                            const pillar = contentPillars.find(p => p.id === post.pillarId);
                                            return (
                                                <button key={post.id} className={`calendar-post-item ${post.platform.toLowerCase()}`} onClick={() => setModalPost(post)}>
                                                    {pillar && <span className="pillar-dot" style={{ backgroundColor: pillar.color }}></span>}
                                                    {post.threadTitle}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
             {modalPost && (
                <PostDetailModal
                    post={modalPost}
                    account={accounts.find(a => a.id === modalPost.accountId)}
                    onClose={() => setModalPost(null)}
                />
            )}
        </div>
    );
};