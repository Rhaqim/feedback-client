<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { listGames, createGame, listRegions } from "../lib/api";
	import { availableGames } from "../lib/stores";
	import type { GameListItem, Region, Tag } from "../lib/types";
	import { ALL_TAGS, TAG_COLORS, TAG_LABELS } from "../lib/types";
	import JoinModal from "./JoinModal.svelte";

	let games: GameListItem[] = [];
	let gameName = "";
	let creating = false;
	let error = "";
	let regions: Region[] = [];
	let selectedRegionId = "";
	let selectedTags: Tag[] = [];
	let pollTimer: ReturnType<typeof setInterval>;

	// Join modal state
	let showJoinModal = false;
	let joinGameId = "";
	let joinAfterCreate = false;

	availableGames.subscribe(v => (games = v));

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

	function toggleTag(tag: Tag) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter(t => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	async function handleCreate() {
		if (!gameName.trim() || !selectedRegionId || selectedTags.length === 0)
			return;
		creating = true;
		error = "";
		try {
			const result = await createGame(
				gameName.trim(),
				selectedRegionId,
				selectedTags,
			);
			gameName = "";
			selectedRegionId = "";
			selectedTags = [];
			joinGameId = result.game_id;
			joinAfterCreate = true;
			showJoinModal = true;
			await loadGames();
		} catch (e: any) {
			error = e.message || "Failed to create game";
		}
		creating = false;
	}

	function handleJoin(gameId: string) {
		joinGameId = gameId;
		joinAfterCreate = false;
		showJoinModal = true;
	}

	function handleJoinModalClose() {
		showJoinModal = false;
		joinGameId = "";
		joinAfterCreate = false;
	}

	function getPhaseLabel(phase: string): string {
		switch (phase) {
			case "active":
				return "Active";
			case "evaluating":
				return "Evaluating";
			case "completed":
				return "Completed";
			default:
				return phase;
		}
	}

	function getPhaseClass(phase: string): string {
		switch (phase) {
			case "active":
				return "phase-active";
			case "evaluating":
				return "phase-evaluating";
			case "completed":
				return "phase-completed";
			default:
				return "";
		}
	}
</script>

<div class="lobby">
	<header class="lobby-header">
		<h1 class="title">
			<span class="title-world">WORLD</span><span class="title-game">GAME</span>
		</h1>
		<p class="tagline">
			Solve real-world challenges. Compete with proposals. Win with strategy.
		</p>
	</header>

	<div class="lobby-content">
		<section class="create-section card">
			<h2>Create a Game</h2>
			<form on:submit|preventDefault={handleCreate} class="create-form">
				<div class="form-group">
					<label for="game-name">Game Name</label>
					<input
						id="game-name"
						type="text"
						bind:value={gameName}
						placeholder="Enter game name..."
						maxlength="40"
					/>
				</div>

				<div class="form-group">
					<label for="region-select">Region</label>
					<select id="region-select" bind:value={selectedRegionId}>
						<option value="">Select a region...</option>
						{#each regions as region (region.id)}
							<option value={region.id}
								>{region.name} - {region.country} ({region.continent})</option
							>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label>Tags (select at least 1)</label>
					<div class="tags-row">
						{#each ALL_TAGS as tag}
							<button
								type="button"
								class="tag-toggle"
								class:selected={selectedTags.includes(tag)}
								style="--tag-color: {TAG_COLORS[tag]}"
								on:click={() => toggleTag(tag)}
							>
								{TAG_LABELS[tag]}
							</button>
						{/each}
					</div>
				</div>

				<button
					type="submit"
					class="btn-primary create-btn"
					disabled={!gameName.trim() ||
						!selectedRegionId ||
						selectedTags.length === 0 ||
						creating}
				>
					{creating ? "Creating..." : "Create Game"}
				</button>

				{#if error}
					<p class="error">{error}</p>
				{/if}
			</form>
		</section>

		<section class="games-section">
			<h2>Available Games</h2>
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
									<span class="region-label">{game.region_name}</span>
									<span class="meta-sep">|</span>
									<span class="player-count">
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
											<circle cx="9" cy="7" r="4" />
											<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
											<path d="M16 3.13a4 4 0 0 1 0 7.75" />
										</svg>
										{game.player_count}
									</span>
									<span class="meta-sep">|</span>
									<span class="week-label">Week {game.week_number}</span>
								</div>
								<div class="game-tags">
									{#each game.tags as tag}
										<span
											class="tag-badge"
											style="background: {TAG_COLORS[
												tag
											]}20; color: {TAG_COLORS[tag]}"
										>
											{TAG_LABELS[tag]}
										</span>
									{/each}
								</div>
							</div>
							<div class="game-actions">
								<span class="phase-badge {getPhaseClass(game.phase)}">
									{getPhaseLabel(game.phase)}
								</span>
								<button
									class="btn-primary"
									on:click={() => handleJoin(game.id)}
								>
									Join
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>

	<footer class="lobby-footer">
		<p>5 topics. Weekly challenges. One winner.</p>
		<div class="tag-dots">
			{#each ALL_TAGS as tag}
				<span
					class="dot"
					style="background: {TAG_COLORS[tag]}"
					title={TAG_LABELS[tag]}
				></span>
			{/each}
		</div>
	</footer>
</div>

{#if showJoinModal}
	<JoinModal gameId={joinGameId} on:close={handleJoinModalClose} />
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

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.form-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.form-group input,
	.form-group select {
		width: 100%;
	}

	.tags-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-toggle {
		padding: 0.4rem 0.8rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		transition: all 0.2s ease;
	}

	.tag-toggle:hover {
		border-color: var(--tag-color);
		color: var(--tag-color);
	}

	.tag-toggle.selected {
		background: color-mix(in srgb, var(--tag-color) 15%, transparent);
		color: var(--tag-color);
		border-color: var(--tag-color);
	}

	.create-btn {
		align-self: flex-start;
		padding: 0.7rem 2rem;
	}

	.error {
		color: var(--danger);
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
		gap: 1rem;
	}

	.game-info {
		flex: 1;
	}

	.game-info h3 {
		font-size: 1.1rem;
		margin-bottom: 0.3rem;
	}

	.game-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
		margin-bottom: 0.4rem;
	}

	.meta-sep {
		color: var(--text-muted);
	}

	.player-count {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.game-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.game-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.phase-badge {
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.phase-active {
		background: rgba(56, 161, 105, 0.15);
		color: var(--success);
	}

	.phase-evaluating {
		background: rgba(240, 180, 41, 0.15);
		color: var(--warning);
	}

	.phase-completed {
		background: rgba(99, 102, 241, 0.15);
		color: var(--accent);
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

	.tag-dots {
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
