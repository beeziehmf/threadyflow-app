import React, { createContext, useState, useCallback, useEffect, useContext, ChangeEvent, ReactNode } from 'react';
import type { GeneratedThread, Account, ScheduledPost, ActivityLogEntry, User, Post, ContentPillar, QueuedPost, QueueSchedule } from '../types/types.tsx';
import { aiService } from '../services/aiService.tsx';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";

// --- CONTEXT TYPE DEFINITION ---
interface AppContextType {
  activeView: string;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  idea: string;
  setIdea: React.Dispatch<React.SetStateAction<string>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  generatedIdeas: string[];
  handleGenerateIdeas: () => Promise<void>;
  tone: string;
  setTone: React.Dispatch<React.SetStateAction<string>>;
  style: string;
  setStyle: React.Dispatch<React.SetStateAction<string>>;
  contentPillars: ContentPillar[];
  addPillar: (pillar: ContentPillar) => void;
  updatePillar: (pillar: ContentPillar) => void;
  deletePillar: (pillarId: string) => void;
  selectedPillarId: string | undefined;
  setSelectedPillarId: React.Dispatch<React.SetStateAction<string | undefined>>;
  queuedPosts: QueuedPost[];
  addToQueue: () => void;
  queueSchedule: QueueSchedule;
  setQueueSchedule: React.Dispatch<React.SetStateAction<QueueSchedule>>;
  processQueue: () => void;
  generationCount: number;
  showApiLimitExceeded: boolean;
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
  user: User | null; // User can be null if not logged in
  updateUser: (updatedUser: Partial<User>) => void;
  userVoiceSamples: UserVoiceSample[];
  addUserVoiceSample: (sample: UserVoiceSample) => void;
  updateUserVoiceSample: (sample: UserVoiceSample) => void;
  deleteUserVoiceSample: (id: string) => void;
  analyzedVoice: AnalyzedVoice | null;
  handleAnalyzeVoice: () => Promise<void>;
  applyAnalyzedVoiceToDefaults: () => void;
  useAnalyzedVoiceForGeneration: boolean;
  setUseAnalyzedVoiceForGeneration: React.Dispatch<React.SetStateAction<boolean>>;
  handleSuggestImprovements: (postId: number, improvementType: ImprovementSuggestion['type']) => Promise<void>;
}

// --- CONTEXT CREATION ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [idea, setIdea] = useState("");
  const [theme, setTheme] = useState("");
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [tone, setTone] = useState('professional');
  const [style, setStyle] = useState('informative');
  const [contentPillars, setContentPillars] = useState<ContentPillar[]>([]);
  const [selectedPillarId, setSelectedPillarId] = useState<string | undefined>();
  const [queuedPosts, setQueuedPosts] = useState<QueuedPost[]>([]);
  const [queueSchedule, setQueueSchedule] = useState<QueueSchedule>({ days: [1, 3, 5], times: ["09:00"] });
  const [generationCount, setGenerationCount] = useState(0);
  const [showApiLimitExceeded, setShowApiLimitExceeded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedThread, setGeneratedThread] = useState<GeneratedThread | null>(null);
  const [csvData, setCsvData] = useState<string[] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>('');
  
  const [accounts, setAccounts] = useState<Account[]>([]); // Initialize as empty array
  
  const [currentAccountId, setCurrentAccountId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userVoiceSamples, setUserVoiceSamples] = useState<UserVoiceSample[]>([]);
  const [analyzedVoice, setAnalyzedVoice] = useState<AnalyzedVoice | null>(null);
  const [useAnalyzedVoiceForGeneration, setUseAnalyzedVoiceForGeneration] = useState(false);

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

  // Listen to Firebase Auth state changes and load user data
  useEffect(() => {
    console.log("AppContext: Setting up auth state listener.");
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        console.log("AppContext: User is signed in.", firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
        // User is signed in
        setUser({ uid: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email || '', email: firebaseUser.email || '' });
        // Load user data from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        getDoc(userDocRef).then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("AppContext: User data loaded from Firestore.", data);
            setContentPillars(data.contentPillars || []);
            setQueuedPosts(data.queuedPosts || []);
            setQueueSchedule(data.queueSchedule || { days: [1, 3, 5], times: ["09:00"] });
            setScheduledPosts(data.scheduledPosts || []);
            setGenerationCount(data.generationCount || 0);
            setUserVoiceSamples(data.userVoiceSamples || []);
            setAnalyzedVoice(data.analyzedVoice || null);
            setUseAnalyzedVoiceForGeneration(data.useAnalyzedVoiceForGeneration || false);

            // Load Threads account data
            if (data.threads) {
              const threadsAccount: Account = {
                id: data.threads.threadsUserId, // Use threadsUserId as the account ID
                platform: 'Threads',
                name: `@${data.threads.username}`,
              };
              setAccounts([threadsAccount]); // Assuming one Threads account for now
            } else {
              setAccounts([]); // No Threads account connected
            }

          } else {
            console.log("AppContext: Initializing new user data in Firestore.");
            // Initialize user data in Firestore if it doesn't exist
            setDoc(userDocRef, {
              contentPillars: [],
              queuedPosts: [],
              queueSchedule: { days: [1, 3, 5], times: ["09:00"] },
              scheduledPosts: [],
              generationCount: 0,
              userVoiceSamples: [],
              analyzedVoice: null,
              useAnalyzedVoiceForGeneration: false,
              threads: null, // Initialize threads to null
            });
            setAccounts([]);
          }
        }).catch(e => {
          console.error("AppContext: Error loading/initializing user data from Firestore:", e);
        });
      } else {
        console.log("AppContext: User is signed out.");
        // User is signed out
        setUser(null);
        // Clear local state
        setContentPillars([]);
        setQueuedPosts([]);
        setQueueSchedule({ days: [1, 3, 5], times: ["09:00"] });
        setScheduledPosts([]);
        setGenerationCount(0);
        setAccounts([]); // Clear accounts on sign out
      }
    });
    return () => {
      unsubscribe(); // Cleanup subscription on unmount
      console.log("AppContext: Auth state listener unsubscribed.");
    };
  }, []);

  // Save user data to Firestore whenever relevant state changes
  useEffect(() => {
    if (user && user.uid) { // Use uid for consistency
      console.log("AppContext: User data changed, saving to Firestore.", user);
      const userDocRef = doc(db, "users", user.uid);
      setDoc(userDocRef, {
        contentPillars,
        queuedPosts,
        queueSchedule,
        scheduledPosts,
        generationCount,
        userVoiceSamples,
        analyzedVoice,
        useAnalyzedVoiceForGeneration,
        // Save threads data if available in accounts state
        threads: accounts.find(acc => acc.platform === 'Threads') ? accounts.find(acc => acc.platform === 'Threads') : null,
      }, { merge: true }).catch(e => {
        console.error("AppContext: Error saving user data to Firestore:", e);
      });
    } else if (user === null) {
      console.log("AppContext: User is null, not saving to Firestore.");
    }
  }, [user, contentPillars, queuedPosts, queueSchedule, scheduledPosts, generationCount, userVoiceSamples, analyzedVoice, useAnalyzedVoiceForGeneration, accounts]); // Add accounts to dependency array

  // Process queue on app load (and whenever scheduledPosts or queuedPosts change)
  useEffect(() => {
    if (user && user.email) {
      console.log("AppContext: User logged in or queue/scheduled posts changed, processing queue.");
      processQueue();
    } else {
      console.log("AppContext: User not logged in, not processing queue.");
    }
  }, [user, scheduledPosts, queuedPosts]); // Re-run when user logs in or relevant data changes

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
    if (generationCount >= 30) {
        setShowApiLimitExceeded(true);
        setError("API generation limit exceeded for this session. Please provide your own API key.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedThread(null);
    try {
      const finalTone = useAnalyzedVoiceForGeneration && analyzedVoice ? analyzedVoice.tone : tone;
      const finalStyle = useAnalyzedVoiceForGeneration && analyzedVoice ? analyzedVoice.style : style;
      const thread = await aiService.generateThread(idea, finalTone, finalStyle);
      setGeneratedThread(thread);
      setGenerationCount(prev => prev + 1);
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

  const handleGenerateIdeas = useCallback(async () => {
    if (!theme.trim()) {
      setError("Please enter a theme.");
      return;
    }
    if (generationCount >= 30) {
        setShowApiLimitExceeded(true);
        setError("API generation limit exceeded for this session. Please provide your own API key.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedIdeas([]);
    try {
      const ideas = await aiService.generateIdeas(theme);
      setGeneratedIdeas(ideas);
      setGenerationCount(prev => prev + 1);
      addActivity(`Generated ideas for theme: "${theme}"`);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while generating ideas.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [theme, addActivity]);

  const handlePostChange = useCallback((id: number, value: string) => {
    if (generatedThread) {
      const newPosts = generatedThread.posts.map(post => 
        post.id === id ? { ...post, text: value } : post
      );
      setGeneratedThread({...generatedThread, posts: newPosts});
    }
  }, [generatedThread]);

  const handleSuggestImprovements = useCallback(async (postId: number, improvementType: ImprovementSuggestion['type']) => {
    if (!generatedThread) return;

    const postToImprove = generatedThread.posts.find(p => p.id === postId);
    if (!postToImprove) return;

    if (generationCount >= 30) {
        setShowApiLimitExceeded(true);
        setError("API generation limit exceeded for this session. Please provide your own API key.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const improvedText = await aiService.suggestImprovements(postToImprove.text, improvementType);
      setGeneratedThread(prev => {
        if (!prev) return null;
        const updatedPosts = prev.posts.map(p => 
          p.id === postId ? { ...p, text: improvedText } : p
        );
        return { ...prev, posts: updatedPosts };
      });
      setGenerationCount(prev => prev + 1);
      addActivity(`Suggested improvement (${improvementType}) for post: "${postToImprove.threadTitle}"`);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while suggesting improvements.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [generatedThread, generationCount, addActivity]);

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
      addActivity(`Used random idea: "${randomIdea.substring(0,30)}"...`);
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
      pillarId: selectedPillarId,
    };
    setScheduledPosts(prev => {
      const updatedPosts = [...prev, newScheduledPost].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
      addActivity(`Scheduled thread "${generatedThread.threadTitle}" for ${account.name}.`);
      return updatedPosts;
    });
    setGeneratedThread(null);
    setIdea('');
    setScheduleDate('');
    setScheduleTime('');
    setSelectedPillarId(undefined);
    setActiveView('dashboard');
  }, [accounts, currentAccountId, scheduleDate, scheduleTime, generatedThread, addActivity, selectedPillarId]);
  
  const handleUnschedule = useCallback((postId: number) => {
    setScheduledPosts(prev => {
      const postToUnschedule = prev.find(p => p.id === postId);
      if (postToUnschedule) {
        addActivity(`Unscheduled thread: "${postToUnschedule.threadTitle}"`);
        return prev.filter(p => p.id !== postId);
      }
      return prev;
    });
  }, [addActivity]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser(prev => (prev ? {...prev, ...updatedUser} : null)); // Handle prev being null
    addActivity(`Updated user profile information.`);
  }, [addActivity]);

  const addUserVoiceSample = useCallback((sample: UserVoiceSample) => {
    setUserVoiceSamples(prev => [...prev, sample]);
    addActivity(`Added voice sample: "${sample.text.substring(0, 30)}"...`);
  }, [addActivity]);

  const updateUserVoiceSample = useCallback((updatedSample: UserVoiceSample) => {
    setUserVoiceSamples(prev => prev.map(s => s.id === updatedSample.id ? updatedSample : s));
    addActivity(`Updated voice sample: "${updatedSample.text.substring(0, 30)}"...`);
  }, [addActivity]);

  const deleteUserVoiceSample = useCallback((id: string) => {
    setUserVoiceSamples(prev => {
      const sampleToDelete = prev.find(s => s.id === id);
      if (sampleToDelete) {
        addActivity(`Deleted voice sample: "${sampleToDelete.text.substring(0, 30)}"...`);
        return prev.filter(s => s.id !== id);
      }
      return prev;
    });
  }, [addActivity]);

  const handleAnalyzeVoice = useCallback(async () => {
    if (userVoiceSamples.length === 0) {
      setError("Please add at least one voice sample to analyze.");
      return;
    }
    if (generationCount >= 30) {
        setShowApiLimitExceeded(true);
        setError("API generation limit exceeded for this session. Please provide your own API key.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setAnalyzedVoice(null);
    try {
      const result = await aiService.analyzeVoice(userVoiceSamples);
      setAnalyzedVoice(result);
      setGenerationCount(prev => prev + 1);
      addActivity(`Analyzed user voice: ${result.description}`);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while analyzing the voice.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [userVoiceSamples, addActivity, generationCount]);

  const applyAnalyzedVoiceToDefaults = useCallback(() => {
    if (analyzedVoice) {
      setTone(analyzedVoice.tone);
      setStyle(analyzedVoice.style);
      setUseAnalyzedVoiceForGeneration(true);
      addActivity(`Applied analyzed voice (${analyzedVoice.tone}, ${analyzedVoice.style}) as defaults.`);
    }
  }, [analyzedVoice, setTone, setStyle, addActivity]);

  const addPillar = useCallback((pillar: ContentPillar) => {
    setContentPillars(prev => {
      const newPillars = [...prev, pillar];
      addActivity(`Added new content pillar: "${pillar.name}"`);
      return newPillars;
    });
  }, [addActivity]);

  const updatePillar = useCallback((updatedPillar: ContentPillar) => {
    setContentPillars(prev => {
      const newPillars = prev.map(p => p.id === updatedPillar.id ? updatedPillar : p);
      addActivity(`Updated content pillar: "${updatedPillar.name}"`);
      return newPillars;
    });
  }, [addActivity]);

  const deletePillar = useCallback((pillarId: string) => {
    setContentPillars(prev => {
      const pillarToDelete = prev.find(p => p.id === pillarId);
      if (pillarToDelete) {
        addActivity(`Deleted content pillar: "${pillarToDelete.name}"`);
        return prev.filter(p => p.id !== pillarId);
      }
      return prev;
    });
  }, [addActivity]);

  const addToQueue = useCallback(() => {
    if (!generatedThread || !currentAccountId) {
        alert("Please generate a thread and select a workspace first.");
        return;
    }
    const newQueuedPost: QueuedPost = {
        id: Date.now(),
        threadTitle: generatedThread.threadTitle,
        posts: generatedThread.posts,
        hashtags: generatedThread.hashtags,
        accountId: currentAccountId,
        pillarId: selectedPillarId,
    };
    setQueuedPosts(prev => [...prev, newQueuedPost]);
    addActivity(`Added thread "${generatedThread.threadTitle}" to the queue.`);
    setGeneratedThread(null);
    setIdea('');
    setSelectedPillarId(undefined);
  }, [generatedThread, currentAccountId, selectedPillarId, addActivity]);

  const processQueue = useCallback(() => {
    if (queuedPosts.length === 0) {
        // alert("The queue is empty."); // Removed alert for background processing
        return;
    }

    let lastScheduledDate = new Date();
    // Ensure we don't schedule posts in the past
    if (scheduledPosts.length > 0) {
        const lastExistingScheduledPost = scheduledPosts[scheduledPosts.length - 1];
        const lastExistingDate = new Date(`${lastExistingScheduledPost.date}T${lastExistingScheduledPost.time}`);
        if (lastExistingDate > lastScheduledDate) {
            lastScheduledDate = lastExistingDate;
        }
    }

    const newScheduledPosts: ScheduledPost[] = [];
    const remainingQueuedPosts = [...queuedPosts];

    while (remainingQueuedPosts.length > 0) {
        const postToSchedule = remainingQueuedPosts.shift()!;
        const account = accounts.find(a => a.id === postToSchedule.accountId);
        if (!account) continue;

        let nextSlotFound = false;
        // Look for a slot up to 365 days in the future to avoid infinite loops
        for (let i = 0; i < 365 && !nextSlotFound; i++) {
            lastScheduledDate.setDate(lastScheduledDate.getDate() + (i === 0 ? 0 : 1)); // Increment day, but not on first iteration
            
            if (queueSchedule.days.includes(lastScheduledDate.getDay())) {
                for (const time of queueSchedule.times) {
                    const proposedDateTime = new Date(`${lastScheduledDate.toISOString().split('T')[0]}T${time}`);
                    // Only consider future slots
                    if (proposedDateTime <= new Date()) continue;

                    const isSlotTaken = [...scheduledPosts, ...newScheduledPosts].some(p => 
                        new Date(p.date + 'T' + p.time).getTime() === proposedDateTime.getTime()
                    );

                    if (!isSlotTaken) {
                        const newPost: ScheduledPost = {
                            id: Date.now() + Math.random(), // Use random for unique ID in client-side scheduling
                            threadTitle: postToSchedule.threadTitle,
                            posts: postToSchedule.posts,
                            hashtags: postToSchedule.hashtags,
                            accountId: postToSchedule.accountId,
                            accountName: account.name,
                            platform: account.platform,
                            date: proposedDateTime.toISOString().split('T')[0],
                            time: time,
                            pillarId: postToSchedule.pillarId,
                        };
                        newScheduledPosts.push(newPost);
                        nextSlotFound = true;
                        break; // Exit time loop
                    }
                }
            }
        }
        if (!nextSlotFound) {
            console.warn(`Could not find a slot for post: ${postToSchedule.threadTitle}. It remains in queue.`);
            remainingQueuedPosts.push(postToSchedule); // Put it back if no slot found
        }
    }

    if (newScheduledPosts.length > 0) {
        setScheduledPosts(prev => [...prev, ...newScheduledPosts].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
        setQueuedPosts(remainingQueuedPosts); // Only keep posts that couldn't be scheduled
        addActivity(`Processed ${newScheduledPosts.length} posts from the queue.`);
    }
  }, [queuedPosts, scheduledPosts, accounts, queueSchedule, addActivity]);

  const value = {
    activeView, setActiveView,
    idea, setIdea,
    theme, setTheme,
    generatedIdeas,
    handleGenerateIdeas,
    tone, setTone,
    style, setStyle,
    contentPillars,
    addPillar,
    updatePillar,
    deletePillar,
    selectedPillarId,
    setSelectedPillarId,
    queuedPosts,
    addToQueue,
    queueSchedule,
    setQueueSchedule,
    processQueue,
    generationCount,
    showApiLimitExceeded,
    isLoading, error,
    generatedThread,
    handleGenerateThread,
    handlePostChange,
    handleSuggestImprovements,
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
    user, updateUser,
    userVoiceSamples,
    addUserVoiceSample,
    updateUserVoiceSample,
    deleteUserVoiceSample,
    analyzedVoice,
    handleAnalyzeVoice,
    applyAnalyzedVoiceToDefaults,
    useAnalyzedVoiceForGeneration,
    setUseAnalyzedVoiceForGeneration,
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
