
import * as React from 'react';
import { Target, Map as MapIcon, Trophy, FileText, QrCode, CheckCircle2, Radio, Navigation, ChevronDown, ChevronUp, ShieldCheck, X, ListTree, Timer, Play, AlertTriangle, Lock, Plus, Minus, Maximize, Info, Award, Zap } from 'lucide-react';
import { TacticalButton } from '../components/TacticalButton';
import { QRScanner } from '../components/QRScanner';
import { OperationEvent, Mission, MissionStatus, Operator, MissionProgress } from '../types';

interface OperatorDashboardProps {
  operatorCallsign: string;
  operation: OperationEvent;
  ranking: Operator[];
  missionsProgress: Record<string, MissionProgress>;
  onCompleteMission: (missionId: string) => void;
  onStartMission: (missionId: string) => void;
  onFailMission: (missionId: string) => void;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ 
  operatorCallsign, 
  operation, 
  ranking,
  missionsProgress,
  onCompleteMission,
  onStartMission,
  onFailMission
}) => {
  const [activeTab, setActiveTab] = React.useState<'briefing' | 'map' | 'ranking'>('briefing');
  const [scanning, setScanning] = React.useState(false);
  const [validatingMission, setValidatingMission] = React.useState<Mission | null>(null);
  const [detailMission, setDetailMission] = React.useState<Mission | null>(null);
  const [manualCode, setManualCode] = React.useState('');
  const [validationStatus, setValidationStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [currentTime, setCurrentTime] = React.useState(Date.now());
  
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);

  const primaryMissions = operation.missions.filter(m => m.isMain);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitora falha por tempo em tempo real (background)
  React.useEffect(() => {
    (Object.entries(missionsProgress) as [string, MissionProgress][]).forEach(([missionId, prog]) => {
      const missionDef = operation.missions.find(m => m.id === missionId);
      if (prog.status === MissionStatus.IN_PROGRESS && prog.startedAt && missionDef?.timerMinutes) {
        const deadline = prog.startedAt + (missionDef.timerMinutes * 60 * 1000);
        if (Date.now() > deadline) {
          onFailMission(missionId);
        }
      }
    });
  }, [currentTime, missionsProgress, operation.missions, onFailMission]);

  const handleValidate = (code: string) => {
    if (!validatingMission) return;
    const prog = missionsProgress[validatingMission.id];

    if (!prog || prog.status !== MissionStatus.IN_PROGRESS) {
      alert("OPERADOR: Este objetivo não está mais ativo ou o tempo expirou.");
      setValidatingMission(null);
      return;
    }

    if (validatingMission.timerMinutes && prog.startedAt) {
      const deadline = prog.startedAt + (validatingMission.timerMinutes * 60 * 1000);
      if (Date.now() > deadline) {
        alert("PROTOCOLO FALHOU: O tempo limite foi atingido antes da validação. Objetivo abortado.");
        onFailMission(validatingMission.id);
        setValidatingMission(null);
        setManualCode('');
        return;
      }
    }
    
    if (prog?.startedAt) {
      const timeElapsed = Date.now() - prog.startedAt;
      const shouldApplyLock = !validatingMission.timerMinutes || validatingMission.timerMinutes >= 5;
      
      if (shouldApplyLock && timeElapsed < FIVE_MINUTES_MS) {
        alert("PROTOCOLO DE SEGURANÇA: Aguarde o tempo mínimo de campo (5min) para validar este alvo.");
        return;
      }
    }

    if (code.toUpperCase() === validatingMission.code.toUpperCase()) {
      setValidationStatus('success');
      setTimeout(() => {
        onCompleteMission(validatingMission.id);
        setValidatingMission(null);
        setManualCode('');
        setScanning(false);
        setValidationStatus('idle');
      }, 1500);
    } else {
      setValidationStatus('error');
      setTimeout(() => {
        setValidationStatus('idle');
        setManualCode('');
      }, 2000);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleMapStart = (e: React.MouseEvent | React.TouchEvent) => setIsDragging(true);
  const handleMapMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    let movementX = 0, movementY = 0;
    if (!('touches' in e)) { movementX = (e as React.MouseEvent).movementX; movementY = (e as React.MouseEvent).movementY; }
    setPosition(prev => ({ x: prev.x + (movementX / zoom), y: prev.y + (movementY / zoom) }));
  };
  const handleMapEnd = () => setIsDragging(false);

  return (
    <div className="pb-24 pt-2">
      <div className="mx-4 p-3 military-border bg-amber/5 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest leading-none mb-1">Status Operacional</p>
            <h2 className="font-orbitron text-md font-black text-white leading-tight uppercase">{operation.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-60 font-bold uppercase leading-none mb-1">Operador</p>
            <p className="font-orbitron font-bold text-amber amber-glow uppercase">{operatorCallsign}</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="grid grid-cols-3 gap-1 bg-black p-1 military-border">
          <button onClick={() => setActiveTab('briefing')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'briefing' ? 'bg-amber text-black' : 'text-amber/40'}`}>
            <FileText size={18} /><span className="text-[9px] font-black uppercase">Briefing</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'bg-amber text-black' : 'text-amber/40'}`}>
            <MapIcon size={18} /><span className="text-[9px] font-black uppercase">Mapa</span>
          </button>
          <button onClick={() => setActiveTab('ranking')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'bg-amber text-black' : 'text-amber/40'}`}>
            <Trophy size={18} /><span className="text-[9px] font-black uppercase">Ranking</span>
          </button>
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'briefing' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-amber pl-2 py-1">
                <Radio size={16} /><h3 className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase">Objetivos de Campo</h3>
              </div>
              <div className="space-y-3">
                {primaryMissions.map(mission => {
                  const prog = missionsProgress[mission.id] || { status: MissionStatus.ACTIVE };
                  const isCompleted = prog.status === MissionStatus.COMPLETED;
                  const isFailed = prog.status === MissionStatus.FAILED;
                  const isInProgress = prog.status === MissionStatus.IN_PROGRESS;
                  
                  return (
                    <div key={mission.id} className={`military-border overflow-hidden transition-all duration-300 ${isCompleted ? 'bg-green-950/5 border-green-900/40' : isFailed ? 'bg-red-950/5 border-red-900/40' : isInProgress ? 'bg-amber/10 border-amber' : 'bg-black/40'}`}>
                      <button onClick={() => setDetailMission(mission)} className={`w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-amber/5`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 border ${isCompleted ? 'border-green-500 text-green-500' : isFailed ? 'border-red-500 text-red-500' : isInProgress ? 'border-amber text-amber animate-pulse' : 'border-amber/50 text-amber'}`}>
                            {isCompleted ? <CheckCircle2 size={18} /> : isFailed ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[8px] px-1 py-0.5 font-black bg-amber text-black uppercase">PRIMÁRIA</span>
                              <span className="text-[10px] font-mono font-bold text-amber/60">+{mission.points} PTS</span>
                            </div>
                            <h4 className="font-black uppercase text-sm">{mission.title}</h4>
                            {isInProgress && prog.startedAt && mission.timerMinutes && (
                               <p className="text-[10px] font-mono text-amber font-bold mt-1">
                                 T-MINUS: {formatTime((prog.startedAt + mission.timerMinutes * 60000) - currentTime)}
                               </p>
                            )}
                          </div>
                        </div>
                        <Info size={20} className="text-amber/40 hover:text-amber transition-colors" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="military-border bg-black relative overflow-hidden aspect-[4/5]" onMouseDown={handleMapStart} onMouseMove={handleMapMove} onMouseUp={handleMapEnd} onMouseLeave={handleMapEnd}>
              <div className="w-full h-full" style={{ transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)` }}>
                <img src={operation.mapUrl} alt="Map" className="w-full h-full object-contain grayscale brightness-50" draggable={false} />
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 4))} className="w-10 h-10 bg-black/80 border border-amber/50 text-amber"><Plus size={20}/></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="w-10 h-10 bg-black/80 border border-amber/50 text-amber"><Minus size={20}/></button>
              </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="space-y-3">
              {ranking.sort((a,b) => b.score - a.score).map((op, idx) => (
                <div key={op.id} className={`flex items-center justify-between p-4 military-border ${op.id === operatorCallsign ? 'bg-amber/10 border-amber' : 'bg-black/60'}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-orbitron text-amber/40 font-black text-xs">{idx + 1}</span>
                    <div>
                      <div className="font-black text-white text-sm uppercase">{op.callsign}</div>
                      <div className="text-[9px] opacity-60 font-bold uppercase">{op.rank}</div>
                    </div>
                  </div>
                  <div className="text-amber font-mono font-bold text-md">{op.score}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Missão */}
      {detailMission && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="w-full max-w-md military-border bg-[#0a0a0a] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(255,176,0,0.1)]">
            <div className="p-4 border-b border-amber/20 bg-amber/5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase ${detailMission.isMain ? 'bg-amber text-black' : 'bg-amber/20 text-amber'}`}>
                    {detailMission.isMain ? 'Missão Primária' : 'Sub-Objetivo'}
                  </span>
                  {detailMission.timerMinutes ? (
                    <span className="flex items-center gap-1 text-[8px] font-black text-amber/60 uppercase">
                      <Timer size={10} /> {detailMission.timerMinutes} MIN
                    </span>
                  ) : null}
                </div>
                <h3 className="font-orbitron font-black text-lg text-white uppercase leading-tight tracking-tight amber-glow">{detailMission.title}</h3>
              </div>
              <button onClick={() => setDetailMission(null)} className="p-2 text-amber/40 hover:text-amber transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-amber/60 text-[10px] font-black uppercase tracking-widest">
                  <FileText size={14} /> Briefing de Missão
                </div>
                <p className="text-[12px] leading-relaxed text-amber/90 font-mono italic bg-white/5 p-4 border-l-2 border-amber/30">
                  {detailMission.briefing}
                </p>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="military-border p-3 bg-amber/5 flex flex-col items-center justify-center gap-1">
                  <Award size={20} className="text-amber" />
                  <span className="text-[8px] font-black text-amber/60 uppercase">Recompensa</span>
                  <span className="font-orbitron font-black text-xl text-amber">+{detailMission.points}</span>
                  <span className="text-[8px] font-black text-amber/40 uppercase">Créditos</span>
                </div>
                <div className="military-border p-3 bg-amber/5 flex flex-col items-center justify-center gap-1">
                  <Zap size={20} className="text-amber" />
                  <span className="text-[8px] font-black text-amber/60 uppercase">Status</span>
                  <span className="font-orbitron font-black text-[10px] text-amber uppercase tracking-widest">
                    {missionsProgress[detailMission.id]?.status || MissionStatus.ACTIVE}
                  </span>
                  {missionsProgress[detailMission.id]?.status === MissionStatus.IN_PROGRESS && detailMission.timerMinutes && (
                    <span className="text-[10px] font-mono font-bold text-amber animate-pulse">
                      {formatTime((missionsProgress[detailMission.id].startedAt! + detailMission.timerMinutes * 60000) - currentTime)}
                    </span>
                  )}
                </div>
              </section>

              {operation.missions.some(m => m.parentId === detailMission.id) && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-amber/60 text-[10px] font-black uppercase tracking-widest">
                    <ListTree size={14} /> Sub-Objetivos Táticos
                  </div>
                  <div className="space-y-2">
                    {operation.missions.filter(m => m.parentId === detailMission.id).map(sub => {
                      const subProg = missionsProgress[sub.id] || { status: MissionStatus.ACTIVE };
                      return (
                        <div key={sub.id} className="flex items-center justify-between p-3 military-border border-amber/10 bg-black/40">
                          <div className="flex items-center gap-3">
                            <Target size={14} className={subProg.status === MissionStatus.COMPLETED ? 'text-green-500' : 'text-amber/40'} />
                            <span className="text-[10px] font-black text-white/80 uppercase">{sub.title}</span>
                          </div>
                          <span className="text-[9px] font-mono text-amber/40">+{sub.points}P</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="p-4 bg-black border-t border-amber/20 flex gap-3">
              {(!missionsProgress[detailMission.id] || missionsProgress[detailMission.id].status === MissionStatus.ACTIVE) && (
                <TacticalButton 
                  label="INICIAR PROTOCOLO" 
                  icon={<Play size={18} />} 
                  className="flex-1 py-4 font-black"
                  onClick={() => {
                    onStartMission(detailMission.id);
                  }}
                />
              )}
              {missionsProgress[detailMission.id]?.status === MissionStatus.IN_PROGRESS && (
                <TacticalButton 
                  label="VALIDAR ALVO" 
                  icon={<QrCode size={18} />} 
                  className="flex-1 py-4 font-black"
                  onClick={() => {
                    setValidatingMission(detailMission);
                    setDetailMission(null);
                  }}
                />
              )}
              {missionsProgress[detailMission.id]?.status === MissionStatus.COMPLETED && (
                <div className="flex-1 flex items-center justify-center gap-2 p-4 text-green-500 font-orbitron font-black text-sm uppercase">
                  <CheckCircle2 size={20} /> Missão Concluída
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {validatingMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95">
          <div className={`w-full max-w-sm military-border bg-black p-6 space-y-6 ${validationStatus === 'error' ? 'border-red-600' : validationStatus === 'success' ? 'border-green-500' : 'border-amber'}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-orbitron text-md font-black uppercase text-amber">Validar: {validatingMission.title}</h3>
              <button onClick={() => {setValidatingMission(null); setManualCode('');}} className="text-amber/40"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              {/* Alerta visual se o tempo estiver acabando */}
              {missionsProgress[validatingMission.id]?.startedAt && validatingMission.timerMinutes && (
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-amber/80 animate-pulse">
                  <Timer size={14} />
                  <span>TEMPO RESTANTE: {formatTime((missionsProgress[validatingMission.id].startedAt! + validatingMission.timerMinutes * 60000) - currentTime)}</span>
                </div>
              )}

              <input 
                type="text" 
                autoFocus 
                value={manualCode} 
                onChange={(e) => setManualCode(e.target.value.toUpperCase())} 
                className="w-full bg-black/60 border p-4 text-center text-2xl font-mono tracking-widest text-amber" 
                placeholder="CÓDIGO"
                onKeyDown={(e) => e.key === 'Enter' && handleValidate(manualCode)}
              />
              
              <div className="grid grid-cols-1 gap-3">
                <TacticalButton label="CONFIRMAR" onClick={() => handleValidate(manualCode)} className="w-full" />
                <TacticalButton label="SCANNER" variant="outline" icon={<QrCode size={18}/>} onClick={() => setScanning(true)} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {scanning && <QRScanner onResult={(res) => { setManualCode(res); handleValidate(res); setScanning(false); }} onClose={() => setScanning(false)} />}
    </div>
  );
};
