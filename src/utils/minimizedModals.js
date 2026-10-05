import { writable } from 'svelte/store';

/**
 * The ids of every currently minimized `Modal`, in the order they were
 * minimized.
 *
 * Minimized modals stack in the bottom corner of the viewport, and each one is
 * an independent `Modal` instance that knows nothing about the others — so the
 * order has to live outside all of them. A modal's position in this array is
 * its position in the stack; dropping out of the middle of it slides the ones
 * above down, which is why the chips animate their offset.
 *
 * @type {import('svelte/store').Writable<string[]>}
 */
const minimizedModals = writable([]);

/**
 * Add a modal to the bottom of the stack. Idempotent.
 * @param {string} id
 */
export function registerMinimized(id) {
	minimizedModals.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
}

/**
 * Remove a modal from the stack (on restore, on close, or on destroy).
 * @param {string} id
 */
export function unregisterMinimized(id) {
	minimizedModals.update((ids) => ids.filter((existing) => existing !== id));
}

/**
 * Every open, minimizable `Modal`, keyed by id, with its own `minimize()`.
 *
 * Only one modal is maximized at a time: restoring one sends whatever else is up
 * to the corner, and a modal cannot reach its siblings any more than it can see
 * the stack. Not a store — nothing renders from it, so a plain Map is enough.
 *
 * @type {Map<string, () => void>}
 */
const openModals = new Map();

/**
 * Note an open modal that is able to minimize itself.
 * @param {string} id
 * @param {() => void} minimize
 */
export function registerOpen(id, minimize) {
	openModals.set(id, minimize);
}

/**
 * Forget a modal that has closed (or lost `minimizable`).
 * @param {string} id
 */
export function unregisterOpen(id) {
	openModals.delete(id);
}

/**
 * Send every other open modal to the corner. Each one's own `minimize()` is a
 * no-op if it is already down there.
 * @param {string} id The modal being maximized
 */
export function minimizeOthers(id) {
	for (const [otherId, minimize] of openModals) {
		if (otherId !== id) minimize();
	}
}

/**
 * Every open, maximized `Modal`, in the order it came up; the last is on top.
 *
 * Modals can stack (a popup opened from inside another), and each binds Escape
 * and Tab to the window. Without this, one Escape closed both and the lower
 * one's focus trap pulled focus out of the upper. Only the top one answers.
 *
 * @type {string[]}
 */
const activeModals = [];

/**
 * Put a modal on top of the stack: it has opened, or been restored.
 * @param {string} id
 */
export function pushActive(id) {
	removeActive(id);
	activeModals.push(id);
}

/**
 * Take a modal out of the stack: it has closed, or been minimized.
 * @param {string} id
 */
export function removeActive(id) {
	const index = activeModals.indexOf(id);
	if (index !== -1) activeModals.splice(index, 1);
}

/**
 * Whether this modal is the one on top, and so the one keys belong to.
 * @param {string} id
 */
export function isTopActive(id) {
	return activeModals.at(-1) === id;
}

export default minimizedModals;
