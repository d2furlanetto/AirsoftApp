
import * as React from 'react';

// Fix: Removed redundant global JSX augmentation. Centralized version in types.ts handles this globally.

interface TacticalButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary', 
  icon, 
  className = '',
  disabled = false
}) => {
  const baseStyle = "font-orbitron font-bold uppercase tracking-widest px-4 py-2 transition-all duration-200 flex items-center justify-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#ffb000] text-black border-[#ffb000] hover:bg-[#ffc133] active:scale-95",
    danger: "bg-red-600 text-white border-red-600 hover:bg-red-700 active:scale-95",
    outline: "bg-transparent text-[#ffb000] border-[#ffb000] hover:bg-[#ffb000]/10 active:scale-95",
    ghost: "bg-transparent text-[#ffb000]/70 border-transparent hover:text-[#ffb000] active:scale-95"
  };

  return (
    // Fix: Using standard button element allowed by global JSX augmentation in types.ts
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
