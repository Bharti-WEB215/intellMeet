import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Task } from '../store/useStore';
import { GlassCard } from '../components/GlassCard';
import { 
  Plus, CheckSquare, Clock, Trash2, 
  Sparkles, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export const KanbanWorkspace: React.FC = () => {
  const { tasks, addTask, updateTaskStatus, deleteTask } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New task form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState('June 10, 2026');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    addTask({
      title,
      description,
      priority,
      deadline,
      status: 'todo',
      assignee: { 
        name: 'Julian Carter', 
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80' 
      }
    });

    // Reset
    setTitle('');
    setDescription('');
    setPriority('medium');
    setShowAddForm(false);
  };

  const columns: Array<{
    id: Task['status'];
    title: string;
    color: string;
    glow: string;
  }> = [
    { id: 'todo', title: 'To Do', color: 'border-l-indigo-500', glow: 'shadow-indigo-500/5' },
    { id: 'in-progress', title: 'In Progress', color: 'border-l-secondary', glow: 'shadow-secondary/5' },
    { id: 'review', title: 'Under Review', color: 'border-l-yellow-500', glow: 'shadow-yellow-500/5' },
    { id: 'done', title: 'Completed', color: 'border-l-accent', glow: 'shadow-accent/5' },
  ];

  const handleNextStatus = (task: Task) => {
    const statusOrder: Task['status'][] = ['todo', 'in-progress', 'review', 'done'];
    const currIdx = statusOrder.indexOf(task.status);
    if (currIdx < 3) {
      updateTaskStatus(task.id, statusOrder[currIdx + 1]);
    }
  };

  const handlePrevStatus = (task: Task) => {
    const statusOrder: Task['status'][] = ['todo', 'in-progress', 'review', 'done'];
    const currIdx = statusOrder.indexOf(task.status);
    if (currIdx > 0) {
      updateTaskStatus(task.id, statusOrder[currIdx - 1]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6 w-full text-[var(--theme-text)] pb-12"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--theme-text)] tracking-tight leading-none my-0 flex items-center gap-2">
            Kanban Workspace 
            <span className="text-xs bg-secondary/20 border border-secondary/30 text-secondary font-mono px-2 py-0.5 rounded-full">TASK COLLABORATION</span>
          </h1>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1.5 tracking-wide">Manage deliverables and targets generated dynamically from meeting reports</p>
        </div>

        {/* Toggle Form Button */}
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-magnetic flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-primary text-white border border-primary/20 hover:bg-primary/90 transition-all duration-200 text-xs font-bold cursor-pointer"
          style={{ boxShadow: 'var(--theme-glow-primary)' }}
        >
          <Plus className="w-4 h-4" /> Add Smart Task
        </button>
      </div>

      {/* Add Task Collapsible Drawer Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="border-[var(--theme-border)] p-5 space-y-4 max-w-xl">
              <h3 className="font-heading text-sm font-bold text-[var(--theme-text)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Add Task Pushed by AI
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Task Label</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Integrate Recharts library components" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Target Deadline</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. June 10, 2026" 
                      value={deadline} 
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Task Details</label>
                  <textarea 
                    placeholder="Provide specific notes and guidelines..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Priority</span>
                    <div className="flex bg-[var(--theme-input-bg)] rounded-lg p-0.5 border border-[var(--theme-border)]">
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`px-3 py-1 text-[9px] font-bold rounded-md uppercase transition-all duration-200 cursor-pointer ${
                            priority === p 
                              ? p === 'high' 
                                ? 'bg-red-500/20 text-red-400' 
                                : p === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="px-3.5 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)] rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-magnetic px-4.5 py-1.5 text-xs font-bold text-[var(--theme-text-inverse)] bg-accent rounded-xl hover:bg-accent/90 transition-all duration-200 cursor-pointer"
                      style={{ boxShadow: 'var(--theme-glow-accent)' }}
                    >
                      Save Task
                    </button>
                  </div>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board columns */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start"
      >
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <motion.div key={col.id} variants={staggerItem} className="flex flex-col space-y-4">
              {/* Column Header */}
              <div className="flex justify-between items-center px-2 pb-1 border-b border-[var(--theme-divider)]">
                <span className="font-heading text-xs font-bold text-[var(--theme-text-muted)] flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" /> {col.title}
                </span>
                <span className="bg-[var(--theme-surface-alt)] px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[var(--theme-text-muted)]">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards lane list */}
              <div className="space-y-4 min-h-[300px]">
                <AnimatePresence mode="popLayout">
                  {colTasks.map(t => (
                    <motion.div
                      key={t.id}
                      layout
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragElastic={0.35}
                      whileDrag={{ scale: 1.05, rotate: 1.5, zIndex: 50 }}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <GlassCard className={`border-[var(--theme-border)] border-l-4 ${col.color} p-4 space-y-3 ${col.glow}`}>
                        {/* Title & priority */}
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-heading text-xs font-bold text-[var(--theme-text)] leading-normal">{t.title}</h4>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            t.priority === 'high' 
                              ? 'bg-red-500/15 text-red-400 border border-red-500/25' 
                              : t.priority === 'medium'
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                          }`}>
                            {t.priority}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-[var(--theme-text-muted)] leading-relaxed">{t.description}</p>

                        {/* Target & Assignee footer */}
                        <div className="flex items-center justify-between border-t border-[var(--theme-divider)] pt-2.5">
                          <div className="flex items-center space-x-1.5">
                            <img className="w-5 h-5 rounded-full object-cover" src={t.assignee.avatar} alt={t.assignee.name} />
                            <span className="text-[9px] text-[var(--theme-text-secondary)] truncate max-w-[80px]">{t.assignee.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-[9px] text-[var(--theme-text-muted)] font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t.deadline.split(',')[0]}</span>
                          </div>
                        </div>

                        {/* Interactive Board quick action shifters */}
                        <div className="flex justify-between items-center border-t border-[var(--theme-divider)] pt-2 text-[10px] text-[var(--theme-text-muted)]">
                          <button 
                            onClick={() => deleteTask(t.id)} 
                            className="hover:text-red-400 p-1 rounded transition-colors duration-200 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="flex gap-2">
                            {col.id !== 'todo' && (
                              <button 
                                onClick={() => handlePrevStatus(t)}
                                className="hover:text-[var(--theme-text)] font-bold cursor-pointer transition-colors duration-200"
                              >
                                Prev
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button 
                                onClick={() => handleNextStatus(t)}
                                className="hover:text-accent font-bold cursor-pointer flex items-center transition-colors duration-200"
                              >
                                Move <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && (
                  <div className="border border-dashed border-[var(--theme-divider)] rounded-2xl py-12 text-center text-[10px] text-[var(--theme-text-muted)] font-mono uppercase tracking-wider">
                    Lane Empty
                  </div>
                )}
              </div>

            </motion.div>
          );
        })}
      </motion.div>

    </motion.div>
  );
};
export default KanbanWorkspace;
