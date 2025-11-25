import { useState, useEffect, Fragment } from 'react';
import { useInView } from '../hooks/useInView';

function AnimatedDashboardMockup() {
	const [step, setStep] = useState(0);
	const { ref, isInView } = useInView();

	// Mock arbitrage data
	const mockBets = [
		{
			id: 1,
			league: 'NBA',
			matchup: 'Lakers vs Celtics',
			market: 'Moneyline',
			profit: 3.45,
			bet1: { team: 'Lakers', odds: 210, stake: 520.50, sportsbook: 'fanduel' },
			bet2: { team: 'Celtics', odds: 195, stake: 479.50, sportsbook: 'draftkings' }
		},
		{
			id: 2,
			league: 'NFL',
			matchup: 'Chiefs vs Bills',
			market: 'Spread',
			profit: 2.15,
			bet1: { team: 'Chiefs -3.5', odds: 205, stake: 485.25, sportsbook: 'betmgm' },
			bet2: { team: 'Bills +3.5', odds: 200, stake: 514.75, sportsbook: 'caesars' }
		},
		{
			id: 3,
			league: 'NHL',
			matchup: 'Bruins vs Rangers',
			market: 'Total',
			profit: 1.85,
			bet1: { team: 'Over 6.5', odds: 220, stake: 450.00, sportsbook: 'fanatics' },
			bet2: { team: 'Under 6.5', odds: 185, stake: 550.00, sportsbook: 'espnbet' }
		}
	];

	// Helper function to get sportsbook icon
	const getSportsbookIcon = (sportsbookName: string): string | null => {
		const iconMap: { [key: string]: string } = {
			'fanduel': 'fanduel.avif',
			'draftkings': 'draftkings.avif',
			'betmgm': 'betmgm.avif',
			'caesars': 'caesars.avif',
			'fanatics': 'fanatics.avif',
			'espnbet': 'espnbet.png',
		};
		return iconMap[sportsbookName] ? `/sportsbook_icons/${iconMap[sportsbookName]}` : null;
	};

	// Animation sequence - only runs when component is in view
	useEffect(() => {
		if (!isInView) {
			// Reset animation when scrolled out of view
			setStep(0);
			return;
		}

		let timeouts: number[] = [];

		const runAnimation = () => {
			// Clear any existing timeouts
			timeouts.forEach(timeout => clearTimeout(timeout));
			timeouts = [];

			const timings = [
				{ delay: 500, step: 1 },  // First row appears (with icons)
				{ delay: 1000, step: 2 }, // Second row appears (with icons)
				{ delay: 1500, step: 3 }, // Third row appears (with icons)
				{ delay: 2500, step: 4 }, // Highlight best opportunity
				{ delay: 5000, step: 0 }, // Reset
			];

			// Schedule all steps
			timings.forEach(({ delay, step: nextStep }) => {
				const timeout = setTimeout(() => {
					setStep(nextStep);
				}, delay);
				timeouts.push(timeout);
			});
		};

		// Run initial animation
		runAnimation();

		// Loop animation every 5.5 seconds
		const interval = setInterval(() => {
			runAnimation();
		}, 5500);

		return () => {
			clearInterval(interval);
			timeouts.forEach(timeout => clearTimeout(timeout));
		};
	}, [isInView]);

	return (
		<div ref={ref} className="w-full h-full bg-gradient-to-b from-red-900/50 to-rose-500/50 rounded-xl overflow-hidden lg:p-4 flex items-center justify-center">
			<div className="w-full scale-90 sm:scale-100 md:scale-70 lg:scale-95">
				{/* Mini Dashboard Table */}
				<div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
					<table className="w-full text-[10px]">
						{/* Table Header */}
						<thead className="bg-gray-700/50 border-b border-gray-600/30">
							<tr>
								<th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-300 uppercase">Value</th>
								<th className="px-2 py-2 text-left text-[9px] font-semibold text-gray-300 uppercase">Game</th>
								<th className="px-2 py-2 text-left text-[9px] font-semibold text-gray-300 uppercase">Market</th>
								<th className="px-2 py-2 text-left text-[9px] font-semibold text-gray-300 uppercase">Bet</th>
								<th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-300 uppercase">Stake</th>
								<th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-300 uppercase">Book</th>
							</tr>
						</thead>

						{/* Table Body */}
						<tbody className="divide-y divide-gray-700/20">
							{mockBets.map((bet, index) => {
								const isVisible = step >= index + 1;
								const showIcons = isVisible; // Icons appear with their row
								const isHighlighted = step >= 4 && index === 0;

								return (
									<Fragment key={bet.id}>
										{/* First Row - Bet 1 */}
										<tr
											key={`${bet.id}-1`}
											className={`transition-all duration-700 ${
												isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
											} ${
												isHighlighted
													? 'bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 shadow-lg border-b border-yellow-700/30'
													: 'bg-gray-800/10 hover:bg-gray-800/30 border-b border-gray-700/10'
											}`}
											style={{ transitionDelay: isVisible ? '0ms' : '0ms' }}
										>
											{/* Value (spans 2 rows) */}
											<td
												rowSpan={2}
												className={`px-2 py-1 text-center transition-all duration-700 ${
													isHighlighted ? 'border-r border-yellow-700/40' : 'border-r border-gray-700/20'
												}`}
											>
												<div className={`font-bold transition-all duration-700 ${
													isHighlighted
														? 'text-lg text-yellow-400 animate-scale-in'
														: 'text-xs text-green-400'
												}`}>
													{bet.profit.toFixed(2)}%
												</div>
											</td>

											{/* Game (spans 2 rows) */}
											<td rowSpan={2} className={`px-2 py-1 transition-all duration-700 ${
												isHighlighted ? 'border-r border-yellow-700/40' : 'border-r border-gray-700/20'
											}`}>
												<div className="text-[10px] font-medium text-white">{bet.matchup}</div>
												<div className="text-[8px] text-gray-400">{bet.league}</div>
											</td>

											{/* Market (spans 2 rows) */}
											<td rowSpan={2} className={`px-2 py-1 transition-all duration-700 ${
												isHighlighted ? 'border-r border-yellow-700/40' : 'border-r border-gray-700/20'
											}`}>
												<span className="text-[10px] font-semibold text-gray-200">
													{bet.market}
												</span>
											</td>

											{/* Bet 1 */}
											<td className="px-2 py-1">
												<div className="text-[10px] text-white font-medium">
													{bet.bet1.team}
													<span className="ml-1 text-[8px] text-gray-400">
														+{bet.bet1.odds}
													</span>
												</div>
											</td>

											{/* Stake 1 */}
											<td className="px-2 py-1 text-center">
												<div className="text-[10px] text-gray-300">
													${bet.bet1.stake.toFixed(0)}
												</div>
											</td>

											{/* Book 1 */}
											<td className="px-2 py-1 text-center">
												{showIcons && getSportsbookIcon(bet.bet1.sportsbook) ? (
													<img
														src={getSportsbookIcon(bet.bet1.sportsbook)!}
														alt={bet.bet1.sportsbook}
														className="w-4 h-4 rounded object-contain mx-auto animate-scale-in"
													/>
												) : (
													<div className="w-4 h-4 mx-auto"></div>
												)}
											</td>
										</tr>

										{/* Second Row - Bet 2 */}
										<tr
											key={`${bet.id}-2`}
											className={`transition-all duration-700 ${
												isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
											} ${
												isHighlighted
													? 'bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 shadow-lg border-b border-yellow-700/30'
													: 'bg-gray-800/10 hover:bg-gray-800/30 border-b border-gray-700/10'
											}`}
											style={{ transitionDelay: isVisible ? '0ms' : '0ms' }}
										>
											{/* Bet 2 */}
											<td className="px-2 py-1">
												<div className="text-[10px] text-white font-medium">
													{bet.bet2.team}
													<span className="ml-1 text-[8px] text-gray-400">
														+{bet.bet2.odds}
													</span>
												</div>
											</td>

											{/* Stake 2 */}
											<td className="px-2 py-1 text-center">
												<div className="text-[10px] text-gray-300">
													${bet.bet2.stake.toFixed(0)}
												</div>
											</td>

											{/* Book 2 */}
											<td className="px-2 py-1 text-center">
												{showIcons && getSportsbookIcon(bet.bet2.sportsbook) ? (
													<img
														src={getSportsbookIcon(bet.bet2.sportsbook)!}
														alt={bet.bet2.sportsbook}
														className="w-4 h-4 rounded object-contain mx-auto animate-scale-in"
													/>
												) : (
													<div className="w-4 h-4 mx-auto"></div>
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
	);
}

export default AnimatedDashboardMockup;
