import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL;

export interface CreatePortalSessionRequest {
	returnUrl: string;
}

// Sportsbook configuration interfaces
export interface SportsbookInfo {
	icon: string;
	display_name: string;
}

export interface SportsbooksResponse {
	sportsbooks: Record<string, SportsbookInfo>;
}

// Tier features configuration interfaces
export interface TierInfo {
	name: string;
	description?: string;
	price?: string;
	features_intro?: string;
	features: string[];
}

export interface TierFeaturesResponse {
	tiers: Record<string, TierInfo>;
}

export interface Arbs {
	message: string;
	tier: string;
	data: Array<{
		id: number;
		league: string;
		matchup: string;
		market: string;
		game_time: string;
		profit_percentage: number;
		bet1: {
			team: string;
			odds: number;
			sportsbook: string;
			stake: number;
		};
		bet2: {
			team: string;
			odds: number;
			sportsbook: string;
			stake: number;
		};
		found_at: string;
		expires_in_minutes: number;
	}>;
}

// Terminal/Line Movement Interfaces
export interface LineDataPoint {
	odds: number;
	sportsbook: string;
	timestamp: number;
}

export interface OutcomeLine {
	outcome_id: string;
	outcome_name: string;
	history: LineDataPoint[];
	current_best_odds: number;
	current_best_sportsbook: string;
	history_by_sportsbook?: Record<string, LineDataPoint[]>;
}

export interface MarketLines {
	market_type: string;
	market_display: string;
	outcomes: OutcomeLine[];
}

export interface GameTerminalData {
	event_id: string;
	sport: string;
	league: string;
	home_team: string;
	away_team: string;
	matchup: string;
	start_time: string;
	game_status: string;
	markets: MarketLines[];
}

export interface TerminalResponse {
	tier: string;
	data: GameTerminalData[];
	metadata?: {
		count: number;
		league: string;
		game_time: string;
	};
	cached_at?: string;
	message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
		throw new Error(error.detail || `HTTP error! status: ${response.status}`);
	}

	// Handle empty responses (204 No Content)
	if (response.status === 204) {
		return {} as T;
	}

	return response.json();
}

class ApiService {
	private async publicRequest<T = unknown>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${API_URL}${endpoint}`;
		const isFormData = options.body instanceof FormData;

		const config: RequestInit = {
			...options,
			headers: {
				// Don't set Content-Type for FormData - browser sets it with correct boundary
				...(isFormData ? {} : { 'Content-Type': 'application/json' }),
				...options.headers,
			},
		};

		// Convert body to JSON if it exists (but not for FormData)
		if (options.body && typeof options.body !== 'string' && !isFormData) {
			config.body = JSON.stringify(options.body);
		}

		const response = await fetch(url, config);
		return handleResponse<T>(response);
	}

	private async protectedRequest<T = unknown>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		// Get current user's ID token
		const currentUser = auth.currentUser;

		if (!currentUser) {
			throw new Error('No authenticated user found. Please log in.');
		}

		// Get fresh ID token (Firebase handles caching internally)
		const token = await currentUser.getIdToken();

		const url = `${API_URL}${endpoint}`;

		const config: RequestInit = {
			...options,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
				...options.headers,
			},
		};

		// Convert body to JSON if it exists
		if (options.body && typeof options.body !== 'string') {
			config.body = JSON.stringify(options.body);
		}

		const response = await fetch(url, config);
		return handleResponse<T>(response);
	}

	// ==================== PUBLIC ENDPOINTS ====================

	async getHealth(): Promise<{ msg: string }> {
		return this.publicRequest('/api/health');
	}

	async getSportsbooks(): Promise<SportsbooksResponse> {
		return this.publicRequest('/api/config/sportsbooks');
	}

	async getTierFeatures(): Promise<TierFeaturesResponse> {
		return this.publicRequest('/api/config/tiers');
	}

	// ==================== PROTECTED ENDPOINTS ====================

	async deleteAccount(): Promise<{ message: string }> {
		return this.protectedRequest<{ message: string }>('/api/delete-account', {
			method: 'POST',
		});
	}

	async getArbs(): Promise<Arbs> {
		return this.protectedRequest('/api/data/arbs');
	}

	// ==================== STRIPE ENDPOINTS ====================

	async createPortalSession(request: CreatePortalSessionRequest): Promise<{ url: string }> {
		return this.protectedRequest<{ url: string }>('/api/create-portal-session', {
			method: 'POST',
			body: JSON.stringify(request),
		});
	}

	async createBugReport(request: FormData): Promise<{ message: string }> {
		return this.publicRequest('/api/create-bug-report', {
			method: 'POST',
			// Don't set Content-Type - browser will set it with correct boundary for FormData
			body: request,
		});
	}

	// ==================== STREAMING ====================
	// NOTE: SSE streaming methods (streamArbs, streamTerminal) have been removed.
	// Real-time streaming now uses WebSocket via the wsService in websocket.ts

	// ==================== TERMINAL ENDPOINTS ====================

	async getTerminalData(league?: string, gameTime?: string): Promise<TerminalResponse> {
		let url = '/api/data/terminal';
		const params = new URLSearchParams();

		if (league) params.append('league', league);
		if (gameTime) params.append('game_time', gameTime);

		if (params.toString()) {
			url += `?${params.toString()}`;
		}

		return this.protectedRequest(url);
	}

	async getLineHistory(
		eventId: string,
		marketType: string,
		outcomeId: string,
		startTime?: number,
		endTime?: number
	): Promise<{ event_id: string; market_type: string; outcome_id: string; history: LineDataPoint[]; count: number }> {
		let url = `/api/data/terminal/lines/${eventId}/${marketType}/${outcomeId}`;
		const params = new URLSearchParams();

		if (startTime) params.append('start_time', startTime.toString());
		if (endTime) params.append('end_time', endTime.toString());

		if (params.toString()) {
			url += `?${params.toString()}`;
		}

		return this.protectedRequest(url);
	}

}

// Export singleton instance
export const api = new ApiService();
