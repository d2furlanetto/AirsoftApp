import { OperationEvent, MissionStatus, Operator } from './types';

export const COLORS = {
  amber: '#ffb000',
  amberDim: 'rgba(255, 176, 0, 0.2)',
  danger: '#ff4444',
  success: '#00ff44',
};

/**
 * Sistema de Progressão Tática (Patentes)
 * Define o rank do operador com base na experiência (pontos) acumulada.
 */
export const getRankByScore = (score: number): string => {
  if (score >= 9600) return 'MAJOR';
  if (score >= 4800) return 'CAPITÃO';
  if (score >= 2400) return 'TENENTE';
  if (score >= 1200) return 'SARGENTO';
  if (score >= 600) return 'CABO';
  if (score >= 300) return 'SOLDADO';
  return 'RECRUTA';
};

export const INITIAL_OPERATION: OperationEvent = {
  id: 'op-001',
  name: 'CHERNOBYL RECOVERY',
  date: '2026-04-19',
  description: 'RECUPERAÇÃO DE ATIVOS EM ZONA HOSTIL.',
  mapUrl: 'https://images.unsplash.com/photo-1526370417036-39e44686985d?auto=format&fit=crop&q=80&w=1200',
  isActive: true,
  missions: [
    {
      id: 'm-01',
      title: 'PERÍMETRO ALPHA',
      briefing: 'Garanta a segurança do setor Leste para a chegada do comboio. Elimine resistência.',
      points: 500,
      isMain: true,
      status: MissionStatus.ACTIVE,
      location: { lat: -23.5505, lng: -46.6333, label: 'SETOR LESTE' },
      code: 'ALPHA-9',
      updatedAt: Date.now()
    },
    {
      id: 'm-02',
      title: 'RECUPERAR INTEL',
      briefing: 'Localize o rádio abandonado na casa em ruínas (Ponto Beta).',
      points: 250,
      isMain: false,
      status: MissionStatus.ACTIVE,
      code: 'BETA-VIX',
      updatedAt: Date.now(),
      parentId: 'm-01'
    },
    {
      id: 'm-03',
      title: 'EXTRAÇÃO SEGURA',
      briefing: 'Prepare a LZ para o helicóptero de extração no Setor Norte.',
      points: 400,
      isMain: true,
      status: MissionStatus.LOCKED,
      code: 'EXIT-7',
      updatedAt: Date.now()
    }
  ]
};

export const MOCK_RANKING: Operator[] = [
  { id: 'opt-01', callsign: 'GHOST', rank: getRankByScore(1250), score: 1250, status: 'ONLINE' },
  { id: 'opt-02', callsign: 'VIPER', rank: getRankByScore(980), score: 980, status: 'ONLINE' },
  { id: 'opt-03', callsign: 'REAPER', rank: getRankByScore(1420), score: 1420, status: 'KIA' }
];