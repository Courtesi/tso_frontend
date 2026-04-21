import { useState, useEffect, Fragment, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useSettings } from '../contexts/SettingsContext';
import { api } from '../services/api';
import type { SportsbookInfo } from '../types/stripe';
import { formatOdds, calculateArbStakes } from '../utils/oddsUtils';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ArbFilters from '../components/ArbFilters';
import PinButton from '../components/PinButton';
import { ArbTableSkeleton } from '../components/Skeletons';

// Cache sportsbook config at module level to avoid refetching
let sportsbooksCache: Record<string, SportsbookInfo> | null = null;

function Dashboard() {
	const { currentUser, userTier, loading: authLoading, refreshToken } = useAuth();
	const { arbData: bettingData, arbLoading: loading, arbError: error, isArbStale, isPinned, pinArb, unpinArb } = useData();
	const { isCollapsed } = useSidebar();
	const { settings } = useSettings();
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
		<div className="min-h-screen text-white relative bg-black">

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
				{!error && (
					<div className="max-w-7xl mx-auto">
						<ArbFilters />
					</div>
				)}

				{/* Data Display */}
				<div className="max-w-7xl mx-auto bg-black border-2 border-gray-700 rounded-lg p-4">
					{loading && <ArbTableSkeleton />}

					{error && (
						<div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
							{error}
						</div>
					)}

					{!loading && !error && bettingData.length > 0 && (
						<div className="space-y-3 text-table">

							{/* Mobile Card View */}
							<div className="md:hidden space-y-3">
								{bettingData.map((bet) => {
									const isPinnedArb = isPinned(bet.id.toString());
									const isStale = isPinnedArb && isArbStale(bet.id.toString());
									const cardBorder = isPinnedArb
										? (isStale ? 'border-l-4 border-l-red-800' : 'border-l-4 border-l-indigo-500')
										: '';

									const gameTime = new Date(bet.game_time).toLocaleString([], {
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									});

									const { stake1, stake2 } = calculateArbStakes(
										bet.bet1.odds,
										bet.bet2.odds,
										settings?.arbBetAmount || 100
									);

									return (
										<div key={bet.id} className={`bg-gray-800/10 border border-gray-700 rounded-lg overflow-hidden ${cardBorder}`}>

											{/* Card Header: pin | game info | profit % */}
											<div className="flex items-start gap-2 px-3 pt-3 pb-2">
												<div className="flex-shrink-0 mt-0.5">
													<PinButton
														id={bet.id.toString()}
														isPinned={isPinnedArb}
														isStale={isStale}
														onToggle={() => {
															if (isPinnedArb) {
																unpinArb(bet.id.toString());
															} else {
																pinArb(bet);
															}
														}}
													/>
												</div>
												<div className="flex-1 min-w-0">
													<div className="text-sm font-medium text-white truncate" title={`${bet.matchup.replace(/_/g, ' ')} - ${bet.league}`}>
														{bet.matchup.replace(/_/g, ' ')} - {bet.league}
													</div>
													<div className="flex items-center gap-2 mt-0.5">
														<span className="text-xs font-semibold text-gray-300">{bet.market}</span>
														<span className="text-xs text-gray-400">{gameTime}</span>
													</div>
													{isStale && (
														<div className="text-xs text-red-400 mt-1 flex items-center gap-1">
															<span>⚠ May no longer be available</span>
														</div>
													)}
												</div>
												<div className="text-base font-bold text-green-400 whitespace-nowrap flex-shrink-0">
													{bet.profit_percentage.toFixed(2)}%
												</div>
											</div>

											<div className="border-t border-gray-700" />

											{/* Bet 1 Row */}
											<div className="flex items-center gap-3 py-2.5 px-3">
												{getSportsbookIcon(bet.bet1.sportsbook) ? (
													bet.bet1.link ? (
														<a href={bet.bet1.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
															<img src={getSportsbookIcon(bet.bet1.sportsbook)!} alt={bet.bet1.sportsbook} className="w-7 h-7 rounded-lg object-contain hover:opacity-80 transition-opacity" title={bet.bet1.sportsbook} />
														</a>
													) : (
														<img src={getSportsbookIcon(bet.bet1.sportsbook)!} alt={bet.bet1.sportsbook} className="w-7 h-7 rounded-lg object-contain opacity-40 grayscale flex-shrink-0 cursor-not-allowed" title={bet.bet1.sportsbook} />
													)
												) : (
													<div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
														<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
													</div>
												)}
												<div className="flex-1 min-w-0 text-sm text-white font-medium truncate">
													{bet.bet1.team.replace(/_/g, ' ')}
													<span className="ml-2 text-xs text-gray-300">{formatOdds(bet.bet1.odds, settings?.oddsFormat || 'american')}</span>
												</div>
												<div className="text-sm text-gray-200 whitespace-nowrap flex-shrink-0">${stake1.toFixed(2)}</div>
											</div>

											<div className="border-t border-gray-700/60" />

											{/* Bet 2 Row */}
											<div className="flex items-center gap-3 py-2.5 px-3">
												{getSportsbookIcon(bet.bet2.sportsbook) ? (
													bet.bet2.link ? (
														<a href={bet.bet2.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
															<img src={getSportsbookIcon(bet.bet2.sportsbook)!} alt={bet.bet2.sportsbook} className="w-7 h-7 rounded-lg object-contain hover:opacity-80 transition-opacity" title={bet.bet2.sportsbook} />
														</a>
													) : (
														<img src={getSportsbookIcon(bet.bet2.sportsbook)!} alt={bet.bet2.sportsbook} className="w-7 h-7 rounded-lg object-contain opacity-40 grayscale flex-shrink-0 cursor-not-allowed" title={bet.bet2.sportsbook} />
													)
												) : (
													<div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
														<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
													</div>
												)}
												<div className="flex-1 min-w-0 text-sm text-white font-medium truncate">
													{bet.bet2.team.replace(/_/g, ' ')}
													<span className="ml-2 text-xs text-gray-300">{formatOdds(bet.bet2.odds, settings?.oddsFormat || 'american')}</span>
												</div>
												<div className="text-sm text-gray-200 whitespace-nowrap flex-shrink-0">${stake2.toFixed(2)}</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* Desktop Table View */}
							<div className="hidden md:block shadow-xl rounded-lg overflow-hidden">
								<div className="overflow-x-auto">
									<table className="w-full table-fixed min-w-[900px]">
										{/* Table Header */}
										<thead className="border-b border-gray-400/50">
											<tr>
												<th className="w-[45px] min-w-[45px] max-w-[45px] px-1 py-4 sticky left-0 z-20 bg-black"></th>
												<th className="w-[72px] min-w-[72px] max-w-[72px] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[45px] z-20 bg-black">Value</th>
												<th className="w-[26%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[117px] z-20 bg-black">Game</th>
												<th className="w-[12%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Market</th>
												<th className="w-[27%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet</th>
												<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet Size</th>
												<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Link</th>
											</tr>
										</thead>

										{/* Table Body */}
										<tbody className="divide-y-2 divide-gray-400/50">
											{bettingData.map((bet, index) => {
												// Row background alternating (per bet pair, not per row)
												const rowBg = index % 2 === 0
													? 'bg-gray-800/10 hover:bg-gray-900/20'
													: 'bg-gray-800/10 hover:bg-gray-900/20';

												// Check if this arb is pinned and/or stale
												const isPinnedArb = isPinned(bet.id.toString());
												const isStale = isPinnedArb && isArbStale(bet.id.toString());
												// Golden left border for pinned arbs (amber for stale warning)
												const pinnedBorder = isPinnedArb
													? (isStale ? 'border-l-3 border-r-3 border-l-red-800 border-r-red-800' : "border-l-3 border-r-3 border-l-indigo-500 border-r-indigo-500")
													: '';

												// Format game time
												const gameTime = new Date(bet.game_time).toLocaleString([], {
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												});

												// Calculate stakes based on user's arb bet amount
												const { stake1, stake2 } = calculateArbStakes(
													bet.bet1.odds,
													bet.bet2.odds,
													settings?.arbBetAmount || 100
												);

												return (
													<Fragment key={bet.id}>
														{/* First Row - Bet 1 */}
														<tr className={`${rowBg} ${pinnedBorder} transition-colors border-b-0 h-8`}>
															{/* Pin Button (spans 2 rows) */}
															<td rowSpan={2} className="px-1 py-1 text-center align-middle sticky left-0 z-10 bg-black">
																<PinButton
																	id={bet.id.toString()}
																	isPinned={isPinned(bet.id.toString())}
																	isStale={isStale}
																	onToggle={() => {
																		if (isPinned(bet.id.toString())) {
																			unpinArb(bet.id.toString());
																		} else {
																			pinArb(bet);
																		}
																	}}
																/>
															</td>

															{/* Value (spans 2 rows) */}
															<td rowSpan={2} className="px-2 py-1 text-center border-r-2 border-gray-300/50 align-middle sticky left-[45px] z-10 bg-black">
																<div className="text-sm font-bold text-green-400">
																	{bet.profit_percentage.toFixed(2)}%
																</div>
															</td>

															{/* Game (spans 2 rows) */}
															<td rowSpan={2} className="px-2 py-1 border-r-2 border-gray-300/50 align-middle sticky left-[117px] z-10 bg-black">
																<div className="text-sm font-medium text-white truncate" title={`${bet.matchup.replace(/_/g, ' ')} - ${bet.league}`}>
																	{bet.matchup.replace(/_/g, ' ')} - {bet.league}
																</div>
																<div className="text-xs text-gray-400 mt-1">{gameTime}</div>
																{isStale && (
																	<div className="text-xs text-red-400 mt-1 flex items-center gap-1">
																		<span>⚠</span>
																		<span>May no longer be available</span>
																	</div>
																)}
															</td>

															{/* Market (spans 2 rows) */}
															<td rowSpan={2} className="px-2 py-2 border-r-2 border-gray-300/50 align-middle">
																<span className="px-1 py-1 font-semibold text-gray-100 truncate block" title={bet.market}>
																	{bet.market}
																</span>
															</td>

															{/* Bet 1 */}
															<td className="px-2 py-1 align-middle">
																<div className="text-sm text-white font-medium truncate" title={bet.bet1.team.replace(/_/g, ' ')}>
																	{bet.bet1.team.replace(/_/g, ' ')}
																	<span className="ml-2 px-2 py-0.5 text-xs text-gray-300">
																		{formatOdds(bet.bet1.odds, settings?.oddsFormat || 'american')}
																	</span>
																</div>
															</td>

															{/* Bet Size 1 */}
															<td className="px-2 py-1 text-center align-middle">
																<div className="text-sm text-gray-200">
																	${stake1.toFixed(2)}
																</div>
															</td>

															{/* Link 1 */}
															<td className="px-2 py-1 text-center align-middle">
																{getSportsbookIcon(bet.bet1.sportsbook) ? (
																	bet.bet1.link ? (
																		<a href={bet.bet1.link} target="_blank" rel="noopener noreferrer">
																			<img
																				src={getSportsbookIcon(bet.bet1.sportsbook)!}
																				alt={bet.bet1.sportsbook}
																				className="w-6 h-6 rounded-lg object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
																				title={bet.bet1.sportsbook}
																			/>
																		</a>
																	) : (
																			<img
																				src={getSportsbookIcon(bet.bet1.sportsbook)!}
																				alt={bet.bet1.sportsbook}
																				className="w-6 h-6 rounded-lg object-contain mx-auto cursor-not-allowed opacity-40 grayscale"
																				title={bet.bet1.sportsbook}
																			/>
																	)
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
														<tr className={`${rowBg} ${pinnedBorder} transition-colors h-8 border-t-0`}>
															{/* Bet 2 */}
															<td className="px-2 py-1 align-middle">
																<div className="text-sm text-white font-medium truncate" title={bet.bet2.team.replace(/_/g, ' ')}>
																	{bet.bet2.team.replace(/_/g, ' ')}
																	<span className="ml-2 px-2 py-0.5 text-xs text-gray-300">
																		{formatOdds(bet.bet2.odds, settings?.oddsFormat || 'american')}
																	</span>
																</div>
															</td>

															{/* Bet Size 2 */}
															<td className="px-2 py-1 text-center align-middle">
																<div className="text-sm text-gray-200">
																	${stake2.toFixed(2)}
																</div>
															</td>

															{/* Link 2 */}
															<td className="px-2 py-1 text-center align-middle">
																{getSportsbookIcon(bet.bet2.sportsbook) ? (
																	bet.bet2.link ? (
																		<a href={bet.bet2.link} target="_blank" rel="noopener noreferrer">
																			<img
																				src={getSportsbookIcon(bet.bet2.sportsbook)!}
																				alt={bet.bet2.sportsbook}
																				className="w-6 h-6 rounded-lg object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
																				title={bet.bet2.sportsbook}
																			/>
																		</a>
																	) : (
																		<img
																			src={getSportsbookIcon(bet.bet2.sportsbook)!}
																			alt={bet.bet2.sportsbook}
																			className="w-6 h-6 rounded-lg object-contain mx-auto cursor-not-allowed opacity-40 grayscale"
																			title={bet.bet2.sportsbook}
																		/>
																	)
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
						<div className="bg-gray-950 border border-gray-600 shadow-xl rounded-lg p-12 text-center">
							<p className="text-gray-300 text-lg">No arbitrage opportunities available at this time.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Dashboard;