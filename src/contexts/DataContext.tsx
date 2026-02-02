import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { wsService, type ConnectionStatus, type FilterOptions } from '../services/websocket';
import type { ArbitrageBet } from '../types/arbs';
import type { GameTerminalData } from '../types/terminal';
import type { EVBet } from '../types/ev';

const PINNED_ARBS_STORAGE_KEY = 'pinnedArbs';

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

	// EV data
	evData: EVBet[];
	evLoading: boolean;
	evError: string;

	// Filters for charts
	leagueFilter: string[];
	setLeagueFilter: (leagues: string[]) => void;
	gameTimeFilter: string;
	setGameTimeFilter: (gameTime: string) => void;
	sportsbookFilter: string[];
	setSportsbookFilter: (sportsbooks: string[]) => void;

	// Arb-specific filters
	arbLeagueFilter: string[];
	setArbLeagueFilter: (leagues: string[]) => void;
	arbMinProfitFilter: number | null;
	setArbMinProfitFilter: (minProfit: number | null) => void;
	arbMaxProfitFilter: number | null;
	setArbMaxProfitFilter: (maxProfit: number | null) => void;
	arbMarketTypeFilter: string[];
	setArbMarketTypeFilter: (marketTypes: string[]) => void;
	arbSportsbookFilter: string[];
	setArbSportsbookFilter: (sportsbooks: string[]) => void;

	// EV-specific filters
	evLeagueFilter: string[];
	setEvLeagueFilter: (leagues: string[]) => void;
	evMinEvFilter: number | null;
	setEvMinEvFilter: (minEv: number | null) => void;
	evConfidenceFilter: string[];
	setEvConfidenceFilter: (confidence: string[]) => void;
	evSportsbookFilter: string[];
	setEvSportsbookFilter: (sportsbooks: string[]) => void;

	// WebSocket connection status
	connectionStatus: ConnectionStatus;

	// Pinned arbs
	pinArb: (arb: ArbitrageBet) => void;
	unpinArb: (arbId: string) => void;
	isPinned: (arbId: string) => boolean;
	isArbStale: (arbId: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Load pinned arbs from localStorage
function loadPinnedArbs(): Map<string, ArbitrageBet> {
	try {
		const stored = localStorage.getItem(PINNED_ARBS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Record<string, ArbitrageBet>;
			return new Map(Object.entries(parsed));
		}
	} catch (e) {
		console.error('Failed to load pinned arbs from localStorage:', e);
	}
	return new Map();
}

// Save pinned arbs to localStorage
function savePinnedArbs(pinnedArbs: Map<string, ArbitrageBet>): void {
	try {
		const obj = Object.fromEntries(pinnedArbs);
		localStorage.setItem(PINNED_ARBS_STORAGE_KEY, JSON.stringify(obj));
	} catch (e) {
		console.error('Failed to save pinned arbs to localStorage:', e);
	}
}

// Generate a unique fingerprint for an arb based on its content
// Matches backend logic: event + market + sorted sportsbooks
function getArbFingerprint(arb: ArbitrageBet): string {
	const sportsbooks = [arb.bet1.sportsbook, arb.bet2.sportsbook].sort();
	return `${arb.matchup}|${arb.market}|${sportsbooks[0]}|${sportsbooks[1]}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
	const { currentUser } = useAuth();
	const location = useLocation();

	// Determine which data streams should be active based on current route
	const shouldFetchArbs = location.pathname === '/dashboard';
	const shouldFetchCharts = location.pathname === '/charts';
	const shouldFetchEv = location.pathname === '/ev-bets';

	// Arbitrage state
	const [arbData, setArbData] = useState<ArbitrageBet[]>([]);
	const [arbLoading, setArbLoading] = useState(false);
	const [arbError, setArbError] = useState('');

	// Charts state
	const [chartsData, setChartsData] = useState<GameTerminalData[]>([]);
	const [chartsLoading, setChartsLoading] = useState(false);
	const [chartsError, setChartsError] = useState('');
	const [selectedGame, setSelectedGame] = useState<GameTerminalData | null>(null);

	// EV state
	const [evData, setEvData] = useState<EVBet[]>([]);
	const [evLoading, setEvLoading] = useState(false);
	const [evError, setEvError] = useState('');

	// Filters for charts
	const [leagueFilter, setLeagueFilter] = useState<string[]>([]);
	const [gameTimeFilter, setGameTimeFilter] = useState<string>('upcoming');
	const [sportsbookFilter, setSportsbookFilter] = useState<string[]>([]);

	// Arb-specific filters
	const [arbLeagueFilter, setArbLeagueFilter] = useState<string[]>([]);
	const [arbMinProfitFilter, setArbMinProfitFilter] = useState<number | null>(0);
	const [arbMaxProfitFilter, setArbMaxProfitFilter] = useState<number | null>(null);
	const [arbMarketTypeFilter, setArbMarketTypeFilter] = useState<string[]>([]);
	const [arbSportsbookFilter, setArbSportsbookFilter] = useState<string[]>([]);

	// EV-specific filters
	const [evLeagueFilter, setEvLeagueFilter] = useState<string[]>([]);
	const [evMinEvFilter, setEvMinEvFilter] = useState<number | null>(0);
	const [evConfidenceFilter, setEvConfidenceFilter] = useState<string[]>([]);
	const [evSportsbookFilter, setEvSportsbookFilter] = useState<string[]>([]);

	// WebSocket connection status
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

	// Refs to skip redundant filter updates on initial subscribe
	const terminalJustSubscribed = useRef(false);
	const arbsJustSubscribed = useRef(false);
	const evJustSubscribed = useRef(false);

	// Pinned arbs state (stores full arb objects for stale display)
	const [pinnedArbs, setPinnedArbs] = useState<Map<string, ArbitrageBet>>(() => loadPinnedArbs());

	// Ref to track current pinnedArbs for use in callbacks (avoids stale closure)
	const pinnedArbsRef = useRef<Map<string, ArbitrageBet>>(pinnedArbs);

	// Keep the ref in sync with state
	useEffect(() => {
		pinnedArbsRef.current = pinnedArbs;
	}, [pinnedArbs]);

	// Track last seen timestamps for pinned arbs
	const [arbLastSeen, setArbLastSeen] = useState<Map<string, Date>>(new Map());

	// Ref to track current arbLastSeen for use in callbacks (avoids stale closure)
	const arbLastSeenRef = useRef<Map<string, Date>>(arbLastSeen);

	// Keep the ref in sync with state
	useEffect(() => {
		arbLastSeenRef.current = arbLastSeen;
	}, [arbLastSeen]);

	// Track which pinned arbs are stale (not in latest server data)
	const [staleArbIds, setStaleArbIds] = useState<Set<string>>(new Set());

	// Pinned arbs functions
	const pinArb = useCallback((arb: ArbitrageBet) => {
		setPinnedArbs(prev => {
			const next = new Map(prev);
			next.set(arb.id.toString(), arb);
			savePinnedArbs(next);
			return next;
		});
	}, []);

	const unpinArb = useCallback((arbId: string) => {
		setPinnedArbs(prev => {
			const next = new Map(prev);
			next.delete(arbId);
			savePinnedArbs(next);
			return next;
		});
	}, []);

	const isPinned = useCallback((arbId: string): boolean => {
		return pinnedArbs.has(arbId);
	}, [pinnedArbs]);

	// Cache terminal data per filter combination for instant filter switching
	const [cachedChartsData, setCachedChartsData] = useState<Map<string, {
		data: GameTerminalData[];
		timestamp: number;
	}>>(new Map());

	// WebSocket connection management
	// Depend on UID, not the User object reference — Firebase's onAuthStateChanged
	// fires multiple times on page load (cached user, then server-verified user),
	// producing a new User reference each time. Using the full object as a dependency
	// causes a needless disconnect → reconnect cycle.
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser?.uid]);

	// Subscribe to arbitrage stream when on /dashboard
	useEffect(() => {
		if (!currentUser || !shouldFetchArbs || connectionStatus !== 'connected') return;

		console.log('Subscribing to arbs stream');
		if (arbData.length === 0) setArbLoading(true);
		setArbError('');

		const filters: FilterOptions = {
			sportsbooks: arbSportsbookFilter.length > 0 ? arbSportsbookFilter : null,
			min_profit: arbMinProfitFilter,
			max_profit: arbMaxProfitFilter,
			league: arbLeagueFilter.length > 0 ? arbLeagueFilter : null,
			market_type: arbMarketTypeFilter.length > 0 ? arbMarketTypeFilter : null
		};

		arbsJustSubscribed.current = true;
		wsService.subscribe('arbs', filters, (data) => {
			const incomingArbs = data.data as ArbitrageBet[];
			const currentTime = new Date();

			// Update last seen timestamps for all incoming arbs (use ref to avoid stale closure)
			const newLastSeen = new Map(arbLastSeenRef.current);
			incomingArbs.forEach(arb => {
				newLastSeen.set(arb.id.toString(), currentTime);
			});

			// Get current pinned arbs (use ref to avoid stale closure)
			const currentPinnedArbs = pinnedArbsRef.current;

			// Create fingerprint-based lookups
			const incomingByFingerprint = new Map<string, ArbitrageBet>();
			incomingArbs.forEach(arb => {
				incomingByFingerprint.set(getArbFingerprint(arb), arb);
			});

			const pinnedByFingerprint = new Map<string, ArbitrageBet>();
			Array.from(currentPinnedArbs.values()).forEach(arb => {
				pinnedByFingerprint.set(getArbFingerprint(arb), arb);
			});

			// Categorize by fingerprint (mutually exclusive)
			const freshPinnedArbs: ArbitrageBet[] = [];
			const stalePinnedArbs: ArbitrageBet[] = [];
			const unpinnedArbs: ArbitrageBet[] = [];
			let pinnedArbsUpdated = false;

			// Check each pinned arb - is it in incoming?
			pinnedByFingerprint.forEach((pinnedArb, fingerprint) => {
				const incomingArb = incomingByFingerprint.get(fingerprint);
				if (incomingArb) {
					// Arb exists in both - use fresh data, mark as pinned
					freshPinnedArbs.push(incomingArb);
					// Update the stored pinned arb with fresh data (including new ID if changed)
					if (pinnedArb.id !== incomingArb.id) {
						currentPinnedArbs.delete(pinnedArb.id.toString());
					}
					currentPinnedArbs.set(incomingArb.id.toString(), incomingArb);
					pinnedArbsUpdated = true;
				} else {
					// Arb only in pinned - it's stale
					stalePinnedArbs.push(pinnedArb);
				}
			});

			// Check incoming arbs that aren't pinned
			incomingByFingerprint.forEach((arb, fingerprint) => {
				if (!pinnedByFingerprint.has(fingerprint)) {
					unpinnedArbs.push(arb);
				}
			});

			// Save updated pinned arbs if we refreshed any with new data
			if (pinnedArbsUpdated) {
				savePinnedArbs(currentPinnedArbs);
				setPinnedArbs(new Map(currentPinnedArbs));
			}

			// Auto-unpin stale arbs older than 30 minutes
			const staleThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds
			const autoUnpinIds: string[] = [];

			stalePinnedArbs.forEach(arb => {
				const lastSeen = newLastSeen.get(arb.id.toString());
				if (lastSeen && (currentTime.getTime() - lastSeen.getTime()) > staleThreshold) {
					autoUnpinIds.push(arb.id.toString());
				}
			});

			// Remove auto-unpinned IDs
			if (autoUnpinIds.length > 0) {
				autoUnpinIds.forEach(id => unpinArb(id));
			}

			// Track which pinned arbs are stale
			const remainingStalePinned = stalePinnedArbs.filter(arb => !autoUnpinIds.includes(arb.id.toString()));
			setStaleArbIds(new Set(remainingStalePinned.map(arb => arb.id.toString())));

			// Merge and sort: fresh pinned → stale pinned → unpinned
			const sortedData = [
				...freshPinnedArbs.sort((a, b) => b.profit_percentage - a.profit_percentage),
				...remainingStalePinned,
				...unpinnedArbs.sort((a, b) => b.profit_percentage - a.profit_percentage)
			];

			setArbData(sortedData);
			setArbLastSeen(newLastSeen);
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
	}, [currentUser?.uid, shouldFetchArbs, connectionStatus]);

	// Subscribe to terminal stream when on /charts
	useEffect(() => {
		if (!currentUser || !shouldFetchCharts || connectionStatus !== 'connected') return;

		console.log('Subscribing to terminal stream with filters:', {
			league: leagueFilter,
			game_time: gameTimeFilter,
			sportsbooks: sportsbookFilter
		});

		// Check cache and show immediately if available and fresh
		const cacheKey = `${leagueFilter.length > 0 ? leagueFilter.join(',') : 'all'}:${gameTimeFilter || 'all'}:${sportsbookFilter.join(',')}`;
		const cached = cachedChartsData.get(cacheKey);

		if (cached) {
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
			league: leagueFilter.length > 0 ? leagueFilter : null,
			game_time: gameTimeFilter || null,
			sportsbooks: sportsbookFilter.length > 0 ? sportsbookFilter : null
		};

		terminalJustSubscribed.current = true;
		wsService.subscribe('terminal', filters, (data) => {
			const terminalData = data.data as GameTerminalData[];
			setChartsData(terminalData);
			setChartsError('');
			setChartsLoading(false);

			// Cache the received data for instant filter switching
			const cacheKey = `${leagueFilter.length > 0 ? leagueFilter.join(',') : 'all'}:${gameTimeFilter || 'all'}:${sportsbookFilter.join(',')}`;
			setCachedChartsData(prev => {
				const newCache = new Map(prev);
				newCache.set(cacheKey, {
					data: terminalData,
					timestamp: Date.now()
				});
				return newCache;
			});

			setSelectedGame(prevSelected => {
				if (!prevSelected) {
					return terminalData.length > 0 ? terminalData[0] : null;
				}

				const updatedGame = terminalData.find((g: GameTerminalData) => g.event_id === prevSelected.event_id);
				return updatedGame || terminalData[0] || prevSelected;
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
	}, [currentUser?.uid, shouldFetchCharts, connectionStatus]);

	// Update terminal filters dynamically when they change (NO reconnection needed)
	useEffect(() => {
		if (connectionStatus !== 'connected' || !shouldFetchCharts) return;

		if (terminalJustSubscribed.current) {
			terminalJustSubscribed.current = false;
			return;
		}

		const filters: FilterOptions = {
			league: leagueFilter.length > 0 ? leagueFilter : null,
			game_time: gameTimeFilter || null,
			sportsbooks: sportsbookFilter.length > 0 ? sportsbookFilter : null
		};

		console.log('Updating terminal WebSocket filters:', filters);
		wsService.updateFilters('terminal', filters);

	}, [leagueFilter, gameTimeFilter, sportsbookFilter, connectionStatus, shouldFetchCharts]);

	// Update arb filters dynamically (separate from terminal filters)
	// Debounced to prevent overwhelming WebSocket when slider is dragged rapidly
	useEffect(() => {
		if (connectionStatus !== 'connected' || !shouldFetchArbs) return;

		if (arbsJustSubscribed.current) {
			arbsJustSubscribed.current = false;
			return;
		}

		console.log('[ArbFilter] Scheduling update - min:', arbMinProfitFilter, 'max:', arbMaxProfitFilter);

		const timeoutId = setTimeout(() => {
			const filters: FilterOptions = {
				sportsbooks: arbSportsbookFilter.length > 0 ? arbSportsbookFilter : null,
				min_profit: arbMinProfitFilter,
				max_profit: arbMaxProfitFilter,
				league: arbLeagueFilter.length > 0 ? arbLeagueFilter : null,
				market_type: arbMarketTypeFilter.length > 0 ? arbMarketTypeFilter : null
			};

			console.log('[ArbFilter] Sending filters:', JSON.stringify(filters));
			wsService.updateFilters('arbs', filters);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [arbLeagueFilter, arbMinProfitFilter, arbMaxProfitFilter, arbMarketTypeFilter, arbSportsbookFilter, connectionStatus, shouldFetchArbs]);

	// Subscribe to EV stream when on /ev-bets
	useEffect(() => {
		if (!currentUser || !shouldFetchEv || connectionStatus !== 'connected') return;

		console.log('Subscribing to EV stream');
		if (evData.length === 0) setEvLoading(true);
		setEvError('');

		const filters: FilterOptions = {
			sportsbooks: evSportsbookFilter.length > 0 ? evSportsbookFilter : null,
			min_ev: evMinEvFilter,
			league: evLeagueFilter.length > 0 ? evLeagueFilter : null,
			confidence: evConfidenceFilter.length > 0 ? evConfidenceFilter : null
		};

		evJustSubscribed.current = true;
		wsService.subscribe('ev', filters, (data) => {
			const incomingEvBets = data.data as EVBet[];
			setEvData(incomingEvBets);
			setEvError('');
			setEvLoading(false);
		});

		// Cleanup on unmount or when leaving ev-bets page
		return () => {
			console.log('Unsubscribing from EV stream');
			wsService.unsubscribe('ev');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser?.uid, shouldFetchEv, connectionStatus]);

	// Update EV filters dynamically
	// Debounced to prevent overwhelming WebSocket when slider is dragged rapidly
	useEffect(() => {
		if (connectionStatus !== 'connected' || !shouldFetchEv) return;

		if (evJustSubscribed.current) {
			evJustSubscribed.current = false;
			return;
		}

		const timeoutId = setTimeout(() => {
			const filters: FilterOptions = {
				sportsbooks: evSportsbookFilter.length > 0 ? evSportsbookFilter : null,
				min_ev: evMinEvFilter,
				league: evLeagueFilter.length > 0 ? evLeagueFilter : null,
				confidence: evConfidenceFilter.length > 0 ? evConfidenceFilter : null
			};

			console.log('[EVFilter] Sending filters:', JSON.stringify(filters));
			wsService.updateFilters('ev', filters);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [evLeagueFilter, evMinEvFilter, evConfidenceFilter, evSportsbookFilter, connectionStatus, shouldFetchEv]);

	// Helper function to check if a pinned arb is stale (not in latest incoming data)
	const isArbStale = useCallback((arbId: string): boolean => {
		return staleArbIds.has(arbId);
	}, [staleArbIds]);

	const value = {
		arbData,
		arbLoading,
		arbError,
		chartsData,
		chartsLoading,
		chartsError,
		selectedGame,
		setSelectedGame,
		evData,
		evLoading,
		evError,
		leagueFilter,
		setLeagueFilter,
		gameTimeFilter,
		setGameTimeFilter,
		sportsbookFilter,
		setSportsbookFilter,
		arbLeagueFilter,
		setArbLeagueFilter,
		arbMinProfitFilter,
		setArbMinProfitFilter,
		arbMaxProfitFilter,
		setArbMaxProfitFilter,
		arbMarketTypeFilter,
		setArbMarketTypeFilter,
		arbSportsbookFilter,
		setArbSportsbookFilter,
		evLeagueFilter,
		setEvLeagueFilter,
		evMinEvFilter,
		setEvMinEvFilter,
		evConfidenceFilter,
		setEvConfidenceFilter,
		evSportsbookFilter,
		setEvSportsbookFilter,
		connectionStatus,
		pinArb,
		unpinArb,
		isPinned,
		isArbStale,
	};

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Exporting custom hook alongside component is standard React context pattern
export function useData() {
	const context = useContext(DataContext);
	if (context === undefined) {
		throw new Error('useData must be used within a DataProvider');
	}
	return context;
}
