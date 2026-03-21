<script lang="ts">
  import type { PlayerState, SectorType } from '../lib/types';
  import { SECTOR_COLORS, SECTOR_LABELS, ALL_SECTORS } from '../lib/types';

  export let playerState: PlayerState | null = null;

  const RESOURCE_ICONS: Record<string, string> = {
    budget: '$',
    influence: '*',
    stability: '~',
    knowledge: '?',
  };
</script>

<div class="dashboard card">
  {#if playerState}
    <div class="player-info">
      <h3 class="player-name">{playerState.player.name}</h3>
      <span class="region-name">{playerState.player.region_id}</span>
    </div>

    <div class="score-display">
      <span class="score-label">SCORE</span>
      <span class="score-value">{playerState.score}</span>
      <span class="score-max">/ 500</span>
    </div>

    <div class="resources">
      <h4>Resources</h4>
      {#each Object.entries(playerState.player.resources) as [key, value]}
        <div class="resource-row">
          <span class="resource-icon">{RESOURCE_ICONS[key] || '>'}</span>
          <span class="resource-name">{key}</span>
          <span class="resource-value">{value}</span>
        </div>
      {/each}
    </div>

    <div class="sectors">
      <h4>Sectors</h4>
      {#each ALL_SECTORS as sector}
        {@const state = playerState.sectors[sector]}
        {@const level = state?.level || 0}
        <div class="sector-row">
          <div class="sector-header">
            <span class="sector-name" style="color: {SECTOR_COLORS[sector]}">{SECTOR_LABELS[sector]}</span>
            <span class="sector-level">{level}</span>
          </div>
          <div class="progress-bar">
            <div class="fill" style="width: {(level / 100) * 100}%; background: {SECTOR_COLORS[sector]}"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="empty">No player data</p>
  {/if}
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .player-info {
    display: flex;
    flex-direction: column;
  }

  .player-name {
    font-size: 1.1rem;
  }

  .region-name {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .score-display {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 0.75rem;
    text-align: center;
  }

  .score-label {
    display: block;
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.2rem;
  }

  .score-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--accent);
  }

  .score-max {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .resources h4,
  .sectors h4 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }

  .resource-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0;
    font-size: 0.85rem;
  }

  .resource-icon {
    width: 20px;
    text-align: center;
    color: var(--text-muted);
    font-weight: 700;
  }

  .resource-name {
    flex: 1;
    text-transform: capitalize;
    color: var(--text-secondary);
  }

  .resource-value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .sector-row {
    margin-bottom: 0.5rem;
  }

  .sector-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.2rem;
  }

  .sector-name {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .sector-level {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: 1rem;
  }
</style>
