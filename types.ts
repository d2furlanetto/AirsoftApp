
import * as React from 'react';

// Centralized fix for JSX intrinsic element errors (div, span, button, etc.)
// We augment the global JSX namespace to ensure all HTML tags are recognized.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

export enum MissionStatus {
  LOCKED = 'LOCKED',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Mission {
  id: string;
  title: string;
  briefing: string;
  points: number;
  isMain: boolean;
  location?: { lat: number; lng: number; label: string };
  code: string; 
  updatedAt: number;
  parentId?: string;
  timerMinutes?: number;
  // Fix: Added status property to Mission to resolve type mismatch in INITIAL_OPERATION
  status?: MissionStatus;
}

export interface MissionProgress {
  status: MissionStatus;
  startedAt?: number;
}

export interface Operator {
  id: string;
  callsign: string;
  rank: string;
  score: number;
  status: 'ONLINE' | 'OFFLINE' | 'KIA';
  deviceId: string; // Vínculo com o hardware do jogador
  lastLat?: number;
  lastLng?: number;
  missionsProgress?: Record<string, MissionProgress>;
}

export interface OperationEvent {
  id: string;
  name: string;
  date: string;
  description: string;
  missions: Mission[];
  mapUrl: string;
  isActive: boolean;
}
