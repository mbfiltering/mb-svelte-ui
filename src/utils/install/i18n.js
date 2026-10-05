/**
 * The walkthrough's copy, one chunk per language, registered into the shared
 * engine the first time a walkthrough renders in that language.
 *
 * Locale-first files rather than one key-first module, for two reasons: a visitor
 * downloads their own language and not the other five (it is ~120 strings), and
 * the estate's i18n consistency check can read them as a catalog of their own
 * (`ui` in `consistencyLoader.js`), so the em-dash and same-English rules cover
 * them exactly as they cover the portals' strings.
 *
 * **The app's own chunk for a language is loaded first.** `loadLanguage()` treats
 * any language that already holds data as loaded, so registering these strings
 * before the app's chunk had arrived would stop that chunk from ever being
 * fetched, and every other string on the page would fall back to English.
 */

import { loadLanguage, registerLocale } from '../i18n/localeRegistry.js';

/** @type {Record<string, () => Promise<{ translations: object }>>} */
const LOADERS = {
	en: () => import('./translations/en.js'),
	es: () => import('./translations/es.js'),
	fr: () => import('./translations/fr.js'),
	he: () => import('./translations/he.js'),
	ru: () => import('./translations/ru.js'),
	yi: () => import('./translations/yi.js')
};

/** @type {Map<string, Promise<void>>} */
const pending = new Map();

/**
 * @param {string} lang
 * @returns {Promise<void>}
 */
function loadOne(lang) {
	let promise = pending.get(lang);
	if (!promise) {
		const loader = LOADERS[lang];
		promise = loader
			? Promise.all([loadLanguage(lang), loader()]).then(([, mod]) =>
					registerLocale(lang, mod.translations)
				)
			: Promise.resolve();
		// A failed fetch is not remembered, so the next render tries again.
		promise.catch(() => pending.delete(lang));
		pending.set(lang, promise);
	}
	return promise;
}

/**
 * Makes the walkthrough's strings available in `lang`, with English beside them
 * as the fallback the engine reaches for. Memoised; cheap to call on every render.
 *
 * @param {string} lang
 * @returns {Promise<void>}
 */
export function loadInstallTranslations(lang) {
	return Promise.all([loadOne('en'), loadOne(lang)]).then(() => {});
}
