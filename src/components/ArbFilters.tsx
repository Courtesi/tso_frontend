import { useState, useRef, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

// Leagues available to free tier users
const FREE_TIER_LEAGUES = ['NBA', 'NFL', 'MLB'];
const ALL_LEAGUES = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF'];

// Market types (matches production values)
const MARKET_TYPES = [
	{ value: 'MONEY', label: 'Moneyline' },
	{ value: 'SPREAD', label: 'Spread' },
	{ value: 'TOTAL', label: 'Total' }
];

// Available sportsbooks
const SPORTSBOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'fliff', 'novig', 'prophetx', 'kalshi'];

// Profit range constants
const MIN_PROFIT = 0;
const MAX_PROFIT = 20;

function ArbFilters() {
	const { userTier } = useAuth();
	const {
		arbLeagueFilter,
		setArbLeagueFilter,
		arbMinProfitFilter,
		setArbMinProfitFilter,
		arbMaxProfitFilter,
		setArbMaxProfitFilter,
		arbMarketTypeFilter,
		setArbMarketTypeFilter,
		arbSportsbookFilter,
		setArbSportsbookFilter
	} = useData();

	const [sportsbookDropdownOpen, setSportsbookDropdownOpen] = useState(false);
	const [marketTypeDropdownOpen, setMarketTypeDropdownOpen] = useState(false);
	const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
	const sportsbookDropdownRef = useRef<HTMLDivElement>(null);
	const marketTypeDropdownRef = useRef<HTMLDivElement>(null);
	const leagueDropdownRef = useRef<HTMLDivElement>(null);

	// Slider values
	const minValue = arbMinProfitFilter ?? MIN_PROFIT;
	const maxValue = arbMaxProfitFilter ?? MAX_PROFIT;

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sportsbookDropdownRef.current && !sportsbookDropdownRef.current.contains(event.target as Node)) {
				setSportsbookDropdownOpen(false);
			}
			if (marketTypeDropdownRef.current && !marketTypeDropdownRef.current.contains(event.target as Node)) {
				setMarketTypeDropdownOpen(false);
			}
			if (leagueDropdownRef.current && !leagueDropdownRef.current.contains(event.target as Node)) {
				setLeagueDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSliderChange = (values: number | number[]) => {
		if (Array.isArray(values)) {
			setArbMinProfitFilter(values[0]);
			if (values[1] >= MAX_PROFIT) {
				setArbMaxProfitFilter(null); // null means no upper limit
			} else {
				setArbMaxProfitFilter(values[1]);
			}
		}
	};

	const handleMarketTypeToggle = (marketType: string) => {
		if (arbMarketTypeFilter.includes(marketType)) {
			setArbMarketTypeFilter(arbMarketTypeFilter.filter(m => m !== marketType));
		} else {
			setArbMarketTypeFilter([...arbMarketTypeFilter, marketType]);
		}
	};

	const handleSportsbookToggle = (sportsbook: string) => {
		if (arbSportsbookFilter.includes(sportsbook)) {
			setArbSportsbookFilter(arbSportsbookFilter.filter(s => s !== sportsbook));
		} else {
			setArbSportsbookFilter([...arbSportsbookFilter, sportsbook]);
		}
	};

	return (
		<div className="bg-gray-800 rounded-lg p-4 mb-6">
			<div className="flex flex-wrap items-start gap-4">
				{/* Profit Range Slider */}
				<div className="flex flex-col min-w-[200px]">
					<label className="text-sm text-gray-400 mb-1">
						Profit Range: {minValue.toFixed(1)}% - {arbMaxProfitFilter === null ? 'Max' : `${maxValue.toFixed(1)}%`}
					</label>
					<div className="pt-1 pb-2">
						<Slider
							range
							min={MIN_PROFIT}
							max={MAX_PROFIT}
							step={0.1}
							value={[minValue, maxValue]}
							onChange={handleSliderChange}
							styles={{
								track: { backgroundColor: '#6366f1', height: 6 },
								rail: { backgroundColor: '#374151', height: 6 },
								handle: {
									backgroundColor: '#fff',
									borderColor: '#6366f1',
									height: 16,
									width: 16,
									marginTop: -5,
									opacity: 1
								}
							}}
						/>
					</div>
				</div>

				{/* League Filter */}
				<div className="flex flex-col relative" ref={leagueDropdownRef}>
					<label className="text-sm text-gray-400 mb-1">League</label>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setLeagueDropdownOpen(!leagueDropdownOpen);
						}}
						className="bg-gray-700 text-white px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between min-w-[120px]"
					>
						<span>{arbLeagueFilter || 'All Leagues'}</span>
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
							<div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
								<div className="py-1">
									<button
										onClick={() => {
											setArbLeagueFilter('');
											setLeagueDropdownOpen(false);
										}}
										className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 cursor-pointer ${!arbLeagueFilter ? 'text-indigo-400' : 'text-white'}`}
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
														setArbLeagueFilter(league);
														setLeagueDropdownOpen(false);
													}
												}}
												disabled={isLocked}
												className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 ${
													arbLeagueFilter === league ? 'text-indigo-400 cursor-pointer' : isLocked ? 'text-gray-500 cursor-not-allowed' : 'text-white cursor-pointer'
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

				{/* Market Type Filter */}
				<div className="flex flex-col relative" ref={marketTypeDropdownRef}>
					<label className="text-sm text-gray-400 mb-1">Market Type</label>
					<button
						onClick={() => setMarketTypeDropdownOpen(!marketTypeDropdownOpen)}
						className="bg-gray-700 text-white px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between min-w-[140px]"
					>
						<span>
							{arbMarketTypeFilter.length === 0
								? 'All Markets'
								: `${arbMarketTypeFilter.length} selected`}
						</span>
						<svg
							className={`w-4 h-4 ml-2 transition-transform ${marketTypeDropdownOpen ? 'rotate-180' : ''}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{marketTypeDropdownOpen && (
						<div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-50 min-w-[160px]">
							{arbMarketTypeFilter.length > 0 && (
								<button
									onClick={() => setArbMarketTypeFilter([])}
									className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-gray-600 border-b border-gray-600"
								>
									Clear all
								</button>
							)}
							<div className="py-1">
								{MARKET_TYPES.map(market => (
									<label
										key={market.value}
										className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 px-3 py-2"
									>
										<input
											type="checkbox"
											checked={arbMarketTypeFilter.includes(market.value)}
											onChange={() => handleMarketTypeToggle(market.value)}
											className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
										/>
										<span className="text-sm text-white">{market.label}</span>
									</label>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Sportsbooks Filter */}
				<div className="flex flex-col relative" ref={sportsbookDropdownRef}>
					<label className="text-sm text-gray-400 mb-1">Sportsbooks</label>
					<button
						onClick={() => setSportsbookDropdownOpen(!sportsbookDropdownOpen)}
						className="bg-gray-700 text-white px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between min-w-[160px]"
					>
						<span>
							{arbSportsbookFilter.length === 0
								? 'All Sportsbooks'
								: `${arbSportsbookFilter.length} selected`}
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
						<div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-50 min-w-[180px]">
							{arbSportsbookFilter.length > 0 && (
								<button
									onClick={() => setArbSportsbookFilter([])}
									className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-gray-600 border-b border-gray-600"
								>
									Clear all
								</button>
							)}
							<div className="py-1 max-h-60 overflow-y-auto">
								{SPORTSBOOKS.map(sb => (
									<label
										key={sb}
										className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 px-3 py-2"
									>
										<input
											type="checkbox"
											checked={arbSportsbookFilter.includes(sb)}
											onChange={() => handleSportsbookToggle(sb)}
											className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
										/>
										<span className="text-sm text-white capitalize">{sb}</span>
									</label>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default ArbFilters;
