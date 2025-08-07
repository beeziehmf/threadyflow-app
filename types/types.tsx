export interface Post {
    id: number;
    text: string;
}
export interface GeneratedThread {
  threadTitle: string;
  posts: Post[];
  hashtags: string[];
}
export interface Account {
    id: number;
    platform: 'Threads' | 'Instagram' | 'Facebook';
    name: string;
}
export interface ContentPillar {
    id: string;
    name: string;
    color: string;
}

export interface ScheduledPost {
    id: number;
    threadTitle: string;
    posts: Post[];
    hashtags: string[];
    accountId: number;
    accountName: string;
    platform: Account['platform'];
    date: string;
    time: string;
    pillarId?: string; // Optional pillar ID
}

export interface QueuedPost {
    id: number;
    threadTitle: string;
    posts: Post[];
    hashtags: string[];
    accountId: number;
    pillarId?: string;
}

export interface QueueSchedule {
    days: number[]; // 0 = Sunday, 1 = Monday, etc.
    times: string[]; // e.g., ["09:00", "14:30"]
}

export interface UserVoiceSample {
    id: string;
    text: string;
}

export interface AnalyzedVoice {
    tone: string;
    style: string;
    description: string; // A short summary from AI about the voice
}

export interface ImprovementSuggestion {
    type: 'conciseness' | 'cta' | 'tone' | 'seo' | 'other';
    description: string; // A short description of the improvement
}

export interface ActivityLogEntry {
    id: number;
    text: string;
    timestamp: string;
}

export interface User {
    name: string;
    email: string;
}