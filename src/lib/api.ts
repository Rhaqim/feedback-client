import type { Game, GameListItem, Region } from './types';

const BASE_URL = 'http://localhost:8080';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

/** POST /api/games -- Create game (no player, just the game) */
export async function createGame(
  name: string,
  max_players: number,
  max_turns: number = 30
): Promise<{ game_id: string; game: Game }> {
  return request<{ game_id: string; game: Game }>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ name, max_players, max_turns }),
  });
}

/** GET /api/games -- List games (unwraps { games: [...] }) */
export async function listGames(): Promise<GameListItem[]> {
  const data = await request<{ games: GameListItem[] }>('/api/games');
  return data.games;
}

/** GET /api/games/:id -- Get game (returns Game directly) */
export async function getGame(id: string): Promise<Game> {
  return request<Game>(`/api/games/${id}`);
}

/** POST /api/games/:id/join -- Join game */
export async function joinGame(
  gameId: string,
  player_name: string,
  region_id: string
): Promise<{ game_id: string; player_id: string; game: Game }> {
  return request<{ game_id: string; player_id: string; game: Game }>(`/api/games/${gameId}/join`, {
    method: 'POST',
    body: JSON.stringify({ player_name, region_id }),
  });
}

/** POST /api/games/:id/start -- Start game (host only) */
export async function startGame(
  gameId: string,
  player_id: string
): Promise<{ status: string; game: Game }> {
  return request<{ status: string; game: Game }>(`/api/games/${gameId}/start`, {
    method: 'POST',
    body: JSON.stringify({ player_id }),
  });
}

/** GET /api/regions -- List regions (unwraps { regions: [...] }) */
export async function listRegions(): Promise<Region[]> {
  const data = await request<{ regions: Region[] }>('/api/regions');
  return data.regions;
}
