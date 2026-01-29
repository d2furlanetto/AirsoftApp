
import * as React from 'react';
import { Plus, Trash2, ShieldAlert, Award, RefreshCcw, Camera, MapPin, SlidersHorizontal, Lock, QrCode, Radio, Upload, Image as ImageIcon, Users, UserMinus, MinusCircle, PlusCircle, Skull, Map as MapIcon, Target, LayoutGrid, X, Edit3, Save, CheckCircle2, Link as LinkIcon, ChevronRight, Info, Timer, Trophy } from 'lucide-react';
import { TacticalButton } from '../components/TacticalButton';
import { OperationEvent, Operator, MissionStatus, Mission } from '../types';

interface AdminDashboardProps {
  operation: OperationEvent;
  ranking: Operator[];
  onUpdateOperation: (op: Partial<OperationEvent>) => void;
  onResetMatch: () => void;
  onUpdateScore: (id: string, delta: number) => void;
  onRemoveOperator: (id: string) => void;
  onSaveMission: (mission: Partial<Mission>) => void;
  onDeleteMission: (missionId: string) => void;
}

type AdminTab = 'missions' | 'map' | 'ranking';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  operation, 
  ranking, 
  onUpdateOperation,
  onResetMatch,
  onUpdateScore,
  onRemoveOperator,
  onSaveMission,
  onDeleteMission
}) => {
  const [activeTab, setActiveTab] = React.useState<AdminTab>('missions');
  const [selectedMissionQR, setSelectedMissionQR] = React.useState<string | null>(null);
  const [editingMission, setEditingMission] = React.useState<Partial<Mission> | null>(null);
  const [editingOperation, setEditingOperation] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const primaryMissionsList = operation.missions.filter(m => m.isMain);

  const handleSaveMissionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMission) {
      onSaveMission(editingMission);
      setEditingMission(null);
    }
  };

  const handleMapUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateOperation({ mapUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 pb-32 flex flex-col space-y-6">
      <div className="flex justify-between items-center border-b border-amber/20 pb-4">
        <div>
          <h2 className="font-orbitron text-xl font-black text-amber flex items-center gap-2">
            <Lock size={18} className="text-red-600 animate-pulse" /> CMD CENTRAL
          </h2>
          <p className="text-[9px] opacity-40 uppercase font-black tracking-widest italic">Protocolos Administrativos</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-black p-1 military-border">
        <button onClick={() => setActiveTab('missions')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'missions' ? 'bg-amber text-black' : 'text-amber/40 hover:text-amber'}`}>
          <LayoutGrid size={18} /><span className="text-[9px] font-black uppercase">Missões</span>
        </button>
        <button onClick={() => setActiveTab('map')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'bg-amber text-black' : 'text-amber/40 hover:text-amber'}`}>
          <MapIcon size={18} /><span className="text-[9px] font-black uppercase">Mapa</span>
        </button>
        <button onClick={() => setActiveTab('ranking')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'bg-amber text-black' : 'text-amber/40 hover:text-amber'}`}>
          <Trophy size={18} /><span className="text-[9px] font-black uppercase">Ranking</span>
        </button>
      </div>

      <div className="min-h-[450px]">
        {activeTab === 'missions' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-l-2 border-amber pl-3">
                <h3 className="font-orbitron font-black text-sm uppercase">Dados da Operação</h3>
                <button onClick={() => setEditingOperation(!editingOperation)} className="text-[9px] font-black border border-amber/30 px-2 py-1 text-amber uppercase hover:bg-amber/10 transition-colors">
                  {editingOperation ? 'Fechar' : 'Editar'}
                </button>
              </div>

              {editingOperation ? (
                <div className="military-border p-4 bg-amber/5 space-y-4">
                  <input type="text" value={operation.name} onChange={e => onUpdateOperation({name: e.target.value.toUpperCase()})} className="w-full bg-black border border-amber/30 p-2 text-white font-black text-sm uppercase focus:outline-none" />
                  <textarea rows={2} value={operation.description} onChange={e => onUpdateOperation({description: e.target.value})} className="w-full bg-black border border-amber/30 p-2 text-white text-[10px] uppercase focus:outline-none" />
                  <TacticalButton label="SALVAR DADOS" className="w-full text-[10px]" onClick={() => setEditingOperation(false)} />
                </div>
              ) : (
                <div className="military-border p-4 bg-black/40 border-amber/20">
                  <h4 className="font-orbitron font-black text-amber text-lg leading-tight uppercase tracking-tight">{operation.name}</h4>
                  <p className="text-[10px] opacity-60 italic leading-tight uppercase line-clamp-2">{operation.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-2 border-amber pl-3">
                <Target size={16} className="text-amber" />
                <h3 className="font-orbitron font-black text-sm uppercase">Objetivos de Campo</h3>
              </div>

              <div className="space-y-6">
                {operation.missions.filter(m => m.isMain).map(primary => (
                  <div key={primary.id} className="space-y-3">
                    <div className="military-border bg-amber/5 border-amber/40 p-4 relative">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber text-black px-1.5 py-0.5 font-black text-[8px] uppercase">PRIMÁRIA</span>
                            <span className="font-mono text-amber text-[10px] font-bold">+{primary.points} PTS</span>
                          </div>
                          <h4 className="font-orbitron font-black text-white text-md uppercase leading-none">{primary.title}</h4>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingMission(primary)} className="p-2 border border-amber/20 text-amber hover:bg-amber/20 transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => setSelectedMissionQR(primary.id)} className={`p-2 border transition-all ${selectedMissionQR === primary.id ? 'bg-amber text-black' : 'border-amber/20 text-amber'}`}><QrCode size={16} /></button>
                          <button onClick={() => window.confirm(`HQ: Apagar Missão [${primary.title}]?`) && onDeleteMission(primary.id)} className="p-2 border border-amber/20 text-amber/40 hover:text-red-500 hover:border-red-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <div className="mt-4 ml-6 space-y-2 border-l-2 border-amber/20 pl-4">
                        {operation.missions.filter(m => m.parentId === primary.id).map(secondary => (
                          <div key={secondary.id} className="military-border bg-black/60 p-3 flex justify-between items-center">
                            <div>
                               <h5 className="font-black text-white text-[10px] uppercase leading-none">{secondary.title}</h5>
                               <span className="text-[7px] font-mono text-amber/60">+{secondary.points} PTS</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingMission(secondary)} className="p-1.5 border border-amber/10 text-amber/60 hover:text-amber"><Edit3 size={12} /></button>
                              <button onClick={() => setSelectedMissionQR(secondary.id)} className="p-1.5 border border-amber/10 text-amber/60 hover:text-amber"><QrCode size={12} /></button>
                              <button onClick={() => window.confirm(`HQ: Apagar sub-missão?`) && onDeleteMission(secondary.id)} className="p-1.5 border border-amber/10 text-amber/40 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setEditingMission({ title: '', briefing: '', points: 50, isMain: false, parentId: primary.id, code: '', timerMinutes: 0 })} className="w-full py-2 border border-dashed border-amber/30 text-[9px] font-black text-amber/40 hover:text-amber hover:border-amber transition-all uppercase flex items-center justify-center gap-2"><Plus size={14} /> Sub-Objetivo</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setEditingMission({ title: '', briefing: '', points: 200, isMain: true, code: '', timerMinutes: 0 })} className="w-full py-4 military-border bg-amber/5 text-amber font-orbitron font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber/10 border-dashed transition-all"><PlusCircle size={20} /> Nova Missão Primária</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
           <div className="space-y-4">
             <div className="military-border p-4 bg-black/40">
                <div className="aspect-[4/3] bg-black relative military-border overflow-hidden">
                   <img src={operation.mapUrl} className="w-full h-full object-cover opacity-50 grayscale" alt="Map View" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <TacticalButton label="ATUALIZAR MAPA" icon={<Upload size={18}/>} onClick={() => fileInputRef.current?.click()} />
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleMapUpload} />
                   </div>
                </div>
             </div>
           </div>
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-2 border-amber pl-3 mb-2">
              <Trophy size={16} className="text-amber" />
              <h3 className="font-orbitron font-black text-sm uppercase">Operadores em Campo</h3>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {ranking.sort((a,b) => b.score - a.score).map(op => (
                <div key={op.id} className="military-border bg-black/60 p-3 flex justify-between items-center transition-all hover:bg-black/80">
                  <div className="flex-1">
                    <h4 className="font-black text-white text-xs uppercase tracking-tight">{op.callsign}</h4>
                    <p className="text-[8px] opacity-40 uppercase font-black">{op.rank}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 border-r border-amber/10 pr-3">
                      <button onClick={() => onUpdateScore(op.id, 50)} className="p-1 text-green-500 hover:scale-125 transition-all"><PlusCircle size={18}/></button>
                      <button onClick={() => onUpdateScore(op.id, -50)} className="p-1 text-red-500 hover:scale-125 transition-all"><MinusCircle size={18}/></button>
                    </div>
                    <div className="font-mono text-amber font-black min-w-[50px] text-right text-lg">{op.score}</div>
                    <button 
                      onClick={() => window.confirm(`CMD: CONFIRMAR REMOÇÃO DO OPERADOR [${op.callsign}]?`) && onRemoveOperator(op.id)} 
                      className="p-1 ml-2 text-red-600/30 hover:text-red-600 transition-colors"
                      title="Remover Operador"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
              {ranking.length === 0 && (
                <div className="py-12 text-center text-amber/30 font-mono text-xs uppercase">Nenhum operador registrado.</div>
              )}
            </div>
            
            <div className="pt-4 border-t border-amber/10">
              <TacticalButton 
                label="RESETAR PARTIDA" 
                variant="danger" 
                className="w-full text-xs py-4" 
                onClick={onResetMatch} 
                icon={<RefreshCcw size={16}/>}
              />
              <p className="text-[8px] text-red-500/60 font-black text-center mt-2 uppercase tracking-tighter">Ação crítica: redefine todas as missões e remove operadores.</p>
            </div>
          </div>
        )}
      </div>

      {editingMission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-md military-border bg-black p-6 space-y-6 max-h-[90vh] overflow-y-auto border-amber shadow-[0_0_50px_rgba(255,176,0,0.1)]">
            <div className="flex justify-between items-start border-b border-amber/20 pb-4">
              <h3 className="font-orbitron text-amber font-black uppercase text-lg tracking-tight">{editingMission.id ? 'Ajustar Alvo' : 'Novo Alvo'}</h3>
              <button onClick={() => setEditingMission(null)} className="text-amber/40 hover:text-amber transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveMissionForm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-amber/60 tracking-widest">Título do Objetivo</label>
                <input required type="text" value={editingMission.title || ''} onChange={e => setEditingMission({...editingMission, title: e.target.value.toUpperCase()})} className="w-full bg-black military-border border-amber/30 p-3 text-white font-black text-xs uppercase focus:border-amber focus:outline-none transition-all"/>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-amber/60 tracking-widest">Briefing (Ordens)</label>
                <textarea required rows={2} value={editingMission.briefing || ''} onChange={e => setEditingMission({...editingMission, briefing: e.target.value})} className="w-full bg-black military-border border-amber/30 p-3 text-white text-[10px] uppercase focus:border-amber focus:outline-none transition-all"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-amber/60 tracking-widest">Pontos</label>
                  <input type="number" value={editingMission.points || 0} onChange={e => setEditingMission({...editingMission, points: parseInt(e.target.value) || 0})} className="w-full bg-black military-border border-amber/30 p-3 text-amber font-mono text-xs"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-amber/60 tracking-widest">Código de Validação</label>
                  <input required type="text" value={editingMission.code || ''} onChange={e => setEditingMission({...editingMission, code: e.target.value.toUpperCase()})} className="w-full bg-black military-border border-amber/30 p-3 text-amber font-mono text-xs uppercase"/>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-amber/60 flex items-center gap-2 tracking-widest"><Timer size={12}/> Tempo de Operação (Minutos)</label>
                <input type="number" placeholder="0 = Sem tempo" value={editingMission.timerMinutes || ''} onChange={e => setEditingMission({...editingMission, timerMinutes: parseInt(e.target.value) || 0})} className="w-full bg-black military-border border-amber/30 p-3 text-amber font-mono text-xs"/>
              </div>

              {!editingMission.isMain && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-amber/60 tracking-widest">Missão Pai (Dependência)</label>
                  <select value={editingMission.parentId || ''} onChange={e => setEditingMission({...editingMission, parentId: e.target.value})} className="w-full bg-black military-border border-amber/30 p-3 text-white text-[10px] uppercase outline-none focus:border-amber transition-all">
                    <option value="">Nenhum</option>
                    {primaryMissionsList.map(p => (<option key={p.id} value={p.id}>{p.title}</option>))}
                  </select>
                </div>
              )}

              <div className="pt-4 grid grid-cols-2 gap-3">
                 <TacticalButton label="CANCELAR" variant="outline" className="text-[10px]" onClick={() => setEditingMission(null)}/>
                 <button type="submit" className="bg-amber text-black font-orbitron font-black text-[10px] py-3 uppercase tracking-widest hover:bg-white transition-all">Confirmar Operação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMissionQR && (
         <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-6" onClick={() => setSelectedMissionQR(null)}>
            <div className="bg-white p-6 border-8 border-amber" onClick={e => e.stopPropagation()}>
               <div className="w-64 h-64 bg-black flex items-center justify-center p-4">
                  <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-0.5 bg-white">
                    {[...Array(100)].map((_, i) => (<div key={i} className={Math.random() > 0.5 ? 'bg-black' : 'bg-white'}></div>))}
                  </div>
               </div>
               <p className="text-black font-black text-center mt-4 font-mono uppercase text-lg">CODE: {operation.missions.find(m => m.id === selectedMissionQR)?.code}</p>
            </div>
         </div>
      )}
    </div>
  );
};
