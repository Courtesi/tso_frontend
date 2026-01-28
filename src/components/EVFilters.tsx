import { useState, useRef, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

// Leagues available to free tier users
const FREE_TIER_LEAGUES = ['NBA', 'NFL', 'MLB'];
const ALL_LEAGUES = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF'];

// Confidence levels
const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];

// Available sportsbooks (excluding prediction markets)
const SPORTSBOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'fliff', 'novig', 'prophetx', 'espnbet'];

// EV range constants
const MIN_EV = 0;
const MAX_EV = 20;

function EVFilters() {
	const { userTier } = useAuth();
	const {
		evLeagueFilter,
		setEvLeagueFilter,
		evMinEvFilter,
		setEvMinEvFilter,
		evConfidenceFilter,
		setEvConfidenceFilter,
		evSportsbookFilter,
		setEvSportsbookFilter
	} = useData();

	const [sportsbookDropdownOpen, setSportsbookDropdownOpen] = useState(false);
	const [confidenceDropdownOpen, setConfidenceDropdownOpen] = useState(false);
	const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
	const sportsbookDropdownRef = useRef<HTMLDivElement>(null);
	const confidenceDropdownRef = useRef<HTMLDivElement>(null);
	const leagueDropdownRef = useRef<HTMLDivElement>(null);

	// Slider value
	const minValue = evMinEvFilter ?? MIN_EV;

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (sportsbookDropdownRef.current && !sportsbookDropdownRef.current.contains(event.target as Node)) {
				setSportsbookDropdownOpen(false);
			}
			if (confidenceDropdownRef.current && !confidenceDropdownRef.current.contains(event.target as Node)) {
				setConfidenceDropdownOpen(false);
			}
			if (leagueDropdownRef.current && !leagueDropdownRef.current.contains(event.target as Node)) {
				setLeagueDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSliderChange = (value: number | number[]) => {
		if (typeof value === 'number') {
			setEvMinEvFilter(value);
		}
	};

	const handleConfidenceToggle = (confidence: string) => {
		if (evConfidenceFilter.includes(confidence)) {
			setEvConfidenceFilter(evConfidenceFilter.filter(c => c !== confidence));
		} else {
			setEvConfidenceFilter([...evConfidenceFilter, confidence]);
		}
	};

	const handleSportsbookToggle = (sportsbook: string) => {
		if (evSportsbookFilter.includes(sportsbook)) {
			setEvSportsbookFilter(evSportsbookFilter.filter(s => s !== sportsbook));
		} else {
			setEvSportsbookFilter([...evSportsbookFilter, sportsbook]);
		}
	};

	const handleLeagueToggle = (league: string) => {
		if (evLeagueFilter.includes(league)) {
			setEvLeagueFilter(evLeagueFilter.filter(l => l !== league));
		} else {
			setEvLeagueFilter([...evLeagueFilter, league]);
		}
	};

	return (
		<div className="bg-black border-2 border-gray-700 rounded-lg p-4 mb-6">
			<div className="flex flex-wrap items-start gap-4">
				{/* Min EV Slider */}
				<div className="flex flex-col min-w-[180px]">
					<label className="text-sm text-gray-200 mb-1">
						Min EV: {minValue.toFixed(1)}%
					</label>
					<div className="pt-1 pb-2">
						<Slider
							min={MIN_EV}
							max={MAX_EV}
							step={0.5}
							value={minValue}
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

				{/* Confidence Filter */}
				<div className="flex flex-col relative" ref={confidenceDropdownRef}>
					<label className="text-sm text-gray-200 mb-1">Confidence</label>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setConfidenceDropdownOpen(!confidenceDropdownOpen);
						}}
						className="bg-gray-950 border border-gray-600 text-white px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between min-w-[130px]"
					>
						<span>
							{evConfidenceFilter.length === 0
								? 'All Levels'
								: `${evConfidenceFilter.length} selected`}
						</span>
						<svg
							className={`w-4 h-4 ml-2 transition-transform ${confidenceDropdownOpen ? 'rotate-180' : ''}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{confidenceDropdownOpen && (
						<div className="absolute top-full left-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50 min-w-[140px]">
							{evConfidenceFilter.length > 0 && (
								<button
									onClick={() => setEvConfidenceFilter([])}
									className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 border-b border-gray-600 cursor-pointer"
								>
									Clear all
								</button>
							)}
							<div className="py-1">
								{CONFIDENCE_LEVELS.map(level => (
									<label
										key={level}
										className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 px-3 py-2"
									>
										<input
											type="checkbox"
											checked={evConfidenceFilter.includes(level)}
											onChange={() => handleConfidenceToggle(level)}
											className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
										/>
										<span className={`text-sm ${
											level === 'HIGH' ? 'text-green-400' :
											level === 'MEDIUM' ? 'text-yellow-400' :
											'text-red-400'
										}`}>
											{level}
										</span>
									</label>
								))}
							</div>
						</div>
					)}
				</div>

				{/* League Filter */}
				<div className="flex flex-col relative" ref={leagueDropdownRef}>
					<label className="text-sm text-gray-200 mb-1">Leagues</label>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setLeagueDropdownOpen(!leagueDropdownOpen);
						}}
						className="bg-gray-950 border border-gray-600 text-white px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between min-w-[120px]"
					>
						<span>
							{evLeagueFilter.length === 0
								? 'All Leagues'
								: `${evLeagueFilter.length} selected`}
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
						<div className="absolute top-full left-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50 min-w-[140px]">
							{evLeagueFilter.length > 0 && (
								<button
									onClick={() => setEvLeagueFilter([])}
									className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 border-b border-gray-600 cursor-pointer"
								>
									Clear all
								</button>
							)}
							<div className="py-1">
								{ALL_LEAGUES.map(league => {
									const isLocked = userTier === 'free' && !FREE_TIER_LEAGUES.includes(league);
									return (
										<label
											key={league}
											className={`flex items-center gap-2 px-3 py-2 ${
												isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-800'
											}`}
										>
											<input
												type="checkbox"
												checked={evLeagueFilter.includes(league)}
												onChange={() => !isLocked && handleLeagueToggle(league)}
												disabled={isLocked}
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

				{/* Sportsbooks Filter */}
				<div className="flex flex-col relative" ref={sportsbookDropdownRef}>
					<label className="text-sm text-gray-200 mb-1">Sportsbooks</label>
					<button
						onClick={() => setSportsbookDropdownOpen(!sportsbookDropdownOpen)}
						className="bg-gray-950 border border-gray-600 text-white px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between min-w-[160px]"
					>
						<span>
							{evSportsbookFilter.length === 0
								? 'All Sportsbooks'
								: `${evSportsbookFilter.length} selected`}
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
						<div className="absolute top-full left-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50 min-w-[180px]">
							{evSportsbookFilter.length > 0 && (
								<button
									onClick={() => setEvSportsbookFilter([])}
									className="w-full text-left px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 border-b border-gray-600 cursor-pointer"
								>
									Clear all
								</button>
							)}
							<div className="py-1 max-h-60 overflow-y-auto">
								{SPORTSBOOKS.map(sb => (
									<label
										key={sb}
										className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 px-3 py-2"
									>
										<input
											type="checkbox"
											checked={evSportsbookFilter.includes(sb)}
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

export default EVFilters;
