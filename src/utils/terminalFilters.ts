import type { GameTerminalData } from '../types/terminal';

export function applyTerminalFilters(
  games: GameTerminalData[],
  leagueFilter: string[],
  gameTimeFilter: string,
  sportsbookFilter: string[]
): GameTerminalData[] {
  let filtered = games;

  if (leagueFilter.length > 0) {
    const leagues = new Set(leagueFilter.map(l => l.toUpperCase()));
    filtered = filtered.filter(g => leagues.has(g.league.toUpperCase()));
  }

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

  return filtered;
}
