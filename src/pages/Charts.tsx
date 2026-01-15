import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GameLineChart from '../components/GameLineChart';
import GameListSidebar from '../components/GameListSidebar';

// Leagues available to free tier users
const FREE_TIER_LEAGUES = ['NBA', 'NFL', 'MLB'];
const ALL_LEAGUES = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF'];

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
		setGameTimeFilter,
		sportsbookFilter,
		setSportsbookFilter
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

			<div className="md:ml-64 px-4 py-20 pt-24">
				{/* Header */}
				<div className="max-w-7xl mx-auto mb-8">
					{/* Info banner for free users */}
					{userTier === 'free' && (
						<div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4 mb-6">
							<p className="text-yellow-200 text-sm">
								Free tier: NBA/NFL/MLB only, up to 10 games.{' '}
								<a href="/pricing" className="underline font-semibold">
									Upgrade to Premium
								</a>{' '}
								for all leagues, unlimited games, and real-time updates.
							</p>
						</div>
					)}
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

					{!loading && !error && (
						<div className="grid grid-cols-12 gap-4 lg:gap-6">
							{/* Chart Area */}
							<div className="col-span-12 lg:col-span-9 order-2 lg:order-1">
								{games.length > 0 && selectedGame ? (
									<GameLineChart game={selectedGame} />
								) : games.length > 0 ? (
									<div className="bg-gray-800 rounded-lg p-12 text-center">
										<p className="text-gray-400">Select a game to view line movements</p>
									</div>
								) : (
									<div className="bg-gradient-to-br from-indigo-400/40 via-indigo-500/30 to-indigo-400/30 backdrop-blur-md border border-indigo-500/10 shadow-xl rounded-lg p-12 text-center">
										<p className="text-gray-300 text-lg">No games available for the selected filters.</p>
										<p className="text-gray-400 text-sm mt-2">
											Try changing the league or game time filters, or check back later.
										</p>
									</div>
								)}
							</div>

							{/* Sidebar Container - Filters + Game List */}
							<div className="col-span-12 lg:col-span-3 order-1 lg:order-2">
								{/* Filters */}
								<div className="flex flex-col sm:flex-row lg:flex-col gap-4 mb-4">
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
										onChange={(e) => {
											const value = e.target.value;
											// Prevent selecting locked leagues for free users
											if (userTier === 'free' && value && !FREE_TIER_LEAGUES.includes(value)) {
												return;
											}
											setLeagueFilter(value);
										}}
										className="bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer"
									>
										<option value="">All Leagues</option>
										{ALL_LEAGUES.map(league => {
											const isLocked = userTier === 'free' && !FREE_TIER_LEAGUES.includes(league);
											return (
												<option
													key={league}
													value={league}
													disabled={isLocked}
													className={isLocked ? 'text-gray-500' : ''}
												>
													{league}{isLocked ? ' (Premium)' : ''}
												</option>
											);
										})}
									</select>

									<div className="bg-gray-700 rounded-lg p-3">
										<div className="flex items-center justify-between mb-2">
											<label className="text-sm text-gray-400">Sportsbooks</label>
											{sportsbookFilter.length > 0 && (
												<button
													onClick={() => setSportsbookFilter([])}
													className="text-xs text-indigo-400 hover:text-indigo-300 underline"
												>
													Clear all
												</button>
											)}
										</div>
										<div className="space-y-1 max-h-48 overflow-y-auto">
											{['draftkings', 'fanduel', 'betmgm', 'caesars', 'fliff', 'novig', 'prophetx', 'kalshi'].map(sb => (
												<label key={sb} className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 px-2 py-1 rounded">
													<input
														type="checkbox"
														checked={sportsbookFilter.includes(sb)}
														onChange={(e) => {
															if (e.target.checked) {
																setSportsbookFilter([...sportsbookFilter, sb]);
															} else {
																setSportsbookFilter(sportsbookFilter.filter(s => s !== sb));
															}
														}}
														className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
													/>
													<span className="text-sm text-white capitalize">{sb}</span>
												</label>
											))}
										</div>
									</div>
								</div>

								{/* Game List */}
								<GameListSidebar
									games={games}
									selectedGame={selectedGame}
									onSelectGame={setSelectedGame}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Charts;
