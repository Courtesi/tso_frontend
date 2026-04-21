import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import type { StripeProduct, Subscription } from '../types/stripe';

interface StripeContextType {
	products: StripeProduct[];
	loading: boolean;
	error: string | null;
	fetchProducts: () => Promise<void>;
	subscription: Subscription | null;
	subscriptionLoading: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function useStripe() {
	const context = useContext(StripeContext);
	if (context === undefined) {
		throw new Error('useStripe must be used within a StripeProvider');
	}
	return context;
}

interface StripeProviderProps {
	children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
	const { currentUser } = useAuth();
	const [products, setProducts] = useState<StripeProduct[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasFetched, setHasFetched] = useState(false);
	const [subscription, setSubscription] = useState<Subscription | null>(null);
	const [subscriptionLoading, setSubscriptionLoading] = useState(false);

	const fetchProducts = useCallback(async () => {
		// If already fetched, don't fetch again (caching)
		if (hasFetched) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const { products: fetchedProducts } = await api.getProducts();
			setProducts(fetchedProducts);
			setHasFetched(true);
		} catch (err: unknown) {
			console.error('Error fetching Stripe products:', err);
			setError(err instanceof Error ? err.message : 'Failed to load products');
		} finally {
			setLoading(false);
		}
	}, [hasFetched]);

	// Listen to user's active subscriptions
	useEffect(() => {
		if (!currentUser) {
			setSubscription(null);
			return;
		}

		setSubscriptionLoading(true);

		// Query for active subscriptions
		const subscriptionsRef = collection(db, 'customers', currentUser.uid, 'subscriptions');
		const q = query(subscriptionsRef, where('status', 'in', ['trialing', 'active']));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				if (!snapshot.empty) {
					// Get the first active subscription
					const subDoc = snapshot.docs[0];
					setSubscription({
						id: subDoc.id,
						...subDoc.data(),
					} as Subscription);
				} else {
					setSubscription(null);
				}
				setSubscriptionLoading(false);
			},
			(err) => {
				console.error('Error fetching subscriptions:', err);
				setSubscriptionLoading(false);
			}
		);

		return () => unsubscribe();
	}, [currentUser]);

	const value: StripeContextType = {
		products,
		loading,
		error,
		fetchProducts,
		subscription,
		subscriptionLoading,
	};

	return (
		<StripeContext.Provider value={value}>
			{children}
		</StripeContext.Provider>
	);
}
