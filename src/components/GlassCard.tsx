import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverable = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 transition-all duration-400 ${
        hoverable ? 'glass-panel-hover card-shine cursor-pointer' : ''
      } ${className}`}
      style={{
        boxShadow: 'var(--theme-card-shadow)',
      }}
    >
      {children}
    </div>
  );
};
export default GlassCard;
