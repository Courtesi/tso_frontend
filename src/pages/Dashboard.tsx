import { useState, useEffect, Fragment, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import { api, type SportsbookInfo } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ArbFilters from '../components/ArbFilters';

// interface BetSide {
// 	team: string;
// 	odds: number;
// 	sportsbook: string;
// 	stake: number;
// }

// interface ArbitrageBet {
// 	id: number;
// 	league: string;
// 	matchup: string;
// 	market: string;
// 	game_time: string;
// 	profit_percentage: number;
// 	bet1: BetSide;
// 	bet2: BetSide;
// 	found_at: string;
// 	expires_in_minutes: number;
// }

// Cache sportsbook config at module level to avoid refetching
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;

function Dashboard() {
	const { currentUser, userTier, loading: authLoading, refreshToken } = useAuth();
	const { arbData: bettingData, arbLoading: loading, arbError: error } = useData();
	const { isCollapsed } = useSidebar();
	const navigate = useNavigate();
	const [successMessage, setSuccessMessage] = useState('');
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
		// Check for successful checkout in URL params
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('success') === 'true') {
			setSuccessMessage('Payment successful! Your premium subscription is now active.');
			// Clean up URL
			window.history.replaceState({}, '', '/dashboard');
			// Refresh token to get updated custom claims for backend
			refreshToken();
			// Auto-hide message after 10 seconds
			setTimeout(() => setSuccessMessage(''), 10000);
		}
	}, [refreshToken]);

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

	// Show loading screen while auth is initializing
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

			<Navbar/>
			<Sidebar />

			{/* Main Content */}
			<div className={`px-4 py-20 pt-24 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>

				{/* Success Message */}
				{successMessage && (
					<div className="max-w-4xl mx-auto mb-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500 rounded-lg p-4 text-center">
						<div className="flex items-center justify-between">
							<p className="text-green-100 flex-1">{successMessage}</p>
							<button
								onClick={() => setSuccessMessage('')}
								className="text-green-200 hover:text-white ml-4 cursor-pointer"
							>
								✕
							</button>
						</div>
					</div>
				)}

				{/* Tier Message */}
				{loading ? null :userTier === 'free' && (
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto bg-gradient-to-r from-pink-500/50 to-rose-400/70 shadow-xl rounded-lg p-3 text-center mb-10">
						<p className="text-blue-100 text-sm sm:text-base">
							Updates every 60 seconds. Upgrade to Premium for full access!
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
				{!loading && !error && (
					<div className="max-w-7xl mx-auto">
						<ArbFilters />
					</div>
				)}

				{/* Data Display */}
				<div className="max-w-7xl mx-auto bg-gray-800">
					{loading && (
						<div className="text-center text-gray-400 py-12">
							Loading arbitrage opportunities...
						</div>
					)}

					{error && (
						<div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
							{error}
						</div>
					)}

					{!loading && !error && bettingData.length > 0 && (
						<div className="space-y-6 text-table">
							{/* Table Container */}
							<div className="shadow-xl rounded-lg overflow-hidden">
								<div className="overflow-x-auto">
									<table className="w-full">
										{/* Table Header */}
										<thead className="border-b border-gray-400/30">
											<tr>
												<th className="px-6 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Value</th>
												<th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Game</th>
												<th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Market</th>
												<th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet</th>
												<th className="px-6 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet Size</th>
												<th className="px-6 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Link</th>
											</tr>
										</thead>

										{/* Table Body */}
										<tbody className="divide-y divide-gray-400/20">
											{bettingData.map((bet, index) => {
												// Row background alternating (per bet pair, not per row)
												const rowBg = index % 2 === 0
													? 'bg-gray-800/10 hover:bg-gray-900/20'
													: 'bg-gray-800/10 hover:bg-gray-900/20';

												// Format game time
												const gameTime = new Date(bet.game_time).toLocaleString([], {
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												});

												return (
													<Fragment key={bet.id}>
														{/* First Row - Bet 1 */}
														<tr className={`${rowBg} transition-colors border-b border-indigo-400/5`}>
															{/* Value (spans 2 rows) */}
															<td rowSpan={2} className="py-1 text-center border-r border-indigo-400/10">
																<div className="text-sm font-bold text-green-400">
																	{bet.profit_percentage.toFixed(2)}%
																</div>
															</td>

															{/* Game (spans 2 rows) */}
															<td rowSpan={2} className="px-2 py-1 border-r border-indigo-400/10">
																<div className="text-sm font-medium text-white">{bet.matchup.replace(/_/g, ' ')} - {bet.league}</div>
																<div className="text-xs text-gray-400 mt-1">{gameTime}</div>
															</td>

															{/* Market (spans 2 rows) */}
															<td rowSpan={2} className="px-2 py-2 border-r border-indigo-400/10">
																<span className="px-1 py-1 font-semibold text-gray-100">
																	{bet.market}
																</span>
															</td>

															{/* Bet 1 */}
															<td className="px-2 py-1">
																<div className="text-sm text-white font-medium">
																	{bet.bet1.team.replace(/_/g, ' ')}
																	<span className="ml-2 px-2 py-0.5 text-xs text-gray-300">
																		{bet.bet1.odds}
																	</span>
																</div>
															</td>

															{/* Bet Size 1 */}
															<td className="py-1 text-center">
																<div className="text-sm text-gray-200">
																	${bet.bet1.stake.toFixed(2)}
																</div>
															</td>

															{/* Link 1 */}
															<td className="px-2 py-1 text-center">
																{getSportsbookIcon(bet.bet1.sportsbook) ? (
																	<img
																		src={getSportsbookIcon(bet.bet1.sportsbook)!}
																		alt={bet.bet1.sportsbook}
																		className="w-6 h-6 rounded-lg object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
																		title={bet.bet1.sportsbook}
																	/>
																) : (
																	<div className="flex items-center justify-center gap-1 text-xs text-gray-300 hover:text-white cursor-pointer">
																		<span>Book</span>
																		<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
																		</svg>
																	</div>
																)}
															</td>
														</tr>

														{/* Second Row - Bet 2 */}
														<tr className={`${rowBg} transition-colors`}>
															{/* Bet 2 */}
															<td className="px-2 py-1">
																<div className="text-sm text-white font-medium">
																	{bet.bet2.team.replace(/_/g, ' ')}
																	<span className="ml-2 px-2 py-0.5 text-xs text-gray-300">
																		{bet.bet2.odds}
																	</span>
																</div>
															</td>

															{/* Bet Size 2 */}
															<td className="py-1 text-center">
																<div className="text-sm text-gray-200">
																	${bet.bet2.stake.toFixed(2)}
																</div>
															</td>

															{/* Link 2 */}
															<td className="px-2 py-1 text-center">
																{getSportsbookIcon(bet.bet2.sportsbook) ? (
																	<img
																		src={getSportsbookIcon(bet.bet2.sportsbook)!}
																		alt={bet.bet2.sportsbook}
																		className="w-6 h-6 rounded-lg object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
																		title={bet.bet2.sportsbook}
																	/>
																) : (
																	<div className="flex items-center justify-center gap-1 text-xs text-gray-300">
																		<span>Book</span>
																		<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
																		</svg>
																	</div>
																)}
															</td>
														</tr>
													</Fragment>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}

					{!loading && !error && bettingData.length === 0 && (
						<div className="bg-gradient-to-br from-indigo-400/40 via-indigo-500/30 to-indigo-400/30 backdrop-blur-md border border-indigo-500/10 shadow-xl rounded-lg p-12 text-center">
							<p className="text-gray-300 text-lg">No arbitrage opportunities available at this time.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
