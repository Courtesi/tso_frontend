import type { GameTerminalData, LineUpdate } from '../types/terminal';

/**
 * Appends line updates (from lines:{league} WS channel) to existing terminal chart state.
 * Each update directly identifies its target by event_id + market_type + outcome_name.
 * Returns a new array with updated data (immutable).
 */
export function appendLineUpdates(
	existing: GameTerminalData[],
	updates: LineUpdate[]
): GameTerminalData[] {
	const gameByEventId = new Map<string, number>();
	existing.forEach((game, i) => gameByEventId.set(game.event_id, i));

	const updated = [...existing];
	const touchedGames = new Set<number>();
	const clonedMarkets = new Set<string>(); // "gameIdx:marketIdx"

	for (const update of updates) {
		const gameIdx = gameByEventId.get(update.event_id);
		if (gameIdx === undefined) continue;

		// Shallow-clone game + markets array on first touch
		if (!touchedGames.has(gameIdx)) {
			updated[gameIdx] = { ...updated[gameIdx], markets: updated[gameIdx].markets.map(m => ({ ...m })) };
			touchedGames.add(gameIdx);
		}
		const game = updated[gameIdx];

		const marketIdx = game.markets.findIndex(m => m.market_type === update.market_type);
		if (marketIdx === -1) continue;

		// Clone outcomes array once per market
		const marketKey = `${gameIdx}:${marketIdx}`;
		if (!clonedMarkets.has(marketKey)) {
			game.markets[marketIdx] = { ...game.markets[marketIdx], outcomes: game.markets[marketIdx].outcomes.map(o => ({ ...o })) };
			clonedMarkets.add(marketKey);
		}
		const market = game.markets[marketIdx];

		const outcomeIdx = market.outcomes.findIndex(
			o => o.outcome_name.toLowerCase() === update.outcome_name.toLowerCase()
		);
		if (outcomeIdx === -1) continue;

		const outcome = { ...market.outcomes[outcomeIdx] };
		market.outcomes[outcomeIdx] = outcome;

		outcome.history = [...outcome.history, update.point];

		outcome.history_by_sportsbook = { ...outcome.history_by_sportsbook };
		const sbHistory = outcome.history_by_sportsbook[update.point.sportsbook] || [];
		outcome.history_by_sportsbook[update.point.sportsbook] = [...sbHistory, update.point];

		outcome.current_best_odds = update.point.odds;
		outcome.current_best_sportsbook = update.point.sportsbook;
	}

	return updated;
}
