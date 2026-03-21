<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Challenge } from "../lib/types";

	export let challenge: Challenge;
	export let playerPoints: number = 0;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();

	let description = "";
	let pointsInvested = 1;
	let submitting = false;

	$: maxPoints = Math.max(playerPoints, 1);
	$: canSubmit =
		description.trim().length > 0 &&
		pointsInvested > 0 &&
		pointsInvested <= playerPoints &&
		!disabled &&
		!submitting;

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		dispatch("submit", {
			challenge_id: challenge.id,
			description: description.trim(),
			points_invested: pointsInvested,
		});
		description = "";
		pointsInvested = 1;
		submitting = false;
	}
</script>

<div class="proposal-form">
	<h4 class="form-title">Write Your Proposal</h4>
	<p class="form-subtitle">
		Propose a solution to: <strong>{challenge.title}</strong>
	</p>

	<div class="form-group">
		<label for="proposal-desc-{challenge.id}">Your Solution</label>
		<textarea
			id="proposal-desc-{challenge.id}"
			bind:value={description}
			placeholder="Describe your proposed solution to this challenge. Be specific about implementation, expected outcomes, and how it addresses the core issue..."
			rows="5"
			maxlength="2000"
			{disabled}
		></textarea>
		<span class="char-count">{description.length} / 2000</span>
	</div>

	<div class="form-group">
		<label for="points-{challenge.id}"
			>Points to Invest ({playerPoints} available)</label
		>
		<div class="points-row">
			<input
				id="points-{challenge.id}"
				type="range"
				bind:value={pointsInvested}
				min="1"
				max={maxPoints}
				disabled={disabled || playerPoints <= 0}
			/>
			<span class="points-display">{pointsInvested}</span>
		</div>
		{#if playerPoints <= 0}
			<p class="no-points">You have no points remaining this week.</p>
		{/if}
	</div>

	<button
		class="btn-primary submit-btn"
		on:click={handleSubmit}
		disabled={!canSubmit}
	>
		{submitting ? "Submitting..." : `Submit Proposal (${pointsInvested} pts)`}
	</button>
</div>

<style>
	.proposal-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-title {
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.form-subtitle {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.form-subtitle strong {
		color: var(--text-primary);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.form-group label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	textarea {
		width: 100%;
		font-size: 0.85rem;
		line-height: 1.6;
		min-height: 100px;
	}

	.char-count {
		font-size: 0.65rem;
		color: var(--text-muted);
		text-align: right;
	}

	.points-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.points-row input[type="range"] {
		flex: 1;
		accent-color: var(--accent);
		padding: 0;
		border: none;
		background: transparent;
	}

	.points-display {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--accent);
		min-width: 40px;
		text-align: center;
	}

	.no-points {
		color: var(--danger);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.submit-btn {
		align-self: flex-start;
		padding: 0.6rem 1.5rem;
	}
</style>
