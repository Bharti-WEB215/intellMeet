import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, className = '' }) => {
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={onToggle}
      className={`theme-toggle-btn relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 cursor-pointer group ${
        isDark
          ? 'bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] hover:bg-[var(--theme-surface-hover)]'
          : 'bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-primary/30 hover:bg-primary/5'
      } ${className}`}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {isDark ? (
          <Sun className="w-4.5 h-4.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
        )}
      </motion.div>

      {/* Ambient glow ring */}
      <div
        className={`absolute inset-0 rounded-xl transition-opacity duration-500 pointer-events-none ${
          isDark
            ? 'opacity-0 group-hover:opacity-100 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
            : 'opacity-0 group-hover:opacity-100 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
        }`}
      />
    </motion.button>
  );
};

export default ThemeToggle;
