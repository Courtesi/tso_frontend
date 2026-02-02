import { useMemo, useState, useEffect, useCallback } from 'react';
import { type SportsbookInfo, api } from '../services/api';
import type { GameTerminalData, OutcomeLine, LineDataPoint } from '../types/terminal';
import { useSettings, type OddsFormat } from '../contexts/SettingsContext';
import { formatOdds } from '../utils/oddsUtils';

// Cache sportsbook config at module level
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;

interface OddsScreenProps {
	game: GameTerminalData;
	outcomes: OutcomeLine[];
}

/**
 * Calculate the background color based on odds change.
 * Green for increase, red for decrease. Subtle intensity on dark gray background.
 */
function getOddsChangeColor(currentOdds: number, previousOdds: number): string {
	const change = currentOdds - previousOdds;
	if (change === 0) return 'transparent';

	// Positive change = odds went up (green), negative = went down (red)
	const isPositiveChange = change > 0;

	// Calculate subtle intensity (0-1) based on magnitude
	const absChange = Math.abs(change);
	const intensity = Math.min(absChange / 30, 1); // Cap at 30 units for max intensity

	// HSL color tuned for dark gray background (bg-gray-700/50 ~ lightness 25-30%)
	// Green: hsl(120, 25-50%, 20-30%)
	// Red: hsl(0, 25-50%, 20-30%)
	const hue = isPositiveChange ? 120 : 0;
	const saturation = 25 + intensity * 25; // 25% to 50%
	const lightness = 20 + intensity * 10; // 20% (subtle) to 30% (more visible)

	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get the previous odds value from history
 */
function getPreviousOdds(history: LineDataPoint[]): number | null {
	if (history.length < 2) return null;
	return history[history.length - 2].odds;
}

/**
 * Calculate average odds for an outcome across all sportsbooks
 */
function calculateAverage(outcome: OutcomeLine): number | null {
	if (!outcome.history_by_sportsbook) return null;

	const currentOdds = Object.values(outcome.history_by_sportsbook)
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

	return (
		<tr className="border-b border-gray-600/50 last:border-b-0">
			{/* First column - team name */}
			<td className="px-2 py-2 text-sm text-gray-200 min-w-[100px]">
				<div className="text-xs text-gray-300 truncate font-medium" title={teamName}>{teamName}</div>
			</td>

			{/* Second column - date/time spanning all rows (only rendered on first row) */}
			{isFirstRow && (
				<td
					className="px-2 py-2 text-center min-w-[70px] border-l border-gray-600/50"
					rowSpan={totalRows}
				>
					<div className="flex flex-col items-center justify-center h-full">
						<span className="font-medium text-xs text-gray-300">{formattedDate}</span>
						<span className="text-xs text-gray-500">{formattedTime}</span>
					</div>
				</td>
			)}

			{/* Average column */}
			<td className="px-2 py-2 text-center min-w-[60px] border-l border-gray-600/50">
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
				const history = outcome.history_by_sportsbook?.[book];
				const currentOdds = history?.[history.length - 1]?.odds;
				const previousOdds = history ? getPreviousOdds(history) : null;

				const bgColor =
					previousOdds !== null && currentOdds !== undefined
						? getOddsChangeColor(currentOdds, previousOdds)
						: 'transparent';

				return (
					<td
						key={book}
						className="px-1 py-2 text-center transition-colors duration-300 min-w-[50px]"
						style={{ backgroundColor: bgColor }}
					>
						{currentOdds !== undefined ? (
							<span className="font-medium text-white text-sm">
								{formatOdds(currentOdds, oddsFormat)}
							</span>
						) : (
							<span className="text-gray-500">-</span>
						)}
					</td>
				);
			})}
		</tr>
	);
}

function OddsScreen({ game, outcomes }: OddsScreenProps) {
	const { settings } = useSettings();
	const oddsFormat = settings?.oddsFormat || 'american';
	const [sportsbooks, setSportsbooks] = useState<Record<string, SportsbookInfo>>(sportsbooksCache || {});

	// Fetch sportsbook config on mount
	useEffect(() => {
		if (sportsbooksCache) return;

		api.getSportsbooks()
			.then(response => {
				sportsbooksCache = response.sportsbooks;
				setSportsbooks(response.sportsbooks);
			})
			.catch(err => {
				console.error('Failed to fetch sportsbooks config:', err);
			});
	}, []);

	// Helper function to get sportsbook icon path
	const getSportsbookIcon = useCallback((sportsbookName: string): string | null => {
		const normalized = sportsbookName.toLowerCase().replace(/\s+/g, '');
		const sportsbookInfo = sportsbooks[normalized];
		return sportsbookInfo ? `/sportsbook_icons/${sportsbookInfo.icon}` : null;
	}, [sportsbooks]);

	// Get all unique sportsbooks across all outcomes
	const allSportsbooks = useMemo(() => {
		const books = new Set<string>();
		outcomes.forEach(outcome => {
			if (outcome.history_by_sportsbook) {
				Object.keys(outcome.history_by_sportsbook).forEach(book => books.add(book));
			}
		});
		return Array.from(books).sort();
	}, [outcomes]);

	// Get team display name from outcome
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
			<div className="bg-gray-700/50 rounded-lg p-4">
				<p className="text-gray-400 text-sm">No odds data available.</p>
			</div>
		);
	}

	return (
		<div className="bg-zinc-950 border border-gray-600 rounded-lg">
			<div className="overflow-x-auto">
				<table className="min-w-full">
					<thead>
						<tr className="border-b border-gray-600">
							{/* Header for team column */}
							<th className="px-2 py-2 text-left text-xs font-semibold text-gray-300 min-w-[100px]">
								{/* No header text */}
							</th>
							{/* Header for date column */}
							<th className="px-2 py-2 text-center text-xs font-semibold text-gray-300 min-w-[70px] border-l border-gray-600/50">
								Date
							</th>
							<th className="px-2 py-2 text-center text-xs font-semibold text-gray-300 min-w-[60px] border-l border-gray-600/50">
								Avg
							</th>
							{allSportsbooks.map(book => {
								const iconPath = getSportsbookIcon(book);
								return (
									<th
										key={book}
										className="px-1 py-2 text-center min-w-[50px]"
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
		</div>
	);
}

export default OddsScreen;
