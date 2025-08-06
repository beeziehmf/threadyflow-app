import React, { createContext, useState, useCallback, useEffect, useContext, ChangeEvent, ReactNode } from 'react';
import type { GeneratedThread, Account, ScheduledPost, ActivityLogEntry, User, Post } from '../types/types.tsx';
import { aiService } from '../services/aiService.tsx';

// --- CONTEXT TYPE DEFINITION ---
interface AppContextType {
  activeView: string;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  idea: string;
  setIdea: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  error: string | null;
  generatedThread: GeneratedThread | null;
  handleGenerateThread: () => Promise<void>;
  handlePostChange: (id: number, value: string) => void;
  csvData: string[] | null;
  csvFileName: string;
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  handleUseRandomIdea: () => void;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  currentAccountId: number | null;
  setCurrentAccountId: React.Dispatch<React.SetStateAction<number | null>>;
  scheduleDate: string;
  setScheduleDate: React.Dispatch<React.SetStateAction<string>>;
  scheduleTime: string;
  setScheduleTime: React.Dispatch<React.SetStateAction<string>>;
  handleSchedule: () => void;
  scheduledPosts: ScheduledPost[];
  handleUnschedule: (postId: number) => void;
  activityLog: ActivityLogEntry[];
  addActivity: (text: string) => void;
  user: User;
  updateUser: (updatedUser: Partial<User>) => void;
}

// --- CONTEXT CREATION ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedThread, setGeneratedThread] = useState<GeneratedThread | null>(null);
  const [csvData, setCsvData] = useState<string[] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>('');
  
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, platform: 'Threads', name: '@corp_solutions' },
    { id: 2, platform: 'Instagram', name: '@corpsol_insta' },
  ]);
  
  const [currentAccountId, setCurrentAccountId] = useState<number | null>(accounts.length > 0 ? accounts[0].id : null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [user, setUser] = useState<User>({ name: 'Jane Doe', email: 'jane.doe@example.com' });

  // Sync currentAccountId if accounts list changes
  useEffect(() => {
    if (!accounts.some(acc => acc.id === currentAccountId)) {
      setCurrentAccountId(accounts.length > 0 ? accounts[0].id : null);
    }
  }, [accounts, currentAccountId]);
  
  // Set view to dashboard if current workspace is deleted
  useEffect(() => {
    if (!currentAccountId && (activeView === 'dashboard' || activeView === 'new-thread')) {
        // No action needed, the view component will render NoWorkspaceView
    }
  }, [currentAccountId, activeView]);

  const addActivity = useCallback((text: string) => {
    const newActivity: ActivityLogEntry = {
      id: Date.now(),
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActivityLog(prev => [newActivity, ...prev.slice(0, 19)]); // Keep last 20 activities
  }, []);

  const handleGenerateThread = useCallback(async () => {
    if (!idea.trim()) {
      setError("Please enter a content idea.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedThread(null);
    try {
      const thread = await aiService.generateThread(idea);
      setGeneratedThread(thread);
      addActivity(`Generated new thread: "${thread.threadTitle}"`);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while generating the thread.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [idea, addActivity]);

  const handlePostChange = (id: number, value: string) => {
    if (generatedThread) {
      const newPosts = generatedThread.posts.map(post => 
        post.id === id ? { ...post, text: value } : post
      );
      setGeneratedThread({...generatedThread, posts: newPosts});
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(line => line.trim().replace(/"/g, '')).filter(line => line);
      setCsvData(lines);
      setIdea(''); 
      addActivity(`Imported ${lines.length} ideas from ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    addActivity(`Removed CSV file: ${csvFileName}`);
    setCsvData(null);
    setCsvFileName('');
  };

  const handleUseRandomIdea = () => {
    if (csvData && csvData.length > 0) {
      const randomIndex = Math.floor(Math.random() * csvData.length);
      const randomIdea = csvData[randomIndex];
      setIdea(randomIdea);
      addActivity(`Used random idea: "${randomIdea.substring(0,30)}..."`);
    }
  };
  
  const handleSchedule = useCallback(() => {
    const account = accounts.find(a => a.id === currentAccountId);
    if (!scheduleDate || !scheduleTime || !account || !generatedThread) {
      alert("Please ensure a thread is generated, a date and time are selected, and you are in a valid workspace.");
      return;
    }
    const newScheduledPost: ScheduledPost = {
      id: Date.now(),
      threadTitle: generatedThread.threadTitle,
      posts: generatedThread.posts,
      hashtags: generatedThread.hashtags,
      accountId: account.id,
      accountName: account.name,
      platform: account.platform,
      date: scheduleDate,
      time: scheduleTime,
    };
    setScheduledPosts(prev => [...prev, newScheduledPost].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
    addActivity(`Scheduled thread "${generatedThread.threadTitle}" for ${account.name}.`);
    setGeneratedThread(null);
    setIdea('');
    setScheduleDate('');
    setScheduleTime('');
    setActiveView('dashboard');
  }, [accounts, currentAccountId, scheduleDate, scheduleTime, generatedThread, addActivity]);
  
  const handleUnschedule = useCallback((postId: number) => {
    const postToUnschedule = scheduledPosts.find(p => p.id === postId);
    if (postToUnschedule) {
      setScheduledPosts(prev => prev.filter(p => p.id !== postId));
      addActivity(`Unscheduled thread: "${postToUnschedule.threadTitle}"`);
    }
  }, [scheduledPosts, addActivity]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser(prev => ({...prev, ...updatedUser}));
    addActivity(`Updated user profile information.`);
  }, [addActivity]);

  const value = {
    activeView, setActiveView,
    idea, setIdea,
    isLoading, error,
    generatedThread,
    handleGenerateThread,
    handlePostChange,
    csvData, csvFileName,
    handleFileUpload,
    handleRemoveFile,
    handleUseRandomIdea,
    accounts, setAccounts,
    currentAccountId, setCurrentAccountId,
    scheduleDate, setScheduleDate,
    scheduleTime, setScheduleTime,
    handleSchedule,
    scheduledPosts,
    handleUnschedule,
    activityLog, addActivity,
    user, updateUser
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- CUSTOM HOOK FOR CONSUMING CONTEXT ---
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};