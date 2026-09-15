/**
 * Colour scheme (dark / light / system).
 *
 * One preference for the whole estate, persisted in the `mb_theme` cookie so every
 * portal under `mb-smart.net` reads and writes the same value — see `preferences.js`
 * for why it is a cookie and not `localStorage`.
 *
 * What is *applied* has always been shared: `styles.css` declares
 * `@custom-variant dark (&:where(.dark, .dark *))`, so a `dark` class on `<html>` is
 * the one switch behind every `dark:` utility in the estate. This module is only the
 * state in front of that switch.
 *
 * **Each app still owns a pre-paint copy of the reader.** The class has to be on
 * `<html>` before the first paint or dark mode flashes white, which means an inline
 * `<script>` in `app.html` — running before any module, including this one, has
 * loaded. That snippet cannot import from here; it is hand-copied, and a change to
 * the cookie name or vocabulary has to be mirrored into all of them. The canonical
 * copy is in DOCUMENTATION.md.
 */

import { readable, writable } from 'svelte/store';
import { clearLegacyPreferences, readPreference, writePreference } from './preferences.js';

const isBrowser = typeof window !== 'undefined';

/** The estate-wide colour scheme cookie. Mirrored in every app's pre-paint snippet. */
export const THEME_COOKIE = 'mb_theme';

/** The three values `mb_theme` can hold. */
export const THEMES = {
	LIGHT: 'light',
	DARK: 'dark',
	SYSTEM: 'system'
};

/** Offer order for a picker: the default first, then the two explicit choices. */
export const THEME_VALUES = [THEMES.SYSTEM, THEMES.DARK, THEMES.LIGHT];

/**
 * Whether a value is one this module recognises.
 *
 * @param {string|undefined|null} value
 * @returns {boolean}
 */
export function isValidTheme(value) {
	return !!value && THEME_VALUES.includes(/** @type {string} */ (value));
}

/**
 * The persisted preference, defaulting to `system` when unset or unrecognised.
 *
 * @returns {string}
 */
export function getStoredTheme() {
	const saved = readPreference(THEME_COOKIE);
	return isValidTheme(saved) ? /** @type {string} */ (saved) : THEMES.SYSTEM;
}

/**
 * Whether the OS currently asks for a dark colour scheme.
 *
 * @returns {boolean}
 */
export function prefersDark() {
	return isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolve a preference to the effective dark/light state.
 *
 * @param {string} value - One of THEMES.
 * @returns {boolean}
 */
export function isDark(value) {
	return value === THEMES.SYSTEM ? prefersDark() : value === THEMES.DARK;
}

/**
 * The current preference. Read it to render a picker; write with `setTheme`, never
 * with `theme.set` — a bare store write persists nothing and repaints nothing.
 */
export const theme = writable(isBrowser ? getStoredTheme() : THEMES.SYSTEM);

/**
 * Whether `<html>` is painted dark right now: the class, not the preference, so a
 * page holding `lockTheme` reads as what it shows. For choosing between two assets
 * in script when only one should be downloaded; a hidden `<img>` still fetches, so
 * a `dark:hidden` pair downloads both. Always `false` on the server, where nothing
 * is painted.
 */
export const paintedDark = readable(false, (set) => {
	if (!isBrowser) return;
	const html = document.documentElement;
	const read = () => set(html.classList.contains('dark'));
	read();
	const observer = new MutationObserver(read);
	observer.observe(html, { attributes: true, attributeFilter: ['class'] });
	return () => observer.disconnect();
});

/**
 * Paint a preference onto `<html>`. Persists nothing.
 *
 * @param {string} value - One of THEMES.
 */
export function applyTheme(value) {
	if (!isBrowser) return;
	document.documentElement.classList.toggle('dark', isDark(value));
}

/**
 * Set the colour scheme: persist it estate-wide, paint it, and publish it.
 *
 * @param {string} value - One of THEMES.
 */
export function setTheme(value) {
	if (!isValidTheme(value)) {
		console.warn(`Unsupported theme: ${value}`);
		return;
	}

	writePreference(THEME_COOKIE, value);
	applyTheme(value);
	theme.set(value);
}

/**
 * Marks a page that paints its own scheme regardless of the preference.
 *
 * The legal documents are the case this exists for: the Terms and the Privacy Policy
 * are always rendered light, so a page showing one takes the `dark` class off `<html>`
 * itself. Without a way to say so, the next `syncTheme` — the reader coming back to
 * the tab — would helpfully put it back.
 */
const LOCK_ATTRIBUTE = 'data-theme-locked';

/**
 * Pin the scheme this page painted, until the returned function is called.
 *
 * The preference itself is untouched: this suppresses repainting, so the page keeps
 * whatever it set and the rest of the app resumes following on the way out.
 *
 * @returns {() => void} Release, and repaint to the current preference.
 */
export function lockTheme() {
	if (!isBrowser) return () => {};

	document.documentElement.setAttribute(LOCK_ATTRIBUTE, '');

	return () => {
		document.documentElement.removeAttribute(LOCK_ATTRIBUTE);
		syncTheme();
	};
}

/**
 * Re-read the cookie and repaint. Cheap, and safe to call as often as you like.
 *
 * This is what makes a portal sitting open in a background tab pick up a change made
 * in another one: a cookie fires no `storage` event, so nothing tells a tab its
 * preference moved and it has to look for itself.
 *
 * A page holding `lockTheme` is left alone — the store still moves, only the paint is
 * withheld, so a picker rendered on such a page still shows the truth.
 */
export function syncTheme() {
	if (!isBrowser) return;
	const current = getStoredTheme();
	if (!document.documentElement.hasAttribute(LOCK_ATTRIBUTE)) applyTheme(current);
	theme.set(current);
}

/**
 * Start following the preference. Call once, from the root layout, in the browser.
 *
 * Two things move it after load and neither is this tab: the OS flipping its own
 * scheme while we are on `system`, and another portal writing the cookie. The
 * returned function detaches both listeners.
 *
 * @returns {() => void} Cleanup.
 */
export function initTheme() {
	if (!isBrowser) return () => {};

	clearLegacyPreferences();
	syncTheme();

	const media = window.matchMedia('(prefers-color-scheme: dark)');
	const onSystemChange = () => syncTheme();
	// Coming back to a tab is the one moment a stale paint is about to be looked at.
	const onVisible = () => {
		if (document.visibilityState === 'visible') syncTheme();
	};

	media.addEventListener('change', onSystemChange);
	document.addEventListener('visibilitychange', onVisible);

	return () => {
		media.removeEventListener('change', onSystemChange);
		document.removeEventListener('visibilitychange', onVisible);
	};
}
