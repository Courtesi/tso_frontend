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
	// Populated by /terminal/odds (latest odds per sportsbook, no history arrays)
	latest_by_sportsbook?: Record<string, number>;
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
	matchup: string; // Not in Raw
	start_time: string;
	game_status: string; // Not in Raw
	markets: MarketLines[];
}

export interface TerminalPayload {
	tier: string;
	data: GameTerminalData[];
	metadata: {
		count: number;
	};
	cached_at?: string;
	message?: string;
}

// Line update from WS (lines:{league} channel)
export interface LineUpdate {
	event_id: string;
	market_type: string;
	outcome_name: string;
	point: LineDataPoint;
}

// RAW DATA WITH REST ENDPOINT + WEBSOCKET (sportsbook:*:bets) SUBSCRIBE

export interface RawEventData {
	event_id: string;
	sport: string;
	home_team: string;
	away_team: string;
	start_time: string;
	markets: RawMarketData[];
}

export interface RawMarketData {
	market_id: string;
	market_type: string;
	strike_value: string;
	outcomes: RawOutcomeData[];
}

export interface RawOutcomeData {
	outcome_id: string;
	outcome: string;
	odds: number;
	probability: number;
	sportsbook: string;
	last_updated: string;
	liquidity?: number;
	volume?: number;
	link?: string;
}

export interface SportsbookUpdate {
	type: string;
	stream: string;
	data: RawEventData[];
	metadata: {
		sportsbook: string;
		timestamp: number;
	}
}