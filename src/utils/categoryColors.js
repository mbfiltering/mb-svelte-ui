/**
 * Category Colors - Single source of truth for category-to-color mappings
 *
 * Used by:
 * - SafetyBadge component for displaying risk level badges
 * - Device page for deriving colorKey when processing categories
 */

// Specific label -> color mapping (fallback when API doesn't provide color)
export const labelToColorKey = {
	// Green (Trusted)
	tools: 'green',
	banks: 'green',
	torah: 'green',
	jewish: 'green',
	technology: 'green',
	business: 'green',
	'basic information': 'green',
	education: 'green',
	productivity: 'green',

	// Yellow (Caution)
	travel: 'yellow',
	'safe shopping': 'yellow',
	'safe information': 'yellow',
	information: 'yellow',
	'jewish news': 'yellow',
	jobs: 'yellow',
	nodata: 'yellow',
	'no data': 'yellow',
	'content servers': 'yellow',
	health: 'yellow',
	'basic shopping': 'yellow',

	// Orange (Risk)
	chats: 'orange',
	communication: 'orange',
	games: 'orange',
	shopping: 'orange',
	sports: 'orange',
	search: 'orange',
	news: 'orange',
	media: 'orange',
	browsers: 'orange',

	// Red (Danger)
	socialmedia: 'red',
	'social media': 'red',
	chats_red: 'red',
	chats_alt: 'red',
	// Open-ended AI chat can answer or generate anything (Sora and Grok make
	// images and video), so it sits with Social Media rather than plain Chats.
	'ai chats': 'red',
	aichats: 'red',
	mature: 'red',
	proxies: 'red',
	entertainment: 'red',
	prohibited: 'red',
	'ad services': 'red',
	badapps: 'red',
	'bad apps': 'red'
};

// Map color key -> risk label
export const riskLabelMap = {
	green: 'Trusted',
	yellow: 'Caution',
	orange: 'Risk',
	red: 'Danger',
	gray: 'Unknown'
};

// Color classes for each risk level (TailwindCSS)
export const colorClasses = {
	green: 'border-green-alt-500 bg-green-alt-500/5 text-green-alt-500',
	yellow: 'border-yellow-500 bg-yellow-500/5 text-yellow-500',
	orange: 'border-orange-alt-500 bg-orange-alt-500/5 text-orange-alt-500',
	red: 'border-red-alt-500 bg-red-alt-500/5 text-red-alt-500',
	gray: 'border-gray-600 bg-gray-600/5 text-gray-600 dark:border-gray-300 dark:bg-gray-300/5 dark:text-gray-300'
};

/**
 * Derive a color key from a category label
 * @param {string} label - The category label
 * @returns {string} The color key ('green', 'yellow', 'orange', 'red', or 'gray')
 */
export function deriveColorKeyFromLabel(label) {
	if (!label) return 'gray';
	const key = label.trim().toLowerCase();
	return labelToColorKey[key] || 'gray';
}

/**
 * Get the risk label for a color key
 * @param {string} colorKey - The color key
 * @returns {string} The risk label ('Trusted', 'Caution', 'Risk', 'Danger', or 'Unknown')
 */
export function getRiskLabel(colorKey) {
	return riskLabelMap[colorKey] || riskLabelMap.gray;
}

/**
 * Get the CSS classes for a color key
 * @param {string} colorKey - The color key
 * @returns {string} The TailwindCSS classes for the color
 */
export function getColorClasses(colorKey) {
	return colorClasses[colorKey] || colorClasses.gray;
}

/**
 * Normalize a category label for display
 * Handles API quirks like "SocialMedia" vs "Social Media"
 * @param {string} label - The category label from API
 * @returns {string} The normalized label for display
 */
export function normalizeLabel(label) {
	if (!label) return '';

	// Handle specific API quirks
	const normalizations = {
		socialmedia: 'Social Media'
	};

	const key = label.trim().toLowerCase();
	if (normalizations[key]) {
		return normalizations[key];
	}

	return label;
}
