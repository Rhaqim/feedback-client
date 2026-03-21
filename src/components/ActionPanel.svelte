<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PlayerState, SectorType } from '../lib/types';
  import { SECTOR_COLORS, SECTOR_LABELS, ALL_SECTORS } from '../lib/types';

  export let playerState: PlayerState | null = null;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let allocations: Record<SectorType, number> = {
    economics: 0,
    politics: 0,
    security: 0,
    education: 0,
    randd: 0,
  };

  $: totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  $: availableBudget = playerState?.player.resources.budget || 0;
  $: remaining = availableBudget - totalAllocated;
  $: overBudget = totalAllocated > availableBudget;

  function clampAllocation(sector: SectorType) {
    if (allocations[sector] < 0) allocations[sector] = 0;
    const maxForSector = remaining + allocations[sector];
    if (allocations[sector] > maxForSector) {
      allocations[sector] = Math.max(0, maxForSector);
    }
  }

  function submitActions() {
    if (overBudget || disabled) return;
    const actions = ALL_SECTORS
      .filter((s) => allocations[s] > 0)
      .map((s) => ({ type: 'allocate' as const, data: { sector: s, amount: allocations[s] } }));
    dispatch('submit', actions);
  }

  function readyUp() {
    dispatch('ready');
  }

  function resetAllocations() {
    allocations = { economics: 0, politics: 0, security: 0, education: 0, randd: 0 };
  }
</script>

<div class="action-panel card">
  <div class="panel-header">
    <h4>Allocate Resources</h4>
    <div class="budget-info" class:over={overBudget}>
      <span class="budget-label">Budget:</span>
      <span class="budget-remaining">{remaining}</span>
      <span class="budget-total">/ {availableBudget}</span>
    </div>
  </div>

  <div class="allocations">
    {#each ALL_SECTORS as sector}
      <div class="alloc-row">
        <span class="alloc-label" style="color: {SECTOR_COLORS[sector]}">
          {SECTOR_LABELS[sector]}
        </span>
        <input
          type="range"
          min="0"
          max={availableBudget}
          bind:value={allocations[sector]}
          on:change={() => clampAllocation(sector)}
          disabled={disabled}
          class="alloc-slider"
          style="--sector-color: {SECTOR_COLORS[sector]}"
        />
        <input
          type="number"
          min="0"
          max={availableBudget}
          bind:value={allocations[sector]}
          on:change={() => clampAllocation(sector)}
          disabled={disabled}
          class="alloc-input"
        />
      </div>
    {/each}
  </div>

  <div class="panel-actions">
    <button class="btn-secondary" on:click={resetAllocations} disabled={disabled}>Reset</button>
    <button class="btn-primary" on:click={submitActions} disabled={disabled || overBudget || totalAllocated === 0}>
      Submit Actions
    </button>
    <button class="btn-success" on:click={readyUp} disabled={disabled}>
      Ready
    </button>
  </div>
</div>

<style>
  .action-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-header h4 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .budget-info {
    font-size: 0.85rem;
    font-weight: 600;
  }

  .budget-info.over {
    color: var(--danger);
  }

  .budget-label {
    color: var(--text-secondary);
    margin-right: 0.3rem;
  }

  .budget-remaining {
    color: var(--accent);
    font-size: 1.1rem;
  }

  .budget-total {
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .allocations {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .alloc-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .alloc-label {
    width: 80px;
    font-size: 0.8rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .alloc-slider {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--bg-secondary);
    border-radius: 3px;
    outline: none;
  }

  .alloc-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--sector-color);
    cursor: pointer;
    border: 2px solid var(--bg-card);
  }

  .alloc-input {
    width: 60px;
    text-align: center;
    padding: 0.3rem;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .panel-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
