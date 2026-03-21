<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { joinGame } from "../lib/api";
	import { currentPlayer } from "../lib/stores";

	export let gameId: string;

	const dispatch = createEventDispatcher();

	let playerName = "";
	let joining = false;
	let error = "";

	async function handleJoin() {
		if (!playerName.trim()) return;
		joining = true;
		error = "";
		try {
			const result = await joinGame(gameId, playerName.trim());
			currentPlayer.set({
				id: result.player_id,
				name: playerName.trim(),
			});
			window.location.href = `/game/${gameId}`;
		} catch (e: any) {
			error = e.message || "Failed to join game";
		}
		joining = false;
	}
</script>

<div
	class="overlay"
	on:click|self={() => dispatch("close")}
	on:keydown={e => e.key === "Escape" && dispatch("close")}
	tabindex="0"
	role="dialog"
	aria-modal="true"
	aria-label="Join Game"
>
	<div class="modal card fade-in">
		<div class="modal-header">
			<h2>Join Game</h2>
			<button class="close-btn" on:click={() => dispatch("close")}
				>&times;</button
			>
		</div>

		<form on:submit|preventDefault={handleJoin} class="join-form">
			<div class="form-group">
				<label for="player-name">Your Name</label>
				<input
					id="player-name"
					type="text"
					bind:value={playerName}
					placeholder="Enter your name..."
					maxlength="20"
					autofocus
				/>
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					on:click={() => dispatch("close")}>Cancel</button
				>
				<button
					type="submit"
					class="btn-primary"
					disabled={!playerName.trim() || joining}
				>
					{joining ? "Joining..." : "Join Game"}
				</button>
			</div>
		</form>
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
		max-width: 420px;
		width: 90%;
		padding: 1.5rem;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
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

	.join-form {
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

	.form-group input {
		width: 100%;
	}

	.error {
		color: var(--danger);
		font-size: 0.85rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
