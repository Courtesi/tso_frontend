import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GameLineChart from '../components/GameLineChart';
import GameListSidebar from '../components/GameListSidebar';

function Charts() {
	const { currentUser, userTier, loading: authLoading } = useAuth();
	const {
		chartsData: games,
		chartsLoading: loading,
		chartsError: error,
		selectedGame,
		setSelectedGame,
		leagueFilter,
		setLeagueFilter,
		gameTimeFilter,
		setGameTimeFilter
	} = useData();
	const navigate = useNavigate();

	useEffect(() => {
		if (authLoading) return;
		if (!currentUser) {
			navigate('/');
			return;
		}
	}, [currentUser, navigate, authLoading]);

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
			<Sidebar />

			<div className="ml-64 px-4 py-20 pt-24">
				{/* Header */}
				<div className="max-w-7xl mx-auto mb-8">
					<h1 className="text-4xl font-bold mb-4">Odds Charts</h1>

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
							className="bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer"
						>
							<option value="upcoming">Upcoming Games</option>
							<option value="live">Live Games</option>
						</select>

						<select
							value={leagueFilter}
							onChange={(e) => setLeagueFilter(e.target.value)}
							className="bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer"
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
									onSelectGame={setSelectedGame}
								/>
							</div>

							{/* Chart Area */}
							<div className="col-span-12 lg:col-span-9">
								{selectedGame ? (
									<GameLineChart game={selectedGame} />
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

export default Charts;
