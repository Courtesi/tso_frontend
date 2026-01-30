import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings, type OddsFormat } from '../contexts/SettingsContext';
import { useSidebar } from '../contexts/SidebarContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const KELLY_PRESETS = [
	{ label: 'Full Kelly (1.0)', value: 1.0 },
	{ label: 'Half Kelly (0.5)', value: 0.5 },
	{ label: 'Quarter Kelly (0.25)', value: 0.25 },
	{ label: 'Eighth Kelly (0.125)', value: 0.125 },
	{ label: 'Custom', value: -1 },
];

const ODDS_FORMATS: { label: string; value: OddsFormat }[] = [
	{ label: 'American (+150, -110)', value: 'american' },
	{ label: 'Decimal (2.50, 1.91)', value: 'decimal' },
	{ label: 'Fractional (3/2, 10/11)', value: 'fractional' },
	{ label: 'Implied Probability (40.0%, 52.4%)', value: 'probability' },
];

function Settings() {
	const { currentUser, loading: authLoading } = useAuth();
	const { settings, loading: settingsLoading, updateSettings } = useSettings();
	const { isCollapsed } = useSidebar();
	const navigate = useNavigate();

	const [bankroll, setBankroll] = useState<string>('');
	const [kellyFraction, setKellyFraction] = useState<number>(0.25);
	const [customKelly, setCustomKelly] = useState<string>('');
	const [isCustomKelly, setIsCustomKelly] = useState(false);
	const [arbBetAmount, setArbBetAmount] = useState<string>('');
	const [oddsFormat, setOddsFormat] = useState<OddsFormat>('american');
	const [saving, setSaving] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	// Sync form state with loaded settings
	useEffect(() => {
		if (settings) {
			setBankroll(settings.bankroll.toString());
			setArbBetAmount((settings.arbBetAmount ?? 100).toString());
			setOddsFormat(settings.oddsFormat);

			// Check if kelly fraction matches a preset
			const matchingPreset = KELLY_PRESETS.find(p => p.value === settings.kellyFraction);
			if (matchingPreset && matchingPreset.value !== -1) {
				setKellyFraction(settings.kellyFraction);
				setIsCustomKelly(false);
			} else {
				setIsCustomKelly(true);
				setCustomKelly(settings.kellyFraction.toString());
			}
		}
	}, [settings]);

	// Auth protection
	useEffect(() => {
		if (authLoading) return;
		if (!currentUser) {
			navigate('/');
		}
	}, [currentUser, navigate, authLoading]);

	const handleKellyChange = (value: number) => {
		if (value === -1) {
			setIsCustomKelly(true);
			setCustomKelly(kellyFraction.toString());
		} else {
			setIsCustomKelly(false);
			setKellyFraction(value);
		}
	};

	const handleSave = async () => {
		setSaving(true);
		setErrorMessage('');
		setSuccessMessage('');

		try {
			const bankrollValue = parseFloat(bankroll);
			if (isNaN(bankrollValue) || bankrollValue < 0) {
				throw new Error('Please enter a valid bankroll amount');
			}

			let kellyValue = kellyFraction;
			if (isCustomKelly) {
				kellyValue = parseFloat(customKelly);
				if (isNaN(kellyValue) || kellyValue < 0 || kellyValue > 1) {
					throw new Error('Kelly fraction must be between 0 and 1');
				}
			}

			const arbBetValue = parseFloat(arbBetAmount);
			if (isNaN(arbBetValue) || arbBetValue < 0) {
				throw new Error('Please enter a valid arb bet amount');
			}

			await updateSettings({
				bankroll: bankrollValue,
				kellyFraction: kellyValue,
				arbBetAmount: arbBetValue,
				oddsFormat,
			});

			setSuccessMessage('Settings saved successfully!');
			setTimeout(() => setSuccessMessage(''), 5000);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : 'Failed to save settings');
		} finally {
			setSaving(false);
		}
	};

	// Loading state
	if (authLoading || settingsLoading) {
		return (
			<div className="min-h-screen text-white relative bg-zinc-800 flex items-center justify-center">
				<div className="text-center">
					<div className="text-gray-400 text-lg">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-white relative bg-black">
			<Navbar />
			<Sidebar />

			{/* Main Content */}
			<div className={`px-4 py-20 pt-24 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
				<div className="max-w-2xl mx-auto">
					<h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

					{/* Success Message */}
					{successMessage && (
						<div className="mb-6 bg-green-800 border border-green-500 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<p className="text-green-100">{successMessage}</p>
								<button
									onClick={() => setSuccessMessage('')}
									className="text-green-200 hover:text-white cursor-pointer"
								>
									✕
								</button>
							</div>
						</div>
					)}

					{/* Error Message */}
					{errorMessage && (
						<div className="mb-6 bg-gradient-to-r from-red-900/50 to-rose-900/50 border border-red-500 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<p className="text-red-100">{errorMessage}</p>
								<button
									onClick={() => setErrorMessage('')}
									className="text-red-200 hover:text-white cursor-pointer"
								>
									✕
								</button>
							</div>
						</div>
					)}

					{/* Settings Form */}
					<div className="bg-gray-950 rounded-lg border border-gray-600 p-6 space-y-6">
						{/* Bankroll */}
						<div>
							<label className="block text-sm font-medium text-gray-100 mb-2">
								Bankroll
							</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
								<input
									type="number"
									value={bankroll}
									onChange={(e) => setBankroll(e.target.value)}
									placeholder="1000"
									min="0"
									step="0.01"
									className="w-full pl-8 pr-4 py-3 bg-gray-900 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
								/>
							</div>
							<p className="mt-1 text-xs text-gray-400">
								Your total betting bankroll for calculating stake sizes
							</p>
						</div>

						{/* Kelly Fraction */}
						<div>
							<label className="block text-sm font-medium text-gray-100 mb-2">
								Kelly Criterion Fraction
							</label>
							<div className="space-y-3">
								<select
									value={isCustomKelly ? -1 : kellyFraction}
									onChange={(e) => handleKellyChange(parseFloat(e.target.value))}
									className="w-full px-4 py-3 bg-gray-900 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
								>
									{KELLY_PRESETS.map((preset) => (
										<option key={preset.value} value={preset.value}>
											{preset.label}
										</option>
									))}
								</select>

								{isCustomKelly && (
									<input
										type="number"
										value={customKelly}
										onChange={(e) => setCustomKelly(e.target.value)}
										placeholder="0.25"
										min="0"
										max="1"
										step="0.01"
										className="w-full px-4 py-3 bg-gray-900 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
									/>
								)}
							</div>
							<p className="mt-1 text-xs text-gray-400">
								Fraction of Kelly criterion to use. Quarter Kelly (0.25) is a conservative choice.
							</p>
						</div>

						{/* Arb Bet Amount */}
					<div>
						<label className="block text-sm font-medium text-gray-100 mb-2">
							Arb Bet Amount
						</label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
							<input
								type="number"
								value={arbBetAmount}
								onChange={(e) => setArbBetAmount(e.target.value)}
								placeholder="100"
								min="0"
								step="0.01"
								className="w-full pl-8 pr-4 py-3 bg-gray-900 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
							/>
						</div>
						<p className="mt-1 text-xs text-gray-400">
							Maximum total stake across both sides of an arbitrage bet
						</p>
					</div>

					{/* Odds Format */}
						<div>
							<label className="block text-sm font-medium text-gray-100 mb-2">
								Odds Display Format
							</label>
							<select
								value={oddsFormat}
								onChange={(e) => setOddsFormat(e.target.value as OddsFormat)}
								className="w-full px-4 py-3 bg-gray-900 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
							>
								{ODDS_FORMATS.map((format) => (
									<option key={format.value} value={format.value}>
										{format.label}
									</option>
								))}
							</select>
							<p className="mt-1 text-xs text-gray-400">
								How odds are displayed throughout the app
							</p>
						</div>

						{/* Save Button */}
						<div className="pt-4">
							<button
								onClick={handleSave}
								disabled={saving}
								className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer"
							>
								{saving ? 'Saving...' : 'Save Settings'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Settings;