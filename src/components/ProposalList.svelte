<script lang="ts">
	import type { Proposal } from "../lib/types";

	export let proposals: Proposal[] = [];
	export let currentPlayerId: string = "";

	let expandedId: string | null = null;

	$: sortedProposals = [...proposals].sort((a, b) => {
		// Evaluated proposals (with scores) first, sorted by score desc
		if (a.ai_score > 0 && b.ai_score > 0) return b.ai_score - a.ai_score;
		if (a.ai_score > 0) return -1;
		if (b.ai_score > 0) return 1;
		// Then by submission time desc
		return (
			new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
		);
	});

	function toggleExpand(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	function getScoreColor(score: number): string {
		if (score >= 80) return "#38a169";
		if (score >= 60) return "#f0b429";
		if (score >= 40) return "#e53e3e";
		return "#606080";
	}

	function formatTime(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}
</script>

<div class="proposal-list">
	{#if sortedProposals.length === 0}
		<div class="empty-state card">
			<p>No proposals submitted yet.</p>
		</div>
	{:else}
		{#each sortedProposals as proposal (proposal.id)}
			<div
				class="proposal-card card"
				class:own={proposal.player_id === currentPlayerId}
			>
				<button
					class="proposal-header"
					on:click={() => toggleExpand(proposal.id)}
				>
					<div class="proposal-info">
						<div class="proposal-top">
							<span
								class="player-name"
								class:is-self={proposal.player_id === currentPlayerId}
							>
								{proposal.player_name}
								{#if proposal.player_id === currentPlayerId}
									<span class="you-badge">YOU</span>
								{/if}
							</span>
							<span class="points-invested">{proposal.points_invested} pts</span
							>
						</div>
						<p class="proposal-desc">
							{#if expandedId === proposal.id}
								{proposal.description}
							{:else}
								{proposal.description.slice(0, 120)}{proposal.description
									.length > 120
									? "..."
									: ""}
							{/if}
						</p>
						<span class="proposal-time"
							>{formatTime(proposal.submitted_at)}</span
						>
					</div>
					<div class="proposal-score-area">
						{#if proposal.ai_score > 0}
							<div
								class="score-badge"
								style="color: {getScoreColor(
									proposal.ai_score,
								)}; border-color: {getScoreColor(proposal.ai_score)}"
							>
								{proposal.ai_score}
							</div>
						{:else}
							<span class="pending-score">--</span>
						{/if}
					</div>
				</button>

				{#if expandedId === proposal.id && proposal.ai_feedback}
					<div class="feedback-section fade-in">
						<h4>AI Feedback</h4>
						<p>{proposal.ai_feedback}</p>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style>
	.proposal-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.proposal-card {
		padding: 0;
		overflow: hidden;
	}

	.proposal-card.own {
		border-color: rgba(99, 102, 241, 0.3);
		background: rgba(99, 102, 241, 0.05);
	}

	.proposal-header {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.85rem 1rem;
		background: transparent;
		color: var(--text-primary);
		text-align: left;
		border-radius: 12px;
		font-size: inherit;
		font-weight: normal;
	}

	.proposal-header:hover {
		background: var(--bg-card-hover);
	}

	.proposal-info {
		flex: 1;
		min-width: 0;
	}

	.proposal-top {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.3rem;
	}

	.player-name {
		font-weight: 600;
		font-size: 0.85rem;
	}

	.player-name.is-self {
		color: var(--accent);
	}

	.you-badge {
		font-size: 0.55rem;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		background: var(--accent);
		color: white;
		vertical-align: middle;
		margin-left: 0.25rem;
	}

	.points-invested {
		font-size: 0.7rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.proposal-desc {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 0.3rem;
	}

	.proposal-time {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.proposal-score-area {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.score-badge {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 2px solid;
		font-size: 0.9rem;
		font-weight: 800;
	}

	.pending-score {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 2px solid var(--border);
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.feedback-section {
		border-top: 1px solid var(--border);
		padding: 0.85rem 1rem;
		background: var(--bg-secondary);
	}

	.feedback-section h4 {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: 0.4rem;
	}

	.feedback-section p {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-muted);
	}
</style>
