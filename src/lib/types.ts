export type SectorType = 'economics' | 'politics' | 'security' | 'education' | 'randd';
export type GamePhase = 'lobby' | 'playing' | 'finished';

export const SECTOR_COLORS: Record<SectorType, string> = {
  economics: '#f0b429',
  politics: '#e53e3e',
  security: '#3182ce',
  education: '#38a169',
  randd: '#805ad5',
};

export const SECTOR_LABELS: Record<SectorType, string> = {
  economics: 'Economics',
  politics: 'Politics',
  security: 'Security',
  education: 'Education',
  randd: 'R&D',
};

export const ALL_SECTORS: SectorType[] = ['economics', 'politics', 'security', 'education', 'randd'];

export interface Resources {
  budget: number;
  influence: number;
  stability: number;
  knowledge: number;
}

export interface SectorState {
  level: number;
  investment: number;
  growth: number;
}

export interface Player {
  id: string;
  name: string;
  region_id: string;
  resources: Resources;
  ready: boolean;
  connected: boolean;
}

export interface PlayerState {
  player: Player;
  sectors: Record<SectorType, SectorState>;
  score: number;
  turn_actions: Action[];
}

export interface Region {
  id: string;
  name: string;
  country: string;
  continent: string;
  base_stats: Record<SectorType, number>;
  description: string;
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  source: string;
  affected_sectors: SectorType[];
  impact: Record<SectorType, number>;
  duration: number;
  region_specific: string;
}

export interface Game {
  id: string;
  name: string;
  max_players: number;
  players: Record<string, PlayerState>;
  phase: GamePhase;
  current_turn: number;
  max_turns: number;
  events: WorldEvent[];
  active_events: WorldEvent[];
  created_at: string;
  host_id: string;
}

export interface GameListItem {
  id: string;
  name: string;
  phase: GamePhase;
  player_count: number;
  max_players: number;
  max_turns: number;
  current_turn: number;
  created_at: string;
}

export interface Action {
  type: 'allocate' | 'policy' | 'respond_event';
  data: Record<string, unknown>;
}

export interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}

export interface ChatMessage {
  player_id: string;
  player_name: string;
  message: string;
  timestamp: number;
}

/** Local player identity stored in client stores */
export interface LocalPlayer {
  id: string;
  name: string;
  region_id: string;
}
