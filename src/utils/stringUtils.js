/**
 * String utilities for fuzzy matching and text processing
 */

/**
 * Calculate the Levenshtein distance between two strings.
 * This is the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one string into the other.
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} The edit distance between the two strings
 */
export function levenshteinDistance(a, b) {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	// Two rows instead of a full matrix: each row only ever reads the one above it.
	let prev = new Array(a.length + 1);
	let curr = new Array(a.length + 1);
	for (let j = 0; j <= a.length; j++) prev[j] = j;

	for (let i = 1; i <= b.length; i++) {
		curr[0] = i;
		for (let j = 1; j <= a.length; j++) {
			curr[j] =
				b.charCodeAt(i - 1) === a.charCodeAt(j - 1)
					? prev[j - 1]
					: Math.min(
							prev[j - 1] + 1, // substitution
							curr[j - 1] + 1, // insertion
							prev[j] + 1 // deletion
						);
		}
		[prev, curr] = [curr, prev];
	}

	return prev[a.length];
}

/**
 * Check if a query fuzzy-matches a target string within a given edit distance tolerance.
 * The query can match anywhere within the target (substring matching with typo tolerance).
 * @param {string} query - The search query (typically shorter)
 * @param {string} target - The target string to search in
 * @param {number} maxDistance - Maximum allowed edit distance (default: 1)
 * @returns {boolean} True if the query matches within the tolerance
 */
export function fuzzyMatch(query, target, maxDistance = 1) {
	if (!query || !target) return false;

	const q = query.toLowerCase();
	const t = target.toLowerCase();

	// If query is empty or target is empty, no match
	if (q.length === 0 || t.length === 0) return false;

	// Exact substring match - always succeeds
	if (t.includes(q)) return true;

	// For very short queries (1-2 chars), require exact match to avoid too many false positives
	if (q.length <= 2) return false;

	// Is any substring of the target within the edit distance of the query?
	return substringWithinDistance(q, t, maxDistance);
}

/**
 * Whether some substring of `t` is within `maxDistance` edits of `q`.
 *
 * Sellers' algorithm: Levenshtein with a free starting point anywhere in `t`, so
 * one pass over `t` answers what comparing `q` against every window of length
 * `q.length ± maxDistance` used to (a substring that close cannot be any other
 * length). Magic search runs this for every searchable element on every
 * keystroke, which is why it is not the window loop any more.
 *
 * @param {string} q - Non-empty query
 * @param {string} t - Non-empty target
 * @param {number} maxDistance - Whole number of edits allowed
 * @returns {boolean}
 */
function substringWithinDistance(q, t, maxDistance) {
	// col[i]: fewest edits turning q's first i characters into a substring of t
	// ending at the current position of t.
	let prev = new Int32Array(q.length + 1);
	let curr = new Int32Array(q.length + 1);
	for (let i = 0; i <= q.length; i++) prev[i] = i;

	for (let j = 1; j <= t.length; j++) {
		const c = t.charCodeAt(j - 1);
		curr[0] = 0; // the match may start here for free
		for (let i = 1; i <= q.length; i++) {
			curr[i] = Math.min(
				prev[i - 1] + (q.charCodeAt(i - 1) === c ? 0 : 1),
				prev[i] + 1,
				curr[i - 1] + 1
			);
		}
		if (curr[q.length] <= maxDistance) return true;
		[prev, curr] = [curr, prev];
	}

	return false;
}

/**
 * Check if a query matches a target string with fuzzy tolerance.
 * Combines exact includes() check with fuzzy matching.
 * @param {string} query - The search query
 * @param {string} target - The target string to search in
 * @param {number} typoTolerance - Maximum typos allowed (default: 1)
 * @returns {boolean} True if matches exactly or within typo tolerance
 */
export function fuzzyIncludes(query, target, typoTolerance = 1) {
	return fuzzyMatch(query, target, typoTolerance);
}
