import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import { api, type SportsbookInfo } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GameLineChart from '../components/GameLineChart';
import GameListSidebar from '../components/GameListSidebar';

// Leagues available to free tier users
const FREE_TIER_LEAGUES = ['NBA', 'NFL', 'MLB'];
const ALL_LEAGUES = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF'];

// Cache sportsbook config at module level to avoid refetching
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;

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
	const { isCollapsed } = useSidebar();
	const navigate = useNavigate();

	const [sportsbookDropdownOpen, setSportsbookDropdownOpen] = useState(false);
	const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
	const sportsbookDropdownRef = useRef<HTMLDivElement>(null);
	const leagueDropdownRef = useRef<HTMLDivElement>(null);
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

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sportsbookDropdownRef.current && !sportsbookDropdownRef.current.contains(event.target as Node)) {
				setSportsbookDropdownOpen(false);
			}
			if (leagueDropdownRef.current && !leagueDropdownRef.current.contains(event.target as Node)) {
				setLeagueDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (authLoading) return;
		if (!currentUser) {
			navigate('/');
			return;
		}
	}, [currentUser, navigate, authLoading]);

	const handleSportsbookToggle = (sportsbook: string) => {
		if (sportsbookFilter.includes(sportsbook)) {
			setSportsbookFilter(sportsbookFilter.filter(s => s !== sportsbook));
		} else {
			setSportsbookFilter([...sportsbookFilter, sportsbook]);
		}
	};

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

			<div className={`px-4 py-20 pt-24 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
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
									{/* Toggle Switch for Upcoming/Live */}
									<div className="flex justify-end mb-2">
										<div className="flex items-center bg-gray-700 rounded-lg p-1 w-fit">
											<button
												onClick={() => setGameTimeFilter('upcoming')}
												className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
													gameTimeFilter === 'upcoming'
														? 'bg-indigo-600 text-white shadow-md'
														: 'text-gray-400 hover:text-white'
												}`}
											>
												Upcoming
											</button>
											<button
												onClick={() => setGameTimeFilter('live')}
												className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
													gameTimeFilter === 'live'
														? 'bg-indigo-600 text-white shadow-md'
														: 'text-gray-400 hover:text-white'
												}`}
											>
												<span className="relative flex h-2 w-2">
													<span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gameTimeFilter === 'live' ? 'bg-red-400' : 'bg-red-500'}`}></span>
													<span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
												</span>
												Live
											</button>
										</div>
									</div>

									<div className="relative" ref={leagueDropdownRef}>
										<button
											onClick={(e) => {
												e.stopPropagation();
												setLeagueDropdownOpen(!leagueDropdownOpen);
											}}
											className="w-full bg-gray-700 text-white px-3 py-1.5 h-[34px] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between text-sm"
										>
											<span>{leagueFilter || 'All Leagues'}</span>
											<svg
												className={`w-4 h-4 ml-2 transition-transform ${leagueDropdownOpen ? 'rotate-180' : ''}`}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{leagueDropdownOpen && (
											<>
												<div
													className="fixed inset-0 z-40"
													onClick={() => setLeagueDropdownOpen(false)}
												/>
												<div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-50">
													<div className="py-1">
													<button
														onClick={() => {
															setLeagueFilter('');
															setLeagueDropdownOpen(false);
														}}
														className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 cursor-pointer ${!leagueFilter ? 'text-indigo-400' : 'text-white'}`}
													>
														All Leagues
													</button>
													{ALL_LEAGUES.map(league => {
														const isLocked = userTier === 'free' && !FREE_TIER_LEAGUES.includes(league);
														return (
															<button
																key={league}
																onClick={() => {
																	if (!isLocked) {
																		setLeagueFilter(league);
																		setLeagueDropdownOpen(false);
																	}
																}}
																disabled={isLocked}
																className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 ${
																	leagueFilter === league ? 'text-indigo-400 cursor-pointer' : isLocked ? 'text-gray-500 cursor-not-allowed' : 'text-white cursor-pointer'
																}`}
															>
																{league}{isLocked ? ' (Premium)' : ''}
															</button>
														);
													})}
												</div>
											</div>
											</>
										)}
									</div>

									<div className="relative" ref={sportsbookDropdownRef}>
										<button
											onClick={() => setSportsbookDropdownOpen(!sportsbookDropdownOpen)}
											className="w-full bg-gray-700 text-white px-3 py-1.5 h-[34px] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between text-sm"
										>
											<span>
												{sportsbookFilter.length === 0
													? 'All Sportsbooks'
													: `${sportsbookFilter.length} selected`}
											</span>
											<svg
												className={`w-4 h-4 ml-2 transition-transform ${sportsbookDropdownOpen ? 'rotate-180' : ''}`}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{sportsbookDropdownOpen && (
											<div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-50">
												{sportsbookFilter.length > 0 && (
													<button
														onClick={() => setSportsbookFilter([])}
														className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-gray-600 border-b border-gray-600"
													>
														Clear all
													</button>
												)}
												<div className="py-1 max-h-60 overflow-y-auto">
													{Object.entries(sportsbooks).map(([key, info]) => (
														<label
															key={key}
															className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 px-3 py-2"
														>
															<input
																type="checkbox"
																checked={sportsbookFilter.includes(key)}
																onChange={() => handleSportsbookToggle(key)}
																className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
															/>
															<span className="text-sm text-white">{info.display_name}</span>
														</label>
													))}
												</div>
											</div>
										)}
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
