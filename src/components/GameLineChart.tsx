import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData } from 'lightweight-charts';
import { GameTerminalData, MarketLines } from '../services/api';

interface GameLineChartProps {
	game: GameTerminalData;
	market: MarketLines;
	onMarketChange: (market: MarketLines) => void;
}

function GameLineChart({ game, market, onMarketChange }: GameLineChartProps) {
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

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
		};
	}, []);

	// Update chart data when market changes
	useEffect(() => {
		if (!chartRef.current) return;

		// Clear existing series
		seriesRefs.current.forEach((series) => {
			chartRef.current?.removeSeries(series);
		});
		seriesRefs.current.clear();

		// Create series for each outcome
		const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

		market.outcomes.forEach((outcome, index) => {
			const series = chartRef.current!.addLineSeries({
				color: colors[index % colors.length],
				lineWidth: 2,
				title: outcome.outcome_name,
			});

			// Convert history to chart data
			const data: LineData[] = outcome.history.map((point) => ({
				time: point.timestamp,
				value: point.odds,
			}));

			if (data.length > 0) {
				series.setData(data);
			}

			seriesRefs.current.set(outcome.outcome_id, series);
		});

		chartRef.current.timeScale().fitContent();
	}, [market]);

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

	return (
		<div className="bg-gray-800 rounded-lg p-6">
			{/* Header */}
			<div className="mb-4">
				<h2 className="text-2xl font-bold">{game.matchup}</h2>
				<p className="text-gray-400 text-sm">
					{new Date(game.start_time).toLocaleString()} • {game.league}
				</p>
			</div>

			{/* Market Tabs */}
			<div className="flex gap-2 mb-4">
				{game.markets.map((m) => (
					<button
						key={m.market_type}
						onClick={() => onMarketChange(m)}
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${
							market.market_type === m.market_type
								? 'bg-indigo-600 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
					>
						{m.market_display}
					</button>
				))}
			</div>

			{/* Chart */}
			<div ref={chartContainerRef} className="mb-4" />

			{/* Current Lines */}
			<div className="grid grid-cols-2 gap-4">
				{market.outcomes.map((outcome) => (
					<div
						key={outcome.outcome_id}
						className="bg-gray-700 rounded-lg p-4"
					>
						<div className="text-sm font-medium text-gray-300 mb-2">
							{outcome.outcome_name}
						</div>
						<div className="text-2xl font-bold text-white">
							{outcome.current_best_odds > 0 ? '+' : ''}{outcome.current_best_odds}
						</div>
						<div className="text-xs text-gray-400 mt-1">
							{outcome.current_best_sportsbook}
						</div>
						<div className="text-xs text-gray-500 mt-1">
							{outcome.history.length} data points
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default GameLineChart;
