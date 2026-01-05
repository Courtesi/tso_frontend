import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { api, GameTerminalData, MarketLines } from '../services/api';
import GameLineChart from '../components/GameLineChart';
import GameListSidebar from '../components/GameListSidebar';

function Terminal() {
	const { currentUser, userTier, loading: authLoading } = useAuth();
	const navigate = useNavigate();

	const [games, setGames] = useState<GameTerminalData[]>([]);
	const [selectedGame, setSelectedGame] = useState<GameTerminalData | null>(null);
	const [selectedMarket, setSelectedMarket] = useState<MarketLines | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [useSSE, setUseSSE] = useState(true);

	// Filters
	const [leagueFilter, setLeagueFilter] = useState<string>('');
	const [gameTimeFilter, setGameTimeFilter] = useState<string>('upcoming');

	useEffect(() => {
		if (authLoading) return;
		if (!currentUser) {
			navigate('/');
			return;
		}

		if (useSSE) {
			setLoading(true);
			setError('');

			const cleanup = api.streamTerminal(
				(data) => {
					setGames(data.data);
					setError('');
					setLoading(false);

					// Auto-select first game if none selected
					if (!selectedGame && data.data.length > 0) {
						setSelectedGame(data.data[0]);
						if (data.data[0].markets.length > 0) {
							setSelectedMarket(data.data[0].markets[0]);
						}
					}
				},
				(err) => {
					console.error('SSE failed, falling back to polling:', err);
					setUseSSE(false);
				},
				leagueFilter,
				gameTimeFilter
			);

			return cleanup;
		} else {
			// Polling fallback
			const fetchData = async (isInitial = false) => {
				if (isInitial) setLoading(true);
				setError('');

				try {
					const response = await api.getTerminalData(leagueFilter, gameTimeFilter);
					setGames(response.data);

					if (!selectedGame && response.data.length > 0) {
						setSelectedGame(response.data[0]);
						if (response.data[0].markets.length > 0) {
							setSelectedMarket(response.data[0].markets[0]);
						}
					}
				} catch (err: any) {
					console.error('Error fetching terminal data:', err);
					setError(err.message || 'Failed to load terminal data');
				} finally {
					if (isInitial) setLoading(false);
				}
			};

			fetchData(true);

			const pollInterval = userTier === 'premium' ? 5000 : 60000;
			const intervalId = setInterval(() => fetchData(false), pollInterval);

			return () => clearInterval(intervalId);
		}
	}, [currentUser, navigate, authLoading, userTier, useSSE, leagueFilter, gameTimeFilter]);

	if (authLoading) {
		return (
			<div className="min-h-screen text-white relative bg-zinc-800 flex items-center justify-center">
				<div className="text-center">
					<div className="text-gray-400 text-lg">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-white relative bg-zinc-800">
			<Navbar />

			<div className="px-4 py-20 pt-32">
				{/* Header */}
				<div className="max-w-7xl mx-auto mb-8">
					<h1 className="text-4xl font-bold mb-4">Line Movement Terminal</h1>

					{/* Info banner for free users */}
					{userTier === 'free' && (
						<div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4 mb-6">
							<p className="text-yellow-200 text-sm">
								Free tier: Viewing up to 10 games, updates every 60 seconds.{' '}
								<a href="/pricing" className="underline font-semibold">
									Upgrade to Premium
								</a>{' '}
								for unlimited games and real-time updates.
							</p>
						</div>
					)}

					{/* Filters */}
					<div className="flex gap-4 mb-6">
						<select
							value={gameTimeFilter}
							onChange={(e) => setGameTimeFilter(e.target.value)}
							className="bg-gray-700 text-white px-4 py-2 rounded-lg"
						>
							<option value="upcoming">Upcoming Games</option>
							<option value="live">Live Games</option>
						</select>

						<select
							value={leagueFilter}
							onChange={(e) => setLeagueFilter(e.target.value)}
							className="bg-gray-700 text-white px-4 py-2 rounded-lg"
						>
							<option value="">All Leagues</option>
							<option value="NBA">NBA</option>
							<option value="NFL">NFL</option>
							<option value="NHL">NHL</option>
							<option value="MLB">MLB</option>
							<option value="NCAAB">NCAAB</option>
							<option value="NCAAF">NCAAF</option>
						</select>
					</div>
				</div>

				{/* Main Content */}
				<div className="max-w-7xl mx-auto">
					{loading && (
						<div className="text-center text-gray-400 py-12">
							Loading terminal data...
						</div>
					)}

					{error && (
						<div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
							{error}
						</div>
					)}

					{!loading && !error && games.length > 0 && (
						<div className="grid grid-cols-12 gap-6">
							{/* Game List Sidebar */}
							<div className="col-span-12 lg:col-span-3">
								<GameListSidebar
									games={games}
									selectedGame={selectedGame}
									onSelectGame={(game) => {
										setSelectedGame(game);
										if (game.markets.length > 0) {
											setSelectedMarket(game.markets[0]);
										}
									}}
								/>
							</div>

							{/* Chart Area */}
							<div className="col-span-12 lg:col-span-9">
								{selectedGame && selectedMarket ? (
									<GameLineChart
										game={selectedGame}
										market={selectedMarket}
										onMarketChange={setSelectedMarket}
									/>
								) : (
									<div className="bg-gray-800 rounded-lg p-12 text-center">
										<p className="text-gray-400">Select a game to view line movements</p>
									</div>
								)}
							</div>
						</div>
					)}

					{!loading && !error && games.length === 0 && (
						<div className="bg-gradient-to-br from-indigo-400/40 via-indigo-500/30 to-indigo-400/30 backdrop-blur-md border border-indigo-500/10 shadow-xl rounded-lg p-12 text-center">
							<p className="text-gray-300 text-lg">No games available for the selected filters.</p>
							<p className="text-gray-400 text-sm mt-2">
								Try changing the league or game time filters, or check back later.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Terminal;
