// Stripe product types
export interface ProductFeature {
	name: string;
}

export interface ProductPriceInfo {
	currency: string;
	unit_amount: number;
	interval?: string | null;
	interval_count?: number | null;
	type: string;
}

export interface StripeProduct {
	id: string;
	name: string;
	description?: string;
	active: boolean;
	priceId: string;
	priceInfo: ProductPriceInfo;
	features?: ProductFeature[];
}

// Sportsbook types
export interface SportsbookInfo {
	icon: string;
	display_name: string;
}

export interface SportsbooksResponse {
	sportsbooks: Record<string, SportsbookInfo>;
}

// Portal types
export interface CreatePortalSessionRequest {
	returnUrl: string;
}

// Subscription types
export interface FirebaseTimestamp {
	seconds: number;
	nanoseconds: number;
}

export interface SubscriptionPrice {
	id: string;
	unit_amount: number;
	currency: string;
	interval?: string;
}

export interface SubscriptionProduct {
	name: string;
	description: string;
}

export interface Subscription {
	id: string;
	status: string;
	current_period_end: FirebaseTimestamp;
	current_period_start: FirebaseTimestamp;
	cancel_at_period_end: boolean;
	price?: SubscriptionPrice;
	product?: SubscriptionProduct;
	[key: string]: string | boolean | undefined | FirebaseTimestamp | SubscriptionPrice | SubscriptionProduct;
}