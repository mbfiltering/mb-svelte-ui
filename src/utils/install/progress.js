/**
 * How far along the iOS install walkthrough is, in words.
 */

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
