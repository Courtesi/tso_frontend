export interface LineDataPoint {
	odds: number;
	sportsbook: string;
	timestamp: number;
}

export interface OutcomeLine {
	outcome_id: string;
	outcome_name: string;
	history: LineDataPoint[];
	current_best_odds: number;
	current_best_sportsbook: string;
	history_by_sportsbook?: Record<string, LineDataPoint[]>;
}

export interface MarketLines {
	market_type: string;
	market_display: string;
	outcomes: OutcomeLine[];
}

export interface GameTerminalData {
	event_id: string;
	sport: string;
	league: string;
	home_team: string;
	away_team: string;
	matchup: string;
	start_time: string;
	game_status: string;
	markets: MarketLines[];
}

export interface TerminalPayload {
	tier: string;
	data: GameTerminalData[];
	metadata?: {
		count: number;
		league: string;
		game_time: string;
	};
	cached_at?: string;
	message?: string;
}
