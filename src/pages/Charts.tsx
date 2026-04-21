import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import { api } from '../services/api';
import type { SportsbookInfo } from '../types/stripe';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { ExpandableOddsScreen } from '../components/OddsScreen';
import { ChartsSkeleton } from '../components/Skeletons';

// Cache configs at module level to avoid refetching
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;
let leaguesConfigCache: { allLeagues: string[]; freeAllowedLeagues: string[] } | null = null;

function Charts() {
	const { currentUser, userTier, loading: authLoading } = useAuth();
	const {
		chartsData: games,
		chartsLoading: loading,
		chartsError: error,
		leagueFilter,
		setLeagueFilter,
		gameTimeFilter,
		setGameTimeFilter,
		sportsbookFilter,
		setSportsbookFilter,
		getGameHistory,
		loadedHistoryGames,
	} = useData();
	const { isCollapsed } = useSidebar();
	const navigate = useNavigate();

	const [sportsbookDropdownOpen, setSportsbookDropdownOpen] = useState(false);
	const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
	const sportsbookDropdownRef = useRef<HTMLDivElement>(null);
	const leagueDropdownRef = useRef<HTMLDivElement>(null);
	const [sportsbooks, setSportsbooks] = useState<Record<string, SportsbookInfo>>(sportsbooksCache || {});
	const [allLeagues, setAllLeagues] = useState<string[]>(leaguesConfigCache?.allLeagues || []);
	const [freeAllowedLeagues, setFreeAllowedLeagues] = useState<string[]>(leaguesConfigCache?.freeAllowedLeagues || []);

	// Fetch sportsbook config on mount
	useEffect(() => {
		if (sportsbooksCache) return;
		api.getSportsbooks()
			.then(response => {
				sportsbooksCache = response.sportsbooks;
				setSportsbooks(response.sportsbooks);
			})
			.catch(err => console.error('Failed to fetch sportsbooks config:', err));
	}, []);

	// Fetch leagues config on mount
	useEffect(() => {
		if (leaguesConfigCache) return;
		api.getLeaguesConfig()
			.then(response => {
				const freeLeagues = response.tier_allowed_leagues.free ?? [];
				leaguesConfigCache = { allLeagues: response.all_leagues, freeAllowedLeagues: freeLeagues };
				setAllLeagues(response.all_leagues);
				setFreeAllowedLeagues(freeLeagues);
			})
			.catch(err => console.error('Failed to fetch leagues config:', err));
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
		if (!currentUser) navigate('/');
	}, [currentUser, navigate, authLoading]);

	const handleSportsbookToggle = (sportsbook: string) => {
		if (sportsbookFilter.includes(sportsbook)) {
			setSportsbookFilter(sportsbookFilter.filter(s => s !== sportsbook));
		} else {
			setSportsbookFilter([...sportsbookFilter, sportsbook]);
		}
	};

	const handleLeagueSelect = (league: string) => {
		setLeagueFilter(league);
		setLeagueDropdownOpen(false);
	};

	if (authLoading) {
		return (
			<div className="min-h-screen text-white relative bg-zinc-800 flex items-center justify-center">
				<div className="text-gray-400 text-lg">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-white relative bg-black">
			<Navbar />
			<Sidebar />

			<div className={`px-4 py-20 pt-24 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
				<div className="max-w-7xl mx-auto">
					{/* Free tier info banner */}
					{userTier === 'free' && freeAllowedLeagues.length > 0 && (
						<div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4 mb-6">
							<p className="text-yellow-200 text-sm">
								Free tier: {freeAllowedLeagues.join('/') || 'All leagues'} only.{' '}
								<a href="/pricing" className="underline font-semibold">Upgrade to Premium</a>{' '}
								for all leagues and real-time updates.
							</p>
						</div>
					)}

					{/* Filters bar */}
					{!error && (
						<div className="flex flex-wrap items-center gap-3 mb-6">
							{/* Upcoming / Live toggle */}
							<div className="flex items-center bg-black border border-gray-600 rounded-lg p-1">
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
										<span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gameTimeFilter === 'live' ? 'bg-red-400' : 'bg-red-500'}`} />
										<span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
									</span>
									Live
								</button>
							</div>

							{/* League dropdown */}
							<div className="relative" ref={leagueDropdownRef}>
								<button
									onClick={(e) => { e.stopPropagation(); setLeagueDropdownOpen(!leagueDropdownOpen); }}
									className="bg-black border border-gray-400 text-white px-3 py-1.5 h-[34px] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2 text-sm"
								>
									<span>{leagueFilter}</span>
									<svg className={`w-4 h-4 transition-transform ${leagueDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{leagueDropdownOpen && (
									<div className="absolute top-full left-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50 min-w-[120px]">
										<div className="py-1 max-h-60 overflow-y-auto">
											{allLeagues.map(league => {
												const isLocked = userTier === 'free' && freeAllowedLeagues.length > 0 && !freeAllowedLeagues.includes(league);
												const isSelected = leagueFilter === league;
												return (
													<button
														key={league}
														onClick={() => !isLocked && handleLeagueSelect(league)}
														disabled={isLocked || false}
														className={`w-full text-left px-3 py-2 text-sm ${
															isLocked
																? 'cursor-not-allowed text-gray-500'
																: isSelected
																	? 'bg-indigo-600 text-white'
																	: 'text-white cursor-pointer hover:bg-gray-600'
														}`}
													>
														{league}{isLocked ? ' (Premium)' : ''}
													</button>
												);
											})}
										</div>
									</div>
								)}
							</div>

							{/* Sportsbook dropdown */}
							<div className="relative" ref={sportsbookDropdownRef}>
								<button
									onClick={() => setSportsbookDropdownOpen(!sportsbookDropdownOpen)}
									className="bg-black border border-gray-400 text-white px-3 py-1.5 h-[34px] rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2 text-sm"
								>
									<span>
										{sportsbookFilter.length === 0 ? 'All Sportsbooks' : `${sportsbookFilter.length} selected`}
									</span>
									<svg className={`w-4 h-4 transition-transform ${sportsbookDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{sportsbookDropdownOpen && (
									<div className="absolute top-full left-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50 min-w-[160px]">
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
												<label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 px-3 py-2">
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

							{/* Game count */}
							{!loading && games.length > 0 && (
								<span className="text-xs text-gray-500 ml-auto">
									{games.length} game{games.length !== 1 ? 's' : ''}
								</span>
							)}
						</div>
					)}

					{/* Error state */}
					{error && (
						<div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200 mb-6">
							{error}
						</div>
					)}

					{/* Content */}
					{loading ? (
						<ChartsSkeleton />
					) : !error && games.length === 0 ? (
						<div className="bg-gray-900 border border-gray-600 shadow-xl rounded-lg p-12 text-center">
							<p className="text-gray-300 text-lg">No games available for the selected filters.</p>
							<p className="text-gray-400 text-sm mt-2">
								Try changing the league or sportsbooks filters, or check back later.
							</p>
						</div>
					) : !error ? (
						<div className="flex flex-col gap-3">
							{games.map(game => (
								<ExpandableOddsScreen
									key={game.event_id}
									game={game}
									historyLoaded={loadedHistoryGames.has(game.event_id)}
									onExpandChart={() => getGameHistory(game.event_id, leagueFilter)}
								/>
							))}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

export default Charts;
