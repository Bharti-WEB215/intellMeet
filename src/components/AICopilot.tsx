import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, Send, Bot, User, Trash2, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({ isOpen, onClose }) => {
  const { 
    aiMessages, 
    sendCopilotMessage, 
    clearCopilotMessages,
    isAiTyping 
  } = useStore();
  
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendCopilotMessage(inputValue);
    setInputValue('');
  };

  const handleCommandClick = (command: string) => {
    sendCopilotMessage(command);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed top-6 right-6 bottom-6 w-96 z-40 flex flex-col rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-5 py-4 bg-[var(--theme-input-bg)]">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-primary/20 p-1.5 border border-primary/30">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--theme-text)] flex items-center gap-1.5">
                AI Copilot
                <span className="text-[10px] bg-accent/20 border border-accent/30 text-accent font-mono px-1.5 py-0.5 rounded-full">ACTIVE</span>
              </h3>
              <p className="text-[10px] text-[var(--theme-text-secondary)]">Listening to current workspace</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={clearCopilotMessages} 
              title="Clear transcript history" 
              className="text-[var(--theme-text-secondary)] hover:text-red-400 p-1 hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose} 
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] text-sm font-semibold hover:bg-[var(--theme-surface-hover)] px-2.5 py-1 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {aiMessages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`rounded-xl p-1.5 h-fit w-fit flex items-center justify-center border ${
                  msg.sender === 'user' 
                    ? 'bg-primary/20 border-primary/30 text-primary' 
                    : 'bg-secondary/20 border-secondary/30 text-secondary'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-slate-50'
                    : 'bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] text-[var(--theme-text)]'
                }`}>
                  {/* Basic markdown renderer simulator */}
                  {msg.text.split('\n').map((line, idx) => {
                    if (line.startsWith('- **') || line.startsWith('  - **')) {
                      // Bullet line
                      const isNested = line.startsWith('  -');
                      return (
                        <p key={idx} className={`${isNested ? 'ml-4' : 'ml-2'} text-[var(--theme-text-secondary)] my-1 relative pl-3`}>
                          <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-[var(--theme-text-secondary)]" />
                          <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-\s\*]+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </p>
                      );
                    }
                    if (line.startsWith('###')) {
                      return <h4 key={idx} className="font-bold text-[var(--theme-text)] mt-3 mb-1 text-base first:mt-0">{line.replace('###', '').trim()}</h4>;
                    }
                    if (line.includes('**')) {
                      return <p key={idx} className="my-1" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                    }
                    return <p key={idx} className="my-1">{line}</p>;
                  })}
                  <span className="block text-[10px] text-right text-[var(--theme-text-muted)] mt-1">{msg.timestamp}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isAiTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="rounded-xl p-1.5 h-fit w-fit flex items-center justify-center border bg-secondary/20 border-secondary/30 text-secondary">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] text-[var(--theme-text)] text-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary" />
                  Generating insights...
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Command Helper Panel */}
        <div className="px-4 py-2 border-t border-[var(--theme-divider)] bg-[var(--theme-surface-alt)] flex flex-wrap gap-1.5">
          <button 
            onClick={() => handleCommandClick('/summary')} 
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)] rounded-full px-2.5 py-1 bg-[var(--theme-surface-alt)] hover:bg-primary/20 hover:border-primary/30 transition-all"
          >
            /summary <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
          <button 
            onClick={() => handleCommandClick('/tasks')} 
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)] rounded-full px-2.5 py-1 bg-[var(--theme-surface-alt)] hover:bg-accent/20 hover:border-accent/30 transition-all"
          >
            /tasks <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
          <button 
            onClick={() => handleCommandClick('/email')} 
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)] rounded-full px-2.5 py-1 bg-[var(--theme-surface-alt)] hover:bg-secondary/20 hover:border-secondary/30 transition-all"
          >
            /email <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
          <button 
            onClick={() => handleCommandClick('/report')} 
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)] rounded-full px-2.5 py-1 bg-[var(--theme-surface-alt)] hover:bg-purple-500/20 hover:border-purple-500/30 transition-all"
          >
            /report <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Input Block */}
        <form onSubmit={handleSubmit} className="border-t border-[var(--theme-border)] p-3 bg-[var(--theme-input-bg)] flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI, e.g. /summary, or 'Yes push'"
            className="flex-1 bg-[var(--theme-bg)] border border-[var(--theme-border-hover)] rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/95 text-slate-50 p-2.5 rounded-xl transition-colors cursor-pointer border border-primary/20 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};
export default AICopilot;
