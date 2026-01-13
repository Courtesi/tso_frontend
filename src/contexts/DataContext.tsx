import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { GameTerminalData } from '../services/api';
import { wsService, type ConnectionStatus, type FilterOptions } from '../services/websocket';

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
	sportsbookFilter: string[];
	setSportsbookFilter: (sportsbooks: string[]) => void;

	// WebSocket connection status
	connectionStatus: ConnectionStatus;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
	const { currentUser } = useAuth();
	const location = useLocation();

	// Determine which data streams should be active based on current route
	const shouldFetchArbs = location.pathname === '/dashboard';
	const shouldFetchCharts = location.pathname === '/charts';

	// Arbitrage state
	const [arbData, setArbData] = useState<ArbitrageBet[]>([]);
	const [arbLoading, setArbLoading] = useState(false);
	const [arbError, setArbError] = useState('');

	// Charts state
	const [chartsData, setChartsData] = useState<GameTerminalData[]>([]);
	const [chartsLoading, setChartsLoading] = useState(false);
	const [chartsError, setChartsError] = useState('');
	const [selectedGame, setSelectedGame] = useState<GameTerminalData | null>(null);

	// Filters
	const [leagueFilter, setLeagueFilter] = useState<string>('');
	const [gameTimeFilter, setGameTimeFilter] = useState<string>('upcoming');
	const [sportsbookFilter, setSportsbookFilter] = useState<string[]>([]);

	// WebSocket connection status
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

	// Cache terminal data per filter combination for instant filter switching
	const [cachedChartsData, setCachedChartsData] = useState<Map<string, {
		data: GameTerminalData[];
		timestamp: number;
	}>>(new Map());
	const CACHE_TTL = 30000; // 30 seconds

	// WebSocket connection management
	useEffect(() => {
		if (!currentUser) return;

		// Connect to WebSocket once
		const connectWebSocket = async () => {
			try {
				const token = await currentUser.getIdToken();
				await wsService.connect(token);
			} catch (error) {
				console.error('Failed to connect WebSocket:', error);
			}
		};

		connectWebSocket();

		// Subscribe to connection status updates
		const unsubscribe = wsService.onStatusChange(setConnectionStatus);

		// Cleanup on unmount or user change
		return () => {
			unsubscribe();
			wsService.disconnect();
		};
	}, [currentUser]);

	// Subscribe to arbitrage stream when on /dashboard
	useEffect(() => {
		if (!currentUser || !shouldFetchArbs || connectionStatus !== 'connected') return;

		console.log('Subscribing to arbs stream');
		setArbLoading(true);
		setArbError('');

		const filters: FilterOptions = {
			sportsbooks: sportsbookFilter.length > 0 ? sportsbookFilter : null
		};

		wsService.subscribe('arbs', filters, (data) => {
			setArbData(data.data);
			setArbError('');
			setArbLoading(false);
		});

		// Cleanup on unmount or when leaving dashboard
		return () => {
			console.log('Unsubscribing from arbs stream');
			wsService.unsubscribe('arbs');
		};
		// sportsbookFilter is intentionally omitted - filter updates are handled by the updateFilters effect below
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser, shouldFetchArbs, connectionStatus]);

	// Subscribe to terminal stream when on /charts
	useEffect(() => {
		if (!currentUser || !shouldFetchCharts || connectionStatus !== 'connected') return;

		console.log('Subscribing to terminal stream with filters:', {
			league: leagueFilter,
			game_time: gameTimeFilter,
			sportsbooks: sportsbookFilter
		});

		// Check cache and show immediately if available and fresh
		const cacheKey = `${leagueFilter || 'all'}:${gameTimeFilter || 'all'}:${sportsbookFilter.join(',')}`;
		const cached = cachedChartsData.get(cacheKey);

		if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
			// Show cached data instantly
			setChartsData(cached.data);
			setChartsLoading(false);
		} else {
			// No cache or stale - show loading
			if (chartsData.length === 0) {
				setChartsLoading(true);
			}
		}

		setChartsError('');

		const filters: FilterOptions = {
			league: leagueFilter || null,
			game_time: gameTimeFilter || null,
			sportsbooks: sportsbookFilter.length > 0 ? sportsbookFilter : null
		};

		wsService.subscribe('terminal', filters, (data) => {
			setChartsData(data.data);
			setChartsError('');
			setChartsLoading(false);

			// Cache the received data for instant filter switching
			const cacheKey = `${leagueFilter || 'all'}:${gameTimeFilter || 'all'}:${sportsbookFilter.join(',')}`;
			setCachedChartsData(prev => {
				const newCache = new Map(prev);
				newCache.set(cacheKey, {
					data: data.data,
					timestamp: Date.now()
				});
				return newCache;
			});

			setSelectedGame(prevSelected => {
				if (!prevSelected) {
					return data.data.length > 0 ? data.data[0] : null;
				}

				const updatedGame = data.data.find((g: GameTerminalData) => g.event_id === prevSelected.event_id);
				return updatedGame || data.data[0] || prevSelected;
			});
		});

		// Cleanup on unmount or when leaving charts
		return () => {
			console.log('Unsubscribing from terminal stream');
			wsService.unsubscribe('terminal');
		};
		// Filter values and cache are intentionally omitted - filter updates are handled by the updateFilters effect below
		// cachedChartsData and chartsData.length are only read on initial subscription, not tracked for changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser, shouldFetchCharts, connectionStatus]);

	// Update filters dynamically when they change (NO reconnection needed)
	useEffect(() => {
		if (connectionStatus !== 'connected') return;

		const filters: FilterOptions = {
			league: leagueFilter || null,
			game_time: gameTimeFilter || null,
			sportsbooks: sportsbookFilter.length > 0 ? sportsbookFilter : null
		};

		console.log('Updating WebSocket filters:', filters);
		wsService.updateFilters(filters);

	}, [leagueFilter, gameTimeFilter, sportsbookFilter, connectionStatus]);

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
		sportsbookFilter,
		setSportsbookFilter,
		connectionStatus,
	};

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Exporting custom hook alongside component is standard React context pattern
// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
	const context = useContext(DataContext);
	if (context === undefined) {
		throw new Error('useData must be used within a DataProvider');
	}
	return context;
}
