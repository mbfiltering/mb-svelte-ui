/**
 * Whether a device type has a guided install walkthrough.
 *
 * Its own module so a page that only needs the yes/no (the customer portal's
 * device page, deciding whether to offer "Finish setting up") does not ship the
 * whole step list.
 */

/** The Apple `device_type` spellings core uses. Only iOS has a walkthrough today. */
const APPLE_TYPES = ['ios', 'iphone', 'ipad'];

/**
 * @param {string | undefined | null} deviceType
 * @returns {boolean}
 */
export function hasInstallSteps(deviceType) {
	return APPLE_TYPES.includes(String(deviceType ?? '').toLowerCase());
}
