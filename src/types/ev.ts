export interface TrueOddsSource {
	probability: number;
	american_odds: number;
	liquidity: number;
	volume: number;
	confidence_score: number;
	sources: number;
}

export interface EVBetSide {
	team: string;
	odds: number;
	sportsbook: string;
	probability: number;
	link: string | null;
}

export interface EVBet {
	id: string;
	league: string;
	matchup: string;
	market: string;
	game_time: string;
	bet: EVBetSide;
	true_odds: TrueOddsSource;
	expected_value: number;
	edge: number;
	kelly_fraction: number;
	confidence: string;
	found_at: string;
}

export interface EVPayload {
	tier: string;
	data: EVBet[];
	metadata?: {
		count: number;
	};
	cached_at?: string;
	message?: string;
}
