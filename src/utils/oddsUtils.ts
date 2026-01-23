import type { OddsFormat } from '../contexts/SettingsContext';

type DetectedFormat = 'american' | 'decimal' | 'fractional' | 'probability';

/**
 * Detect the format of input odds
 * - Fractional: string containing "/" (e.g., "3/2", "10/11")
 * - Probability: number between 0 and 1 exclusive (e.g., 0.40)
 * - American: number >= 100 or <= -100 (e.g., +150, -110)
 * - Decimal: number > 1 and < 100 (e.g., 1.91, 2.50)
 */
function detectOddsFormat(odds: number | string): DetectedFormat {
	// Fractional: string with "/"
	if (typeof odds === 'string' && odds.includes('/')) {
		return 'fractional';
	}

	const numOdds = typeof odds === 'string' ? parseFloat(odds) : odds;

	// Probability: between 0 and 1 (exclusive)
	if (numOdds > 0 && numOdds < 1) {
		return 'probability';
	}

	// American: >= 100 or <= -100
	if (numOdds >= 100 || numOdds <= -100) {
		return 'american';
	}

	// Decimal: > 1 and < 100
	return 'decimal';
}

/**
 * Convert American odds to decimal
 * +150 -> 2.50, -110 -> 1.91
 */
function americanToDecimal(american: number): number {
	if (american > 0) {
		return (american / 100) + 1;
	} else {
		return (100 / Math.abs(american)) + 1;
	}
}

/**
 * Convert decimal odds to American
 * 2.50 -> +150, 1.91 -> -110
 */
function decimalToAmerican(decimal: number): number {
	if (decimal >= 2) {
		return Math.round((decimal - 1) * 100);
	} else {
		return Math.round(-100 / (decimal - 1));
	}
}

/**
 * Convert fractional odds string to decimal
 * "3/2" -> 2.50, "10/11" -> 1.91
 */
function fractionalToDecimal(fractional: string): number {
	const [num, denom] = fractional.split('/').map(Number);
	if (!denom || denom === 0) return 2.0; // fallback
	return (num / denom) + 1;
}

/**
 * Convert probability to decimal
 * 0.40 -> 2.50, 0.52 -> 1.92
 */
function probabilityToDecimal(probability: number): number {
	if (probability <= 0 || probability >= 1) return 2.0; // fallback
	return 1 / probability;
}

/**
 * Find greatest common divisor for fraction simplification
 */
function gcd(a: number, b: number): number {
	a = Math.abs(Math.round(a));
	b = Math.abs(Math.round(b));
	while (b) {
		const t = b;
		b = a % b;
		a = t;
	}
	return a;
}

/**
 * Convert decimal odds to fractional string
 * 2.50 -> "3/2", 1.91 -> "10/11"
 */
function decimalToFractional(decimal: number): string {
	const profit = decimal - 1;

	// Multiply by 100 to work with integers
	let numerator = Math.round(profit * 100);
	let denominator = 100;

	const divisor = gcd(numerator, denominator);
	numerator = numerator / divisor;
	denominator = denominator / divisor;

	return `${numerator}/${denominator}`;
}

/**
 * Convert decimal odds to implied probability
 * 2.50 -> 0.40 (40%), 1.91 -> 0.52 (52%)
 */
function decimalToProbability(decimal: number): number {
	return 1 / decimal;
}

/**
 * Convert any odds format to decimal
 */
export function toDecimalOdds(odds: number | string): number {
	const inputFormat = detectOddsFormat(odds);

	switch (inputFormat) {
		case 'american':
			return americanToDecimal(odds as number);
		case 'fractional':
			return fractionalToDecimal(odds as string);
		case 'probability':
			return probabilityToDecimal(odds as number);
		case 'decimal':
		default:
			return typeof odds === 'string' ? parseFloat(odds) : odds;
	}
}

/**
 * Calculate optimal stake allocation for arbitrage betting
 * Uses Kelly criterion fraction of bankroll and distributes stakes
 * to ensure equal payout regardless of outcome
 *
 * @param odds1 - Odds for bet 1 (any format)
 * @param odds2 - Odds for bet 2 (any format)
 * @param bankroll - User's total bankroll
 * @param kellyFraction - Fraction of bankroll to wager (e.g., 0.25 for 25%)
 * @returns Object with stake1 and stake2
 */
export function calculateArbStakes(
	odds1: number | string,
	odds2: number | string,
	bankroll: number,
	kellyFraction: number
): { stake1: number; stake2: number } {
	const decimal1 = toDecimalOdds(odds1);
	const decimal2 = toDecimalOdds(odds2);

	// Calculate implied probabilities (inverse of decimal odds)
	const impliedProb1 = 1 / decimal1;
	const impliedProb2 = 1 / decimal2;
	const totalImpliedProb = impliedProb1 + impliedProb2;

	// Total amount to wager based on Kelly
	const totalWager = bankroll * kellyFraction;

	// Distribute stakes proportionally to ensure equal payout
	const stake1 = totalWager * (impliedProb1 / totalImpliedProb);
	const stake2 = totalWager * (impliedProb2 / totalImpliedProb);

	return { stake1, stake2 };
}

/**
 * Format odds based on user's preferred display format
 * Auto-detects input format and converts accordingly
 *
 * @param odds - Input odds (number or fractional string like "3/2")
 * @param targetFormat - User's preferred display format
 * @returns Formatted odds string
 */
export function formatOdds(odds: number | string, targetFormat: OddsFormat): string {
	const inputFormat = detectOddsFormat(odds);

	// Normalize to decimal (common intermediate format)
	let decimalOdds: number;
	switch (inputFormat) {
		case 'american':
			decimalOdds = americanToDecimal(odds as number);
			break;
		case 'fractional':
			decimalOdds = fractionalToDecimal(odds as string);
			break;
		case 'probability':
			decimalOdds = probabilityToDecimal(odds as number);
			break;
		case 'decimal':
		default:
			decimalOdds = typeof odds === 'string' ? parseFloat(odds) : odds;
	}

	// Convert to target format
	switch (targetFormat) {
		case 'american': {
			const american = decimalToAmerican(decimalOdds);
			return american > 0 ? `+${american}` : `${american}`;
		}

		case 'decimal':
			return decimalOdds.toFixed(2);

		case 'fractional':
			return decimalToFractional(decimalOdds);

		case 'probability': {
			const prob = decimalToProbability(decimalOdds);
			return `${(prob * 100).toFixed(1)}%`;
		}

		default:
			return `${odds}`;
	}
}