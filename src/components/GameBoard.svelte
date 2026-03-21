<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ws } from '../lib/websocket';
  import { getGame, startGame } from '../lib/api';
  import { gameState, currentPlayer, events, chatMessages, connectionStatus } from '../lib/stores';
  import type { Game, PlayerState, WorldEvent, ChatMessage, Action, LocalPlayer } from '../lib/types';
  import Dashboard from './Dashboard.svelte';
  import WorldMap from './WorldMap.svelte';
  import EventFeed from './EventFeed.svelte';
  import ActionPanel from './ActionPanel.svelte';
  import Scoreboard from './Scoreboard.svelte';
  import Chat from './Chat.svelte';

  export let gameId: string | undefined = '';

  let game: Game | null = null;
  let localPlayer: LocalPlayer | null = null;
  let worldEvents: WorldEvent[] = [];
  let messages: ChatMessage[] = [];
  let connStatus = 'disconnected';
  let error = '';
  let gameOver = false;
  let winnerName = '';
  let winnerRegion = '';
  let winnerScore = 0;
  let actionsSubmitted = false;
  let waitingForOthers = false;

  gameState.subscribe((v) => (game = v));
  currentPlayer.subscribe((v) => (localPlayer = v));
  events.subscribe((v) => (worldEvents = v));
  chatMessages.subscribe((v) => (messages = v));
  connectionStatus.subscribe((v) => (connStatus = v));

  /** Get current player's PlayerState from the game map */
  $: myPlayerState = (game && localPlayer) ? game.players[localPlayer.id] ?? null : null;

  /** Convert players map to array for child components */
  $: playersArray = game ? Object.values(game.players) : [];

  /** Check if current player is the host */
  $: isHost = !!(game && localPlayer && game.host_id === localPlayer.id);

  /** Player count */
  $: playerCount = game ? Object.keys(game.players).length : 0;

  onMount(async () => {
    // Load initial game state
    try {
      if (gameId) {
        const g = await getGame(gameId);
        gameState.set(g);
      }
    } catch (e: any) {
      error = e.message;
    }

    // Connect WebSocket
    ws.onStatusChange((s) => connectionStatus.set(s));
    ws.connect();

    // Join game via WS (only game_id and player_id needed)
    if (localPlayer && gameId) {
      ws.send('join_game', {
        game_id: gameId,
        player_id: localPlayer.id,
      });
    }

    // Handle WS messages
    ws.on('game_state', handleGameState);
    ws.on('event', handleEvent);
    ws.on('turn_result', handleTurnResult);
    ws.on('player_joined', handlePlayerJoined);
    ws.on('player_left', handlePlayerLeft);
    ws.on('game_over', handleGameOver);
    ws.on('chat', handleChat);
    ws.on('action_ack', handleActionAck);
    ws.on('ready_ack', handleReadyAck);
    ws.on('error', handleError);
  });

  onDestroy(() => {
    ws.off('game_state', handleGameState);
    ws.off('event', handleEvent);
    ws.off('turn_result', handleTurnResult);
    ws.off('player_joined', handlePlayerJoined);
    ws.off('player_left', handlePlayerLeft);
    ws.off('game_over', handleGameOver);
    ws.off('chat', handleChat);
    ws.off('action_ack', handleActionAck);
    ws.off('ready_ack', handleReadyAck);
    ws.off('error', handleError);
    ws.disconnect();
  });

  function handleGameState(payload: Record<string, unknown>) {
    const g = payload as unknown as Game;
    gameState.set(g);
    // New turn arrived — reset per-turn UI state
    actionsSubmitted = false;
    waitingForOthers = false;
  }

  function handleEvent(payload: Record<string, unknown>) {
    const ev = payload as unknown as WorldEvent;
    events.update((e) => [ev, ...e]);
  }

  function handleTurnResult(_payload: Record<string, unknown>) {
    // Turn processed — game_state follows immediately after, which resets flags
  }

  function handlePlayerJoined(_payload: Record<string, unknown>) {
    if (gameId) getGame(gameId).then((g) => gameState.set(g));
  }

  function handlePlayerLeft(_payload: Record<string, unknown>) {
    if (gameId) getGame(gameId).then((g) => gameState.set(g));
  }

  function handleActionAck(_payload: Record<string, unknown>) {
    actionsSubmitted = true;
  }

  function handleReadyAck(_payload: Record<string, unknown>) {
    waitingForOthers = true;
  }

  function handleGameOver(payload: Record<string, unknown>) {
    gameOver = true;
    winnerName = (payload.winner_name as string) || 'Unknown';
    winnerRegion = (payload.winner_region as string) || '';
    winnerScore = (payload.score as number) || 0;
  }

  function handleChat(payload: Record<string, unknown>) {
    const msg: ChatMessage = {
      player_id: payload.player_id as string,
      player_name: payload.player_name as string,
      message: payload.message as string,
      timestamp: payload.timestamp as number,
    };
    chatMessages.update((m) => [...m, msg]);
  }

  function handleError(payload: Record<string, unknown>) {
    error = (payload.message as string) || 'Unknown error';
  }

  function handleSubmitActions(e: CustomEvent<Action[]>) {
    if (!localPlayer || !gameId) return;
    // Send each action directly as { type, data } -- no game_id/player_id wrapping
    for (const action of e.detail) {
      ws.send('player_action', {
        type: action.type,
        data: action.data,
      });
    }
  }

  function handleReady() {
    if (!localPlayer || !gameId) return;
    // Empty payload -- server knows who we are from connection
    ws.send('ready', {});
  }

  function handleSendChat(e: CustomEvent<string>) {
    if (!localPlayer || !gameId) return;
    // Only message needed -- server knows who we are
    ws.send('chat', {
      message: e.detail,
    });
    // Add own message immediately
    chatMessages.update((m) => [
      ...m,
      { player_id: localPlayer!.id, player_name: localPlayer!.name, message: e.detail, timestamp: Date.now() },
    ]);
  }

  async function handleStartGame() {
    if (!localPlayer || !gameId) return;
    try {
      const result = await startGame(gameId, localPlayer.id);
      // Update state directly from REST response — don't rely solely on WS broadcast
      gameState.set(result.game);
    } catch (e: any) {
      error = e.message;
    }
  }
</script>

<div class="game-board">
  <!-- Top Bar -->
  <header class="top-bar">
    <div class="top-left">
      <a href="/" class="back-link">&larr; Lobby</a>
      <h1 class="game-title">{game?.name || 'Loading...'}</h1>
    </div>
    <div class="top-center">
      <div class="turn-info">
        <span class="turn-label">Turn</span>
        <span class="turn-value">{game?.current_turn || 0}</span>
        {#if game?.max_turns}
          <span class="turn-max">/ {game.max_turns}</span>
        {/if}
      </div>
      <div class="phase-badge">
        {game?.phase || '...'}
      </div>
    </div>
    <div class="top-right">
      <span class="conn-status" class:connected={connStatus === 'connected'} class:disconnected={connStatus === 'disconnected'}>
        {connStatus}
      </span>
    </div>
  </header>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  {#if gameOver}
    <div class="game-over-overlay">
      <div class="game-over-card card">
        <h2>Game Over</h2>
        <p class="winner-text">Winner: <strong>{winnerName}</strong></p>
        {#if winnerRegion}
          <p class="winner-region">Region: {winnerRegion}</p>
        {/if}
        <p class="winner-score">Score: {winnerScore}</p>
        <a href="/" class="btn-primary">Back to Lobby</a>
      </div>
    </div>
  {/if}

  {#if game?.phase === 'lobby'}
    <div class="lobby-waiting">
      <div class="waiting-card card">
        <h2>Waiting for Players</h2>
        <p class="player-count-info">{playerCount} / {game.max_players} players</p>
        <div class="players-list">
          {#each playersArray as ps}
            <div class="player-chip">
              <span class="player-dot" class:connected={ps.player.connected}></span>
              {ps.player.name} - {ps.player.region_id}
            </div>
          {/each}
        </div>
        {#if isHost && playerCount >= 2}
          <button class="btn-primary start-btn" on:click={handleStartGame}>Start Game</button>
        {:else if !isHost && playerCount >= 2}
          <p class="hint">Waiting for host to start the game</p>
        {:else}
          <p class="hint">Need at least 2 players to start</p>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Main Game Layout -->
    <div class="game-layout">
      <aside class="left-panel">
        <Dashboard playerState={myPlayerState} />
      </aside>

      <main class="center-panel">
        <WorldMap players={playersArray} activeEvents={game?.active_events || []} />
        <EventFeed events={worldEvents} />
      </main>

      <aside class="right-panel">
        <Scoreboard players={playersArray} currentPlayerId={localPlayer?.id || ''} />
      </aside>
    </div>

    <footer class="bottom-panel">
      {#if waitingForOthers}
        <div class="turn-status card">
          <p class="waiting-text">Waiting for other players to finish their turn...</p>
          <div class="ready-status">
            {#each playersArray as ps}
              <span class="ready-chip" class:is-ready={ps.player.ready}>
                {ps.player.name}: {ps.player.ready ? 'Ready' : 'Deciding...'}
              </span>
            {/each}
          </div>
        </div>
      {:else}
        {#if actionsSubmitted}
          <div class="actions-submitted-hint">Actions submitted — click Ready when done</div>
        {/if}
        <ActionPanel playerState={myPlayerState} disabled={waitingForOthers} on:submit={handleSubmitActions} on:ready={handleReady} />
      {/if}
    </footer>
  {/if}

  <Chat messages={messages} currentPlayerId={localPlayer?.id || ''} on:send={handleSendChat} />
</div>

<style>
  .game-board {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1.25rem;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    gap: 1rem;
  }

  .top-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    background: var(--bg-card);
    transition: color 0.2s;
  }

  .back-link:hover {
    color: var(--text-primary);
  }

  .game-title {
    font-size: 1.1rem;
  }

  .top-center {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .turn-info {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
  }

  .turn-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .turn-value {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--accent);
  }

  .turn-max {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .phase-badge {
    background: var(--bg-card);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  .conn-status {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .conn-status::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-muted);
  }

  .conn-status.connected {
    color: var(--success);
  }
  .conn-status.connected::before {
    background: var(--success);
  }

  .conn-status.disconnected {
    color: var(--danger);
  }
  .conn-status.disconnected::before {
    background: var(--danger);
  }

  .error-banner {
    background: rgba(229, 62, 62, 0.1);
    border-bottom: 1px solid rgba(229, 62, 62, 0.3);
    color: var(--danger);
    padding: 0.5rem 1.25rem;
    font-size: 0.85rem;
    text-align: center;
  }

  .game-over-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .game-over-card {
    text-align: center;
    padding: 3rem;
  }

  .game-over-card h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--warning);
  }

  .winner-text {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }

  .winner-region {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  .winner-score {
    font-size: 1.1rem;
    color: var(--accent);
    font-weight: 700;
    margin-bottom: 2rem;
  }

  .lobby-waiting {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .waiting-card {
    text-align: center;
    max-width: 400px;
    width: 100%;
    padding: 2rem;
  }

  .waiting-card h2 {
    margin-bottom: 0.5rem;
  }

  .player-count-info {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .players-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .player-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg-secondary);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .player-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-muted);
  }

  .player-dot.connected {
    background: var(--success);
  }

  .start-btn {
    padding: 0.75rem 2rem;
    font-size: 1rem;
  }

  .hint {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .game-layout {
    flex: 1;
    display: grid;
    grid-template-columns: 260px 1fr 260px;
    gap: 1rem;
    padding: 1rem;
    min-height: 0;
  }

  .left-panel, .right-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }

  .center-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }

  .bottom-panel {
    padding: 0 1rem 1rem;
  }

  .turn-status {
    text-align: center;
    padding: 1.25rem;
  }

  .waiting-text {
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
  }

  .ready-status {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .ready-chip {
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    background: var(--bg-secondary);
    color: var(--text-muted);
  }

  .ready-chip.is-ready {
    background: rgba(56, 161, 105, 0.15);
    color: var(--success);
  }

  .actions-submitted-hint {
    text-align: center;
    color: var(--success);
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 1024px) {
    .game-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
