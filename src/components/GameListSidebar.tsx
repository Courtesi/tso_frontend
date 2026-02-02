import { useState, useMemo } from 'react';
import type { GameTerminalData } from '../types/terminal';

interface GameListSidebarProps {
	games: GameTerminalData[];
	selectedGame: GameTerminalData | null;
	onSelectGame: (game: GameTerminalData) => void;
}

function GameListSidebar({ games, selectedGame, onSelectGame }: GameListSidebarProps) {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredGames = useMemo(() => {
		if (!searchQuery.trim()) return games;
		const query = searchQuery.toLowerCase();
		return games.filter(game =>
			game.home_team.replace(/_/g, ' ').toLowerCase().includes(query) ||
			game.away_team.replace(/_/g, ' ').toLowerCase().includes(query) ||
			game.league.toLowerCase().includes(query)
		);
	}, [games, searchQuery]);

	return (
		<div className="bg-black border-t border-b border-l border-gray-600 rounded-lg p-4 h-[calc(100vh-300px)] overflow-y-auto">
			<h2 className="text-xl font-bold mb-4">Games</h2>

			{/* Search Input */}
			<div className="relative mb-4">
				<svg
					className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="text"
					placeholder="Search games..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full bg-gray-900 text-gray-200 placeholder-gray-400 rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
				{searchQuery && (
					<button
						onClick={() => setSearchQuery('')}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				)}
			</div>

			{games.length === 0 ? (
				<div className="text-gray-200 text-sm text-center py-8">
					No games available
				</div>
			) : filteredGames.length === 0 ? (
				<div className="text-gray-200 text-sm text-center py-8">
					No matching games
				</div>
			) : (
				<div className="space-y-2">
					{filteredGames.map((game) => {
						const isSelected = selectedGame?.event_id === game.event_id;
						const gameTime = new Date(game.start_time).toLocaleString([], {
							month: 'short',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						});

						return (
							<div
								key={game.event_id}
								onClick={() => onSelectGame(game)}
								className={`p-3 rounded-lg cursor-pointer transition-colors ${
									isSelected
										? 'bg-indigo-600 text-gray-50'
										: 'bg-gray-900 hover:bg-gray-700 text-gray-300'
								}`}
							>
								<div className="text-sm font-medium">{game.away_team.replace(/_/g, ' ')} @ {game.home_team.replace(/_/g, ' ')}</div>
								<div className="text-xs opacity-75 mt-1">{game.league} | {gameTime}</div>
								{game.game_status === 'live' && (
									<div className="text-xs text-red-400 font-bold mt-1">LIVE</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default GameListSidebar;
