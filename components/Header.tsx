
import * as React from 'react';
import { Target, Signal, Battery, Clock, ShieldAlert } from 'lucide-react';

// Fix: Removed redundant global JSX augmentation. Centralized version in types.ts handles this globally.

export const Header: React.FC = () => {
  const [time, setTime] = React.useState(new Date().toLocaleTimeString('pt-BR'));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    /* Fix: HTML tags like header, div, span are now resolved correctly through types.ts augmentation */
    <header className="border-b-2 border-amber/30 bg-black/90 backdrop-blur-md p-3 sticky top-0 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-amber w-6 h-6 animate-pulse" />
          <div>
            <h1 className="font-orbitron text-lg font-black tracking-tighter leading-none amber-glow">COMANDOS</h1>
            <span className="text-[9px] opacity-60 tracking-[0.2em] font-black uppercase">HUD TÁTICO v3.1</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-black">
          <div className="hidden sm:flex items-center gap-1">
            <Signal size={12} className="text-green-500" />
            <span className="text-green-500">HQ ON</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span className="font-mono tabular-nums">{time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Battery size={12} className="text-amber" />
            <span>95%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
