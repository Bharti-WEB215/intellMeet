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
    const token = localStorage.getItem('intellmeet_jwt');
    if (token) {
      setCurrentView('dashboard');
      initializeStore();
    }
  }, [initializeStore, setCurrentView]);

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
      color: 'hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/8'
    },
    {
      view: 'meeting-room',
      label: 'Live Video Sync',
      icon: <Play className="w-4 h-4" />,
      color: 'hover:text-[var(--theme-secondary)] hover:bg-[var(--theme-secondary)]/8'
    },
    {
      view: 'team-mood',
      label: 'Team Mood Analytics',
      icon: <Users className="w-4 h-4" />,
      color: 'hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/8'
    },
    {
      view: 'meeting-dna',
      label: 'Meeting DNA Matrix',
      icon: <BarChart2 className="w-4 h-4" />,
      color: 'hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/8'
    },
    {
      view: 'kanban',
      label: 'Kanban Workspace',
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'hover:text-[var(--theme-secondary)] hover:bg-[var(--theme-secondary)]/8'
    },
    {
      view: 'analytics',
      label: 'Executive Analytics',
      icon: <BarChart2 className="w-4 h-4" />,
      color: 'hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/8'
    },
    {
      view: 'team-workspace',
      label: 'Team Workspace',
      icon: <Users className="w-4 h-4" />,
      color: 'hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/8'
    }
  ];

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex relative overflow-x-hidden font-sans transition-colors duration-500">
      
      {/* Background aurora effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,var(--theme-aurora-1)_0,transparent_70%)] filter blur-[100px]" style={{ animation: 'float-aurora-1 25s infinite alternate ease-in-out' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,var(--theme-aurora-2)_0,transparent_70%)] filter blur-[100px]" style={{ animation: 'float-aurora-2 30s infinite alternate ease-in-out' }} />
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col justify-between w-[260px] h-[calc(100vh-48px)] my-6 ml-6 rounded-3xl glass-panel p-5 z-20 sticky top-6">
        
        <div className="space-y-6">
          {/* Logo brand */}
          <div 
            onClick={() => handleNavClick('landing')}
            className="flex items-center space-x-2.5 cursor-pointer pb-4 border-b border-[var(--theme-divider)]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center shadow-lg" style={{ boxShadow: 'var(--theme-glow-primary)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk, Inter, system-ui' }}>
              Intell<span className="gradient-text-animated">Meet</span>
            </span>
          </div>

          {/* CMD+K trigger */}
          <button 
            onClick={() => setCommandMenuOpen(true)}
            className="w-full flex items-center justify-between bg-[var(--theme-input-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] transition-all rounded-xl px-3 py-2.5 text-xs text-[var(--theme-text-muted)] text-left group"
          >
            <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5 group-hover:text-[var(--theme-primary)] transition-colors" /> Search commands</span>
            <kbd className="rounded-md border border-[var(--theme-border-hover)] px-1.5 py-0.5 text-[10px] bg-[var(--theme-surface-alt)] font-mono">⌘K</kbd>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = currentView === item.view;
              return (
                <motion.button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active 
                      ? 'bg-[var(--theme-primary)] text-white shadow-lg' 
                      : `text-[var(--theme-text-secondary)] ${item.color}`
                  }`}
                  style={active ? { boxShadow: 'var(--theme-glow-primary)' } : {}}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Footer area */}
        <div className="space-y-4 pt-4 border-t border-[var(--theme-divider)]">
          {isRecording && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center gap-2 text-[10px] text-red-400 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              RECORDING ACTIVE
            </div>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">Theme</span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          {/* User profile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <img 
                  className="w-8 h-8 rounded-full object-cover border-2 border-[var(--theme-border)]" 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'} 
                  alt="user" 
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--theme-surface)]" />
              </div>
              <div className="truncate max-w-[110px]">
                <h4 className="text-xs font-bold text-[var(--theme-text)] truncate">{user?.name}</h4>
                <p className="text-[9px] text-[var(--theme-text-muted)] font-mono truncate">{user?.role}</p>
              </div>
            </div>
            
            <motion.button 
              onClick={logout} 
              title="Sign Out"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-[var(--theme-text-muted)] hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 z-30 glass-panel border-x-0 border-t-0 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>IntellMeet</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button 
            onClick={() => setCopilotOpen(!copilotOpen)}
            className="p-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
          >
            <Sparkles className="w-4 h-4 text-[var(--theme-primary)]" />
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
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
              className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text-muted)] flex items-center gap-2"
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
                      ? 'bg-[var(--theme-primary)] text-white' 
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen px-4 sm:px-8 py-24 lg:py-8 z-10 relative max-w-7xl mx-auto overflow-hidden">
        
        {/* Desktop Topbar */}
        <header className="hidden lg:flex items-center justify-between border-b border-[var(--theme-divider)] pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-[var(--theme-text-muted)] font-mono">intellmeet AI</span>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button 
              onClick={() => setCopilotOpen(!copilotOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] transition-all border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] cursor-pointer btn-magnetic"
              style={{ boxShadow: 'var(--theme-card-shadow)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--theme-primary)] animate-pulse" /> AI Assistant
            </motion.button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'meeting-room' && <VideoRoom />}
            {currentView === 'team-mood' && <TeamMood />}
            {currentView === 'meeting-dna' && <MeetingDNA />}
            {currentView === 'kanban' && <KanbanWorkspace />}
            {currentView === 'analytics' && <AnalyticsCenter />}
            {currentView === 'post-meeting' && <PostMeetingReport />}
            {currentView === 'team-workspace' && <TeamWorkspace />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Overlays */}
      <CommandMenu />
      <AICopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col space-y-2 max-w-xs">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              className={`rounded-2xl p-4 backdrop-blur-2xl border flex items-start space-x-3 text-xs ${
                notif.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : notif.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'
              }`}
              style={{ boxShadow: 'var(--theme-card-shadow-elevated)' }}
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
