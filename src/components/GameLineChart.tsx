/**
 * GameLineChart — standalone chart view with header, team tabs, chart, and odds table.
 * Used only when displaying a chart outside the Charts page (e.g., linked directly).
 * The Charts page uses ExpandableOddsScreen (from OddsScreen.tsx) instead.
 */
import { useMemo, useCallback } from 'react';
import type { GameTerminalData, OutcomeLine } from '../types/terminal';
import OddsScreen from './OddsScreen';
import GameChart from './GameChart';

interface GameLineChartProps {
	game: GameTerminalData;
}

function GameLineChart({ game }: GameLineChartProps) {
	const moneylineMarket = game.markets.find(m => m.market_type === 'MONEY');

	const getTeamType = useCallback((outcome: OutcomeLine): 'home' | 'away' | null => {
		const parsedTeam = outcome.outcome_id.split('_')[0].toLowerCase();
		const homeTeam = game.home_team.toLowerCase().replace(/\s+/g, '');
		const awayTeam = game.away_team.toLowerCase().replace(/\s+/g, '');
		if (parsedTeam.includes(homeTeam) || homeTeam.includes(parsedTeam)) return 'home';
		if (parsedTeam.includes(awayTeam) || awayTeam.includes(parsedTeam)) return 'away';
		return null;
	}, [game.home_team, game.away_team]);

	const outcomes = useMemo(() => {
		const base = moneylineMarket?.outcomes || [];
		return [...base].sort((a, b) => {
			const aType = getTeamType(a);
			const bType = getTeamType(b);
			if (aType === 'home' && bType === 'away') return -1;
			if (aType === 'away' && bType === 'home') return 1;
			return 0;
		});
	}, [moneylineMarket?.outcomes, getTeamType]);

	if (!moneylineMarket || outcomes.length === 0) {
		return (
			<div className="bg-black rounded-lg p-6">
				<p className="text-gray-400">No moneyline data available for this game.</p>
			</div>
		);
	}

	return (
		<div className="bg-black border-2 border-gray-500 rounded-lg p-6">
			{/* Header */}
			<div className="mb-4">
				<h2 className="text-2xl text-gray-200 font-bold">
					{game.away_team.replace(/_/g, ' ')} @ {game.home_team.replace(/_/g, ' ')}
				</h2>
				<p className="text-gray-400 text-sm">
					{new Date(game.start_time).toLocaleString()} • {game.league}
				</p>
			</div>

			{/* Chart + team tabs */}
			<GameChart game={game} />

			{/* Odds table */}
			<div className="mt-4">
				<OddsScreen game={game} outcomes={outcomes} />
			</div>
		</div>
	);
}

export default GameLineChart;
