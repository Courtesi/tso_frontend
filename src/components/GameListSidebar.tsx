import { GameTerminalData } from '../services/api';

interface GameListSidebarProps {
	games: GameTerminalData[];
	selectedGame: GameTerminalData | null;
	onSelectGame: (game: GameTerminalData) => void;
}

function GameListSidebar({ games, selectedGame, onSelectGame }: GameListSidebarProps) {
	return (
		<div className="bg-gray-800 rounded-lg p-4 h-[calc(100vh-300px)] overflow-y-auto">
			<h2 className="text-xl font-bold mb-4">Games</h2>

			{games.length === 0 ? (
				<div className="text-gray-400 text-sm text-center py-8">
					No games available
				</div>
			) : (
				<div className="space-y-2">
					{games.map((game) => {
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
										? 'bg-indigo-600 text-white'
										: 'bg-gray-700 hover:bg-gray-600 text-gray-200'
								}`}
							>
								<div className="text-sm font-medium">{game.matchup}</div>
								<div className="text-xs opacity-75 mt-1">{game.league}</div>
								<div className="text-xs opacity-75">{gameTime}</div>
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
