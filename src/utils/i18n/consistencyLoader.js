/**
 * Finding the estate's locale catalogs from inside any one repo.
 *
 * The four apps are separate repositories checked out side by side. A check that
 * only ever sees one of them is exactly the check the estate already had, and it
 * is why the drift was invisible: `check-i18n` compares a repo against its own
 * English and cannot know that the repo next door says it differently.
 *
 * So: walk up from the calling repo, look for the sibling checkouts, and load
 * whichever are there. A developer who cloned one repo alone still gets every
 * single-catalog rule; the cross-catalog rule runs on what it found and says so.
 *
 * Node only. Not re-exported from `index.js` - it reads the filesystem.
 */

import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Where each catalog lives, relative to its repository root. */
export const CATALOGS = [
	{
		id: 'portal',
		repo: 'portal-svelte',
		dir: 'src/lib/utils/i18n/translations',
		pick: (m) => m.translations
	},
	{
		id: 'customer',
		repo: 'customer-portal-svelte',
		dir: 'src/lib/translations',
		pick: (m) => m.translations
	},
	{
		id: 'oauth',
		repo: 'mb-oauth-portal',
		dir: 'src/lib/translations',
		pick: (m) => m.default
	},
	{
		// This package's own locale-first copy: the iOS install walkthrough, which
		// both the customer and the technician portal render.
		id: 'ui',
		repo: 'mb-svelte-ui',
		dir: 'src/utils/install/translations',
		pick: (m) => m.translations
	},
	{
		id: 'brochure',
		repo: 'mb-branding',
		dir: 'marketing/brochure/brochure-strings',
		pick: (m) => m.strings
	}
];

/** Keys the brochure exports beside `strings` that are metadata, not copy. */
const BROCHURE_META = new Set(['lang', 'name', 'dir', 'typeScale']);

/**
 * Walk up from `startDir` until a directory contains one of the repo names.
 * @param {string} startDir
 * @returns {string | null} the directory the repositories sit in
 */
export function findEstateRoot(startDir) {
	let dir = resolve(startDir);
	for (let i = 0; i < 8; i++) {
		if (CATALOGS.some((c) => existsSync(join(dir, c.repo)))) return dir;
		const up = dirname(dir);
		if (up === dir) break;
		dir = up;
	}
	return null;
}

/** Flatten `{ a: { b: 'c' } }` to `{ 'a.b': 'c' }`. */
function flatten(obj, prefix = '', out = {}) {
	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === 'string') out[path] = value;
		else if (Array.isArray(value)) {
			value.forEach((item, i) => {
				if (typeof item === 'string') out[`${path}[${i}]`] = item;
				else if (item && typeof item === 'object') flatten(item, `${path}[${i}]`, out);
			});
		} else if (value && typeof value === 'object') flatten(value, path, out);
	}
	return out;
}

/**
 * Load every catalog that is present.
 *
 * `.ts` catalogs are imported directly: Node strips the types (>= 22.18) and the
 * locale modules are plain object literals, which is the same thing
 * `mb-oauth-portal/scripts/check-i18n.mjs` already relies on.
 *
 * @param {string} startDir usually `import.meta.dirname` of the calling script
 * @returns {Promise<{ entries: Array<{catalog:string,locale:string,key:string,value:string}>, found: string[], missing: string[] }>}
 */
export async function loadEntries(startDir) {
	const root = findEstateRoot(startDir);
	const entries = [];
	const found = [];
	const missing = [];
	if (!root) return { entries, found, missing: CATALOGS.map((c) => c.repo) };

	for (const catalog of CATALOGS) {
		const dir = join(root, catalog.repo, catalog.dir);
		if (!existsSync(dir)) {
			missing.push(catalog.repo);
			continue;
		}
		found.push(catalog.repo);
		for (const file of readdirSync(dir).filter((f) => /\.(js|ts)$/.test(f))) {
			const locale = file.replace(/\.(js|ts)$/, '');
			const module = await import(pathToFileURL(join(dir, file)).href);
			const data = catalog.pick(module);
			if (!data) continue;
			for (const [key, value] of Object.entries(flatten(data))) {
				if (catalog.id === 'brochure' && BROCHURE_META.has(key)) continue;
				entries.push({ catalog: catalog.id, locale, key, value });
			}
		}
	}
	return { entries, found, missing };
}
