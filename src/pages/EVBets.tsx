import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useSettings } from '../contexts/SettingsContext';
import { api, type SportsbookInfo } from '../services/api';
import { formatOdds } from '../utils/oddsUtils';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import EVFilters from '../components/EVFilters';
import PinButton from '../components/PinButton';

// Cache sportsbook config at module level to avoid refetching
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;

function EVBets() {
	const { currentUser, userTier, loading: authLoading } = useAuth();
	const { evData, evLoading, evError, pinEv, unpinEv, isEvPinned, isEvStale } = useData();
	const { isCollapsed } = useSidebar();
	const { settings } = useSettings();
	const navigate = useNavigate();
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

	useEffect(() => {
		// Wait for auth to initialize before doing anything
		if (authLoading) {
			return;
		}

		// Redirect to home if not logged in
		if (!currentUser) {
			navigate('/');
			return;
		}
	}, [currentUser, navigate, authLoading]);

	// Format Kelly fraction as percentage
	const formatKelly = (kelly: number): string => {
		return `${(kelly * 100).toFixed(1)}%`;
	};

	// Get confidence badge color
	const getConfidenceBadgeClass = (confidence: string): string => {
		switch (confidence) {
			case 'HIGH':
				return 'bg-green-600/30 text-green-400 border-green-500/50';
			case 'MEDIUM':
				return 'bg-yellow-600/30 text-yellow-400 border-yellow-500/50';
			case 'LOW':
				return 'bg-red-600/30 text-red-400 border-red-500/50';
			default:
				return 'bg-gray-600/30 text-gray-400 border-gray-500/50';
		}
	};

	// Show loading screen while auth is initializing
	if (authLoading) {
		return (
			<div className="min-h-screen text-white relative bg-black flex items-center justify-center">
				<div className="text-center">
					<div className="text-gray-400 text-lg">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-white relative bg-black">

			<Navbar/>
			<Sidebar />

			{/* Main Content */}
			<div className={`px-4 py-20 pt-24 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>

				{/* Tier Message */}
				{evLoading ? null : userTier === 'free' && (
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto bg-gradient-to-r from-pink-500/50 to-rose-400/70 shadow-xl rounded-lg p-3 text-center mb-10">
						<p className="text-blue-100 text-sm sm:text-base">
							Free tier limited to 5 +EV bets. Upgrade to Premium for full access!
						</p>
						<button
							onClick={() => navigate('/pricing')}
							className="bg-gray-300/40 text-gray-100 text-base sm:text-lg font-semibold px-4 py-2 sm:py-1 rounded-xl transition-colors shadow-lg cursor-pointer whitespace-nowrap flex-shrink-0"
						>
							Upgrade
						</button>
					</div>
				)}

				{/* Filters */}
				{!evError && (
					<div className="max-w-7xl mx-auto">
						<EVFilters />
					</div>
				)}

				{/* Data Display */}
				<div className="max-w-7xl mx-auto bg-black border-2 border-gray-700 rounded-lg p-4">
					{evLoading && (
						<div className="text-center text-gray-400 py-12">
							Loading +EV betting opportunities...
						</div>
					)}

					{evError && (
						<div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
							{evError}
						</div>
					)}

					{!evLoading && !evError && evData.length > 0 && (
						<div className="space-y-6 text-table">
							{/* Table Container */}
							<div className="shadow-xl rounded-lg overflow-hidden">
								<div className="overflow-x-auto">
									<table className="w-full table-fixed min-w-[900px]">
										{/* Table Header */}
										<thead className="border-b border-gray-400/50">
											<tr>
												<th className="w-[45px] min-w-[45px] max-w-[45px] px-1 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-0 z-20 bg-black"></th>
												<th className="w-[72px] min-w-[72px] max-w-[72px] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[45px] z-20 bg-black">EV%</th>
												<th className="w-[24%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[117px] z-20 bg-black">Bet</th>
												<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Sportsbook</th>
												<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">True Odds</th>
												<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Confidence</th>
												<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet Size</th>
												<th className="w-[24%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Game</th>
											</tr>
										</thead>

										{/* Table Body */}
										<tbody className="divide-y-2 divide-gray-400/50">
											{evData.map((bet, index) => {
												// Row background alternating
												const rowBg = index % 2 === 0
													? 'bg-gray-800/10 hover:bg-gray-900/20'
													: 'bg-gray-800/10 hover:bg-gray-900/20';

												// Check if this EV bet is pinned and/or stale
												const isPinnedEv = isEvPinned(bet.id.toString());
												const isStale = isPinnedEv && isEvStale(bet.id.toString());
												const pinnedBorder = isPinnedEv
													? (isStale ? 'border-l-3 border-r-3 border-l-red-800 border-r-red-800' : 'border-l-3 border-r-3 border-l-indigo-500 border-r-indigo-500')
													: '';

												// Format game time
												const gameTime = new Date(bet.game_time).toLocaleString([], {
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												});

												return (
													<tr key={bet.id} className={`${rowBg} ${pinnedBorder} transition-colors h-12`}>
														{/* Pin Button */}
														<td className="px-1 py-1 text-center align-middle sticky left-0 z-10 bg-black">
															<PinButton
																id={bet.id.toString()}
																isPinned={isPinnedEv}
																isStale={isStale}
																onToggle={() => {
																	if (isEvPinned(bet.id.toString())) {
																		unpinEv(bet.id.toString());
																	} else {
																		pinEv(bet);
																	}
																}}
															/>
														</td>

														{/* EV% */}
														<td className="px-2 py-2 text-center border-r-2 border-gray-300/50 sticky left-[45px] z-10 bg-black">
															<div className="text-sm font-bold text-green-400">
																+{bet.expected_value.toFixed(2)}%
															</div>
															<div className="text-xs text-gray-500">
																Edge: {bet.edge.toFixed(1)}%
															</div>
														</td>

														{/* Bet */}
														<td className="px-2 py-2 border-r-2 border-gray-300/50 sticky left-[117px] z-10 bg-black">
															<div className="text-sm text-white font-medium truncate" title={bet.bet.team.replace(/_/g, ' ')}>
																{bet.bet.team.replace(/_/g, ' ')}
																<span className="ml-2 px-2 py-0.5 text-xs text-gray-300">
																	{formatOdds(bet.bet.odds, settings?.oddsFormat || 'american')}
																</span>
															</div>
															<div className="text-xs text-gray-400">
																{bet.market}
															</div>
														</td>

														{/* Sportsbook */}
														<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
															{getSportsbookIcon(bet.bet.sportsbook) ? (
																<img
																	src={getSportsbookIcon(bet.bet.sportsbook)!}
																	alt={bet.bet.sportsbook}
																	className="w-6 h-6 rounded-lg object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
																	title={bet.bet.sportsbook}
																/>
															) : (
																<span className="text-xs text-gray-300">{bet.bet.sportsbook}</span>
															)}
														</td>

														{/* True Odds */}
														<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
															<div className="text-sm text-blue-400">
																{formatOdds(bet.true_odds.american_odds, settings?.oddsFormat || 'american')}
															</div>
															<div className="text-xs text-gray-500">
																{(bet.true_odds.probability * 100).toFixed(1)}%
															</div>
														</td>

														{/* Confidence */}
														<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
															<span className={`px-2 py-1 text-xs font-medium rounded border ${getConfidenceBadgeClass(bet.confidence)}`}>
																{bet.confidence}
															</span>
														</td>

														{/* Bet Size */}
														<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
															<div className="text-sm text-white font-medium">
																${((settings?.bankroll || 1000) * bet.kelly_fraction * (settings?.kellyFraction || 0.25)).toFixed(2)}
															</div>
															<div className="text-xs text-gray-500">
																{formatKelly(bet.kelly_fraction * (settings?.kellyFraction || 0.25))}
															</div>
														</td>

														{/* Game */}
														<td className="px-2 py-2">
															<div className="text-sm font-medium text-white truncate" title={`${bet.matchup.replace(/_/g, ' ')} - ${bet.league}`}>
																{bet.matchup.replace(/_/g, ' ')}
															</div>
															<div className="text-xs text-gray-400">
																{bet.league} • {gameTime}
															</div>
															{isStale && (
																<div className="text-xs text-red-400 mt-1 flex items-center gap-1">
																	<span>⚠</span>
																	<span>May no longer be available</span>
																</div>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>

							{/* Explanation Card */}
							<div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-400">
								<p className="mb-2">
									<span className="text-white font-medium">How it works:</span> We compare odds from prediction markets (Kalshi, Polymarket)
									to traditional sportsbooks to find +EV betting opportunities.
								</p>
								<p>
									<span className="text-green-400 font-medium">EV%</span> = Expected Value as a percentage of stake.
									<span className="text-blue-400 font-medium ml-2">True Odds</span> = Market-implied probability from prediction markets.
									<span className="text-yellow-400 font-medium ml-2">Confidence</span> = Based on market liquidity and volume.
								</p>
							</div>
						</div>
					)}

					{!evLoading && !evError && evData.length === 0 && (
						<div className="bg-gray-950 border border-gray-600 shadow-xl rounded-lg p-12 text-center">
							<p className="text-gray-300 text-lg">No +EV betting opportunities available at this time.</p>
							<p className="text-gray-400 text-sm mt-2">
								+EV bets are found when prediction market odds suggest better value than sportsbook odds.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default EVBets;
