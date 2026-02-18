import type { GameTerminalData } from '../types/terminal';

export function applyTerminalFilters(
  games: GameTerminalData[],
  gameTimeFilter: string,
  sportsbookFilter: string[]
): GameTerminalData[] {
  let filtered = games;

  if (gameTimeFilter) {
    filtered = filtered.filter(g => g.game_status === gameTimeFilter);
  }

  // Sportsbook filter: keep games that have ANY data from selected sportsbooks,
  // but preserve all sportsbooks' data within matching games
  if (sportsbookFilter.length > 0) {
    const sportsbooks = new Set(sportsbookFilter.map(s => s.toLowerCase()));
    filtered = filtered.filter(game =>
      game.markets.some(market =>
        market.outcomes.some(outcome =>
          outcome.history.some(point =>
            sportsbooks.has(point.sportsbook.toLowerCase())
          )
        )
      )
    );
  }

  // Only show games with data from 3+ distinct sportsbooks
  filtered = filtered.filter(game => {
    const sportsbooks = new Set<string>();
    for (const market of game.markets) {
      for (const outcome of market.outcomes) {
        if (outcome.history_by_sportsbook) {
          for (const sb of Object.keys(outcome.history_by_sportsbook)) {
            sportsbooks.add(sb.toLowerCase());
          }
        } else {
          for (const point of outcome.history) {
            sportsbooks.add(point.sportsbook.toLowerCase());
          }
        }
      }
    }
    return sportsbooks.size >= 3;
  });

  return filtered;
}
