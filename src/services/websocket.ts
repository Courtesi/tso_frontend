import { auth } from '../config/firebase';

const WS_URL = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';

export interface FilterOptions {
	// Terminal/Charts filters
	league?: string | string[] | null;
	game_time?: string | null;
	sportsbooks?: string[] | null;

	// Arb-specific filters
	min_profit?: number | null;
	max_profit?: number | null;
	market_type?: string | string[] | null;

	// EV-specific filters
	min_ev?: number | null;
	confidence?: string[] | null;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
export type StreamType = 'arbs' | 'terminal' | 'ev';

// Type for stream data callback - allows any structure but maintains type safety
export interface StreamDataPayload {
	data: unknown[];
	[key: string]: unknown;
}

export type StreamCallback = (data: StreamDataPayload) => void;

interface WebSocketMessage {
	type: string;
	stream?: StreamType;
	filters?: FilterOptions;
	token?: string;
	payload?: StreamDataPayload;
	user?: string;
	message?: string;
	code?: number;
}

export class WebSocketService {
	private ws: WebSocket | null = null;
	private reconnectTimeout: number | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 5000;
	private pingInterval: number | null = null;
	private pongTimeout: number | null = null;
	private connectionStatus: ConnectionStatus = 'disconnected';
	private currentToken: string | null = null;
	private pendingSubscriptions: Map<StreamType, {filters: FilterOptions, callback: StreamCallback}> = new Map();

	// Callbacks
	private onMessageCallbacks: Map<StreamType, StreamCallback> = new Map();
	private onStatusChangeCallbacks: Set<(status: ConnectionStatus) => void> = new Set();

	constructor() {
		// Bind methods to maintain context
		this.handleMessage = this.handleMessage.bind(this);
		this.handleError = this.handleError.bind(this);
		this.handleClose = this.handleClose.bind(this);
	}

	async connect(token: string): Promise<void> {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			console.log('WebSocket already connected');
			return;
		}

		this.currentToken = token;
		this.setStatus('reconnecting');

		try {
			const wsUrl = `${WS_URL}/api/ws`;
			console.log('Connecting to WebSocket:', wsUrl);

			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = async () => {
				console.log('WebSocket connected, authenticating...');
				this.reconnectAttempts = 0;

				// Send authentication message
				this.send({
					type: 'authenticate',
					token: this.currentToken ?? undefined
				});
			};

			this.ws.onmessage = this.handleMessage;
			this.ws.onerror = this.handleError;
			this.ws.onclose = this.handleClose;

		} catch (error) {
			console.error('WebSocket connection failed:', error);
			this.handleError(error as Event);
		}
	}

	disconnect(): void {
		console.log('Disconnecting WebSocket');
		this.stopHeartbeat();

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.ws) {
			this.ws.onclose = null; // Prevent reconnection
			this.ws.close();
			this.ws = null;
		}

		this.setStatus('disconnected');
		this.onMessageCallbacks.clear();
		this.pendingSubscriptions.clear();
	}

	subscribe(stream: StreamType, filters: FilterOptions, onMessage: StreamCallback): void {
		console.log(`Subscribing to ${stream} with filters:`, filters);

		this.onMessageCallbacks.set(stream, onMessage);

		if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connectionStatus === 'connected') {
			// Already connected and authenticated, subscribe immediately
			this.send({
				type: 'subscribe',
				stream,
				filters
			});
		} else {
			// Connection not ready, store for later
			this.pendingSubscriptions.set(stream, { filters, callback: onMessage });
		}
	}

	updateFilters(filters: FilterOptions): void {
		console.log('Updating filters:', filters);

		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.send({
				type: 'update_filters',
				filters
			});
		}
	}

	unsubscribe(stream: StreamType): void {
		console.log(`Unsubscribing from ${stream}`);

		this.onMessageCallbacks.delete(stream);
		this.pendingSubscriptions.delete(stream);

		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.send({
				type: 'unsubscribe',
				stream
			});
		}
	}

	onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
		this.onStatusChangeCallbacks.add(callback);

		// Return unsubscribe function
		return () => {
			this.onStatusChangeCallbacks.delete(callback);
		};
	}

	private send(message: WebSocketMessage): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			console.warn('Cannot send message, WebSocket not open:', message);
		}
	}

	private handleMessage(event: MessageEvent): void {
		try {
			const message = JSON.parse(event.data) as WebSocketMessage;
			console.log('WebSocket message received:', message.type);

			switch (message.type) {
				case 'auth_success':
					console.log('Authentication successful:', message.user);
					this.setStatus('connected');
					this.startHeartbeat();

					// Subscribe to any pending subscriptions
					this.pendingSubscriptions.forEach(({ filters, callback }, stream) => {
						this.onMessageCallbacks.set(stream, callback);
						this.send({
							type: 'subscribe',
							stream,
							filters
						});
					});
					this.pendingSubscriptions.clear();
					break;

				case 'auth_error':
					console.error('Authentication failed:', message.message);
					this.handleAuthError();
					break;

				case 'subscribed':
					console.log(`Subscribed to ${message.stream}`);
					break;

				case 'data': {
					const stream = message.stream as StreamType;
					const callback = this.onMessageCallbacks.get(stream);
					if (callback && message.payload) {
						callback(message.payload);
					}
					break;
				}

				case 'filters_updated':
					console.log('Filters updated:', message.filters);
					break;

				case 'unsubscribed':
					console.log(`Unsubscribed from ${message.stream}`);
					break;

				case 'pong':
					// Received pong, clear timeout
					if (this.pongTimeout) {
						clearTimeout(this.pongTimeout);
						this.pongTimeout = null;
					}
					break;

				case 'error':
					console.error('WebSocket error message:', message.message, message.code);
					break;

				default:
					console.warn('Unknown message type:', message.type);
			}

		} catch (error) {
			console.error('Failed to parse WebSocket message:', error);
		}
	}

	private handleError(event: Event): void {
		console.error('WebSocket error:', event);
	}

	private handleClose(event: CloseEvent): void {
		console.log('WebSocket closed:', event.code, event.reason);

		this.stopHeartbeat();
		this.setStatus('disconnected');

		// Attempt to reconnect if not intentionally closed
		if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnect();
		} else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
		}
	}

	private handleAuthError(): void {
		// Authentication failed, try to get a fresh token and reconnect
		this.disconnect();

		setTimeout(async () => {
			try {
				const currentUser = auth.currentUser;
				if (currentUser) {
					const newToken = await currentUser.getIdToken(true); // Force refresh
					await this.connect(newToken);
				}
			} catch (error) {
				console.error('Failed to refresh token:', error);
			}
		}, 2000);
	}

	private reconnect(): void {
		if (this.reconnectTimeout) {
			return; // Already scheduled
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

		console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

		this.setStatus('reconnecting');

		this.reconnectTimeout = window.setTimeout(async () => {
			this.reconnectTimeout = null;

			try {
				const currentUser = auth.currentUser;
				if (currentUser) {
					const token = await currentUser.getIdToken();
					await this.connect(token);
				}
			} catch (error) {
				console.error('Reconnection failed:', error);
				this.handleClose(new CloseEvent('close', { code: 1006 }));
			}
		}, delay);
	}

	private startHeartbeat(): void {
		this.stopHeartbeat();

		// Send ping every 30 seconds
		this.pingInterval = window.setInterval(() => {
			this.sendPing();
		}, 30000);
	}

	private stopHeartbeat(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}

		if (this.pongTimeout) {
			clearTimeout(this.pongTimeout);
			this.pongTimeout = null;
		}
	}

	private sendPing(): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.send({ type: 'ping' });

			// Set timeout for pong response (10 seconds)
			this.pongTimeout = window.setTimeout(() => {
				console.warn('Pong timeout - closing connection');
				this.ws?.close();
			}, 10000);
		}
	}

	private setStatus(status: ConnectionStatus): void {
		if (this.connectionStatus !== status) {
			this.connectionStatus = status;
			this.onStatusChangeCallbacks.forEach(callback => callback(status));
		}
	}

	getStatus(): ConnectionStatus {
		return this.connectionStatus;
	}
}

// Global WebSocket service instance
export const wsService = new WebSocketService();
