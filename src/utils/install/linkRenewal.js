/**
 * Keeping a short-lived QR alive without asking anyone to press anything: mint on
 * arrival, and mint again when the clock runs out.
 *
 * **Nothing renews behind a hidden tab.** These are bearer credentials, and a
 * walkthrough left open overnight would otherwise spend one every five minutes
 * for a QR nobody can see. A renewal that comes due while the page is hidden is
 * held, and taken the moment the page is looked at again.
 *
 * `setTimeout` rather than polling `Date.now()`: a timer that comes due while the
 * machine sleeps fires late, not never.
 */

/**
 * @typedef {object} LinkRenewal
 * @property {(remainingMs?: number) => void} arm A fresh link landed. Start its
 *   clock over, from the TTL or from what is left of it: a link kept from the
 *   create response arrives part-spent.
 * @property {() => void} cancel Drop whatever is scheduled, and any held renewal.
 * @property {() => void} destroy `cancel`, plus release the visibility listener.
 */

/**
 * Calls `renew` once `ttlMs` has passed since the last `arm()`, deferring until
 * the page is visible. `renew` arms again when it succeeds and leaves the timer
 * cancelled when it does not, so a route answering 404 is asked once, not on a
 * timer.
 *
 * @param {number} ttlMs
 * @param {() => void} renew
 * @returns {LinkRenewal}
 */
export function createLinkRenewal(ttlMs, renew) {
	/** @type {ReturnType<typeof setTimeout> | null} */
	let timer = null;
	let held = false;

	const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

	function fire() {
		timer = null;
		if (isHidden()) {
			held = true;
			return;
		}
		renew();
	}

	function onVisibilityChange() {
		if (held && !isHidden()) {
			held = false;
			renew();
		}
	}

	function cancel() {
		if (timer) clearTimeout(timer);
		timer = null;
		held = false;
	}

	if (typeof document !== 'undefined') {
		document.addEventListener('visibilitychange', onVisibilityChange);
	}

	return {
		arm(remainingMs) {
			cancel();
			timer = setTimeout(fire, Math.max(0, remainingMs ?? ttlMs));
		},
		cancel,
		destroy() {
			cancel();
			if (typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', onVisibilityChange);
			}
		}
	};
}
