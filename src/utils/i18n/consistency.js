/**
 * Cross-catalog i18n consistency rules.
 *
 * Each app already has a `check-i18n` that compares its own locales against its
 * own English, and a `check-auth-wording` that reads its English values. Neither
 * can see across a repo boundary, and neither ever looks at a non-English value,
 * which is why 190 strings could be translated two ways without a single build
 * going red.
 *
 * The rules live here, once, the way `check-auth-wording`'s RULES array already
 * does. Each app ships a thin `scripts/check-i18n-consistency` that loads the
 * catalogs it can see and calls `runChecks`.
 *
 * An entry is `{ catalog, locale, key, value }`. `catalog` is the short name an
 * exception file refers to: `portal`, `customer`, `oauth`, `ui`, `brochure`.
 *
 * @see mb-specs/dev-resources/STYLE-GUIDE.md
 * @see mb-specs/dev-resources/i18n-exceptions.json
 */

import { invariantTerms, fixed } from './glossary.js';

const EM_DASH = '—';
const NNBSP = ' ';
const GERSHAYIM = '״';

/** Flatten `{ a: { b: 'c' } }` to `{ 'a.b': 'c' }`. */
export function flatten(obj, prefix = '', out = {}) {
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

const norm = (s) => s.toLowerCase().replace(/[.…]+$/, '').replace(/\s+/g, ' ').trim();
const addr = (e) => `${e.catalog}:${e.key}`;

const LETTER = /[\p{L}\p{N}]/u;
/** Hebrew and Yiddish glue a one-letter clitic onto the front of a word. */
const CLITIC = new Set(['ו', 'ב', 'ל', 'כ', 'מ', 'ה', 'ש']);

/**
 * Does `text` contain `term` as a word rather than as a fragment?
 *
 * "Pro" is inside "Protection" and "אפל" is inside "אפליקציה", so a substring
 * test turns the glossary into noise. A term may still carry a Hebrew clitic
 * ("ביוטיוב" is YouTube with a preposition welded on), which is a hit.
 *
 * @param {string} text
 * @param {string} term
 */
export function containsTerm(text, term) {
	let at = 0;
	while ((at = text.indexOf(term, at)) !== -1) {
		const before = text[at - 1];
		const after = text[at + term.length];
		const beforeOk =
			before === undefined ||
			!LETTER.test(before) ||
			(CLITIC.has(before) && (at < 2 || !LETTER.test(text[at - 2])));
		if (beforeOk && (after === undefined || !LETTER.test(after))) return true;
		at += 1;
	}
	return false;
}

/** An exception list is `[a, b, "why"]` triples; the reason is required. */
function allowed(exceptions, rule, ...parts) {
	const list = exceptions?.[rule] ?? [];
	return list.some((row) => {
		const keys = row.slice(0, -1);
		return parts.every((p) => keys.includes(p)) && keys.length === parts.length;
	});
}

/**
 * R1 - the same English string translated two ways.
 *
 * Roughly half the hits this rule finds in a fresh estate are legitimate sense
 * splits ("Save" is money on a pricing page and persistence on a form), which is
 * why it reads an exception file rather than being a bare rule. An exception
 * needs a reason written next to it.
 */
export function sameEnglishDifferentTranslation(entries, exceptions) {
	const problems = [];
	const english = entries.filter((e) => e.locale === 'en');
	const byNormalisedEnglish = new Map();
	for (const e of english) {
		// Group on the exact English, not the loose form `english-self` uses: a
		// label and its placeholder ("Search" / "Search…") are two strings and are
		// allowed two translations. Two identical English strings are not.
		const n = e.value.trim();
		if (!n) continue;
		if (!byNormalisedEnglish.has(n)) byNormalisedEnglish.set(n, []);
		byNormalisedEnglish.get(n).push(e);
	}
	const byAddress = new Map(entries.map((e) => [`${e.catalog}:${e.locale}:${e.key}`, e.value]));

	for (const group of byNormalisedEnglish.values()) {
		if (group.length < 2) continue;
		const locales = [...new Set(entries.map((e) => e.locale))].filter((l) => l !== 'en');
		for (const locale of locales) {
			const seen = new Map();
			for (const e of group) {
				const v = byAddress.get(`${e.catalog}:${locale}:${e.key}`);
				if (v === undefined) continue;
				if (!seen.has(v)) seen.set(v, []);
				seen.get(v).push(addr(e));
			}
			if (seen.size < 2) continue;
			const variants = [...seen.entries()];
			const pair = [variants[0][1][0], variants[1][1][0]].sort();
			if (allowed(exceptions, 'same-english', ...pair)) continue;
			problems.push({
				rule: 'same-english',
				locale,
				english: group[0].value,
				detail: variants.map(([v, where]) => `${JSON.stringify(v)} <- ${where.join(', ')}`).join('  |  '),
				suggest: pair
			});
		}
	}
	return problems;
}

/**
 * R2 - a glossary term must survive translation.
 *
 * Two halves: a term the English names has to appear in the locale as well, and
 * a spelling the estate has retired must not come back anywhere.
 */
export function glossaryCompliance(entries, exceptions) {
	const problems = [];
	const englishByAddress = new Map(
		entries.filter((e) => e.locale === 'en').map((e) => [addr(e), e.value])
	);

	for (const e of entries) {
		if (e.locale === 'en') continue;
		const en = englishByAddress.get(addr(e));
		for (const { term, forbid } of invariantTerms) {
			if (allowed(exceptions, 'glossary', addr(e), term)) continue;
			if (en && containsTerm(en, term) && !e.value.includes(term)) {
				problems.push({
					rule: 'glossary',
					locale: e.locale,
					where: addr(e),
					detail: `English says "${term}"; the ${e.locale} value does not: ${JSON.stringify(e.value)}`,
					suggest: [addr(e), term]
				});
			}
			for (const bad of forbid ?? []) {
				if (!containsTerm(e.value, bad)) continue;
				problems.push({
					rule: 'glossary',
					locale: e.locale,
					where: addr(e),
					detail: `"${bad}" is a retired spelling of "${term}": ${JSON.stringify(e.value)}`,
					suggest: [addr(e), term]
				});
			}
		}
	}
	return problems;
}

/**
 * R3 - an app-local key must not re-author a string the shared namespace owns.
 *
 * This is the rule that keeps the deleted duplicates deleted. `safety.*` and
 * `auth.*` are the estate's vocabulary; an app that spells one of those words
 * again gets its own copy, and a copy drifts.
 */
export function sharedNamespaceOwnsIt(entries, exceptions) {
	const problems = [];
	for (const e of entries) {
		if (e.locale !== 'en') continue;
		const owner = fixed[e.value];
		if (!owner) continue;
		if (allowed(exceptions, 'shared-owns', addr(e))) continue;
		problems.push({
			rule: 'shared-owns',
			locale: 'en',
			where: addr(e),
			detail: `${JSON.stringify(e.value)} is already ${owner.key} in @mbsmart/ui; read it from there`,
			suggest: [addr(e)]
		});
	}
	return problems;
}

/**
 * R4 - English has to agree with itself.
 *
 * Two strings that differ only in capitalisation are one string written twice,
 * and each copy gets translated separately. Sentence case is the house rule for
 * every button, label and heading, so Title Case in a short phrase is the same
 * defect seen from the other side.
 */
export function englishSelfConsistency(entries, exceptions, { isTitleCased } = {}) {
	const problems = [];
	const english = entries.filter((e) => e.locale === 'en');
	const byNormalised = new Map();
	for (const e of english) {
		const n = norm(e.value);
		if (!n || n.length > 90) continue;
		if (!byNormalised.has(n)) byNormalised.set(n, []);
		byNormalised.get(n).push(e);
	}
	for (const group of byNormalised.values()) {
		const variants = [...new Set(group.map((e) => e.value))];
		if (variants.length < 2) continue;
		const pair = [addr(group.find((e) => e.value === variants[0])), addr(group.find((e) => e.value === variants[1]))].sort();
		if (allowed(exceptions, 'english-self', ...pair)) continue;
		problems.push({
			rule: 'english-self',
			locale: 'en',
			detail: variants.map((v) => `${JSON.stringify(v)} <- ${group.filter((e) => e.value === v).map(addr).join(', ')}`).join('  |  '),
			suggest: pair
		});
	}
	if (isTitleCased) {
		for (const e of english) {
			if (!isTitleCased(e.key, e.value)) continue;
			if (allowed(exceptions, 'english-self', addr(e))) continue;
			problems.push({
				rule: 'english-self',
				locale: 'en',
				where: addr(e),
				detail: `Title Case in a label; the house style is sentence case: ${JSON.stringify(e.value)}`,
				suggest: [addr(e)]
			});
		}
	}
	return problems;
}

/**
 * R5 - no em dash, in any of the six locales.
 *
 * The style guide's rule is absolute and was, until now, the one house rule with
 * no script behind it. Russian is the locale that breaks it by accident, because
 * a dash before `это` is idiomatic; reword rather than keep it.
 */
export function noEmDash(entries, exceptions) {
	return entries
		.filter((e) => e.value.includes(EM_DASH) && !allowed(exceptions, 'em-dash', addr(e)))
		.map((e) => ({
			rule: 'em-dash',
			locale: e.locale,
			where: addr(e),
			detail: JSON.stringify(e.value),
			suggest: [addr(e)]
		}));
}

/**
 * R6 - the per-locale typographic conventions.
 *
 * Each of these was being applied by hand, which is why each was applied about
 * three-quarters of the time. See the per-locale table in the style guide.
 */
export function typography(entries, exceptions) {
	const problems = [];
	const flag = (e, detail) => {
		if (allowed(exceptions, 'typography', addr(e))) return;
		problems.push({ rule: 'typography', locale: e.locale, where: addr(e), detail, suggest: [addr(e)] });
	};
	for (const e of entries) {
		if (e.value.includes('...')) flag(e, `three dots; the ellipsis is …: ${JSON.stringify(e.value)}`);
		if (e.locale === 'fr') {
			const text = e.value.replace(/<[^>]*>/g, '');
			if (/[^\s  ][?!;:](\s|$)/.test(text) || / [?!;:]/.test(text)) {
				flag(e, `French takes a narrow no-break space (U+202F) before ? ! : ; : ${JSON.stringify(e.value)}`);
			}
		}
		if ((e.locale === 'he' || e.locale === 'yi') && /[֐-׿]"[֐-׿]/.test(e.value)) {
			flag(e, `abbreviation takes a gershayim (${GERSHAYIM}), not a straight quote: ${JSON.stringify(e.value)}`);
		}
	}
	return problems;
}

/**
 * R7 - a translated string must carry the same `{tokens}` as its English.
 *
 * Clean across all four catalogs today. It is here so it stays clean, and
 * because a dropped token is the one defect in this file that throws.
 */
export function interpolationParity(entries) {
	const problems = [];
	const englishByAddress = new Map(
		entries.filter((e) => e.locale === 'en').map((e) => [addr(e), e.value])
	);
	const tokens = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
	for (const e of entries) {
		if (e.locale === 'en') continue;
		const en = englishByAddress.get(addr(e));
		if (en === undefined) continue;
		if (tokens(en) !== tokens(e.value)) {
			problems.push({
				rule: 'interpolation',
				locale: e.locale,
				where: addr(e),
				detail: `English has {${tokens(en) || 'none'}}, ${e.locale} has {${tokens(e.value) || 'none'}}`
			});
		}
	}
	return problems;
}

/**
 * Run every rule and return the problems, most structural first.
 *
 * @param {{ entries: Array<{catalog:string,locale:string,key:string,value:string}>,
 *           exceptions?: Record<string, Array<string[]>>,
 *           isTitleCased?: (key: string, value: string) => boolean }} options
 */
export function runChecks({ entries, exceptions = {}, isTitleCased }) {
	return [
		...interpolationParity(entries),
		...sharedNamespaceOwnsIt(entries, exceptions),
		...glossaryCompliance(entries, exceptions),
		...noEmDash(entries, exceptions),
		...sameEnglishDifferentTranslation(entries, exceptions),
		...englishSelfConsistency(entries, exceptions, { isTitleCased }),
		...typography(entries, exceptions)
	];
}

export { EM_DASH, NNBSP, GERSHAYIM };
