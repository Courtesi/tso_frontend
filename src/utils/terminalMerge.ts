import type { GameTerminalData, LineDataPoint, RawEventData } from '../types/terminal';

/**
 * Appends a single sportsbook's update to existing terminal chart state.
 * Matches by event_id → market_type → outcome name (lowercase).
 * Returns a new array with updated data (immutable).
 */
export function appendSportsbookUpdate(
	existing: GameTerminalData[],
	timestamp: number,
	rawEvents: RawEventData[]
): GameTerminalData[] {
	const gameByEventId = new Map<string, number>();
	existing.forEach((game, i) => gameByEventId.set(game.event_id, i));

	const updated = [...existing];

	for (const rawEvent of rawEvents) {
		const gameIdx = gameByEventId.get(rawEvent.event_id);
		if (gameIdx === undefined) continue;

		const game = { ...updated[gameIdx], markets: updated[gameIdx].markets.map(m => ({ ...m })) };
		updated[gameIdx] = game;

		for (const rawMarket of rawEvent.markets) {
			const marketIdx = game.markets.findIndex(m => m.market_type === rawMarket.market_type);
			if (marketIdx === -1) continue;

			const market = { ...game.markets[marketIdx], outcomes: game.markets[marketIdx].outcomes.map(o => ({ ...o })) };
			game.markets[marketIdx] = market;

			for (const rawOutcome of rawMarket.outcomes) {
				const outcomeKey = rawOutcome.outcome.toLowerCase();
				const outcomeIdx = market.outcomes.findIndex(o => o.outcome_name.toLowerCase() === outcomeKey);
				if (outcomeIdx === -1) continue;

				const outcome = { ...market.outcomes[outcomeIdx] };
				market.outcomes[outcomeIdx] = outcome;

				const newPoint: LineDataPoint = {
					odds: rawOutcome.odds,
					sportsbook: rawOutcome.sportsbook,
					timestamp,
				};

				outcome.history = [...outcome.history, newPoint];

				outcome.history_by_sportsbook = { ...outcome.history_by_sportsbook };
				const sbHistory = outcome.history_by_sportsbook[rawOutcome.sportsbook] || [];
				outcome.history_by_sportsbook[rawOutcome.sportsbook] = [...sbHistory, newPoint];

				outcome.current_best_odds = rawOutcome.odds;
				outcome.current_best_sportsbook = rawOutcome.sportsbook;
			}
		}
	}

	return updated;
}