import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
	type User,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	updateProfile,
	GoogleAuthProvider,
	signInWithPopup,
	sendEmailVerification,
	sendPasswordResetEmail,
	reauthenticateWithCredential,
	EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { api } from '../services/api';

interface AuthContextType {
	currentUser: User | null;
	loading: boolean;
	userTier: string;
	signUp: (email: string, password: string, fullName: string) => Promise<User>;
	signIn: (email: string, password: string) => Promise<User>;
	signInWithGoogle: () => Promise<User>;
	signOut: () => Promise<void>;
	getIdToken: () => Promise<string | null>;
	refreshToken: () => Promise<void>;
	getCustomClaimRole: () => Promise<string | null>;
	resendVerificationEmail: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [userTier, setUserTier] = useState<string>('');

  	// Sign up with email and password
	const signUp = async (email: string, password: string, fullName: string): Promise<User> => {
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);

		// Update display name with full name
		if (userCredential.user) {
			await updateProfile(userCredential.user, { displayName: fullName });

			// Send email verification
			await sendEmailVerification(userCredential.user, {
				url: window.location.origin + '/dashboard',
				handleCodeInApp: false
			});
		}

		return userCredential.user;
	};

  	// Sign in with email and password
	const signIn = async (email: string, password: string): Promise<User> => {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		return userCredential.user;
	};

	// Sign in with Google
	const signInWithGoogle = async (): Promise<User> => {
		const provider = new GoogleAuthProvider();
		const userCredential = await signInWithPopup(auth, provider);
		return userCredential.user;
	};

  	// Sign out
	const signOut = async (): Promise<void> => {
		await firebaseSignOut(auth);
		// Do not need to set current user to null because onAuthStateChanged will handle it
		// setCurrentUser(null);
	};

  	// Get current user's ID token
	const getIdToken = async (): Promise<string | null> => {
		if (!currentUser) return null;
		try {
			const token = await currentUser.getIdToken();
			return token;
		} catch (error) {
			console.error('Error getting ID token:', error);
			return null;
		}
	};

	const getCustomClaimRole = async (): Promise<string | null> => {
		if (!currentUser) return null;

		// Force refresh the ID token
		await currentUser.getIdToken(true);
		const decodedToken = await currentUser.getIdTokenResult();
		return (decodedToken?.claims.stripeRole as string) || null;
	};

	// Force refresh the ID token and update userTier (useful after tier changes)
	const refreshToken = async (): Promise<void> => {
		if (!currentUser) return;
		try {
			await currentUser.getIdToken(true); // true = force refresh
			// Also update userTier from new claims
			const role = await getCustomClaimRole();
			setUserTier(role || 'free');
		} catch (error) {
			console.error('Error refreshing token:', error);
		}
	};

	// Resend email verification
	const resendVerificationEmail = async (): Promise<void> => {
		if (!currentUser) {
			throw new Error('No user is currently signed in');
		}
		if (currentUser.emailVerified) {
			throw new Error('Email is already verified');
		}
		await sendEmailVerification(currentUser, {
			url: window.location.origin + '/dashboard',
			handleCodeInApp: false
		});
	};

	// Reset password
	const resetPassword = async (email: string): Promise<void> => {
		await sendPasswordResetEmail(auth, email, {
			url: window.location.origin,
			handleCodeInApp: false
		});
	};

	// Delete account
	const deleteAccount = async (password?: string): Promise<void> => {
		if (!currentUser) {
			throw new Error('No user is currently signed in');
		}

		try {
			// Re-authenticate if password is provided (for email/password accounts)
			if (password && currentUser.email) {
				const credential = EmailAuthProvider.credential(currentUser.email, password);
				await reauthenticateWithCredential(currentUser, credential);
			}

			// Call backend to cancel subscriptions and delete account
			// Backend handles: Stripe subscription cancellation + Firebase Auth deletion
			await api.deleteAccount();
		} catch (error: any) {
			// Provide more helpful error messages
			if (error.code === 'auth/requires-recent-login') {
				throw new Error('For security reasons, please sign out and sign in again before deleting your account.');
			} else if (error.code === 'auth/wrong-password') {
				throw new Error('Incorrect password. Please try again.');
			}
			throw error;
		}
	};

	// Listen to auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
			setLoading(false);
		});

		// Cleanup subscription on unmount
		return unsubscribe;
	}, []);

	// Get user tier from custom claims when user changes
	useEffect(() => {
		if (!currentUser) {
			setUserTier('');
			return;
		}

		// Get tier from custom claims
		const fetchTier = async () => {
			try {
				const role = await getCustomClaimRole();
				setUserTier(role || 'free');
			} catch (error) {
				console.error('Error fetching user tier:', error);
				setUserTier('free');
			}
		};

		fetchTier();
	}, [currentUser]);

	const value: AuthContextType = {
		currentUser,
		loading,
		userTier,
		signUp,
		signIn,
		signInWithGoogle,
		signOut,
		getIdToken,
		refreshToken,
		getCustomClaimRole,
		resendVerificationEmail,
		resetPassword,
		deleteAccount
	};

	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
}
