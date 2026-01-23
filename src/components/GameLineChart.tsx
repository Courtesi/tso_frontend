import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type LineData, LineSeries} from 'lightweight-charts';
import { type GameTerminalData, type OutcomeLine } from '../services/api';
import OddsScreen from './OddsScreen';

interface GameLineChartProps {
	game: GameTerminalData;
}

function GameLineChart({ game }: GameLineChartProps) {
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

	// Get moneyline market (should only be one)
	const moneylineMarket = game.markets.find(m => m.market_type === 'MONEY');

	// Helper function to determine if outcome is home or away team
	const getTeamType = useCallback((outcome: OutcomeLine): 'home' | 'away' | null => {
		// Parse team name from outcome_id (e.g., "lakers_ml" -> "lakers")
		const parsedTeam = outcome.outcome_id.split('_')[0].toLowerCase();
		const homeTeam = game.home_team.toLowerCase().replace(/\s+/g, '');
		const awayTeam = game.away_team.toLowerCase().replace(/\s+/g, '');

		if (parsedTeam.includes(homeTeam) || homeTeam.includes(parsedTeam)) {
			return 'home';
		} else if (parsedTeam.includes(awayTeam) || awayTeam.includes(parsedTeam)) {
			return 'away';
		}
		return null;
	}, [game.home_team, game.away_team]);

	// Memoize outcomes with team type enrichment
	const outcomes = useMemo(() => {
		const baseOutcomes = moneylineMarket?.outcomes || [];
		// Sort outcomes to show home team first
		return baseOutcomes.sort((a, b) => {
			const aType = getTeamType(a);
			const bType = getTeamType(b);
			if (aType === 'home' && bType === 'away') return -1;
			if (aType === 'away' && bType === 'home') return 1;
			return 0;
		});
	}, [moneylineMarket?.outcomes, getTeamType]);

	// State for selected team/outcome
	const [selectedOutcome, setSelectedOutcome] = useState<OutcomeLine | null>(
		outcomes.length > 0 ? outcomes[0] : null
	);

	// Update selected outcome when game changes or data refreshes
	useEffect(() => {
		// Use functional update to access previous state without adding it to dependencies
		setSelectedOutcome(prevSelected => {
			// No outcomes available, clear selection
			if (outcomes.length === 0) {
				return null;
			}

			// Preserve selection by outcome_id across data refreshes
			if (prevSelected) {
				const updatedOutcome = outcomes.find(o => o.outcome_id === prevSelected.outcome_id);
				// Return updated version of same outcome, or fall back to first outcome
				return updatedOutcome || outcomes[0];
			}

			// No previous selection, select first outcome
			return outcomes[0];
		});
	}, [outcomes]);

	// Initialize chart
	useEffect(() => {
		if (!chartContainerRef.current) return;

		const chart = createChart(chartContainerRef.current, {
			width: chartContainerRef.current.clientWidth,
			height: 400,
			layout: {
				background: { color: '#1f2937' },
				textColor: '#d1d5db',
			},
			grid: {
				vertLines: { color: '#374151' },
				horzLines: { color: '#374151' },
			},
			timeScale: {
				timeVisible: true,
				secondsVisible: false,
			},
		});

		chartRef.current = chart;

		// Capture ref values for cleanup
		const currentSeriesRefs = seriesRefs.current;

		// Cleanup on unmount
		return () => {
			chart.remove();
			chartRef.current = null;
			currentSeriesRefs.clear();
		};
	}, []);

	// Consistent color mapping for sportsbooks
	const getSportsbookColor = (sportsbook: string): string => {
		const colorMap: Record<string, string> = {
			'Fliff': '#ef4444',        // Red
			'Novig': '#3b82f6',        // Blue
			'BetMGM': '#f59e0b',       // Amber
			'DraftKings': '#10b981',   // Green
			'FanDuel': '#3b82f6',      // Blue
			'Caesars': '#8b5cf6',      // Purple
			'BetRivers': '#ec4899',    // Pink
			'PointsBet': '#14b8a6',    // Teal
			'ProphetX': '#f97316',     // Orange
			'Bet365': '#84cc16',       // Lime
			'Unibet': '#06b6d4',       // Cyan
			'Ballybet': '#a855f7',     // Purple
			'ESPN BET': '#ef4444',     // Red
			'Fanatics': '#0ea5e9',     // Sky blue
			'Kalshi': '#00d26a',       // Kalshi green
		};

		// Return mapped color or generate consistent hash-based color
		if (colorMap[sportsbook]) {
			return colorMap[sportsbook];
		}

		// Generate consistent color from sportsbook name
		let hash = 0;
		for (let i = 0; i < sportsbook.length; i++) {
			hash = sportsbook.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue = Math.abs(hash) % 360;
		return `hsl(${hue}, 70%, 60%)`;
	};

	// Update chart data when selected outcome changes
	useEffect(() => {
		if (!chartRef.current || !selectedOutcome || !selectedOutcome.history_by_sportsbook) return;

		// Clear existing series
		seriesRefs.current.forEach((series) => {
			if (series && chartRef.current) {
				chartRef.current.removeSeries(series);
			}
		});
		seriesRefs.current.clear();

		// Create series for each sportsbook
		const sportsbooks = Object.keys(selectedOutcome.history_by_sportsbook);

		sportsbooks.forEach((sportsbook) => {
			const history = selectedOutcome.history_by_sportsbook![sportsbook];

			const series = chartRef.current!.addSeries(LineSeries, {
				color: getSportsbookColor(sportsbook),
				lineWidth: 2,
				title: sportsbook,
			});

			// Convert history to chart data with local timezone adjustment
			// getTimezoneOffset() returns minutes difference from UTC (positive for west of UTC)
			// We subtract this offset to convert UTC timestamps to local time for display
			const timezoneOffsetSeconds = new Date().getTimezoneOffset() * 60;

			const rawData: LineData[] = history.map((point) => ({
				// Adjust Unix timestamp to display in local timezone instead of UTC
				time: (point.timestamp - timezoneOffsetSeconds) as LineData['time'],
				value: point.odds,
			}));

			// Sort by time and remove duplicates
			const dataMap = new Map<number, number>();
			rawData.forEach((point) => {
				dataMap.set(point.time as number, point.value);
			});

			const data: LineData[] = Array.from(dataMap.entries())
				.sort((a, b) => a[0] - b[0])
				.map(([time, value]) => ({
					time: time as LineData['time'],
					value,
				}));

			if (data.length > 0) {
				series.setData(data);
			}

			seriesRefs.current.set(sportsbook, series);
		});

		chartRef.current.timeScale().fitContent();
	}, [selectedOutcome]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			if (chartRef.current && chartContainerRef.current) {
				chartRef.current.applyOptions({
					width: chartContainerRef.current.clientWidth,
				});
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	if (!moneylineMarket || outcomes.length === 0) {
		return (
			<div className="bg-gray-800 rounded-lg p-6">
				<p className="text-gray-400">No moneyline data available for this game.</p>
			</div>
		);
	}

	return (
		<div className="bg-gray-800 rounded-lg p-6">
			{/* Header */}
			<div className="mb-4">
				<h2 className="text-2xl font-bold">{game.away_team.replace(/_/g, ' ')} @ {game.home_team.replace(/_/g, ' ')}</h2>
				<p className="text-gray-400 text-sm">
					{new Date(game.start_time).toLocaleString()} • {game.league}
				</p>
			</div>

			{/* Team Tabs */}
			<div className="flex gap-2 mb-4">
				{outcomes.map((outcome) => {
					const teamType = getTeamType(outcome);
					const displayLabel = teamType === 'home'
						? `Home (${game.home_team.replace(/_/g, ' ')})`
						: teamType === 'away'
						? `Away (${game.away_team.replace(/_/g, ' ')})`
						: outcome.outcome_name.replace(/_/g, ' ');

					return (
						<button
							key={outcome.outcome_id}
							onClick={() => setSelectedOutcome(outcome)}
							className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
								selectedOutcome?.outcome_id === outcome.outcome_id
									? 'bg-indigo-600 text-white'
									: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
							}`}
						>
							{displayLabel}
						</button>
					);
				})}
			</div>

			{/* Chart */}
			<div ref={chartContainerRef} className="mb-4" />

			{/* Odds Screen */}
			<OddsScreen game={game} outcomes={outcomes} />
		</div>
	);
}

export default GameLineChart;
