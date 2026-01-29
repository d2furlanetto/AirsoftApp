
import React from 'react';
import { Header } from './components/Header';
import { OperatorDashboard } from './views/OperatorDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { Shield, Users, Activity, LogOut, X, Loader2, AlertTriangle, MonitorX } from 'lucide-react';
import { INITIAL_OPERATION, getRankByScore } from './constants';
import { OperationEvent, MissionStatus, Operator, Mission, MissionProgress } from './types';
import { TacticalButton } from './components/TacticalButton';
import { db, auth } from './firebase';
import * as authModule from "firebase/auth";
import * as firestoreModule from "firebase/firestore";

const { signInAnonymously } = authModule as any;
const { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  getDoc,
  deleteDoc,
  writeBatch
} = firestoreModule as any;

const BATCH_LIMIT = 500;

// Gera ou recupera um ID único para este dispositivo/navegador
const getDeviceId = () => {
  let id = localStorage.getItem('COMANDOS_DEVICE_ID');
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem('COMANDOS_DEVICE_ID', id);
  }
  return id;
};

const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
};

const App: React.FC = () => {
  const [view, setView] = React.useState<'operator' | 'admin' | 'auth'>('auth');
  const [userInput, setUserInput] = React.useState('');
  const [callsign, setCallsign] = React.useState('');
  const [operation, setOperation] = React.useState<OperationEvent>(INITIAL_OPERATION);
  const [ranking, setRanking] = React.useState<Operator[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(true);
  const [initError, setInitError] = React.useState<string | null>(null);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);

  const currentOperator = ranking.find(op => op.id === callsign);
  const deviceId = getDeviceId();

  /**
   * MONITOR DE SESSÃO TÁTICA
   * Se o operador sumir do ranking (RESET), força o logout.
   */
  React.useEffect(() => {
    if (view === 'operator' && callsign && !isSyncing) {
      const stillExists = ranking.some(op => op.id === callsign);
      if (!stillExists) {
        setCallsign('');
        setUserInput('');
        setView('auth');
      }
    }
  }, [ranking, view, callsign, isSyncing]);

  React.useEffect(() => {
    let unsubOp = () => {};
    let unsubRanking = () => {};

    const setupSync = async () => {
      try {
        setIsSyncing(true);
        await signInAnonymously(auth);
        
        unsubOp = onSnapshot(doc(db, "operations", "op-001"), (docSnap: any) => {
          if (docSnap.exists()) {
            setOperation(docSnap.data() as OperationEvent);
          } else {
            setDoc(doc(db, "operations", "op-001"), cleanData(INITIAL_OPERATION));
          }
          setIsSyncing(false);
        }, (err: any) => {
          console.error("Firestore Op Error:", err);
          setInitError("ACESSO NEGADO: Verifique as Rules do Firestore.");
          setIsSyncing(false);
        });

        unsubRanking = onSnapshot(collection(db, "ranking"), (snap: any) => {
          const ops: Operator[] = [];
          snap.forEach((d: any) => ops.push(d.data() as Operator));
          setRanking(ops);
        }, (err: any) => {
          console.error("Firestore Ranking Error:", err);
        });

      } catch (e) {
        setInitError("Erro de inicialização tática.");
        setIsSyncing(false);
      }
    };

    setupSync();
    return () => { unsubOp(); unsubRanking(); };
  }, []);

  const handleUpdateOperation = async (op: Partial<OperationEvent>) => {
    try {
      await updateDoc(doc(db, "operations", "op-001"), cleanData(op));
    } catch (err) {
      console.error(err);
      alert("FALHA AO ATUALIZAR OPERAÇÃO.");
    }
  };

  /**
   * RESET TÁTICO DE PARTIDA
   * Preserva as missões configuradas pelo admin, mas remove todos os operadores, 
   * zerando pontos e progresso global. Isso libera os callsigns para novos dispositivos.
   */
  const handleResetMatch = async () => {
    const confirmation = window.confirm(
      "PROTOCOLOS DE COMANDO: CONFIRMAR REINICIALIZAÇÃO DA PARTIDA?\n\n" +
      "1. Todos os pontos e progresso dos operadores serão ZERADOS.\n" +
      "2. O VÍNCULO DE APARELHOS será removido.\n" +
      "3. As MISSÕES CRIADAS serão MANTIDAS.\n" +
      "4. Todos os operadores ativos serão DESLOGADOS."
    );

    if (!confirmation) return;

    try {
      setIsSyncing(true);
      
      await updateDoc(doc(db, "operations", "op-001"), {
        isActive: true,
      });
      
      const opsToDelete = [...ranking];
      if (opsToDelete.length > 0) {
        for (let i = 0; i < opsToDelete.length; i += BATCH_LIMIT) {
          const chunk = opsToDelete.slice(i, i + BATCH_LIMIT);
          const batch = writeBatch(db);
          chunk.forEach((op) => {
            if (op?.id) batch.delete(doc(db, "ranking", op.id));
          });
          await batch.commit();
        }
      }
      
      alert("HQ: PARTIDA REINICIADA. CONFIGURAÇÕES DE MISSÃO PRESERVADAS.");
    } catch (err: unknown) {
      console.error("Erro no Reset:", err);
      alert("FALHA CRÍTICA NO RESET DA PARTIDA.");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateOperatorMissionProgress = async (missionId: string, progress: MissionProgress) => {
    if (!callsign) return;
    try {
      const opRef = doc(db, "ranking", callsign);
      const newProgress = {
        ...(currentOperator?.missionsProgress || {}),
        [missionId]: progress
      };
      await updateDoc(opRef, cleanData({ missionsProgress: newProgress }));
    } catch (err) {
      console.error("Erro ao atualizar progresso do operador:", err);
      alert("FALHA AO ATUALIZAR PROGRESSO.");
    }
  };

  const handleStartMission = (id: string) => {
    updateOperatorMissionProgress(id, { status: MissionStatus.IN_PROGRESS, startedAt: Date.now() });
  };

  const handleFailMission = (id: string) => {
    updateOperatorMissionProgress(id, { status: MissionStatus.FAILED });
  };

  const handleCompleteMission = async (id: string) => {
    const mission = operation.missions.find(m => m.id === id);
    if (!mission) return;
    await updateOperatorMissionProgress(id, { status: MissionStatus.COMPLETED });
    
    const opRef = doc(db, "ranking", callsign);
    const snap = await getDoc(opRef);
    if(snap.exists()) {
      const data = snap.data() as Operator;
      const ns = (data.score || 0) + mission.points;
      await updateDoc(opRef, cleanData({ score: ns, rank: getRankByScore(ns) }));
    }
  };

  const handleOperatorLogin = async () => {
    const trimmedInput = userInput.trim().toUpperCase();
    if (!trimmedInput) return;
    setIsSyncing(true);
    setLoginError(null);

    try {
      const opRef = doc(db, "ranking", trimmedInput);
      const opSnap = await getDoc(opRef);
      
      if (!opSnap.exists()) {
        // Novo Operador: Vincula o Callsign a este dispositivo
        await setDoc(opRef, cleanData({ 
          id: trimmedInput, 
          callsign: trimmedInput, 
          rank: getRankByScore(0), 
          score: 0, 
          status: 'ONLINE',
          deviceId: deviceId, // Vínculo de terminal
          missionsProgress: {} 
        }));
      } else {
        const opData = opSnap.data() as Operator;
        
        // Validação de Dispositivo: Verifica se é o mesmo aparelho que registrou o callsign
        if (opData.deviceId && opData.deviceId !== deviceId) {
          setLoginError("TERMINAL BLOQUEADO: CALLSIGN JÁ VINCULADO A OUTRO DISPOSITIVO.");
          setIsSyncing(false);
          return;
        }

        await updateDoc(opRef, { status: 'ONLINE' });
      }
      
      setCallsign(trimmedInput);
      setView('operator');
    } catch (err) {
      alert("ERRO DE CONEXÃO COM HQ.");
    } finally {
      setIsSyncing(false);
    }
  };

  const validateAdminPassword = () => {
    if (adminPassword === 'admin123') { setView('admin'); setShowPasswordModal(false); }
    else { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000); }
  };

  if (isSyncing && view === 'auth') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-amber">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-orbitron text-[10px] tracking-[0.4em] animate-pulse uppercase">Sincronizando Dados...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black text-red-500 text-center space-y-6">
        <div className="p-6 military-border border-red-500/50 bg-red-500/5">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="font-orbitron font-black text-xl mb-4 uppercase">Erro de Protocolo</h2>
          <p className="font-mono text-[11px] leading-relaxed max-w-sm mb-6 uppercase">{initError}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-red-500 text-black font-orbitron font-black py-4 uppercase">Reiniciar</button>
        </div>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-10 relative">
        <div className="text-center space-y-4">
          <Shield className="w-20 h-20 text-amber mx-auto animate-pulse" />
          <h1 className="font-orbitron text-5xl font-black tracking-tighter amber-glow italic uppercase">COMANDOS</h1>
          <p className="text-[10px] opacity-40 uppercase tracking-[0.3em]">Tactical Field Management v4.2</p>
        </div>
        
        <div className="w-full max-w-xs space-y-6">
          <div className="space-y-2">
            <input type="text" value={userInput} onChange={(e) => { setUserInput(e.target.value); setLoginError(null); }} placeholder="CALLSIGN" className={`w-full bg-black/40 military-border p-5 text-center text-amber font-mono text-xl uppercase focus:outline-none transition-all ${loginError ? 'border-red-600 bg-red-950/10' : ''}`} onKeyDown={(e) => e.key === 'Enter' && handleOperatorLogin()}/>
            {loginError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-900/40 text-red-500 text-[9px] font-black uppercase tracking-tight animate-in fade-in slide-in-from-top-2">
                <MonitorX size={14} />
                <span>{loginError}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleOperatorLogin} className="military-border p-6 flex flex-col items-center gap-3 bg-amber/5 hover:bg-amber/10 transition-all">
              <Users size={36} className="text-amber" />
              <span className="font-orbitron font-black text-[10px] tracking-widest uppercase">Operador</span>
            </button>
            <button onClick={() => setShowPasswordModal(true)} className="military-border p-6 flex flex-col items-center gap-3 bg-amber/5 hover:bg-amber/10 transition-all">
              <Activity size={36} className="text-amber" />
              <span className="font-orbitron font-black text-[10px] tracking-widest uppercase">Admin</span>
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-[8px] opacity-20 font-mono uppercase tracking-widest">Device Hash: {deviceId}</p>
          </div>
        </div>

        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div className={`w-full max-w-sm military-border bg-black p-6 space-y-6 ${passwordError ? 'border-red-600 shake' : 'border-amber'}`}>
              <div className="flex justify-between items-start">
                <h3 className="font-orbitron text-amber font-black uppercase tracking-widest">Chave de Acesso</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-amber/40"><X size={20} /></button>
              </div>
              <input type="password" autoFocus value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && validateAdminPassword()} placeholder="SENHA" className="w-full bg-black/60 border border-amber/30 p-4 text-center text-amber font-mono text-xl uppercase focus:outline-none"/>
              <TacticalButton label="AUTENTICAR" onClick={validateAdminPassword} className="w-full py-4" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl bg-black">
      <Header />
      <main className="flex-1 overflow-y-auto">
        {view === 'operator' ? (
          <OperatorDashboard 
            operatorCallsign={callsign} 
            operation={operation} 
            ranking={ranking}
            missionsProgress={currentOperator?.missionsProgress || {}}
            onCompleteMission={handleCompleteMission} 
            onStartMission={handleStartMission} 
            onFailMission={handleFailMission}
          />
        ) : (
          <AdminDashboard 
            operation={operation} ranking={ranking} 
            onUpdateOperation={handleUpdateOperation}
            onResetMatch={handleResetMatch}
            onUpdateScore={(id, delta) => {
               const opRef = doc(db, "ranking", id);
               const data = ranking.find(o => o.id === id);
               if(data) {
                 const ns = Math.max(0, data.score + delta);
                 updateDoc(opRef, cleanData({ score: ns, rank: getRankByScore(ns) }));
               }
            }}
            onRemoveOperator={(id) => deleteDoc(doc(db, "ranking", id))} 
            onSaveMission={(mission) => {
              let newMissions;
              const exists = mission.id ? operation.missions.find(m => m.id === mission.id) : null;
              if (exists) {
                newMissions = operation.missions.map(m => m.id === mission.id ? { ...m, ...mission, updatedAt: Date.now() } : m);
              } else {
                newMissions = [...operation.missions, { ...mission, id: `m-${Date.now()}`, updatedAt: Date.now() } as Mission];
              }
              updateDoc(doc(db, "operations", "op-001"), { missions: cleanData(newMissions) });
            }} 
            onDeleteMission={(id) => {
              const updated = operation.missions.filter(m => m.id !== id && m.parentId !== id);
              updateDoc(doc(db, "operations", "op-001"), { missions: cleanData(updated) });
            }}
          />
        )}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-amber/40 z-50 p-2 max-w-md mx-auto flex justify-between items-center px-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-[8px] font-black uppercase text-amber/60">HQ Conectado</span>
        </div>
        <button 
          onClick={() => {
            setCallsign('');
            setUserInput('');
            setView('auth');
          }} 
          className="flex flex-col items-center gap-1 py-2 text-amber/40 hover:text-red-500 transition-colors"
        >
          <LogOut size={22} />
          <span className="text-[8px] font-black uppercase">Sair</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
