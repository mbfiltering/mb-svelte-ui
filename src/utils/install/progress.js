/**
 * What the person walking the iOS install told the walkthrough, per device, in
 * localStorage: the steps they say they finished, which kind of Apple Account the
 * device signs in with, whether the walkthrough is finished, whether this browser
 * registered the device, and the adult profile link from the create response.
 *
 * localStorage is per origin, so the customer portal and the technician portal
 * each keep their own copy. That is right: the two are different people's word.
 *
 * Only what a *person* said lives here. A step the device itself proves is
 * recomputed from its status on every load and never written down, so a stale
 * tick can never outrank the device.
 *
 * **One key per kind of record**, not one map with several kinds of value in it:
 * every read discards anything that is not the shape it wrote. The key names
 * predate the move from `customer-portal-svelte` (October 2026) and are kept, so
 * walkthroughs already in progress there survive it.
 */

import { CONFIG_LINK_TTL_MS } from './links.js';

const STORAGE_KEY = 'device-install-progress';
const ACCOUNT_KEY = 'device-install-account';
const FINISHED_KEY = 'device-install-finished';
const REGISTERED_KEY = 'device-install-registered';
const CONFIG_LINK_KEY = 'device-install-config-link';

/**
 * localStorage is absent during SSR and can throw in private modes. Anything but
 * the shape we wrote is treated as absent rather than repaired.
 *
 * @param {string} key
 * @returns {Record<string, any>}
 */
function readAll(key) {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

/**
 * @param {string} key
 * @param {object} map
 */
function writeAll(key, map) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(key, JSON.stringify(map));
	} catch {
		// Quota or a locked-down browser. The walkthrough still works for the session.
	}
}

/**
 * Step ids ticked by hand on this device.
 *
 * @param {string} deviceId
 * @returns {string[]}
 */
export function getAttestedSteps(deviceId) {
	const stored = readAll(STORAGE_KEY)[deviceId];
	return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];
}

/**
 * Records a tick. Returns the new list so callers can assign it to state.
 *
 * @param {string} deviceId
 * @param {string} stepId
 * @returns {string[]}
 */
export function attestStep(deviceId, stepId) {
	const all = readAll(STORAGE_KEY);
	const next = getAttestedSteps(deviceId);
	if (!next.includes(stepId)) next.push(stepId);
	writeAll(STORAGE_KEY, { ...all, [deviceId]: next });
	return next;
}

/**
 * Takes a tick back.
 *
 * @param {string} deviceId
 * @param {string} stepId
 * @returns {string[]}
 */
export function unattestStep(deviceId, stepId) {
	const all = readAll(STORAGE_KEY);
	const next = getAttestedSteps(deviceId).filter((id) => id !== stepId);
	writeAll(STORAGE_KEY, { ...all, [deviceId]: next });
	return next;
}

/**
 * Which kind of Apple Account this device was said to sign in with, or `null`
 * while nobody has answered. Nothing is guessed: a default here would be the
 * portal answering a question only the person holding the phone can.
 *
 * @param {string} deviceId
 * @returns {'child' | 'adult' | null}
 */
export function getInstallAccount(deviceId) {
	const stored = readAll(ACCOUNT_KEY)[deviceId];
	return stored === 'child' || stored === 'adult' ? stored : null;
}

/**
 * @param {string} deviceId
 * @param {'child' | 'adult'} kind
 */
export function setInstallAccount(deviceId, kind) {
	writeAll(ACCOUNT_KEY, { ...readAll(ACCOUNT_KEY), [deviceId]: kind });
}

/**
 * Has the walkthrough been seen through to the end on this device, in this
 * browser? The flag MHomsany asked for on 2026-08-30 ("we need to use another
 * flag"), written only by the walkthrough itself and cleared when a step is taken
 * back.
 *
 * @param {string} deviceId
 * @returns {boolean}
 */
export function isInstallFinished(deviceId) {
	return readAll(FINISHED_KEY)[deviceId] === true;
}

/**
 * @param {string} deviceId
 * @param {boolean} finished
 */
export function setInstallFinished(deviceId, finished) {
	const all = readAll(FINISHED_KEY);
	if (finished) {
		writeAll(FINISHED_KEY, { ...all, [deviceId]: true });
		return;
	}
	if (!(deviceId in all)) return;
	const { [deviceId]: _removed, ...rest } = all;
	writeAll(FINISHED_KEY, rest);
}

/**
 * Did this browser register this device through the iOS v2 create route? A
 * device made there is a config-mode device by construction, and until core
 * reports `config_mode` this is the only evidence a customer token has.
 *
 * @param {string} deviceId
 * @returns {boolean}
 */
export function wasRegisteredInConfigMode(deviceId) {
	return readAll(REGISTERED_KEY)[deviceId] === true;
}

/** @param {string} deviceId */
export function markRegisteredInConfigMode(deviceId) {
	writeAll(REGISTERED_KEY, { ...readAll(REGISTERED_KEY), [deviceId]: true });
}

/**
 * Keeps the adult profile link the create response handed out.
 *
 * **It is the only time a customer token is ever given one.** `apple/create`
 * locks the device in the same handler, and `config-link` refuses a locked device
 * from then on (verified on every backend; see `mb-specs` iOS v2 status). The
 * link lives four hours and is not single use, so keeping it until the profile
 * step, which now comes last, is what makes that step work for the customer at
 * all. Past its expiry it is dropped on read.
 *
 * @param {string} deviceId
 * @param {string | undefined | null} link
 * @param {number} [now]
 */
export function rememberConfigLink(deviceId, link, now = Date.now()) {
	if (typeof link !== 'string' || !link) return;
	writeAll(CONFIG_LINK_KEY, {
		...readAll(CONFIG_LINK_KEY),
		[deviceId]: { link, expiresAt: now + CONFIG_LINK_TTL_MS }
	});
}

/**
 * The kept profile link and when it dies, or `null` when there is none left.
 *
 * @param {string} deviceId
 * @param {number} [now]
 * @returns {{ link: string, expiresAt: number } | null}
 */
export function getRememberedConfigLink(deviceId, now = Date.now()) {
	const stored = readAll(CONFIG_LINK_KEY)[deviceId];
	if (!stored || typeof stored.link !== 'string' || typeof stored.expiresAt !== 'number') {
		return null;
	}
	return stored.expiresAt > now ? { link: stored.link, expiresAt: stored.expiresAt } : null;
}

/**
 * How far along, as an encouraging phrase's key rather than a percentage. The
 * ends win over the middles, so "almost there" is never beaten by "past halfway"
 * on a short procedure.
 *
 * @param {number} completed
 * @param {number} total
 * @returns {string}
 */
export function installProgressPhraseKey(completed, total) {
	const remaining = total - completed;
	if (total <= 0 || completed <= 0) return 'DeviceInstall.progress_start';
	if (remaining <= 0) return 'DeviceInstall.progress_done';
	if (remaining === 1) return 'DeviceInstall.progress_last';
	if (remaining === 2) return 'DeviceInstall.progress_almost';
	if (completed * 2 >= total) return 'DeviceInstall.progress_halfway';
	return 'DeviceInstall.progress_going';
}
