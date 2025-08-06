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
export interface ScheduledPost {
    id: number;
    threadTitle: string;
    posts: Post[];
    hashtags: string[];
    accountName: string;
    platform: Account['platform'];
    date: string;
    time: string;
}
export interface ActivityLogEntry {
    id: number;
    text: string;
    timestamp: string;
}
