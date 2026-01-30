import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export type OddsFormat = 'american' | 'decimal' | 'fractional' | 'probability';

export interface UserSettings {
	bankroll: number;
	kellyFraction: number;
	arbBetAmount: number;
	oddsFormat: OddsFormat;
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
}

interface SettingsContextType {
	settings: UserSettings | null;
	loading: boolean;
	error: string | null;
	updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'createdAt' | 'updatedAt'> = {
	bankroll: 1000,
	kellyFraction: 0.25,
	arbBetAmount: 100,
	oddsFormat: 'american',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider');
	}
	return context;
}

interface SettingsProviderProps {
	children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
	const { currentUser } = useAuth();
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Listen to user's settings document
	useEffect(() => {
		if (!currentUser) {
			setSettings(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		const settingsRef = doc(db, 'userSettings', currentUser.uid);

		const unsubscribe = onSnapshot(
			settingsRef,
			async (snapshot) => {
				if (snapshot.exists()) {
					setSettings(snapshot.data() as UserSettings);
				} else {
					// Create default settings for new users
					try {
						await setDoc(settingsRef, {
							...DEFAULT_SETTINGS,
							createdAt: serverTimestamp(),
							updatedAt: serverTimestamp(),
						});
						// The onSnapshot will fire again with the new data
					} catch (err) {
						console.error('Error creating default settings:', err);
						setError(err instanceof Error ? err.message : 'Failed to create settings');
					}
				}
				setLoading(false);
			},
			(err) => {
				console.error('Error fetching settings:', err);
				setError(err.message || 'Failed to load settings');
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, [currentUser]);

	const updateSettings = async (updates: Partial<UserSettings>) => {
		if (!currentUser) {
			throw new Error('Must be logged in to update settings');
		}

		const settingsRef = doc(db, 'userSettings', currentUser.uid);

		try {
			await setDoc(
				settingsRef,
				{
					...updates,
					updatedAt: serverTimestamp(),
				},
				{ merge: true }
			);
		} catch (err) {
			console.error('Error updating settings:', err);
			throw new Error(err instanceof Error ? err.message : 'Failed to update settings');
		}
	};

	const value: SettingsContextType = {
		settings,
		loading,
		error,
		updateSettings,
	};

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}