import { createContext, useContext, useState, useEffect, type ReactNode, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api, type GameTerminalData } from '../services/api';

interface BetSide {
	team: string;
	odds: number;
	sportsbook: string;
	stake: number;
}

interface ArbitrageBet {
	id: number;
	league: string;
	matchup: string;
	market: string;
	game_time: string;
	profit_percentage: number;
	bet1: BetSide;
	bet2: BetSide;
	found_at: string;
	expires_in_minutes: number;
}

interface DataContextType {
	// Arbitrage data
	arbData: ArbitrageBet[];
	arbLoading: boolean;
	arbError: string;

	// Terminal/Charts data
	chartsData: GameTerminalData[];
	chartsLoading: boolean;
	chartsError: string;
	selectedGame: GameTerminalData | null;
	setSelectedGame: (game: GameTerminalData | null) => void;

	// Filters for charts
	leagueFilter: string;
	setLeagueFilter: (league: string) => void;
	gameTimeFilter: string;
	setGameTimeFilter: (gameTime: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
	const { currentUser, userTier } = useAuth();
	const location = useLocation();

	// Determine which data streams should be active based on current route
	const shouldFetchArbs = location.pathname === '/dashboard';
	const shouldFetchCharts = location.pathname === '/charts';

	// Arbitrage state
	const [arbData, setArbData] = useState<ArbitrageBet[]>([]);
	const [arbLoading, setArbLoading] = useState(false);
	const [arbError, setArbError] = useState('');
	const [useArbSSE, setUseArbSSE] = useState(true);

	// Charts state
	const [chartsData, setChartsData] = useState<GameTerminalData[]>([]);
	const [chartsLoading, setChartsLoading] = useState(false);
	const [chartsError, setChartsError] = useState('');
	const [selectedGame, setSelectedGame] = useState<GameTerminalData | null>(null);
	const [leagueFilter, setLeagueFilter] = useState<string>('');
	const [gameTimeFilter, setGameTimeFilter] = useState<string>('upcoming');
	const [useChartsSSE, setUseChartsSSE] = useState(true);

	const currentFiltersRef = useRef({ league: leagueFilter, gameTime: gameTimeFilter });

	useEffect(() => {
		currentFiltersRef.current = { league: leagueFilter, gameTime: gameTimeFilter };
	}, [leagueFilter, gameTimeFilter]);

	// Fetch arbitrage data (only when on /dashboard)
	useEffect(() => {
		if (!currentUser || !shouldFetchArbs) return;

		if (useArbSSE) {
			// Only show loading if we don't have cached data
			if (arbData.length === 0) {
				setArbLoading(true);
			}
			setArbError('');

			const cleanup = api.streamArbs(
				(data) => {
					setArbData(data.data);
					setArbError('');
					setArbLoading(false);
				},
				(err) => {
					console.error('SSE failed, falling back to polling:', err);
					setUseArbSSE(false);
				}
			);

			return cleanup;
		} else {
			const fetchData = async (isInitial = false) => {
				// Only show loading if we don't have cached data
				if (isInitial && arbData.length === 0) setArbLoading(true);
				setArbError('');

				try {
					const response = await api.getArbs();
					setArbData(response.data);
				} catch (err: any) {
					console.error('Error fetching arbs:', err);
					setArbError(err.message || 'Failed to load data');
				} finally {
					if (isInitial) setArbLoading(false);
				}
			};

			fetchData(true);

			const pollInterval = userTier === 'premium' ? 5000 : 60000;
			const intervalId = setInterval(() => fetchData(false), pollInterval);

			return () => clearInterval(intervalId);
		}
	}, [currentUser, userTier, useArbSSE, shouldFetchArbs]);

	// Fetch charts data (only when on /charts)
	useEffect(() => {
		if (!currentUser || !shouldFetchCharts) return;

		const effectFilters = { league: leagueFilter, gameTime: gameTimeFilter };

		if (useChartsSSE) {
			// Only show loading if we don't have cached data
			if (chartsData.length === 0) {
				setChartsLoading(true);
			}
			setChartsError('');

			const cleanup = api.streamTerminal(
				(data) => {
					if (currentFiltersRef.current.league !== effectFilters.league ||
						currentFiltersRef.current.gameTime !== effectFilters.gameTime) {
						return;
					}

					setChartsData(data.data);
					setChartsError('');
					setChartsLoading(false);

					setSelectedGame(prevSelected => {
						if (!prevSelected) {
							return data.data.length > 0 ? data.data[0] : null;
						}

						const updatedGame = data.data.find(g => g.event_id === prevSelected.event_id);
						return updatedGame || data.data[0] || prevSelected;
					});
				},
				(err) => {
					console.error('SSE failed, falling back to polling:', err);
					setUseChartsSSE(false);
				},
				leagueFilter,
				gameTimeFilter
			);

			return cleanup;
		} else {
			const fetchData = async (isInitial = false) => {
				// Only show loading if we don't have cached data
				if (isInitial && chartsData.length === 0) setChartsLoading(true);
				setChartsError('');

				try {
					const response = await api.getTerminalData(leagueFilter, gameTimeFilter);

					if (currentFiltersRef.current.league !== effectFilters.league ||
						currentFiltersRef.current.gameTime !== effectFilters.gameTime) {
						return;
					}

					setChartsData(response.data);

					setSelectedGame(prevSelected => {
						if (!prevSelected) {
							return response.data.length > 0 ? response.data[0] : null;
						}

						const updatedGame = response.data.find(g => g.event_id === prevSelected.event_id);
						return updatedGame || response.data[0] || prevSelected;
					});
				} catch (err: any) {
					console.error('Error fetching terminal data:', err);
					setChartsError(err.message || 'Failed to load terminal data');
				} finally {
					if (isInitial) setChartsLoading(false);
				}
			};

			fetchData(true);

			const pollInterval = userTier === 'premium' ? 5000 : 60000;
			const intervalId = setInterval(() => fetchData(false), pollInterval);

			return () => clearInterval(intervalId);
		}
	}, [currentUser, userTier, useChartsSSE, leagueFilter, gameTimeFilter, shouldFetchCharts]);

	const value = {
		arbData,
		arbLoading,
		arbError,
		chartsData,
		chartsLoading,
		chartsError,
		selectedGame,
		setSelectedGame,
		leagueFilter,
		setLeagueFilter,
		gameTimeFilter,
		setGameTimeFilter,
	};

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
	const context = useContext(DataContext);
	if (context === undefined) {
		throw new Error('useData must be used within a DataProvider');
	}
	return context;
}
