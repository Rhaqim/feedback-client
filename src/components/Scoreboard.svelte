<script lang="ts">
  import type { PlayerState, SectorType } from '../lib/types';
  import { SECTOR_COLORS, SECTOR_LABELS, ALL_SECTORS } from '../lib/types';

  export let players: PlayerState[] = [];
  export let currentPlayerId: string = '';

  $: sorted = [...players].sort((a, b) => b.score - a.score);
</script>

<div class="scoreboard card">
  <h4>Scoreboard</h4>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th class="rank">#</th>
          <th class="name">Player</th>
          <th class="score">Score</th>
          {#each ALL_SECTORS as sector}
            <th class="sector" style="color: {SECTOR_COLORS[sector]}">{SECTOR_LABELS[sector].slice(0, 3)}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sorted as ps, i (ps.player.id)}
          <tr class:current={ps.player.id === currentPlayerId} class:winner={ps.score >= 400}>
            <td class="rank">{i + 1}</td>
            <td class="name">
              <span class="player-name">{ps.player.name}</span>
              <span class="player-region">{ps.player.region_id}</span>
            </td>
            <td class="score">{ps.score}</td>
            {#each ALL_SECTORS as sector}
              <td class="sector">{ps.sectors[sector]?.level || 0}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if players.length === 0}
    <p class="empty">Waiting for players...</p>
  {/if}
</div>

<style>
  .scoreboard {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .scoreboard h4 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  th {
    text-align: left;
    padding: 0.4rem 0.3rem;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 0.5rem 0.3rem;
    border-bottom: 1px solid rgba(42, 42, 90, 0.5);
  }

  th.rank, td.rank {
    width: 30px;
    text-align: center;
  }

  th.score, td.score {
    font-weight: 700;
    text-align: center;
    width: 50px;
  }

  th.sector, td.sector {
    text-align: center;
    width: 40px;
    font-variant-numeric: tabular-nums;
  }

  .player-name {
    display: block;
    font-weight: 600;
  }

  .player-region {
    display: block;
    font-size: 0.65rem;
    color: var(--text-muted);
  }

  tr.current {
    background: rgba(99, 102, 241, 0.08);
  }

  tr.current td {
    border-bottom-color: rgba(99, 102, 241, 0.2);
  }

  tr.winner .score {
    color: var(--warning);
  }

  .empty {
    color: var(--text-muted);
    text-align: center;
    font-size: 0.85rem;
    padding: 1rem;
  }
</style>
