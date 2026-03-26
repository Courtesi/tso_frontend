import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { type SportsbookInfo, api } from '../services/api';
import type { GameTerminalData, OutcomeLine } from '../types/terminal';
import { useSettings, type OddsFormat } from '../contexts/SettingsContext';
import { formatOdds } from '../utils/oddsUtils';
import GameChart from './GameChart';

// Cache sportsbook config at module level
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;

interface OddsScreenProps {
	game: GameTerminalData;
	outcomes: OutcomeLine[];
	// Chart expansion props
	onExpandChart?: () => void;
	historyLoaded?: boolean;
	historyLoading?: boolean;
}

interface ExpandableOddsScreenProps {
	game: GameTerminalData;
	onExpandChart: () => void;
	historyLoaded: boolean;
}

/**
 * Calculate average odds for an outcome across all sportsbooks
 */
function calculateAverage(outcome: OutcomeLine): number | null {
	// Use latest_by_sportsbook (odds-only load) or history_by_sportsbook (history load)
	const latestBySb = outcome.latest_by_sportsbook;
	const historyBySb = outcome.history_by_sportsbook;

	if (latestBySb && Object.keys(latestBySb).length > 0) {
		const values = Object.values(latestBySb).filter((o): o is number => o !== undefined);
		if (values.length === 0) return null;
		return values.reduce((a, b) => a + b, 0) / values.length;
	}

	if (!historyBySb) return null;
	const currentOdds = Object.values(historyBySb)
		.map(history => history[history.length - 1]?.odds)
		.filter((odds): odds is number => odds !== undefined);

	if (currentOdds.length === 0) return null;
	return currentOdds.reduce((a, b) => a + b, 0) / currentOdds.length;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return '';
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
}

/**
 * Format time for display
 */
function formatTime(dateString: string): string {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return '';
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});
}

interface OddsRowProps {
	outcome: OutcomeLine;
	sportsbooks: string[];
	isFirstRow: boolean;
	totalRows: number;
	gameStartTime: string;
	teamName: string;
	oddsFormat: OddsFormat;
}

function OddsRow({
	outcome,
	sportsbooks,
	isFirstRow,
	totalRows,
	gameStartTime,
	teamName,
	oddsFormat,
}: OddsRowProps) {
	const average = calculateAverage(outcome);
	const formattedDate = formatDate(gameStartTime);
	const formattedTime = formatTime(gameStartTime);

	// Track last-seen odds per book to detect real changes
	const prevOddsRef = useRef<Map<string, number>>(new Map());
	// Monotonically increasing counter per book; incrementing forces overlay remount
	const generationRef = useRef<Map<string, number>>(new Map());
	// Drives rendered flash overlays: book -> { direction, generation }
	const [flashMap, setFlashMap] = useState<Map<string, { direction: 'up' | 'down'; generation: number }>>(new Map());

	useEffect(() => {
		const updates: Array<[string, { direction: 'up' | 'down'; generation: number }]> = [];

		for (const book of sportsbooks) {
			const latestOdds = outcome.latest_by_sportsbook?.[book];
			const history = outcome.history_by_sportsbook?.[book];
			const currentOdds = latestOdds ?? history?.[history.length - 1]?.odds;

			if (currentOdds === undefined) continue;

			const prevOdds = prevOddsRef.current.get(book);
			if (prevOdds !== undefined && currentOdds !== prevOdds) {
				const gen = (generationRef.current.get(book) ?? 0) + 1;
				generationRef.current.set(book, gen);
				updates.push([book, { direction: currentOdds > prevOdds ? 'up' : 'down', generation: gen }]);
			}
			prevOddsRef.current.set(book, currentOdds);
		}

		if (updates.length > 0) {
			setFlashMap(prev => {
				const next = new Map(prev);
				for (const [book, info] of updates) next.set(book, info);
				return next;
			});
		}
	}, [outcome, sportsbooks]);

	return (
		<tr className="border-b border-gray-600/50 last:border-b-0">
			{/* First column - team name */}
			<td className="px-2 py-2 text-sm text-gray-200 w-[140px] overflow-hidden">
				<div className="text-xs text-gray-300 truncate font-medium" title={teamName}>{teamName}</div>
			</td>

			{/* Second column - date/time spanning all rows (only rendered on first row) */}
			{isFirstRow && (
				<td
					className="px-2 py-2 text-center w-[80px] overflow-hidden border-l border-gray-600/50"
					rowSpan={totalRows}
				>
					<div className="flex flex-col items-center justify-center h-full">
						<span className="font-medium text-xs text-gray-300">{formattedDate}</span>
						<span className="text-xs text-gray-500">{formattedTime}</span>
					</div>
				</td>
			)}

			{/* Average column */}
			<td className="px-2 py-2 text-center w-36 border-l border-gray-600/50">
				{average !== null ? (
					<span className="font-bold text-white text-sm">
						{formatOdds(average, oddsFormat)}
					</span>
				) : (
					<span className="text-gray-500">-</span>
				)}
			</td>

			{/* Sportsbook columns */}
			{sportsbooks.map(book => {
				// Prefer latest_by_sportsbook (odds-only load) then fall back to history
				const latestOdds = outcome.latest_by_sportsbook?.[book];
				const history = outcome.history_by_sportsbook?.[book];
				const currentOdds = latestOdds ?? history?.[history.length - 1]?.odds;
				const flash = flashMap.get(book);

				return (
					<td
						key={book}
						className="relative px-1 py-2 text-center w-36"
					>
						{flash && (
							<div
								key={`${book}-${flash.generation}`}
								className={`absolute inset-0 ${flash.direction === 'up' ? 'animate-flash-green' : 'animate-flash-red'}`}
							/>
						)}
						{currentOdds !== undefined ? (
							<span className="relative z-10 font-medium text-white text-sm">
								{formatOdds(currentOdds, oddsFormat)}
							</span>
						) : (
							<span className="relative z-10 text-gray-500">-</span>
						)}
					</td>
				);
			})}
		</tr>
	);
}

function OddsTable({ game, outcomes }: { game: GameTerminalData; outcomes: OutcomeLine[] }) {
	const { settings } = useSettings();
	const oddsFormat = settings?.oddsFormat || 'american';
	const [sportsbooks, setSportsbooks] = useState<Record<string, SportsbookInfo>>(sportsbooksCache || {});

	useEffect(() => {
		if (sportsbooksCache) return;
		api.getSportsbooks()
			.then(response => {
				sportsbooksCache = response.sportsbooks;
				setSportsbooks(response.sportsbooks);
			})
			.catch(err => console.error('Failed to fetch sportsbooks config:', err));
	}, []);

	const getSportsbookIcon = useCallback((sportsbookName: string): string | null => {
		const normalized = sportsbookName.toLowerCase().replace(/\s+/g, '');
		const sportsbookInfo = sportsbooks[normalized];
		return sportsbookInfo ? `/sportsbook_icons/${sportsbookInfo.icon}` : null;
	}, [sportsbooks]);

	// Collect all sportsbooks across outcomes (union of latest_by_sportsbook and history_by_sportsbook)
	const allSportsbooks = useMemo(() => {
		const books = new Set<string>();
		outcomes.forEach(outcome => {
			if (outcome.latest_by_sportsbook) {
				Object.keys(outcome.latest_by_sportsbook).forEach(b => books.add(b));
			}
			if (outcome.history_by_sportsbook) {
				Object.keys(outcome.history_by_sportsbook).forEach(b => books.add(b));
			}
		});
		return Array.from(books).sort();
	}, [outcomes]);

	const getTeamName = (outcome: OutcomeLine): string => {
		const parsedTeam = outcome.outcome_id.split('_')[0];
		const homeTeam = game.home_team.toLowerCase().replace(/\s+/g, '');
		const awayTeam = game.away_team.toLowerCase().replace(/\s+/g, '');

		if (parsedTeam.toLowerCase().includes(homeTeam) || homeTeam.includes(parsedTeam.toLowerCase())) {
			return game.home_team.replace(/_/g, ' ');
		} else if (parsedTeam.toLowerCase().includes(awayTeam) || awayTeam.includes(parsedTeam.toLowerCase())) {
			return game.away_team.replace(/_/g, ' ');
		}
		return outcome.outcome_name.replace(/_/g, ' ');
	};

	if (allSportsbooks.length === 0) {
		return (
			<div className="p-4">
				<p className="text-gray-400 text-sm">No odds data available.</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="table-fixed">
				<thead>
					<tr className="border-b border-t border-gray-600">
						<th className="px-2 py-2 text-left text-xs font-semibold text-gray-300 w-[140px]" />
						<th className="px-2 py-2 text-center text-xs font-semibold text-gray-300 w-[80px] border-l border-gray-600/50">
							Date
						</th>
						<th className="px-2 py-2 text-center text-xs font-semibold text-gray-300 w-36 border-l border-gray-600/50">
							Avg
						</th>
						{allSportsbooks.map(book => {
							const iconPath = getSportsbookIcon(book);
							return (
								<th
									key={book}
									className="px-1 py-2 text-center w-36"
									title={book}
								>
									{iconPath ? (
										<img
											src={iconPath}
											alt={book}
											className="w-5 h-5 rounded object-contain mx-auto"
										/>
									) : (
										<span className="text-xs font-semibold text-gray-300 truncate block max-w-[50px]">
											{book.slice(0, 4)}
										</span>
									)}
								</th>
							);
						})}
					</tr>
				</thead>
				<tbody>
					{outcomes.map((outcome, index) => (
						<OddsRow
							key={outcome.outcome_id}
							outcome={outcome}
							sportsbooks={allSportsbooks}
							isFirstRow={index === 0}
							totalRows={outcomes.length}
							gameStartTime={game.start_time}
							teamName={getTeamName(outcome)}
							oddsFormat={oddsFormat}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}

/**
 * ExpandableOddsScreen — a full game card with odds table + expandable chart.
 * This is the primary export used by the Charts page.
 */
export function ExpandableOddsScreen({ game, onExpandChart, historyLoaded }: ExpandableOddsScreenProps) {
	const [expanded, setExpanded] = useState(false);
	const [historyLoading, setHistoryLoading] = useState(false);
	const chartFetchedRef = useRef(false);

	const moneylineMarket = game.markets.find(m => m.market_type === 'MONEY');
	const outcomes = moneylineMarket?.outcomes ?? [];

	const gameStatusBadge = () => {
		if (game.game_status === 'live') {
			return (
				<span className="flex items-center gap-1 text-xs text-red-400 font-medium">
					<span className="relative flex h-1.5 w-1.5">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
					</span>
					Live
				</span>
			);
		}
		if (game.game_status === 'completed') {
			return <span className="text-xs text-gray-500">Final</span>;
		}
		return null;
	};

	const handleToggle = async () => {
		const willExpand = !expanded;
		setExpanded(willExpand);

		if (willExpand && !historyLoaded && !chartFetchedRef.current) {
			chartFetchedRef.current = true;
			setHistoryLoading(true);
			await onExpandChart();
			setHistoryLoading(false);
		}
	};

	return (
		<div className="bg-zinc-950 border border-gray-600 rounded-lg overflow-hidden">
			{/* Game header — always visible */}
			<button
				onClick={handleToggle}
				className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900 transition-colors cursor-pointer"
			>
				<div className="flex items-center gap-3 min-w-0">
					<span className="text-sm font-semibold text-white truncate">
						{game.away_team.replace(/_/g, ' ')} @ {game.home_team.replace(/_/g, ' ')}
					</span>
					<span className="text-xs text-gray-500 shrink-0">{game.league}</span>
					{gameStatusBadge()}
				</div>
				<svg
					className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{/* Odds table — always visible */}
			{outcomes.length > 0 && (
				<OddsTable game={game} outcomes={outcomes} />
			)}

			{/* Expanded chart area */}
			{expanded && (
				<div className="border-t border-gray-600">
					{historyLoading ? (
						<div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
							<svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
							</svg>
							Loading chart history…
						</div>
					) : historyLoaded ? (
						<div className="p-4">
							<GameChart game={game} />
						</div>
					) : (
						<div className="flex items-center justify-center py-12 text-gray-500 text-sm">
							No history available.
						</div>
					)}
				</div>
			)}
		</div>
	);
}

/**
 * Legacy OddsScreen — kept for use inside GameLineChart (odds table only, no expand).
 */
function OddsScreen({ game, outcomes }: OddsScreenProps) {
	return (
		<div className="bg-zinc-950 border border-gray-600 rounded-lg">
			<OddsTable game={game} outcomes={outcomes} />
		</div>
	);
}

export default OddsScreen;
