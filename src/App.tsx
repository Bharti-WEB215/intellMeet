import React, { useState } from 'react';
import { useStore } from './store/useStore';
import type { ViewType } from './store/useStore';
import { 
  Sparkles, Terminal, Users, BarChart2, Play, CheckSquare, 
  LogOut, Search, Menu, X 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeToggle from './components/ThemeToggle';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPages from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import VideoRoom from './pages/VideoRoom';
import TeamMood from './pages/TeamMood';
import MeetingDNA from './pages/MeetingDNA';
import KanbanWorkspace from './pages/KanbanWorkspace';
import AnalyticsCenter from './pages/AnalyticsCenter';
import PostMeetingReport from './pages/PostMeetingReport';
import TeamWorkspace from './pages/TeamWorkspace';

// Global Components
import CommandMenu from './components/CommandMenu';
import AICopilot from './components/AICopilot';

export const App: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    setCommandMenuOpen, 
    user, 
    logout, 
    notifications, 
    removeNotification,
    isRecording,
    initializeStore,
    theme,
    toggleTheme
  } = useStore();

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem('intellmeet_token')) {
      initializeStore();
    }
  }, [initializeStore]);

  // If viewing marketing landing page, skip shell
  if (currentView === 'landing') {
    return (
      <div className="w-full">
        <LandingPage />
        <CommandMenu />
      </div>
    );
  }

  // If viewing authentication portal, skip shell
  if (currentView === 'auth') {
    return (
      <div className="w-full">
        <AuthPages />
        <CommandMenu />
      </div>
    );
  }

  const navItems: Array<{
    view: ViewType;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      view: 'dashboard',
      label: 'AI Command Center',
      icon: <Terminal className="w-4 h-4" />,
      color: 'hover:text-primary hover:bg-primary/10'
    },
    {
      view: 'meeting-room',
      label: 'Live Video Sync',
      icon: <Play className="w-4 h-4" />,
      color: 'hover:text-accent hover:bg-accent/10'
    },
    {
      view: 'team-mood',
      label: 'Team Mood Analytics',
      icon: <Users className="w-4 h-4" />,
      color: 'hover:text-secondary hover:bg-secondary/10'
    },
    {
      view: 'meeting-dna',
      label: 'Meeting DNA Matrix',
      icon: <BarChart2 className="w-4 h-4" />,
      color: 'hover:text-primary hover:bg-primary/10'
    },
    {
      view: 'kanban',
      label: 'Kanban Workspace',
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'hover:text-accent hover:bg-accent/10'
    },
    {
      view: 'analytics',
      label: 'Executive Analytics',
      icon: <BarChart2 className="w-4 h-4" />,
      color: 'hover:text-secondary hover:bg-secondary/10'
    },
    {
      view: 'team-workspace',
      label: 'Team Workspace',
      icon: <Users className="w-4 h-4" />,
      color: 'hover:text-primary hover:bg-primary/10'
    }
  ];

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex relative overflow-x-hidden font-sans transition-colors duration-400">
      
      {/* Background radial spotlights */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,var(--theme-aurora-1)_0,transparent_60%)] pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,var(--theme-aurora-2)_0,transparent_60%)] pointer-events-none z-0" />

      {/* 1. Arc-inspired Floating Glass Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 h-[calc(100vh-48px)] my-6 ml-6 rounded-3xl glass-panel border-[var(--theme-border)] p-5 z-20 sticky top-6">
        
        <div className="space-y-6">
          {/* Logo brand */}
          <div 
            onClick={() => handleNavClick('landing')}
            className="flex items-center space-x-2.5 cursor-pointer pb-4 border-b border-[var(--theme-divider)]"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center border border-[var(--theme-border)] shadow-lg">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[var(--theme-text)]">
              Intell<span className="text-secondary">Meet</span>
            </span>
          </div>

          {/* CMD+K trigger mockup */}
          <button 
            onClick={() => setCommandMenuOpen(true)}
            className="w-full flex items-center justify-between bg-[var(--theme-input-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] transition-all rounded-xl px-3 py-2 text-xs text-[var(--theme-text-secondary)] text-left"
          >
            <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Search commands</span>
            <kbd className="rounded border border-[var(--theme-border-hover)] px-1.5 py-0.5 text-[10px] bg-[var(--theme-surface-alt)] shadow-inner">⌘K</kbd>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active 
                      ? 'bg-primary text-white border border-primary/20 shadow-md shadow-primary/10' 
                      : `text-[var(--theme-text-secondary)] ${item.color}`
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Theme toggle & User profile footer */}
        <div className="space-y-4 pt-4 border-t border-[var(--theme-divider)]">
          {isRecording && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center gap-2 text-[10px] text-red-400 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              RECORDING ACTIVE (TRANSCRIPT IS STREAMING)
            </div>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">Theme</span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img 
                className="w-8 h-8 rounded-full object-cover border border-[var(--theme-border)]" 
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'} 
                alt="user" 
              />
              <div className="truncate max-w-[110px]">
                <h4 className="text-xs font-bold text-[var(--theme-text)] truncate">{user?.name}</h4>
                <p className="text-[9px] text-[var(--theme-text-muted)] font-mono truncate">{user?.role}</p>
              </div>
            </div>
            
            <button 
              onClick={logout} 
              title="Sign Out"
              className="text-[var(--theme-text-secondary)] hover:text-red-400 p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Mobile Top Header Shell */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 z-30 glass-panel border-x-0 border-t-0 border-[var(--theme-border)] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm text-[var(--theme-text)]">IntellMeet</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button 
            onClick={() => setCopilotOpen(!copilotOpen)}
            className="p-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed top-16 inset-x-0 bg-[var(--theme-surface)] border-b border-[var(--theme-border)] backdrop-blur-2xl z-20 px-4 py-6 space-y-4"
          >
            <button 
              onClick={() => { setCommandMenuOpen(true); setMobileMenuOpen(false); }}
              className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text-secondary)] flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Command Search (⌘K)
            </button>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`flex items-center space-x-2 p-3 rounded-xl text-xs font-semibold ${
                    currentView === item.view 
                      ? 'bg-primary text-white' 
                      : 'bg-[var(--theme-surface-alt)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label.replace(' Analytics', '').replace(' Matrix', '').replace(' Center', '')}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-divider)]">
              <div className="flex items-center space-x-2">
                <img className="w-8 h-8 rounded-full object-cover" src={user?.avatar} alt="user" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--theme-text)]">{user?.name}</h4>
                  <p className="text-[9px] text-[var(--theme-text-muted)]">{user?.role}</p>
                </div>
              </div>
              <button onClick={logout} className="text-xs text-red-400 font-bold hover:underline flex items-center gap-1">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main content viewport section */}
      <main className="flex-1 flex flex-col min-h-screen px-4 sm:px-8 py-24 lg:py-8 z-10 relative max-w-7xl mx-auto overflow-hidden">
        
        {/* Desktop Topbar header block */}
        <header className="hidden lg:flex items-center justify-between border-b border-[var(--theme-divider)] pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-[var(--theme-text-muted)] font-mono">system-console_v1.0.4</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Desktop Theme Toggle */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} className="lg:hidden" />
            {/* Quick launch assistant widget */}
            <button 
              onClick={() => setCopilotOpen(!copilotOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] transition-colors border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> AI Assistant Drawer
            </button>
          </div>
        </header>

        {/* Dynamic page router mount */}
        <div className="flex-1">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'meeting-room' && <VideoRoom />}
          {currentView === 'team-mood' && <TeamMood />}
          {currentView === 'meeting-dna' && <MeetingDNA />}
          {currentView === 'kanban' && <KanbanWorkspace />}
          {currentView === 'analytics' && <AnalyticsCenter />}
          {currentView === 'post-meeting' && <PostMeetingReport />}
          {currentView === 'team-workspace' && <TeamWorkspace />}
        </div>
      </main>

      {/* 3. Persisted Spotlights & AI Dialog overlays */}
      <CommandMenu />
      <AICopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* 4. Global Toast Notifications Overlay (Bottom right) */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col space-y-2 max-w-xs">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              className={`rounded-2xl p-4 shadow-xl backdrop-blur-2xl border flex items-start space-x-3 text-xs ${
                notif.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : notif.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-350'
                  : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'
              }`}
            >
              <div className="flex-1">
                <p className="leading-relaxed font-medium">{notif.text}</p>
              </div>
              <button 
                onClick={() => removeNotification(notif.id)}
                className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] font-bold text-[10px] pl-2 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};
export default App;
