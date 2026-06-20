// useStore.ts
import { create } from 'zustand';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

export type ViewType = 
  | 'landing' 
  | 'auth' 
  | 'dashboard' 
  | 'meeting-room' 
  | 'team-mood' 
  | 'meeting-dna' 
  | 'kanban' 
  | 'analytics' 
  | 'post-meeting'
  | 'team-workspace';

export type ThemeType = 'dark' | 'light';

export type AuthModeType = 'login' | 'signup' | 'forgot' | 'otp';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: { name: string; avatar: string };
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  company: string;
}

export interface WorkspaceChannel {
  id: string;
  name: string;
  unread: boolean;
}

export interface WorkspaceDocument {
  id: string;
  title: string;
  lastUpdated: string;
  author: string;
  content: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  size: string;
  type: string;
  timestamp: string;
}

export interface WorkspaceActivity {
  id: string;
  user: string;
  avatar: string;
  action: string;
  time: string;
}

interface StoreState {
  // Navigation & UI
  currentView: ViewType;
  authMode: AuthModeType;
  commandMenuOpen: boolean;
  theme: ThemeType;
  user: UserProfile | null;
  notifications: Array<{ id: string; type: 'success' | 'info' | 'warning'; text: string }>;
  
  // Video Room Controls
  isMuted: boolean;
  isVideoOff: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  meetingTime: number; // in seconds
  activeMeetingId: string | null;
  
  // Kanban Data
  tasks: Task[];
  
  // AI Copilot
  aiMessages: Message[];
  isAiTyping: boolean;
  
  // Team Workspace Data
  workspaceChannels: WorkspaceChannel[];
  workspaceActiveChannelId: string;
  workspaceDocuments: WorkspaceDocument[];
  workspaceActiveDocumentId: string;
  workspaceFiles: WorkspaceFile[];
  workspaceActivities: WorkspaceActivity[];
  
  // Initialize and Sync Store
  initializeStore: () => Promise<void>;
  
  // Setters & Actions
  setCurrentView: (view: ViewType) => void;
  setAuthMode: (mode: AuthModeType) => void;
  setCommandMenuOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addNotification: (text: string, type?: 'success' | 'info' | 'warning') => void;
  removeNotification: (id: string) => void;
  
  // Meeting Actions
  startMeeting: (title: string) => Promise<string>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleRecording: () => void;
  toggleScreenShare: () => void;
  setMeetingTime: (time: number) => void;
  endActiveMeeting: () => Promise<any>;
  resetMeeting: () => void;
  
  // Kanban Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Workspace Actions
  fetchWorkspaceData: () => Promise<void>;
  setWorkspaceActiveChannelId: (id: string) => void;
  setWorkspaceActiveDocumentId: (id: string) => void;
  addWorkspaceDocument: (title: string, content: string) => Promise<void>;
  addWorkspaceFile: (name: string, size: string, type: string) => Promise<void>;
  
  // AI Actions
  sendCopilotMessage: (text: string) => void;
  clearCopilotMessages: () => void;
}

// Map database task schema to frontend Task object structures
// Initialize theme from localStorage or system preference
const getInitialTheme = (): ThemeType => {
  const stored = localStorage.getItem('intellmeet_theme') as ThemeType | null;
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

const applyThemeToDocument = (theme: ThemeType) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('intellmeet_theme', theme);
};

const mapDbTask = (t: any): Task => ({
  id: t.id,
  title: t.title,
  description: t.description || '',
  assignee: {
    name: t.assignee_name || 'Unassigned',
    avatar: t.assignee_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
  },
  priority: t.priority || 'medium',
  deadline: t.deadline || 'June 10, 2026',
  status: t.status || 'todo',
});

export const useStore = create<StoreState>((set, get) => ({
  // Navigation & UI
  currentView: 'landing',
  authMode: 'login',
  commandMenuOpen: false,
  theme: (() => {
    const t = getInitialTheme();
    applyThemeToDocument(t);
    return t;
  })(),
  user: null,
  notifications: [
    { id: 'notif-1', type: 'info', text: 'Welcome to IntellMeet! Press CMD + K to trigger commands.' }
  ],
  
  // Video Room Controls
  isMuted: false,
  isVideoOff: false,
  isRecording: false,
  isScreenSharing: false,
  meetingTime: 0,
  activeMeetingId: null,
  
  // Kanban
  tasks: [],
  
  // AI Copilot
  aiMessages: [
    {
      id: 'msg-init',
      sender: 'ai',
      text: "Hello. I am your IntellMeet AI Copilot. I'm listening to your workspace. You can ask me to summarize meetings, extract action items, create email outlines, or generate action plans. Try typing `/summary` or `/tasks`.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  isAiTyping: false,
  
  // Workspace States
  workspaceChannels: [
    { id: 'ch-1', name: 'ux-design', unread: true },
    { id: 'ch-2', name: 'ai-summaries', unread: false },
    { id: 'ch-3', name: 'engineering-logs', unread: false },
    { id: 'ch-4', name: 'general-sync', unread: false }
  ],
  workspaceActiveChannelId: 'ch-1',
  workspaceDocuments: [],
  workspaceActiveDocumentId: '',
  workspaceFiles: [],
  workspaceActivities: [],
  
  // Initialize and Sync Store Data
  initializeStore: async () => {
    // Guard: don't fire API calls if user has no token
    const token = localStorage.getItem('intellmeet_jwt');
    if (!token) {
      set({ currentView: 'landing' });
      return;
    }

    try {
      const [profile, channels, tasks, docs, files, activities, notifs] = await Promise.all([
        api.auth.getProfile().catch(() => null),
        api.workspace.getChannels().catch(() => []),
        api.tasks.list().catch(() => []),
        api.documents.list().catch(() => []),
        api.workspace.getFiles().catch(() => []),
        api.workspace.getActivities().catch(() => []),
        api.notifications.list().catch(() => [])
      ]);

      // If profile fetch failed, token is invalid — go back to landing
      if (!profile) {
        localStorage.removeItem('intellmeet_jwt');
        set({ currentView: 'landing', user: null });
        return;
      }

      set({
        user: profile,
        workspaceChannels: channels.length ? channels : get().workspaceChannels,
        tasks: tasks.length ? tasks.map(mapDbTask) : get().tasks,
        workspaceDocuments: docs.length ? docs.map((d: any) => ({
          id: d.id,
          title: d.title,
          content: d.content,
          author: d.author,
          lastUpdated: d.last_updated
        })) : get().workspaceDocuments,
        workspaceActiveDocumentId: docs.length ? (docs[0]?.id || '') : get().workspaceActiveDocumentId,
        workspaceFiles: files.length ? files.map((f: any) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          timestamp: f.timestamp
        })) : get().workspaceFiles,
        workspaceActivities: activities.length ? activities.map((a: any) => ({
          id: a.id,
          user: a.user_name,
          avatar: a.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
          action: a.action,
          time: a.time
        })) : get().workspaceActivities,
        notifications: notifs.length 
          ? notifs.map((n: any) => ({ id: n.id, type: n.type, text: n.text })) 
          : get().notifications
      });

      // Bind Socket real-time events
      const socket = getSocket();
      
      socket.off('kanban-card-updated');
      socket.on('kanban-card-updated', async () => {
        const refreshedTasks = await api.tasks.list().catch(() => []);
        set({ tasks: refreshedTasks.map(mapDbTask) });
      });

      socket.off('workspace-chat-updated');
      socket.on('workspace-chat-updated', async () => {
        const refreshedActivities = await api.workspace.getActivities().catch(() => []);
        set({
          workspaceActivities: refreshedActivities.map((a: any) => ({
            id: a.id,
            user: a.user_name,
            avatar: a.avatar,
            action: a.action,
            time: a.time
          }))
        });
      });

    } catch (err) {
      console.error('Failed to initialize and sync store:', err);
    }
  },

  // Navigation Actions
  setCurrentView: (view) => {
    set({ currentView: view });
  },
  setAuthMode: (mode) => set({ authMode: mode }),
  setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
  
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyThemeToDocument(next);
    set({ theme: next });
  },
  setTheme: (theme) => {
    applyThemeToDocument(theme);
    set({ theme });
  },
  
  login: async (email, password) => {
    try {
      const response = await api.auth.login(email, password);
      const { token, user: profile } = response;
      localStorage.setItem('intellmeet_jwt', token);
      set({ user: profile, currentView: 'dashboard' });
      get().addNotification(`Successfully logged in as ${profile.name}`, 'success');
      get().initializeStore();
    } catch (err: any) {
      throw err;
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await api.auth.register(name, email, password);
      const { token, user: profile } = response;
      localStorage.setItem('intellmeet_jwt', token);
      set({ user: profile, currentView: 'dashboard' });
      get().addNotification(`Welcome to IntellMeet, ${profile.name}!`, 'success');
      get().initializeStore();
    } catch (err: any) {
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (_) {
      // proceed with local cleanup even if server call fails
    }
    localStorage.removeItem('intellmeet_jwt');
    set({ user: null, currentView: 'landing' });
  },
  
  addNotification: (text, type = 'info') => {
    const newNotif = { id: Math.random().toString(), type, text };
    set((state) => ({ notifications: [...state.notifications, newNotif] }));
    setTimeout(() => get().removeNotification(newNotif.id), 5000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  // Meeting Actions
  startMeeting: async (title) => {
    try {
      const mtg = await api.meetings.create(title);
      set({ activeMeetingId: mtg.id, meetingTime: 0 });
      get().addNotification(`Meeting "${title}" started. Joining conference...`, 'success');
      return mtg.id;
    } catch (err) {
      get().addNotification('Failed to create meeting session', 'warning');
      throw err;
    }
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
  
  toggleRecording: () => {
    const nextVal = !get().isRecording;
    set({ isRecording: nextVal });
    get().addNotification(
      nextVal ? 'Recording active. Live audio transcript stream started.' : 'Recording paused.',
      nextVal ? 'success' : 'info'
    );
  },

  toggleScreenShare: () => {
    const nextVal = !get().isScreenSharing;
    set({ isScreenSharing: nextVal });
    get().addNotification(
      nextVal ? 'Screen sharing active.' : 'Screen sharing stopped.',
      'info'
    );
  },

  setMeetingTime: (time) => set({ meetingTime: time }),
  
  endActiveMeeting: async () => {
    const meetingId = get().activeMeetingId;
    if (!meetingId) return;

    try {
      const summaryResult = await api.meetings.end(meetingId);
      get().addNotification('Meeting finished. AI Summary reports generated successfully.', 'success');
      get().resetMeeting();
      return summaryResult;
    } catch (err) {
      get().addNotification('Failed to save meeting report', 'warning');
    }
  },

  resetMeeting: () => set({ 
    meetingTime: 0, 
    isRecording: false, 
    isScreenSharing: false, 
    isMuted: false, 
    isVideoOff: false,
    activeMeetingId: null 
  }),
  
  // Kanban Actions
  fetchTasks: async () => {
    try {
      const tasksList = await api.tasks.list();
      set({ tasks: tasksList.map(mapDbTask) });
    } catch (err) {
      console.error('Failed to sync Kanban tasks:', err);
    }
  },

  addTask: async (task) => {
    try {
      await api.tasks.create(task);
      get().fetchTasks();
    } catch (err) {
      get().addNotification('Failed to save task to board', 'warning');
    }
  },

  updateTaskStatus: async (taskId, newStatus) => {
    // Optimistic UI updates
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    }));

    try {
      await api.tasks.updateStatus(taskId, newStatus);
      getSocket().emit('kanban-card-moved', { taskId, newStatus });
    } catch (err) {
      get().addNotification('Failed to sync task move with server', 'warning');
      get().fetchTasks(); // rollback
    }
  },

  deleteTask: async (taskId) => {
    try {
      await api.tasks.delete(taskId);
      get().fetchTasks();
    } catch (err) {
      get().addNotification('Failed to delete task', 'warning');
    }
  },

  // Workspace Actions
  fetchWorkspaceData: async () => {
    try {
      const [docs, files, activities] = await Promise.all([
        api.documents.list(),
        api.workspace.getFiles(),
        api.workspace.getActivities()
      ]);

      set({
        workspaceDocuments: docs.map((d: any) => ({
          id: d.id,
          title: d.title,
          content: d.content,
          author: d.author,
          lastUpdated: d.last_updated
        })),
        workspaceFiles: files,
        workspaceActivities: activities.map((a: any) => ({
          id: a.id,
          user: a.user_name,
          avatar: a.avatar,
          action: a.action,
          time: a.time
        }))
      });
    } catch (err) {
      console.error('Failed to sync Workspace details:', err);
    }
  },

  setWorkspaceActiveChannelId: (id) => set({ workspaceActiveChannelId: id }),
  setWorkspaceActiveDocumentId: (id) => set({ workspaceActiveDocumentId: id }),
  
  addWorkspaceDocument: async (title, content) => {
    try {
      const newDoc = await api.documents.create(title, content);
      get().fetchWorkspaceData();
      set({ workspaceActiveDocumentId: newDoc.id });
    } catch (err) {
      get().addNotification('Failed to create new Notion block', 'warning');
    }
  },

  addWorkspaceFile: async (name, size, type) => {
    try {
      await api.workspace.registerFile({ name, size, type });
      get().fetchWorkspaceData();
      get().addNotification(`Asset "${name}" uploaded successfully`, 'success');
    } catch (err) {
      get().addNotification('Failed to upload file', 'warning');
    }
  },
  
  // AI Copilot responses — real API call
  sendCopilotMessage: async (text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: `msg-${Date.now()}`, sender: 'user', text, timestamp };
    
    set((state) => ({ 
      aiMessages: [...state.aiMessages, userMsg],
      isAiTyping: true
    }));

    try {
      const activeMeetingId = get().activeMeetingId;
      const response = await api.copilot.chat(text, activeMeetingId);
      
      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: response.reply || response.message || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      set((state) => ({
        aiMessages: [...state.aiMessages, aiMsg],
        isAiTyping: false
      }));
    } catch (err: any) {
      const errorMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: `⚠️ Failed to get AI response: ${err.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      set((state) => ({
        aiMessages: [...state.aiMessages, errorMsg],
        isAiTyping: false
      }));
    }
  },
  
  clearCopilotMessages: () => set({
    aiMessages: [
      {
        id: 'msg-init-reset',
        sender: 'ai',
        text: "Conversation history cleared. Ready to record the next meeting transcript or analyze meeting DNA. How can I help?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  })
}));
