<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Challenge, Proposal, Tag } from "../lib/types";
	import { TAG_COLORS, TAG_LABELS } from "../lib/types";
	import ProposalForm from "./ProposalForm.svelte";

	export let challenges: Challenge[] = [];
	export let tags: Tag[] = [];
	export let proposals: Proposal[] = [];
	export let playerPoints: number = 0;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();

	let expandedChallengeId: string | null = null;

	// Group challenges by tag
	$: groupedChallenges = tags.reduce(
		(acc, tag) => {
			acc[tag] = challenges.filter(c => c.tag === tag);
			return acc;
		},
		{} as Record<Tag, Challenge[]>,
	);

	function getProposalCount(challengeId: string): number {
		return proposals.filter(p => p.challenge_id === challengeId).length;
	}

	function getSeverityColor(severity: number): string {
		if (severity <= 3) return "#38a169";
		if (severity <= 6) return "#f0b429";
		return "#e53e3e";
	}

	function getSourceLabel(source: string): string {
		switch (source) {
			case "news":
				return "NEWS";
			case "social_media":
				return "SOCIAL";
			case "report":
				return "REPORT";
			default:
				return source.toUpperCase();
		}
	}

	function toggleChallenge(id: string) {
		if (expandedChallengeId === id) {
			expandedChallengeId = null;
		} else {
			expandedChallengeId = id;
		}
	}

	function handleProposalSubmit(
		e: CustomEvent<{
			challenge_id: string;
			description: string;
			points_invested: number;
		}>,
	) {
		dispatch("submit", e.detail);
		expandedChallengeId = null;
	}
</script>

<div class="challenge-list">
	{#each tags as tag}
		{@const tagChallenges = groupedChallenges[tag] || []}
		{#if tagChallenges.length > 0}
			<div class="tag-section">
				<div class="tag-header" style="border-left-color: {TAG_COLORS[tag]}">
					<span class="tag-name" style="color: {TAG_COLORS[tag]}"
						>{TAG_LABELS[tag]}</span
					>
					<span class="tag-count"
						>{tagChallenges.length} challenge{tagChallenges.length !== 1
							? "s"
							: ""}</span
					>
				</div>

				<div class="challenges">
					{#each tagChallenges as challenge (challenge.id)}
						{@const propCount = getProposalCount(challenge.id)}
						<div
							class="challenge-card card"
							class:expanded={expandedChallengeId === challenge.id}
						>
							<button
								class="challenge-header"
								on:click={() => toggleChallenge(challenge.id)}
							>
								<div class="challenge-main">
									<h3 class="challenge-title">{challenge.title}</h3>
									<p class="challenge-desc">{challenge.description}</p>
								</div>
								<div class="challenge-meta">
									<span class="source-badge"
										>{getSourceLabel(challenge.source)}</span
									>
									<div
										class="severity"
										title="Severity: {challenge.severity}/10"
									>
										{#each Array(10) as _, i}
											<span
												class="severity-dot"
												style="background: {i < challenge.severity
													? getSeverityColor(challenge.severity)
													: 'var(--bg-secondary)'}"
											></span>
										{/each}
									</div>
									<span class="proposal-count"
										>{propCount} proposal{propCount !== 1 ? "s" : ""}</span
									>
								</div>
								<span class="expand-arrow"
									>{expandedChallengeId === challenge.id
										? "\u25B2"
										: "\u25BC"}</span
								>
							</button>

							{#if expandedChallengeId === challenge.id}
								<div class="challenge-expanded fade-in">
									<ProposalForm
										{challenge}
										{playerPoints}
										disabled={disabled || playerPoints <= 0}
										on:submit={handleProposalSubmit}
									/>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/each}

	{#if challenges.length === 0}
		<div class="empty-state card">
			<p>No challenges available yet. Check back soon!</p>
		</div>
	{/if}
</div>

<style>
	.challenge-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.tag-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tag-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-left: 3px solid;
		background: var(--bg-secondary);
		border-radius: 0 6px 6px 0;
	}

	.tag-name {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.tag-count {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.challenges {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.challenge-card {
		padding: 0;
		overflow: hidden;
	}

	.challenge-header {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: transparent;
		color: var(--text-primary);
		text-align: left;
		border-radius: 12px;
		font-size: inherit;
		font-weight: normal;
	}

	.challenge-header:hover {
		background: var(--bg-card-hover);
	}

	.challenge-main {
		flex: 1;
		min-width: 0;
	}

	.challenge-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
		line-height: 1.3;
	}

	.challenge-desc {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.challenge-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.source-badge {
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.severity {
		display: flex;
		gap: 2px;
	}

	.severity-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.proposal-count {
		font-size: 0.7rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.expand-arrow {
		color: var(--text-muted);
		font-size: 0.7rem;
		flex-shrink: 0;
		margin-top: 0.2rem;
	}

	.challenge-expanded {
		border-top: 1px solid var(--border);
		padding: 1rem 1.25rem;
		background: var(--bg-secondary);
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-muted);
	}
</style>
