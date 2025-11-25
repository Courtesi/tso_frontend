import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { query, collection, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface PriceInfo {
	currency: string;
	unit_amount: number;
	interval?: string;
	interval_count?: number;
	type: 'one_time' | 'recurring';
	[key: string]: any;
}

interface Product {
	id: string;
	name: string;
	description?: string;
	active: boolean;
	priceId: string;
	priceInfo: PriceInfo;
	[key: string]: any;
}

interface Subscription {
	id: string;
	status: string;
	current_period_end: any;
	current_period_start: any;
	cancel_at_period_end: boolean;
	price?: {
		id: string;
		unit_amount: number;
		currency: string;
		interval?: string;
	};
	product?: {
		name: string;
		description: string;
	};
	[key: string]: any;
}

interface StripeContextType {
	products: Product[];
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
	const [products, setProducts] = useState<Product[]>([]);
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
			// Create query for active products
			const q = query(
				collection(db, 'products'),
				where('active', '==', true)
			);

			const querySnapshot = await getDocs(q);

			// For each product, get the product price info
			const productsPromises = querySnapshot.docs.map(async (productDoc) => {
				const productData = productDoc.data();

				// Fetch prices subcollection per product
				const pricesCollection = collection(productDoc.ref, 'prices');
				const priceQuerySnapshot = await getDocs(pricesCollection);

				// Get the first active price (you can add more logic here if needed)
				const activePrices = priceQuerySnapshot.docs.filter(
					(doc) => doc.data().active === true
				);

				if (activePrices.length === 0) {
					// Skip products with no active prices
					return null;
				}

				const priceDoc = activePrices[0];

				return {
					id: productDoc.id,
					...productData,
					priceId: priceDoc.id,
					priceInfo: priceDoc.data() as PriceInfo,
				} as Product;
			});

			// Filter out null products (those without active prices)
			const fetchedProducts = (await Promise.all(productsPromises)).filter(
				(product): product is Product => product !== null
			);

			setProducts(fetchedProducts);
			setHasFetched(true);
		} catch (err: any) {
			console.error('Error fetching Stripe products:', err);
			setError(err.message || 'Failed to load products');
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
