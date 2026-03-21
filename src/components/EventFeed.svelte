<script lang="ts">
  import type { WorldEvent, SectorType } from '../lib/types';
  import { SECTOR_COLORS, SECTOR_LABELS } from '../lib/types';

  export let events: WorldEvent[] = [];

  const SOURCE_ICONS: Record<string, string> = {
    natural: '~',
    political: '#',
    economic: '$',
    military: '!',
    tech: '>',
    default: '*',
  };

  function getIcon(source: string): string {
    return SOURCE_ICONS[source] || SOURCE_ICONS.default;
  }
</script>

<div class="event-feed card">
  <h4>World Events</h4>
  <div class="events-list">
    {#if events.length === 0}
      <p class="empty">No events yet. The world is quiet... for now.</p>
    {:else}
      {#each events as event (event.id)}
        <div class="event-item fade-in">
          <div class="event-header">
            <span class="event-source-icon">{getIcon(event.source)}</span>
            <span class="event-title">{event.title}</span>
            {#if event.duration > 0}
              <span class="turns-badge">{event.duration}t</span>
            {/if}
          </div>
          <p class="event-desc">{event.description}</p>
          <div class="event-tags">
            {#each event.affected_sectors as sector}
              <span class="sector-tag" style="background: {SECTOR_COLORS[sector]}20; color: {SECTOR_COLORS[sector]}">
                {SECTOR_LABELS[sector]}
                {#if event.impact && event.impact[sector] !== undefined}
                  ({event.impact[sector] > 0 ? '+' : ''}{event.impact[sector]})
                {/if}
              </span>
            {/each}
          </div>
          {#if event.region_specific}
            <p class="region-specific">Region: {event.region_specific}</p>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .event-feed {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 300px;
    overflow: hidden;
  }

  .event-feed h4 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .events-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .event-item {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    border-left: 3px solid var(--accent);
  }

  .event-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.25rem;
  }

  .event-source-icon {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-card);
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
  }

  .event-title {
    font-weight: 600;
    font-size: 0.85rem;
    flex: 1;
  }

  .turns-badge {
    background: var(--bg-card);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .event-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: 0.3rem;
    line-height: 1.4;
  }

  .event-tags {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .region-specific {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    font-style: italic;
  }

  .empty {
    color: var(--text-muted);
    font-size: 0.85rem;
    text-align: center;
    padding: 1.5rem;
    font-style: italic;
  }
</style>
