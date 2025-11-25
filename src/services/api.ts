import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL;

export interface CreatePortalSessionRequest {
	returnUrl: string;
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
	private async publicRequest<T = any>(
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

	private async protectedRequest<T = any>(
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

	// ==================== SSE STREAMING ====================

	streamArbs(onMessage: (data: Arbs) => void, onError: (error: Error) => void): () => void {
		const currentUser = auth.currentUser;

		if (!currentUser) {
			onError(new Error('No authenticated user found. Please log in.'));
			return () => {};
		}

		let eventSource: EventSource | null = null;
		let isCleaningUp = false;

		const connect = async () => {
			if (isCleaningUp) return;

			try {
				// Get fresh token
				const token = await currentUser.getIdToken();

				// Create EventSource with token as query parameter
				const url = `${API_URL}/api/data/arbs/stream?token=${token}`;
				eventSource = new EventSource(url);

				eventSource.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);
						onMessage(data);
					} catch (err) {
						console.error('Failed to parse SSE message:', err);
					}
				};

				eventSource.onerror = (error) => {
					console.error('SSE connection error:', error);
					eventSource?.close();

					if (!isCleaningUp) {
						// Reconnect after 5 seconds
						setTimeout(connect, 5000);
					}

					onError(new Error('SSE connection failed'));
				};
			} catch (err) {
				onError(err instanceof Error ? err : new Error('Failed to connect'));
			}
		};

		connect();

		// Return cleanup function
		return () => {
			isCleaningUp = true;
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		};
	}

}

// Export singleton instance
export const api = new ApiService();
