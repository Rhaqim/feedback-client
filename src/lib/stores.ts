import { writable } from 'svelte/store';
import type { LocalPlayer, Game, WorldEvent, ChatMessage, GameListItem } from './types';

/**
 * Create a writable store that syncs with sessionStorage so it
 * survives full-page navigations (Astro is an MPA).
 */
function persistedStore<T>(key: string, initial: T) {
  const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
  const value = stored ? (JSON.parse(stored) as T) : initial;
  const store = writable<T>(value);
  store.subscribe((v) => {
    if (typeof sessionStorage !== 'undefined') {
      if (v === null || v === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(v));
      }
    }
  });
  return store;
}

/** Local player identity (id, name, region_id) -- persisted across page navigation */
export const currentPlayer = persistedStore<LocalPlayer | null>('wg_player', null);

/** Full game state from server */
export const gameState = writable<Game | null>(null);

/** World events feed */
export const events = writable<WorldEvent[]>([]);

/** Chat messages */
export const chatMessages = writable<ChatMessage[]>([]);

/** WebSocket connection status */
export const connectionStatus = writable<string>('disconnected');

/** List of available games for lobby */
export const availableGames = writable<GameListItem[]>([]);
