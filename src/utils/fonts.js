/**
 * Font preloading for server-rendered pages.
 *
 * The Rubik faces are declared in `styles.css`, so a browser only discovers them
 * after the stylesheet has been parsed, and `font-display: swap` then paints the
 * first text in the fallback face and reflows it. A `<link rel="preload">` for the
 * faces a page is certain to use starts them with the HTML instead.
 *
 * Only those faces: preloading all eight would download scripts the page never
 * shows, which is what `unicode-range` exists to avoid.
 */

/** The script subset a language needs beyond Latin. */
const SCRIPT_FOR_LANGUAGE = { he: 'hebrew', yi: 'hebrew', ru: 'cyrillic' };

/**
 * A `preload` option for SvelteKit's `resolve(event, { preload })`: keeps the
 * default JS and CSS preloads and adds the Rubik faces a page in `lang` renders.
 *
 * Latin is always included, including on Hebrew and Russian pages: spaces, digits
 * and punctuation live in the Latin subset, so every page with text downloads it.
 * `latin-ext` is left to load on demand; it only covers accented extras.
 *
 * @param {string} lang - The page's language code.
 * @param {{ italic?: boolean }} [options] - Also preload the italic faces, for a
 *   page whose first screen sets italic text.
 * @returns {(input: { type: string, path: string }) => boolean}
 */
export function fontPreload(lang, { italic = false } = {}) {
	const scripts = ['latin', SCRIPT_FOR_LANGUAGE[lang]].filter(Boolean).join('|');
	// `Rubik-latin.<hash>.woff2`, never `Rubik-latin-ext.<hash>.woff2`.
	const face = new RegExp(`/Rubik-${italic ? '(italic-)?' : ''}(${scripts})\\.[^/]+\\.woff2$`);
	return ({ type, path }) => type === 'js' || type === 'css' || (type === 'font' && face.test(path));
}
