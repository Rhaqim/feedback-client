<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { WeekWinner, Proposal, Player } from "../lib/types";

	export let winner: WeekWinner | null = null;
	export let proposals: Proposal[] = [];
	export let players: Record<string, Player> = {};
	export let isHost: boolean = false;

	const dispatch = createEventDispatcher();

	$: scoredProposals = [...proposals]
		.filter(p => p.ai_score > 0)
		.sort((a, b) => b.ai_score - a.ai_score);

	$: sortedPlayers = Object.values(players).sort(
		(a, b) => b.total_score - a.total_score,
	);

	function getScoreColor(score: number): string {
		if (score >= 80) return "#38a169";
		if (score >= 60) return "#f0b429";
		if (score >= 40) return "#e53e3e";
		return "#606080";
	}
</script>

<div
	class="results-overlay"
	on:click|self={() => dispatch("close")}
	on:keydown={e => e.key === "Escape" && dispatch("close")}
	tabindex="0"
	role="dialog"
	aria-modal="true"
	aria-label="Week Results"
>
	<div class="results-panel">
		<!-- Winner Section -->
		{#if winner}
			<div class="winner-section">
				<div class="winner-glow"></div>
				<h2 class="winner-heading">Week Winner</h2>
				<div class="winner-name">{winner.player_name}</div>
				<div class="winner-score">Score: {winner.score}</div>
				{#if winner.summary}
					<p class="winner-summary">{winner.summary}</p>
				{/if}
			</div>
		{:else}
			<div class="winner-section">
				<h2 class="winner-heading">Week Completed</h2>
				<p class="winner-summary">No winner determined.</p>
			</div>
		{/if}

		<!-- Updated Scores -->
		<div class="scores-section">
			<h3>Updated Scores</h3>
			<div class="scores-list">
				{#each sortedPlayers as player, i (player.id)}
					<div class="score-row">
						<span class="score-rank">{i + 1}.</span>
						<span class="score-name">{player.name}</span>
						<span class="score-total">{player.total_score}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Scored Proposals -->
		{#if scoredProposals.length > 0}
			<div class="proposals-section">
				<h3>Evaluated Proposals</h3>
				<div class="scored-list">
					{#each scoredProposals as proposal (proposal.id)}
						<div class="scored-proposal">
							<div class="scored-header">
								<span class="scored-player">{proposal.player_name}</span>
								<span class="scored-points"
									>{proposal.points_invested} pts invested</span
								>
								<span
									class="scored-score"
									style="color: {getScoreColor(proposal.ai_score)}"
									>{proposal.ai_score}</span
								>
							</div>
							<p class="scored-desc">
								{proposal.description.slice(0, 200)}{proposal.description
									.length > 200
									? "..."
									: ""}
							</p>
							{#if proposal.ai_feedback}
								<p class="scored-feedback">{proposal.ai_feedback}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div class="results-actions">
			<button class="btn-secondary" on:click={() => dispatch("close")}
				>Close</button
			>
			{#if isHost}
				<button class="btn-success" on:click={() => dispatch("next-week")}
					>Start Next Week</button
				>
			{/if}
		</div>
	</div>
</div>

<style>
	.results-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		overflow-y: auto;
		padding: 2rem;
	}

	.results-panel {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 2rem;
		max-width: 650px;
		width: 100%;
		max-height: 85vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.winner-section {
		text-align: center;
		padding: 2rem 1rem;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(246, 173, 85, 0.08) 0%,
			rgba(246, 173, 85, 0.02) 100%
		);
		border: 1px solid rgba(246, 173, 85, 0.2);
		position: relative;
		overflow: hidden;
		animation: pulse-glow 3s ease-in-out infinite;
	}

	.winner-glow {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(
			circle,
			rgba(246, 173, 85, 0.06) 0%,
			transparent 60%
		);
		pointer-events: none;
	}

	.winner-heading {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--gold);
		margin-bottom: 0.5rem;
	}

	.winner-name {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.winner-score {
		font-size: 1.2rem;
		color: var(--gold);
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	.winner-summary {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 450px;
		margin: 0 auto;
	}

	.scores-section h3,
	.proposals-section h3 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.scores-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.score-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-card);
		border-radius: 8px;
	}

	.score-rank {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 700;
		width: 24px;
	}

	.score-name {
		flex: 1;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.score-total {
		font-size: 1rem;
		font-weight: 800;
		color: var(--accent);
	}

	.scored-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.scored-proposal {
		background: var(--bg-card);
		border-radius: 10px;
		padding: 0.85rem 1rem;
	}

	.scored-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
	}

	.scored-player {
		font-weight: 600;
		font-size: 0.85rem;
		flex: 1;
	}

	.scored-points {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.scored-score {
		font-size: 1.1rem;
		font-weight: 800;
	}

	.scored-desc {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 0.3rem;
	}

	.scored-feedback {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-style: italic;
		line-height: 1.5;
		border-top: 1px solid var(--border);
		padding-top: 0.4rem;
		margin-top: 0.3rem;
	}

	.results-actions {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		padding-top: 0.5rem;
	}
</style>
