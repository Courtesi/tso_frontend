import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type LineData, LineSeries} from 'lightweight-charts';
import { type GameTerminalData, type OutcomeLine } from '../services/api';

interface GameLineChartProps {
	game: GameTerminalData;
}

function GameLineChart({ game }: GameLineChartProps) {
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

	// Get moneyline market (should only be one)
	const moneylineMarket = game.markets.find(m => m.market_type === 'MONEY');
	const outcomes = moneylineMarket?.outcomes || [];

	// State for selected team/outcome
	const [selectedOutcome, setSelectedOutcome] = useState<OutcomeLine | null>(
		outcomes.length > 0 ? outcomes[0] : null
	);

	// Update selected outcome when game changes or data refreshes
	useEffect(() => {
		if (outcomes.length > 0) {
			// Preserve selection by outcome_id across data refreshes
			if (selectedOutcome) {
				const updatedOutcome = outcomes.find(o => o.outcome_id === selectedOutcome.outcome_id);

				if (updatedOutcome) {
					// Update to new version of same outcome (preserves selection during refresh)
					setSelectedOutcome(updatedOutcome);
				} else {
					// Outcome no longer exists (game changed), select first
					setSelectedOutcome(outcomes[0]);
				}
			} else {
				// No outcome selected yet, select first
				setSelectedOutcome(outcomes[0]);
			}
		} else {
			setSelectedOutcome(null);
		}
	}, [outcomes]); // Depend on outcomes array to catch data updates

	// Initialize chart
	useEffect(() => {
		if (!chartContainerRef.current) return;

		const chart = createChart(chartContainerRef.current, {
			width: chartContainerRef.current.clientWidth,
			height: 500,
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

		// Cleanup on unmount
		return () => {
			chart.remove();
			chartRef.current = null;
			seriesRefs.current.clear();
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

			// Convert history to chart data
			const rawData: LineData[] = history.map((point) => ({
				time: point.timestamp as LineData['time'],
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
				<h2 className="text-2xl font-bold">{game.matchup.replace(/_/g, ' ')}</h2>
				<p className="text-gray-400 text-sm">
					{new Date(game.start_time).toLocaleString()} • {game.league}
				</p>
			</div>

			{/* Team Tabs */}
			<div className="flex gap-2 mb-4">
				{outcomes.map((outcome) => (
					<button
						key={outcome.outcome_id}
						onClick={() => setSelectedOutcome(outcome)}
						className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
							selectedOutcome?.outcome_id === outcome.outcome_id
								? 'bg-indigo-600 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
					>
						{outcome.outcome_name.replace(/_/g, ' ')}
					</button>
				))}
			</div>

			{/* Chart */}
			<div ref={chartContainerRef} className="mb-4" />

			{/* Current Lines by Sportsbook */}
			<div className="grid grid-cols-3 gap-4">
				{selectedOutcome?.history_by_sportsbook &&
					Object.entries(selectedOutcome.history_by_sportsbook).map(([sportsbook, history]) => {
						const latestOdds = history[history.length - 1]?.odds || 0;
						return (
							<div
								key={sportsbook}
								className="bg-gray-700 rounded-lg p-4"
							>
								<div className="text-sm font-medium text-gray-300 mb-2">
									{sportsbook}
								</div>
								<div className="text-2xl font-bold text-white">
									{latestOdds > 0 ? '+' : ''}{latestOdds}
								</div>
								<div className="text-xs text-gray-500 mt-1">
									{history.length} data points
								</div>
							</div>
						);
					})
				}
			</div>
		</div>
	);
}

export default GameLineChart;
