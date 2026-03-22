import type { Game, GameListItem, Region, Tag, Proposal, DBChatMessage } from "./types";

const BASE_URL = "http://localhost:8080";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { "Content-Type": "application/json" },
		...options,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`API error ${res.status}: ${text}`);
	}
	return res.json();
}

/** POST /api/games -- Create a new game */
export async function createGame(
	name: string,
	region_id: string,
	tags: Tag[],
): Promise<{ game_id: string; game: Game }> {
	return request<{ game_id: string; game: Game }>("/api/games", {
		method: "POST",
		body: JSON.stringify({ name, region_id, tags }),
	});
}

/** GET /api/games -- List all games */
export async function listGames(): Promise<GameListItem[]> {
	const data = await request<{ games: GameListItem[] }>("/api/games");
	return data.games;
}

/** GET /api/games/:id -- Get a single game */
export async function getGame(id: string): Promise<Game> {
	return request<Game>(`/api/games/${id}`);
}

/** POST /api/games/:id/join -- Join a game */
export async function joinGame(
	gameId: string,
	player_name: string,
): Promise<{ game_id: string; player_id: string; game: Game }> {
	return request<{ game_id: string; player_id: string; game: Game }>(
		`/api/games/${gameId}/join`,
		{
			method: "POST",
			body: JSON.stringify({ player_name }),
		},
	);
}

/** POST /api/games/:id/proposals -- Submit a proposal */
export async function submitProposal(
	gameId: string,
	player_id: string,
	challenge_id: string,
	description: string,
	points_invested: number,
): Promise<{ proposal: Proposal }> {
	return request<{ proposal: Proposal }>(`/api/games/${gameId}/proposals`, {
		method: "POST",
		body: JSON.stringify({
			player_id,
			challenge_id,
			description,
			points_invested,
		}),
	});
}

/** POST /api/games/:id/evaluate -- Trigger AI evaluation (host only) */
export async function evaluateGame(
	gameId: string,
	player_id: string,
): Promise<{ status: string; game: Game }> {
	return request<{ status: string; game: Game }>(
		`/api/games/${gameId}/evaluate`,
		{
			method: "POST",
			body: JSON.stringify({ player_id }),
		},
	);
}

/** POST /api/games/:id/next-week -- Start next week (host only) */
export async function nextWeek(
	gameId: string,
	player_id: string,
): Promise<{ status: string; game: Game }> {
	return request<{ status: string; game: Game }>(
		`/api/games/${gameId}/next-week`,
		{
			method: "POST",
			body: JSON.stringify({ player_id }),
		},
	);
}

/** GET /api/games/:id/chat -- Load chat history */
export async function getChat(
	gameId: string,
): Promise<{ messages: DBChatMessage[] }> {
	return request<{ messages: DBChatMessage[] }>(
		`/api/games/${gameId}/chat`,
	);
}

/** GET /api/regions -- List available regions */
export async function listRegions(): Promise<Region[]> {
	const data = await request<{ regions: Region[] }>("/api/regions");
	return data.regions;
}
