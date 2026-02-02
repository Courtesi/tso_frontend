export interface ArbBetSide {
	team: string;
	odds: number;
	sportsbook: string;
	stake: number;
	link: string | null;
}

export interface ArbitrageBet {
	id: number;
	league: string;
	matchup: string;
	market: string;
	game_time: string;
	profit_percentage: number;
	bet1: ArbBetSide;
	bet2: ArbBetSide;
	found_at: string;
	expires_in_minutes: number;
}

export interface ArbsPayload {
	message: string;
	tier: string;
	data: ArbitrageBet[];
}
