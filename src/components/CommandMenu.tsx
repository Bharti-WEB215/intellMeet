import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, Terminal, BarChart2, Users, Play, CheckSquare, Settings, LogOut, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const CommandMenu: React.FC = () => {
  const { 
    commandMenuOpen, 
    setCommandMenuOpen, 
    addNotification,
    logout
  } = useStore();
  
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandMenuOpen(!commandMenuOpen);
      }
      if (e.key === 'Escape') {
        setCommandMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandMenuOpen, setCommandMenuOpen]);

  if (!commandMenuOpen) return null;

  const items: Array<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    shortcut: string;
    action: () => void;
  }> = [
    {
      icon: <Terminal className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />,
      title: 'Navigate to AI Command Center',
      subtitle: 'Open the bento-grid executive dashboard',
      shortcut: '↵ G D',
      action: () => { navigate('/dashboard'); setCommandMenuOpen(false); }
    },
    {
      icon: <Play className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />,
      title: 'Join Video Meeting Room',
      subtitle: 'Simulate live collaborative video meeting',
      shortcut: '↵ G M',
      action: () => { navigate('/room'); setCommandMenuOpen(false); }
    },
    {
      icon: <Users className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />,
      title: 'View Team Mood Analytics',
      subtitle: 'Flagship emotional metrics and energy tracking',
      shortcut: '↵ G T',
      action: () => { navigate('/team-mood'); setCommandMenuOpen(false); }
    },
    {
      icon: <BarChart2 className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />,
      title: 'Analyze Meeting DNA',
      subtitle: 'Inspect radar charts of last meeting outcomes',
      shortcut: '↵ G A',
      action: () => { navigate('/meeting-dna'); setCommandMenuOpen(false); }
    },
    {
      icon: <CheckSquare className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />,
      title: 'Open Kanban Workspace',
      subtitle: 'Manage extracted meeting tasks & priorities',
      shortcut: '↵ G K',
      action: () => { navigate('/kanban'); setCommandMenuOpen(false); }
    },
    {
      icon: <BarChart2 className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />,
      title: 'Access Analytics Center',
      subtitle: 'Review team performance charts',
      shortcut: '↵ G C',
      action: () => { navigate('/analytics'); setCommandMenuOpen(false); }
    },
    {
      icon: <Settings className="w-5 h-5 text-[var(--theme-text-secondary)]" />,
      title: 'System Preferences',
      subtitle: 'Configure audio, video, and integrations',
      shortcut: '⌘ ,',
      action: () => { addNotification('Preferences dialogue is simulated.', 'info'); setCommandMenuOpen(false); }
    },
    {
      icon: <LogOut className="w-5 h-5 text-red-400" />,
      title: 'Sign Out of IntellMeet',
      subtitle: 'Terminate secure session and return to landing',
      shortcut: '⌥ ⇧ Q',
      action: () => { logout(); setCommandMenuOpen(false); }
    }
  ];

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandMenuOpen(false)}
          className="absolute inset-0 bg-[var(--theme-bg)]/70 backdrop-blur-lg"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] backdrop-blur-2xl"
          style={{ boxShadow: 'var(--theme-card-shadow-elevated)' }}
        >
          {/* Input */}
          <div className="flex items-center border-b border-[var(--theme-border)] px-5 py-4">
            <Search className="mr-3 w-5 h-5 text-[var(--theme-text-muted)]" />
            <input 
              type="text" 
              placeholder="Search views, run AI commands, find settings..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveIndex(0); }}
              className="w-full bg-transparent text-base text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-block rounded-lg border border-[var(--theme-border-hover)] px-2.5 py-1 text-xs text-[var(--theme-text-muted)] bg-[var(--theme-surface-alt)] font-mono">ESC</kbd>
          </div>

          {/* Items */}
          <div className="max-h-[350px] overflow-y-auto px-2 py-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <motion.div 
                  key={index}
                  onClick={item.action}
                  onMouseEnter={() => setActiveIndex(index)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center justify-between rounded-xl px-3 py-3 cursor-pointer transition-all group ${
                    activeIndex === index ? 'bg-[var(--theme-surface-hover)]' : 'hover:bg-[var(--theme-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-xl p-2 transition-all ${
                      activeIndex === index ? 'bg-[var(--theme-primary)]/15' : 'bg-[var(--theme-surface-alt)]'
                    }`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold transition-colors ${
                        activeIndex === index ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-secondary)]'
                      }`}>{item.title}</p>
                      <p className="text-xs text-[var(--theme-text-muted)]">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeIndex === index && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs font-medium flex items-center gap-1" 
                        style={{ color: 'var(--theme-primary)' }}
                      >
                        Execute <ArrowRight className="w-3 h-3" />
                      </motion.span>
                    )}
                    <span className="rounded-lg bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--theme-text-muted)]">{item.shortcut}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center">
                <Terminal className="mx-auto w-8 h-8 text-[var(--theme-text-muted)] animate-pulse mb-3" />
                <p className="text-sm text-[var(--theme-text-secondary)]">No results found for "{search}"</p>
                <p className="text-xs text-[var(--theme-text-muted)] mt-1">Try typing "meeting", "dna", or "kanban"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[var(--theme-divider)] bg-[var(--theme-bg-secondary)] px-5 py-3 text-xs text-[var(--theme-text-muted)]">
            <div className="flex space-x-4 font-mono">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
            </div>
            <span className="font-mono">IntellMeet Command v2.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default CommandMenu;
