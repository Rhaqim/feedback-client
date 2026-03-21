<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { listGames, createGame, listRegions, getGame } from '../lib/api';
  import { availableGames } from '../lib/stores';
  import type { GameListItem, Region } from '../lib/types';
  import RegionPicker from './RegionPicker.svelte';

  let games: GameListItem[] = [];
  let gameName = '';
  let maxPlayers = 4;
  let creating = false;
  let error = '';
  let showRegionPicker = false;
  let selectedGameId = '';
  let regions: Region[] = [];
  let takenRegions: string[] = [];
  let pollTimer: ReturnType<typeof setInterval>;

  availableGames.subscribe((v) => (games = v));

  async function loadGames() {
    try {
      const result = await listGames();
      availableGames.set(result);
    } catch {
      // backend not available yet
    }
  }

  async function loadRegions() {
    try {
      regions = await listRegions();
    } catch {
      // fallback
    }
  }

  onMount(() => {
    loadGames();
    loadRegions();
    pollTimer = setInterval(loadGames, 5000);
  });

  onDestroy(() => {
    clearInterval(pollTimer);
  });

  async function handleCreate() {
    if (!gameName.trim()) return;
    creating = true;
    error = '';
    try {
      const result = await createGame(gameName.trim(), maxPlayers);
      gameName = '';
      selectedGameId = result.game_id;
      // No regions are taken yet since game was just created
      takenRegions = [];
      showRegionPicker = true;
      await loadGames();
    } catch (e: any) {
      error = e.message || 'Failed to create game';
    }
    creating = false;
  }

  async function handleJoin(gameId: string) {
    selectedGameId = gameId;
    // Fetch taken regions from current game state
    try {
      const game = await getGame(gameId);
      takenRegions = Object.values(game.players).map((ps) => ps.player.region_id);
    } catch {
      takenRegions = [];
    }
    showRegionPicker = true;
  }

  function handleRegionPickerClose() {
    showRegionPicker = false;
    selectedGameId = '';
    takenRegions = [];
  }
</script>

<div class="lobby">
  <header class="lobby-header">
    <h1 class="title">
      <span class="title-world">WORLD</span><span class="title-game">GAME</span>
    </h1>
    <p class="tagline">Lead your nation to dominance through strategy, diplomacy, and innovation</p>
  </header>

  <div class="lobby-content">
    <section class="create-section card">
      <h2>Create a Game</h2>
      <form on:submit|preventDefault={handleCreate} class="create-form">
        <div class="form-row">
          <input
            type="text"
            bind:value={gameName}
            placeholder="Game name..."
            maxlength="40"
          />
          <select bind:value={maxPlayers}>
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
            <option value={5}>5 Players</option>
            <option value={6}>6 Players</option>
          </select>
          <button type="submit" class="btn-primary" disabled={!gameName.trim()}>
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>
        {#if error}
          <p class="error">{error}</p>
        {/if}
      </form>
    </section>

    <section class="games-section">
      <h2>Open Games</h2>
      {#if games.length === 0}
        <div class="empty-state card">
          <p>No games available. Create one to get started!</p>
        </div>
      {:else}
        <div class="games-grid">
          {#each games as game (game.id)}
            <div class="game-card card fade-in">
              <div class="game-info">
                <h3>{game.name}</h3>
                <div class="game-meta">
                  <span class="player-count">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {game.player_count}/{game.max_players}
                  </span>
                  <span class="status-badge" class:open={game.phase === 'lobby'} class:playing={game.phase === 'playing'}>
                    {game.phase === 'lobby' ? 'Open' : game.phase === 'playing' ? 'In Progress' : 'Finished'}
                  </span>
                </div>
              </div>
              <button
                class="btn-primary"
                disabled={game.phase !== 'lobby' || game.player_count >= game.max_players}
                on:click={() => handleJoin(game.id)}
              >
                Join
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>

  <footer class="lobby-footer">
    <p>5 sectors. Infinite strategies. One winner.</p>
    <div class="sector-dots">
      <span class="dot" style="background: var(--economics)" title="Economics"></span>
      <span class="dot" style="background: var(--politics)" title="Politics"></span>
      <span class="dot" style="background: var(--security)" title="Security"></span>
      <span class="dot" style="background: var(--education)" title="Education"></span>
      <span class="dot" style="background: var(--randd)" title="R&D"></span>
    </div>
  </footer>
</div>

{#if showRegionPicker}
  <RegionPicker
    gameId={selectedGameId}
    {regions}
    {takenRegions}
    on:close={handleRegionPickerClose}
  />
{/if}

<style>
  .lobby {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .lobby-header {
    text-align: center;
    padding: 3rem 0 2rem;
  }

  .title {
    font-size: 3.5rem;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }

  .title-world {
    color: var(--text-primary);
  }

  .title-game {
    color: var(--accent);
  }

  .tagline {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }

  .lobby-content {
    flex: 1;
  }

  .create-section {
    margin-bottom: 2rem;
  }

  .create-section h2 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .create-form .form-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .create-form input {
    flex: 1;
  }

  .error {
    color: var(--danger);
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .games-section h2 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .games-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .game-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .game-info h3 {
    font-size: 1.1rem;
    margin-bottom: 0.3rem;
  }

  .game-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .player-count {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .status-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.open {
    background: rgba(56, 161, 105, 0.15);
    color: var(--success);
  }

  .status-badge.playing {
    background: rgba(240, 180, 41, 0.15);
    color: var(--warning);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-muted);
  }

  .lobby-footer {
    text-align: center;
    padding: 3rem 0 1rem;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .sector-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
</style>
