import type { GameTerminalData, OutcomeLine } from '../types/terminal';

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

  if (sportsbookFilter.length > 0) {
    const sportsbooks = new Set(sportsbookFilter.map(s => s.toLowerCase()));
    filtered = filterBySportsbook(filtered, sportsbooks);
  }

  return filtered;
}

function filterBySportsbook(
  games: GameTerminalData[],
  sportsbooks: Set<string>
): GameTerminalData[] {
  const filteredGames: GameTerminalData[] = [];

  for (const game of games) {
    const filteredMarkets = game.markets
      .map(market => {
        const filteredOutcomes = market.outcomes
          .map(outcome => {
            const filteredHistory = outcome.history.filter(
              point => sportsbooks.has(point.sportsbook.toLowerCase())
            );

            if (filteredHistory.length === 0) return null;

            const latest = filteredHistory.reduce((a, b) =>
              a.timestamp > b.timestamp ? a : b
            );

            const filteredOutcome: OutcomeLine = {
              ...outcome,
              history: filteredHistory,
              current_best_odds: latest.odds,
              current_best_sportsbook: latest.sportsbook,
            };

            if (outcome.history_by_sportsbook) {
              const filteredBySb: Record<string, typeof outcome.history> = {};
              for (const [sb, points] of Object.entries(outcome.history_by_sportsbook)) {
                if (sportsbooks.has(sb.toLowerCase())) {
                  filteredBySb[sb] = points;
                }
              }
              filteredOutcome.history_by_sportsbook = filteredBySb;
            }

            return filteredOutcome;
          })
          .filter((o): o is OutcomeLine => o !== null);

        if (filteredOutcomes.length === 0) return null;

        return { ...market, outcomes: filteredOutcomes };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    if (filteredMarkets.length > 0) {
      filteredGames.push({ ...game, markets: filteredMarkets });
    }
  }

  return filteredGames;
}
