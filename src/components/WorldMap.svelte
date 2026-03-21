<script lang="ts">
  import type { PlayerState, WorldEvent, SectorType } from '../lib/types';
  import { SECTOR_COLORS } from '../lib/types';

  export let players: PlayerState[] = [];
  export let activeEvents: WorldEvent[] = [];

  const REGION_POSITIONS = [
    { x: 15, y: 25 },
    { x: 55, y: 20 },
    { x: 85, y: 30 },
    { x: 25, y: 65 },
    { x: 60, y: 60 },
    { x: 80, y: 70 },
  ];

  const PLAYER_COLORS = ['#6366f1', '#f0b429', '#e53e3e', '#38a169', '#3182ce', '#805ad5'];

  $: hasActiveEvent = activeEvents.length > 0;
  $: latestEvent = activeEvents.length > 0 ? activeEvents[0] : null;
</script>

<div class="world-map card">
  <h4>World Map</h4>
  <div class="map-container">
    <svg viewBox="0 0 100 100" class="map-svg">
      <!-- Grid background -->
      {#each Array(10) as _, i}
        <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="var(--border)" stroke-width="0.2" opacity="0.3" />
        <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="var(--border)" stroke-width="0.2" opacity="0.3" />
      {/each}

      <!-- Connection lines between regions -->
      {#each players as ps, i}
        {#each players.slice(i + 1) as ps2, j}
          {@const pos1 = REGION_POSITIONS[i] || { x: 50, y: 50 }}
          {@const pos2 = REGION_POSITIONS[i + j + 1] || { x: 50, y: 50 }}
          <line
            x1={pos1.x} y1={pos1.y}
            x2={pos2.x} y2={pos2.y}
            stroke="var(--border)" stroke-width="0.3" opacity="0.4"
            stroke-dasharray="1,1"
          />
        {/each}
      {/each}

      <!-- Player region nodes -->
      {#each players as ps, i}
        {@const pos = REGION_POSITIONS[i] || { x: 50, y: 50 }}
        {@const color = PLAYER_COLORS[i]}

        <!-- Pulse ring for active events -->
        {#if hasActiveEvent}
          <circle cx={pos.x} cy={pos.y} r="8" fill="none" stroke={color} stroke-width="0.4" opacity="0.5">
            <animate attributeName="r" from="6" to="12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        {/if}

        <circle cx={pos.x} cy={pos.y} r="5" fill={color} opacity="0.2" />
        <circle cx={pos.x} cy={pos.y} r="3" fill={color} opacity="0.8" />

        <text x={pos.x} y={pos.y - 6} text-anchor="middle" fill="var(--text-primary)" font-size="2.5" font-weight="700">
          {ps.player.name}
        </text>
        <text x={pos.x} y={pos.y + 8} text-anchor="middle" fill="var(--text-secondary)" font-size="1.8">
          {ps.player.region_id}
        </text>
        <text x={pos.x} y={pos.y + 1} text-anchor="middle" fill="white" font-size="2" font-weight="700">
          {ps.score}
        </text>
      {/each}
    </svg>
  </div>

  {#if latestEvent}
    <div class="event-banner">
      <span class="event-icon">!</span>
      <span class="event-title">{latestEvent.title}</span>
      <div class="event-sectors">
        {#each latestEvent.affected_sectors as sector}
          <span class="sector-tag" style="background: {SECTOR_COLORS[sector]}20; color: {SECTOR_COLORS[sector]}">
            {sector}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .world-map {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .world-map h4 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .map-container {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 0.5rem;
    aspect-ratio: 16/10;
  }

  .map-svg {
    width: 100%;
    height: 100%;
  }

  .event-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(240, 180, 41, 0.1);
    border: 1px solid rgba(240, 180, 41, 0.3);
    border-radius: 8px;
    font-size: 0.8rem;
    flex-wrap: wrap;
  }

  .event-icon {
    background: var(--warning);
    color: black;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  .event-title {
    font-weight: 600;
    flex: 1;
  }

  .event-sectors {
    display: flex;
    gap: 0.3rem;
  }
</style>
