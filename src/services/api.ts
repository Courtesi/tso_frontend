import { auth } from '../config/firebase';
import type { TerminalPayload } from '../types/terminal';
import type {
	CreatePortalSessionRequest,
	SportsbooksResponse,
	StripeProduct,
} from '../types/stripe';

const API_URL = import.meta.env.VITE_API_URL;

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
		const detail = Array.isArray(error.detail)
			? error.detail.map((e: { msg?: string }) => e.msg).join(', ')
			: error.detail;
		throw new Error(detail || `HTTP error! status: ${response.status}`);
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

	async getProducts(): Promise<{ products: StripeProduct[] }> {
		return this.publicRequest('/api/products');
	}

	async getLeaguesConfig(): Promise<{ all_leagues: string[]; tier_allowed_leagues: Record<string, string[] | null> }> {
		return this.publicRequest('/api/config/leagues');
	}

	// ==================== PROTECTED ENDPOINTS ====================

	async deleteAccount(): Promise<{ message: string }> {
		return this.protectedRequest<{ message: string }>('/api/delete-account', {
			method: 'POST',
		});
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

	async getTerminalOdds(league: string): Promise<TerminalPayload> {
		return this.protectedRequest(`/api/terminal/odds?league=${encodeURIComponent(league)}`);
	}

	async getGameHistory(eventId: string, league: string): Promise<{ data: import('../types/terminal').GameTerminalData; tier: string }> {
		return this.protectedRequest(`/api/terminal/lines/${encodeURIComponent(eventId)}?league=${encodeURIComponent(league)}`);
	}
}

// Export singleton instance
export const api = new ApiService();
