import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, Send, Bot, User, Trash2, ArrowUpRight, Loader2, X } from 'lucide-react';
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
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed top-4 right-4 bottom-4 w-[400px] z-40 flex flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] backdrop-blur-2xl overflow-hidden"
        style={{ boxShadow: 'var(--theme-card-shadow-elevated)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-5 py-4 bg-[var(--theme-bg-secondary)]">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl p-2 border border-[var(--theme-border)]" style={{ background: 'var(--theme-badge-bg)' }}>
              <Sparkles className="w-5 h-5 animate-pulse" style={{ color: 'var(--theme-primary)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--theme-text)] flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                AI Copilot
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border" style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10B981'
                }}>ACTIVE</span>
              </h3>
              <p className="text-[10px] text-[var(--theme-text-muted)]">Listening to current workspace</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <motion.button 
              onClick={clearCopilotMessages} 
              title="Clear history" 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-[var(--theme-text-muted)] hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
            <motion.button 
              onClick={onClose} 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] p-2 hover:bg-[var(--theme-surface-hover)] rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {aiMessages.map((msg, idx) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx === aiMessages.length - 1 ? 0.1 : 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2.5 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`rounded-xl p-1.5 h-fit w-fit flex items-center justify-center border flex-shrink-0 ${
                  msg.sender === 'user' 
                    ? 'border-[var(--theme-border)]' 
                    : 'border-[var(--theme-border)]'
                }`} style={{
                  background: msg.sender === 'user' ? 'var(--theme-badge-bg)' : 'var(--theme-badge-bg)',
                  color: msg.sender === 'user' ? 'var(--theme-primary)' : 'var(--theme-secondary)'
                }}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'text-white rounded-tr-md'
                    : 'bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] text-[var(--theme-text)] rounded-tl-md'
                }`} style={msg.sender === 'user' ? { background: 'var(--theme-primary)' } : {}}>
                  {msg.text.split('\n').map((line, lineIdx) => {
                    if (line.startsWith('- **') || line.startsWith('  - **')) {
                      const isNested = line.startsWith('  -');
                      return (
                        <p key={lineIdx} className={`${isNested ? 'ml-4' : 'ml-2'} text-[var(--theme-text-secondary)] my-1 relative pl-3`}>
                          <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-[var(--theme-text-muted)]" />
                          <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-\s\*]+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </p>
                      );
                    }
                    if (line.startsWith('###')) {
                      return <h4 key={lineIdx} className="font-bold text-[var(--theme-text)] mt-3 mb-1 text-sm first:mt-0" style={{ fontFamily: 'Space Grotesk' }}>{line.replace('###', '').trim()}</h4>;
                    }
                    if (line.includes('**')) {
                      return <p key={lineIdx} className="my-1" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                    }
                    return <p key={lineIdx} className="my-1">{line}</p>;
                  })}
                  <span className="block text-[10px] text-right mt-2 opacity-50 font-mono">{msg.timestamp}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isAiTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="rounded-xl p-1.5 h-fit w-fit flex items-center justify-center border border-[var(--theme-border)]" style={{ background: 'var(--theme-badge-bg)', color: 'var(--theme-secondary)' }}>
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--theme-secondary)' }} />
                  Generating insights...
                </div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Commands */}
        <div className="px-4 py-2.5 border-t border-[var(--theme-divider)] bg-[var(--theme-bg-secondary)] flex flex-wrap gap-1.5">
          {[
            { cmd: '/summary', hoverBg: 'hover:bg-[var(--theme-primary)]/10 hover:border-[var(--theme-primary)]/25' },
            { cmd: '/tasks', hoverBg: 'hover:bg-emerald-500/10 hover:border-emerald-500/25' },
            { cmd: '/email', hoverBg: 'hover:bg-[var(--theme-secondary)]/10 hover:border-[var(--theme-secondary)]/25' },
            { cmd: '/report', hoverBg: 'hover:bg-amber-500/10 hover:border-amber-500/25' },
          ].map(({ cmd, hoverBg }) => (
            <motion.button 
              key={cmd}
              onClick={() => handleCommandClick(cmd)} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-text-muted)] border border-[var(--theme-border)] rounded-full px-2.5 py-1 bg-[var(--theme-surface-alt)] transition-all ${hoverBg}`}
            >
              {cmd} <ArrowUpRight className="w-2.5 h-2.5" />
            </motion.button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-[var(--theme-border)] p-3 bg-[var(--theme-bg-secondary)] flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI, e.g. /summary, or 'Yes push'"
            className="flex-1 bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-primary)]/50 focus:ring-1 focus:ring-[var(--theme-primary)]/20 transition-all"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-lg btn-glow"
            style={{ background: 'var(--theme-primary)', boxShadow: 'var(--theme-glow-primary)' }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};
export default AICopilot;
