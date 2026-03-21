<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { ws } from "../lib/websocket";
	import { getGame, evaluateGame, nextWeek } from "../lib/api";
	import {
		gameState,
		currentPlayer,
		chatMessages,
		connectionStatus,
	} from "../lib/stores";
	import type {
		Game,
		Player,
		Challenge,
		Proposal,
		ChatMessage,
		LocalPlayer,
		WeekWinner,
	} from "../lib/types";
	import ChallengeList from "./ChallengeList.svelte";
	import Leaderboard from "./Leaderboard.svelte";
	import ProposalList from "./ProposalList.svelte";
	import WeekResults from "./WeekResults.svelte";
	import Chat from "./Chat.svelte";

	export let gameId: string | undefined = "";

	let game: Game | null = null;
	let localPlayer: LocalPlayer | null = null;
	let messages: ChatMessage[] = [];
	let connStatus = "disconnected";
	let error = "";
	let notification = "";
	let notificationTimer: ReturnType<typeof setTimeout> | null = null;
	let showResults = false;
	let evaluating = false;
	let startingNextWeek = false;
	let showProposals = false;

	gameState.subscribe(v => (game = v));
	currentPlayer.subscribe(v => (localPlayer = v));
	chatMessages.subscribe(v => (messages = v));
	connectionStatus.subscribe(v => (connStatus = v));

	$: isHost = !!(game && localPlayer && game.host_id === localPlayer.id);
	$: myPlayer =
		game && localPlayer ? (game.players[localPlayer.id] ?? null) : null;
	$: playerCount = game ? Object.keys(game.players).length : 0;
	$: activeChallenges = game ? game.challenges.filter(c => c.active) : [];

	// Show results overlay when phase is completed
	$: if (game?.phase === "completed" && game?.winner) {
		showResults = true;
	}

	function showNotification(msg: string) {
		notification = msg;
		if (notificationTimer) clearTimeout(notificationTimer);
		notificationTimer = setTimeout(() => {
			notification = "";
		}, 4000);
	}

	onMount(async () => {
		// Load initial game state
		try {
			if (gameId) {
				const g = await getGame(gameId);
				gameState.set(g);
			}
		} catch (e: any) {
			error = e.message;
		}

		// Connect WebSocket
		ws.onStatusChange(s => connectionStatus.set(s));
		ws.connect();

		// Join game via WS
		if (localPlayer && gameId) {
			ws.send("join_game", {
				game_id: gameId,
				player_id: localPlayer.id,
			});
		}

		// Handle WS messages
		ws.on("game_state", handleGameState);
		ws.on("new_challenge", handleNewChallenge);
		ws.on("proposal_submitted", handleProposalSubmitted);
		ws.on("evaluation_result", handleEvaluationResult);
		ws.on("player_joined", handlePlayerJoined);
		ws.on("player_left", handlePlayerLeft);
		ws.on("chat", handleChat);
		ws.on("error", handleError);
	});

	onDestroy(() => {
		ws.off("game_state", handleGameState);
		ws.off("new_challenge", handleNewChallenge);
		ws.off("proposal_submitted", handleProposalSubmitted);
		ws.off("evaluation_result", handleEvaluationResult);
		ws.off("player_joined", handlePlayerJoined);
		ws.off("player_left", handlePlayerLeft);
		ws.off("chat", handleChat);
		ws.off("error", handleError);
		ws.disconnect();
		if (notificationTimer) clearTimeout(notificationTimer);
	});

	function handleGameState(payload: Record<string, unknown>) {
		const g = payload as unknown as Game;
		gameState.set(g);
	}

	function handleNewChallenge(payload: Record<string, unknown>) {
		const challenge = payload as unknown as Challenge;
		gameState.update(g => {
			if (!g) return g;
			return { ...g, challenges: [...g.challenges, challenge] };
		});
		showNotification(`New challenge: ${challenge.title}`);
	}

	function handleProposalSubmitted(payload: Record<string, unknown>) {
		const proposal = payload as unknown as Proposal;
		gameState.update(g => {
			if (!g) return g;
			return { ...g, proposals: [...g.proposals, proposal] };
		});
		if (proposal.player_id !== localPlayer?.id) {
			showNotification(`${proposal.player_name} submitted a proposal`);
		}
	}

	function handleEvaluationResult(payload: Record<string, unknown>) {
		const winner = payload.winner as WeekWinner;
		const proposals = payload.proposals as Proposal[];
		gameState.update(g => {
			if (!g) return g;
			return { ...g, phase: "completed" as const, winner, proposals };
		});
		showResults = true;
	}

	function handlePlayerJoined(payload: Record<string, unknown>) {
		const playerName = payload.player_name as string;
		showNotification(`${playerName} joined the game`);
		if (gameId) getGame(gameId).then(g => gameState.set(g));
	}

	function handlePlayerLeft(payload: Record<string, unknown>) {
		if (gameId) getGame(gameId).then(g => gameState.set(g));
	}

	function handleChat(payload: Record<string, unknown>) {
		const msg: ChatMessage = {
			player_id: payload.player_id as string,
			player_name: payload.player_name as string,
			message: payload.message as string,
			timestamp: payload.timestamp as number,
		};
		chatMessages.update(m => [...m, msg]);
	}

	function handleError(payload: Record<string, unknown>) {
		error = (payload.message as string) || "Unknown error";
	}

	function handleSendChat(e: CustomEvent<string>) {
		if (!localPlayer || !gameId) return;
		ws.send("chat", { message: e.detail });
		chatMessages.update(m => [
			...m,
			{
				player_id: localPlayer!.id,
				player_name: localPlayer!.name,
				message: e.detail,
				timestamp: Date.now(),
			},
		]);
	}

	async function handleProposalSubmit(
		e: CustomEvent<{
			challenge_id: string;
			description: string;
			points_invested: number;
		}>,
	) {
		if (!localPlayer || !gameId) return;
		const { challenge_id, description, points_invested } = e.detail;
		try {
			const { submitProposal } = await import("../lib/api");
			const result = await submitProposal(
				gameId,
				localPlayer.id,
				challenge_id,
				description,
				points_invested,
			);
			// Update local state with the new proposal
			gameState.update(g => {
				if (!g) return g;
				const updatedPlayers = { ...g.players };
				if (updatedPlayers[localPlayer!.id]) {
					updatedPlayers[localPlayer!.id] = {
						...updatedPlayers[localPlayer!.id],
						points: updatedPlayers[localPlayer!.id].points - points_invested,
					};
				}
				return {
					...g,
					proposals: [...g.proposals, result.proposal],
					players: updatedPlayers,
				};
			});
			showNotification("Proposal submitted successfully!");
		} catch (e: any) {
			error = e.message || "Failed to submit proposal";
		}
	}

	async function handleEvaluate() {
		if (!localPlayer || !gameId) return;
		evaluating = true;
		error = "";
		try {
			const result = await evaluateGame(gameId, localPlayer.id);
			gameState.set(result.game);
		} catch (e: any) {
			error = e.message || "Failed to evaluate";
		}
		evaluating = false;
	}

	async function handleNextWeek() {
		if (!localPlayer || !gameId) return;
		startingNextWeek = true;
		error = "";
		try {
			const result = await nextWeek(gameId, localPlayer.id);
			gameState.set(result.game);
			showResults = false;
		} catch (e: any) {
			error = e.message || "Failed to start next week";
		}
		startingNextWeek = false;
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
</script>

<div class="game-view">
	<!-- Top Bar -->
	<header class="top-bar">
		<div class="top-left">
			<a href="/" class="back-link">&larr; Lobby</a>
			<h1 class="game-title">{game?.name || "Loading..."}</h1>
			{#if game?.region_name}
				<span class="region-badge">{game.region_name}</span>
			{/if}
		</div>
		<div class="top-center">
			<div class="week-info">
				<span class="week-label">Week</span>
				<span class="week-value">{game?.week_number || 0}</span>
			</div>
			<div
				class="phase-badge"
				class:active={game?.phase === "active"}
				class:evaluating-phase={game?.phase === "evaluating"}
				class:completed-phase={game?.phase === "completed"}
			>
				{getPhaseLabel(game?.phase || "")}
			</div>
		</div>
		<div class="top-right">
			<span class="player-count-badge">{playerCount} players</span>
			<span
				class="conn-dot"
				class:connected={connStatus === "connected"}
				class:disconnected={connStatus === "disconnected"}
			></span>
			<span class="conn-text">{connStatus}</span>
		</div>
	</header>

	{#if error}
		<div class="error-banner">
			{error}
			<button class="dismiss-btn" on:click={() => (error = "")}>&times;</button>
		</div>
	{/if}

	{#if notification}
		<div class="notification-banner fade-in">
			{notification}
		</div>
	{/if}

	<!-- Host Controls -->
	{#if isHost && game}
		<div class="host-controls">
			{#if game.phase === "active"}
				<button
					class="btn-warning"
					on:click={handleEvaluate}
					disabled={evaluating}
				>
					{evaluating ? "Evaluating..." : "Evaluate Week"}
				</button>
			{/if}
			{#if game.phase === "completed"}
				<button
					class="btn-success"
					on:click={handleNextWeek}
					disabled={startingNextWeek}
				>
					{startingNextWeek ? "Starting..." : "Start Next Week"}
				</button>
			{/if}
		</div>
	{/if}

	<!-- Main Content -->
	{#if game?.phase === "evaluating"}
		<div class="evaluating-state">
			<div class="evaluating-card card">
				<div class="spinner"></div>
				<h2>AI is evaluating proposals...</h2>
				<p>
					Please wait while proposals are scored and a winner is determined.
				</p>
			</div>
		</div>
	{:else}
		<div class="game-layout">
			<div class="main-area">
				<div class="tab-bar">
					<button
						class="tab-btn"
						class:active-tab={!showProposals}
						on:click={() => (showProposals = false)}
					>
						Challenges ({activeChallenges.length})
					</button>
					<button
						class="tab-btn"
						class:active-tab={showProposals}
						on:click={() => (showProposals = true)}
					>
						All Proposals ({game?.proposals.length || 0})
					</button>
				</div>

				{#if showProposals}
					<ProposalList
						proposals={game?.proposals || []}
						currentPlayerId={localPlayer?.id || ""}
					/>
				{:else}
					<ChallengeList
						challenges={activeChallenges}
						tags={game?.tags || []}
						proposals={game?.proposals || []}
						playerPoints={myPlayer?.points || 0}
						disabled={game?.phase !== "active"}
						on:submit={handleProposalSubmit}
					/>
				{/if}
			</div>

			<aside class="sidebar">
				<Leaderboard
					players={game ? Object.values(game.players) : []}
					currentPlayerId={localPlayer?.id || ""}
				/>
				{#if myPlayer}
					<div class="points-card card">
						<h4>Your Points</h4>
						<div class="points-display">
							<span class="points-value">{myPlayer.points}</span>
							<span class="points-label">available</span>
						</div>
					</div>
				{/if}
			</aside>
		</div>
	{/if}

	<!-- Week Results Overlay -->
	{#if showResults && game}
		<WeekResults
			winner={game.winner || null}
			proposals={game.proposals}
			players={game.players}
			{isHost}
			on:next-week={handleNextWeek}
			on:close={() => (showResults = false)}
		/>
	{/if}

	<!-- Chat -->
	<Chat
		{messages}
		currentPlayerId={localPlayer?.id || ""}
		on:send={handleSendChat}
	/>
</div>

<style>
	.game-view {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 1.25rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		gap: 1rem;
		flex-wrap: wrap;
	}

	.top-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.back-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.8rem;
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		background: var(--bg-card);
		transition: color 0.2s;
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	.game-title {
		font-size: 1.1rem;
	}

	.region-badge {
		font-size: 0.75rem;
		color: var(--text-secondary);
		background: var(--bg-card);
		padding: 0.2rem 0.6rem;
		border-radius: 6px;
	}

	.top-center {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.week-info {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
	}

	.week-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	.week-value {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--accent);
	}

	.phase-badge {
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		background: var(--bg-card);
	}

	.phase-badge.active {
		background: rgba(56, 161, 105, 0.15);
		color: var(--success);
	}

	.phase-badge.evaluating-phase {
		background: rgba(240, 180, 41, 0.15);
		color: var(--warning);
	}

	.phase-badge.completed-phase {
		background: rgba(99, 102, 241, 0.15);
		color: var(--accent);
	}

	.top-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.player-count-badge {
		color: var(--text-secondary);
		background: var(--bg-card);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
	}

	.conn-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--text-muted);
	}

	.conn-dot.connected {
		background: var(--success);
	}

	.conn-dot.disconnected {
		background: var(--danger);
	}

	.conn-text {
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.error-banner {
		background: rgba(229, 62, 62, 0.1);
		border-bottom: 1px solid rgba(229, 62, 62, 0.3);
		color: var(--danger);
		padding: 0.5rem 1.25rem;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.dismiss-btn {
		background: none;
		color: var(--danger);
		font-size: 1.2rem;
		padding: 0;
		line-height: 1;
	}

	.notification-banner {
		background: rgba(99, 102, 241, 0.1);
		border-bottom: 1px solid rgba(99, 102, 241, 0.3);
		color: var(--accent);
		padding: 0.4rem 1.25rem;
		font-size: 0.8rem;
		text-align: center;
		font-weight: 600;
	}

	.host-controls {
		display: flex;
		justify-content: center;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		gap: 0.75rem;
	}

	.evaluating-state {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.evaluating-card {
		text-align: center;
		padding: 3rem;
		max-width: 400px;
	}

	.evaluating-card h2 {
		margin-bottom: 0.5rem;
		color: var(--warning);
	}

	.evaluating-card p {
		color: var(--text-secondary);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--border);
		border-top-color: var(--warning);
		border-radius: 50%;
		margin: 0 auto 1.5rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.game-layout {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 1rem;
		padding: 1rem;
		min-height: 0;
	}

	.main-area {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 0;
		overflow-y: auto;
	}

	.tab-bar {
		display: flex;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.tab-btn {
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.85rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.tab-btn:hover {
		color: var(--text-primary);
		background: var(--bg-card);
	}

	.tab-btn.active-tab {
		background: var(--bg-card);
		color: var(--accent);
		border: 1px solid var(--accent);
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}

	.points-card {
		text-align: center;
	}

	.points-card h4 {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 0.5rem;
	}

	.points-display {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.points-value {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--accent);
		line-height: 1;
	}

	.points-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-top: 0.2rem;
	}

	@media (max-width: 900px) {
		.game-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
