/**
 * The links the iOS install walkthrough hands to the device: whether to trust
 * one, what to do to it first, and how long it lasts.
 *
 * **Two of them are credentials and two are not.** `enroll` and `profile` are
 * minted per device, expire, and are validated before the browser is pointed at
 * them. `APP_STORE_URL` and `DEVICE_PORTAL_URL` are addresses of our own that we
 * simply write down.
 *
 *   - **`enroll`**: an `mbsmart://redeem?code=…&device_id=…` deep link the *app*
 *     redeems. Single use, five minutes. Since October 2026 it is how **every**
 *     device is linked, adult or child, and it is the walkthrough's first contact
 *     with the phone: the app's first heartbeat follows the redeem, and that is
 *     what lets the portal watch every step after it.
 *   - **`profile`**: an `https://` URL to a `.mobileconfig` the *system* installs.
 *     Four hours, not single use. Adult devices only, and last.
 *
 * One accepts `mbsmart://` and nothing else; the other accepts `https://` and
 * nothing else. A shared validator would have to take both, which is exactly the
 * check neither wants.
 *
 * Moved here from `customer-portal-svelte` in October 2026, when the technician
 * portal started showing the same walkthrough.
 */

/** The only scheme an app-enrolment link may carry. */
export const ENROLL_SCHEME = 'mbsmart://';

/** The only scheme a config-profile link may carry. */
export const CONFIG_SCHEME = 'https://';

/**
 * How long an enrolment code lives, and so how often a visible QR is renewed.
 * Single use as well as short, which together are what make it tolerable to draw
 * a bearer credential on screen.
 */
export const ENROLL_CODE_TTL_MS = 5 * 60_000;

/**
 * How long the tokenized config link lives before the delivery route answers
 * `410 Gone`. Not single use: resolving the token reads the cache without
 * deleting it, so the URL is a bearer credential for the whole window.
 */
export const CONFIG_LINK_TTL_MS = 4 * 60 * 60_000;

/**
 * The app-enrolment link, or `null` if what came back cannot be trusted.
 *
 * `device_id` is appended when absent (the app refuses a link without one; core
 * has added it itself since September 2026, so this is belt and braces), and the
 * scheme is checked, because this is a URL from the network that the browser is
 * about to be navigated to.
 *
 * @param {string | undefined | null} link
 * @param {string | undefined | null} deviceId
 * @returns {string | null}
 */
export function buildEnrollLink(link, deviceId) {
	if (typeof link !== 'string' || !link.startsWith(ENROLL_SCHEME)) return null;
	if (!deviceId) return null;
	if (/[?&]device_id=/.test(link)) return link;
	const separator = link.includes('?') ? '&' : '?';
	return `${link}${separator}device_id=${encodeURIComponent(deviceId)}`;
}

/**
 * The config-profile link, or `null` on the same terms. Nothing is appended: the
 * URL is core's own and already tokenized. `https://` and not merely "not
 * `javascript:`": a profile served over plain HTTP could be rewritten by anyone on
 * the same network, and this one configures the device's filtering.
 *
 * @param {string | undefined | null} link
 * @returns {string | null}
 */
export function buildConfigLink(link) {
	if (typeof link !== 'string' || !link.startsWith(CONFIG_SCHEME)) return null;
	return link;
}

/**
 * Is this browser running on the kind of device being set up, an iPhone or an
 * iPad? It is what puts a direct button beside a QR code: someone holding the
 * device should not be asked to scan their own screen.
 *
 * iPadOS 13+ reports itself as `MacIntel`, so the touch-point count is what
 * separates an iPad from a Mac. Wrong in either direction is cheap: a button that
 * does nothing visible, or a QR that works anyway.
 *
 * @returns {boolean}
 */
export function isAppleMobileBrowser() {
	if (typeof navigator === 'undefined') return false;
	if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return true;
	return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/** MB Smart Protect on the App Store. */
export const APP_STORE_URL = 'https://apps.apple.com/app/mb-smart-protect/id6785542929';

/**
 * Where a fixed link's URL names the device it is about. The step list is built
 * once at module load with no device in hand, so the hole is punched here and
 * filled by whoever draws the link. See `resolveLinkUrl`.
 */
export const DEVICE_ID_TOKEN = '{device_id}';

/**
 * The MB Smart device portal, where the network filter is turned on (MHomsany,
 * 2026-09-09). The **legacy** surface, not `device-portal-svelte`. The id is not
 * a secret and the PIN that opens the portal is deliberately not in the URL.
 */
export const DEVICE_PORTAL_URL = `https://customer.mbsmartservices.net/mbsmart/customer.html?id=${DEVICE_ID_TOKEN}`;

/**
 * A step's fixed link, with this device's id where the token was.
 *
 * @param {string} url
 * @param {string | undefined | null} deviceId
 * @returns {string}
 */
export function resolveLinkUrl(url, deviceId) {
	if (!url.includes(DEVICE_ID_TOKEN)) return url;
	return url.split(DEVICE_ID_TOKEN).join(encodeURIComponent(deviceId ?? ''));
}
