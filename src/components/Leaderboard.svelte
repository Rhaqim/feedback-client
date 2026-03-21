<script lang="ts">
	import type { Player } from "../lib/types";

	export let players: Player[] = [];
	export let currentPlayerId: string = "";

	$: sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);
</script>

<div class="leaderboard card">
	<h4 class="section-title">Leaderboard</h4>

	{#if sortedPlayers.length === 0}
		<p class="empty">No players yet</p>
	{:else}
		<div class="player-list">
			{#each sortedPlayers as player, index (player.id)}
				<div class="player-row" class:current={player.id === currentPlayerId}>
					<span class="rank" class:top={index === 0}>
						{index + 1}
					</span>
					<div class="player-info">
						<span class="player-name">
							{player.name}
							{#if player.id === currentPlayerId}
								<span class="you-tag">(you)</span>
							{/if}
						</span>
						<span class="player-points">{player.points} pts left</span>
					</div>
					<div class="player-right">
						<span class="total-score">{player.total_score}</span>
						<span class="connected-dot" class:online={player.connected}></span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.leaderboard {
		display: flex;
		flex-direction: column;
	}

	.section-title {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.player-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.player-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		background: var(--bg-secondary);
		transition: background 0.2s;
	}

	.player-row.current {
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.2);
	}

	.rank {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--text-muted);
		background: var(--bg-card);
		border-radius: 50%;
	}

	.rank.top {
		background: var(--gold);
		color: #1a1a2e;
	}

	.player-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.player-name {
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.you-tag {
		font-size: 0.65rem;
		color: var(--accent);
		font-weight: 400;
	}

	.player-points {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.player-right {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.total-score {
		font-size: 1rem;
		font-weight: 800;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.connected-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-muted);
	}

	.connected-dot.online {
		background: var(--success);
	}

	.empty {
		color: var(--text-muted);
		text-align: center;
		font-size: 0.8rem;
		padding: 1rem;
	}
</style>
