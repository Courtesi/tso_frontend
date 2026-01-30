import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import { api, type SportsbookInfo, type TierInfo } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GameLineChart from '../components/GameLineChart';
import GameListSidebar from '../components/GameListSidebar';

// Cache configs at module level to avoid refetching
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;
let tierConfigCache: { tiers: Record<string, TierInfo>; allLeagues: string[] } | null = null;

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
	const [allLeagues, setAllLeagues] = useState<string[]>(tierConfigCache?.allLeagues || []);
	const [tierConfig, setTierConfig] = useState<Record<string, TierInfo>>(tierConfigCache?.tiers || {});

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

	// Fetch tier config on mount
	useEffect(() => {
		if (tierConfigCache) return;

		api.getTierFeatures()
			.then(response => {
				tierConfigCache = { tiers: response.tiers, allLeagues: response.all_leagues };
				setTierConfig(response.tiers);
				setAllLeagues(response.all_leagues);
			})
			.catch(err => {
				console.error('Failed to fetch tier config:', err);
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

	const handleLeagueToggle = (league: string) => {
		if (leagueFilter.includes(league)) {
			setLeagueFilter(leagueFilter.filter(l => l !== league));
		} else {
			setLeagueFilter([...leagueFilter, league]);
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
		<div className="min-h-screen text-white relative bg-black">
			<Navbar />
			<Sidebar />

			<div className={`px-4 py-20 pt-24 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
				{/* Header */}
				<div className="max-w-7xl mx-auto mb-8">
					{/* Info banner for free users */}
					{userTier === 'free' && tierConfig.free && (
						<div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4 mb-6">
							<p className="text-yellow-200 text-sm">
								Free tier: {tierConfig.free.allowed_leagues?.join('/') || 'All leagues'} only, up to {tierConfig.free.max_games || 'unlimited'} games.{' '}
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
					<div className="grid grid-cols-12 gap-4 lg:gap-6">
						{/* Chart Area */}
						<div className="col-span-12 lg:col-span-9 order-2 lg:order-1">
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
								<>
									{games.length > 0 && selectedGame ? (
										<GameLineChart game={selectedGame} />
									) : games.length > 0 ? (
										<div className="bg-gray-800 rounded-lg p-12 text-center">
											<p className="text-gray-400">Select a game to view line movements</p>
										</div>
									) : (
										<div className="bg-gray-900 border border-gray-600 shadow-xl rounded-lg p-12 text-center">
											<p className="text-gray-300 text-lg">No games available for the selected filters.</p>
											<p className="text-gray-400 text-sm mt-2">
												Try changing the league or sportsbooks filters, or check back later.
											</p>
										</div>
									)}
								</>
							)}
						</div>

						{/* Sidebar Container - Filters + Game List */}
						<div className="col-span-12 lg:col-span-3 order-1 lg:order-2">
							{/* Filters - always visible (hidden on error) */}
							{!error && (
								<div className="flex flex-col sm:flex-row lg:flex-col gap-4 mb-4">
									{/* Toggle Switch for Upcoming/Live */}
									<div className="flex justify-end mb-2">
										<div className="flex items-center bg-black border border-gray-600 rounded-lg p-1 w-fit">
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
											className="w-full bg-black border border-gray-400 text-white px-3 py-1.5 h-[34px] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between text-sm"
										>
											<span>
												{leagueFilter.length === 0
													? 'All Leagues'
													: `${leagueFilter.length} selected`}
											</span>
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
											<div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50">
												{leagueFilter.length > 0 && (
													<button
														onClick={() => setLeagueFilter([])}
														className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-gray-600 border-b border-gray-600 cursor-pointer"
													>
														Clear all
													</button>
												)}
												<div className="py-1 max-h-60 overflow-y-auto">
													{allLeagues.map(league => {
														const isLocked = userTier === 'free' && tierConfig.free?.allowed_leagues && !tierConfig.free.allowed_leagues.includes(league);
														return (
															<label
																key={league}
																className={`flex items-center gap-2 px-3 py-2 ${
																	isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-600'
																}`}
															>
																<input
																	type="checkbox"
																	checked={leagueFilter.includes(league)}
																	onChange={() => !isLocked && handleLeagueToggle(league)}
																	disabled={isLocked || false}
																	className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
																/>
																<span className={`text-sm ${isLocked ? 'text-gray-500' : 'text-white'}`}>
																	{league}{isLocked ? ' (Premium)' : ''}
																</span>
															</label>
														);
													})}
												</div>
											</div>
										)}
									</div>

									<div className="relative" ref={sportsbookDropdownRef}>
										<button
											onClick={() => setSportsbookDropdownOpen(!sportsbookDropdownOpen)}
											className="w-full bg-black border border-gray-400 text-white px-3 py-1.5 h-[34px] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between text-sm"
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
											<div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50">
												{sportsbookFilter.length > 0 && (
													<button
														onClick={() => setSportsbookFilter([])}
														className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-gray-600 border-b border-gray-600 cursor-pointer"
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
							)}

							{/* Game List - only when loaded */}
							{!loading && !error && (
								<GameListSidebar
									games={games}
									selectedGame={selectedGame}
									onSelectGame={setSelectedGame}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Charts;
