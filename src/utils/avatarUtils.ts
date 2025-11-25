// Predefined color palette for user avatars
// Each color is chosen to be vibrant, professional, and provide good contrast
const AVATAR_COLORS = [
	{ bg: '#3B82F6', text: '#FFFFFF' }, // Blue
	{ bg: '#8B5CF6', text: '#FFFFFF' }, // Purple
	{ bg: '#EC4899', text: '#FFFFFF' }, // Pink
	{ bg: '#10B981', text: '#FFFFFF' }, // Green
	{ bg: '#14B8A6', text: '#FFFFFF' }, // Teal
	{ bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
	{ bg: '#F59E0B', text: '#000000' }, // Orange
	{ bg: '#EF4444', text: '#FFFFFF' }, // Red
	{ bg: '#6366F1', text: '#FFFFFF' }, // Indigo
	{ bg: '#059669', text: '#FFFFFF' }, // Emerald
	{ bg: '#7C3AED', text: '#FFFFFF' }, // Violet
	{ bg: '#F43F5E', text: '#FFFFFF' }, // Rose
	{ bg: '#0891B2', text: '#FFFFFF' }, // Dark Cyan
	{ bg: '#DB2777', text: '#FFFFFF' }, // Deep Pink
	{ bg: '#65A30D', text: '#FFFFFF' }, // Lime
];

/**
 * Generates a simple hash from a string
 * @param str - The string to hash (typically user uid)
 * @returns A numeric hash value
 */
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Gets a consistent color for a user based on their unique identifier
 * The same uid will always return the same color
 * @param uid - The user's unique identifier from Firebase Auth
 * @returns An object with background and text color hex values
 */
export function getUserAvatarColor(uid: string): { bg: string; text: string } {
	if (!uid) {
		// Fallback to gray if no uid provided
		return { bg: '#6B7280', text: '#FFFFFF' };
	}

	const hash = hashString(uid);
	const index = hash % AVATAR_COLORS.length;
	return AVATAR_COLORS[index];
}

/**
 * Calculates the relative luminance of a color
 * Used to determine if text should be black or white for optimal contrast
 * @param hexColor - Hex color string (e.g., '#3B82F6')
 * @returns Luminance value between 0 and 1
 */
function getLuminance(hexColor: string): number {
	// Remove # if present
	const hex = hexColor.replace('#', '');

	// Convert to RGB
	const r = parseInt(hex.substr(0, 2), 16) / 255;
	const g = parseInt(hex.substr(2, 2), 16) / 255;
	const b = parseInt(hex.substr(4, 2), 16) / 255;

	// Apply gamma correction
	const [rs, gs, bs] = [r, g, b].map(c => {
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	});

	// Calculate relative luminance
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determines the best text color (black or white) for a given background color
 * Uses WCAG contrast ratio guidelines
 * @param bgColor - Background color hex string
 * @returns '#000000' for black text or '#FFFFFF' for white text
 */
export function getContrastText(bgColor: string): string {
	const luminance = getLuminance(bgColor);
	// Use white text for dark backgrounds, black for light backgrounds
	return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
