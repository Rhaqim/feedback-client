import type { Game, GameListItem, Region, Tag, Proposal, DBChatMessage, FeedItem, CuratedChallenge, CurateChallengeRequest } from "./types";

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

/** GET /api/feeds -- List recent feed items */
export async function listFeedItems(): Promise<FeedItem[]> {
	const data = await request<{ feed_items: FeedItem[] }>("/api/feeds");
	return data.feed_items;
}

/** POST /api/feeds/fetch -- Trigger a manual feed fetch */
export async function triggerFeedFetch(): Promise<{ status: string; count: number }> {
	return request<{ status: string; count: number }>("/api/feeds/fetch", {
		method: "POST",
	});
}

// ---------- Game Master API ----------

/** GET /api/game-master/feeds -- List feed items with filters */
export async function gmListFeeds(
	tag?: string,
	regionId?: string,
	unusedOnly?: boolean,
): Promise<FeedItem[]> {
	const params = new URLSearchParams();
	if (tag) params.set("tag", tag);
	if (regionId) params.set("region_id", regionId);
	if (unusedOnly) params.set("unused", "true");
	const qs = params.toString();
	const data = await request<{ feed_items: FeedItem[] }>(
		`/api/game-master/feeds${qs ? "?" + qs : ""}`,
	);
	return data.feed_items;
}

/** POST /api/game-master/curate -- Create a curated challenge */
export async function gmCurate(
	req: CurateChallengeRequest,
): Promise<CuratedChallenge> {
	const data = await request<{ curated_challenge: CuratedChallenge }>(
		"/api/game-master/curate",
		{ method: "POST", body: JSON.stringify(req) },
	);
	return data.curated_challenge;
}

/** GET /api/game-master/challenges -- List curated challenges */
export async function gmListChallenges(
	tag?: string,
	regionId?: string,
): Promise<CuratedChallenge[]> {
	const params = new URLSearchParams();
	if (tag) params.set("tag", tag);
	if (regionId) params.set("region_id", regionId);
	const qs = params.toString();
	const data = await request<{ curated_challenges: CuratedChallenge[] }>(
		`/api/game-master/challenges${qs ? "?" + qs : ""}`,
	);
	return data.curated_challenges;
}

/** DELETE /api/game-master/challenges/:id -- Delete a curated challenge */
export async function gmDeleteChallenge(id: number): Promise<void> {
	await request<{ status: string }>(`/api/game-master/challenges/${id}`, {
		method: "DELETE",
	});
}

/** POST /api/game-master/dismiss/:id -- Dismiss a feed item */
export async function gmDismissFeed(id: number): Promise<void> {
	await request<{ status: string }>(`/api/game-master/dismiss/${id}`, {
		method: "POST",
	});
}
