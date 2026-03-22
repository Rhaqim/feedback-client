export type Tag = "economics" | "politics" | "security" | "education" | "law";
export type GamePhase = "active" | "evaluating" | "completed";

export const ALL_TAGS: Tag[] = [
	"economics",
	"politics",
	"security",
	"education",
	"law",
];

export const TAG_COLORS: Record<Tag, string> = {
	economics: "#f0b429",
	politics: "#e53e3e",
	security: "#3182ce",
	education: "#38a169",
	law: "#805ad5",
};

export const TAG_LABELS: Record<Tag, string> = {
	economics: "Economics",
	politics: "Politics",
	security: "Security",
	education: "Education",
	law: "Law",
};

export interface Player {
	id: string;
	name: string;
	points: number;
	total_score: number;
	connected: boolean;
}

export interface Region {
	id: string;
	name: string;
	country: string;
	continent: string;
	description: string;
}

export interface Challenge {
	id: string;
	tag: Tag;
	title: string;
	description: string;
	source: string;
	region: string;
	severity: number;
	created_at: string;
	active: boolean;
}

export interface Proposal {
	id: string;
	player_id: string;
	player_name: string;
	challenge_id: string;
	description: string;
	points_invested: number;
	submitted_at: string;
	ai_score: number;
	ai_feedback: string;
}

export interface WeekWinner {
	player_id: string;
	player_name: string;
	score: number;
	summary: string;
}

export interface Game {
	id: string;
	name: string;
	region_id: string;
	region_name: string;
	tags: Tag[];
	phase: GamePhase;
	players: Record<string, Player>;
	challenges: Challenge[];
	proposals: Proposal[];
	week_number: number;
	week_start: string;
	week_end: string;
	host_id: string;
	created_at: string;
	winner?: WeekWinner;
}

export interface GameListItem {
	id: string;
	name: string;
	region_name: string;
	tags: Tag[];
	phase: GamePhase;
	player_count: number;
	week_number: number;
	created_at: string;
}

export interface ChatMessage {
	player_id: string;
	player_name: string;
	message: string;
	timestamp: number;
}

/** ChatMessage as returned from the REST API (DB format) */
export interface DBChatMessage {
	id: number;
	game_id: string;
	player_id: string;
	player_name: string;
	message: string;
	created_at: string;
}

export interface LocalPlayer {
	id: string;
	name: string;
}

export interface FeedItem {
	id: number;
	tag: Tag;
	region_id: string;
	title: string;
	description: string;
	url: string;
	source: string;
	feed_name: string;
	published_at: string;
	fetched_at: string;
	used_in_game: boolean;
}

export interface WSMessage {
	type: string;
	payload: Record<string, unknown>;
}
