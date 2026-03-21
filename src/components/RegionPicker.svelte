<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { joinGame } from "../lib/api";
	import { currentPlayer } from "../lib/stores";
	import type { Region, SectorType } from "../lib/types";
	import { SECTOR_COLORS, SECTOR_LABELS, ALL_SECTORS } from "../lib/types";

	export let gameId: string;
	export let regions: Region[] = [];
	export let takenRegions: string[] = [];

	const dispatch = createEventDispatcher();

	let selected: Region | null = null;
	let playerName = "";
	let joining = false;
	let error = "";

	function isAvailable(region: Region): boolean {
		return !takenRegions.includes(region.id);
	}

	async function handleConfirm() {
		if (!selected || !playerName.trim()) return;
		joining = true;
		error = "";
		try {
			const result = await joinGame(gameId, playerName.trim(), selected.id);
			currentPlayer.set({
				id: result.player_id,
				name: playerName.trim(),
				region_id: selected.id,
			});
			window.location.href = `/game/${gameId}`;
		} catch (e: any) {
			error = e.message || "Failed to join";
		}
		joining = false;
	}

	function getMaxStat(region: Region): number {
		return Math.max(...ALL_SECTORS.map(s => region.base_stats[s] || 0), 1);
	}
</script>

<div
	class="overlay"
	on:click|self={() => dispatch("close")}
	on:keydown={e => e.key === "Escape" && dispatch("close")}
	tabindex="0"
  
>
	<div class="modal">
		<div class="modal-header">
			<h2>Choose Your Nation</h2>
			<button class="close-btn" on:click={() => dispatch("close")}
				>&times;</button
			>
		</div>

		<div class="name-input">
			<input
				type="text"
				bind:value={playerName}
				placeholder="Enter your name..."
				maxlength="20"
			/>
		</div>

		<div class="regions-grid">
			{#if regions.length === 0}
				<p class="empty">No regions available</p>
			{/if}
			{#each regions as region (region.id)}
				{@const available = isAvailable(region)}
				<button
					class="region-card card"
					class:selected={selected?.id === region.id}
					class:taken={!available}
					disabled={!available}
					on:click={() => {
						if (available) selected = region;
					}}
				>
					<h3>{region.name}</h3>
					<span class="continent">{region.continent}</span>
					<div class="stats">
						{#each ALL_SECTORS as sector}
							{@const value = region.base_stats[sector] || 0}
							{@const max = getMaxStat(region)}
							<div class="stat-row">
								<span class="stat-label" style="color: {SECTOR_COLORS[sector]}"
									>{SECTOR_LABELS[sector].slice(0, 4)}</span
								>
								<div class="stat-bar">
									<div
										class="stat-fill"
										style="width: {(value / 100) *
											100}%; background: {SECTOR_COLORS[sector]}"
									></div>
								</div>
								<span class="stat-value">{value}</span>
							</div>
						{/each}
					</div>
					{#if !available}
						<div class="taken-overlay">TAKEN</div>
					{/if}
				</button>
			{/each}
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div class="modal-footer">
			<button class="btn-secondary" on:click={() => dispatch("close")}
				>Cancel</button
			>
			<button
				class="btn-primary"
				disabled={!selected || !playerName.trim() || joining}
				on:click={handleConfirm}
			>
				{joining ? "Joining..." : "Confirm & Join"}
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 1.5rem;
		max-width: 750px;
		width: 95%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.modal-header h2 {
		font-size: 1.3rem;
	}

	.close-btn {
		background: none;
		color: var(--text-secondary);
		font-size: 1.5rem;
		padding: 0.25rem 0.5rem;
	}

	.name-input {
		margin-bottom: 1rem;
	}

	.name-input input {
		width: 100%;
	}

	.regions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.region-card {
		text-align: left;
		position: relative;
		padding: 1rem;
		cursor: pointer;
		border: 2px solid var(--border);
		background: var(--bg-card);
		color: var(--text-primary);
		border-radius: 12px;
		width: 100%;
	}

	.region-card:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.region-card.selected {
		border-color: var(--accent);
		background: rgba(99, 102, 241, 0.1);
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
	}

	.region-card.taken {
		opacity: 0.4;
	}

	.region-card h3 {
		font-size: 1rem;
		margin-bottom: 0.1rem;
	}

	.continent {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stats {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.stat-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.7rem;
	}

	.stat-label {
		width: 30px;
		font-weight: 600;
	}

	.stat-bar {
		flex: 1;
		height: 5px;
		background: var(--bg-secondary);
		border-radius: 3px;
		overflow: hidden;
	}

	.stat-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.stat-value {
		width: 20px;
		text-align: right;
		color: var(--text-secondary);
	}

	.taken-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--danger);
		letter-spacing: 0.1em;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.error {
		color: var(--danger);
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}

	.empty {
		color: var(--text-muted);
		grid-column: 1 / -1;
		text-align: center;
		padding: 2rem;
	}
</style>
