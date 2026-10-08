/**
 * The iOS v2 install walkthrough, as data.
 *
 * Shared by the customer portal (`/customer/devices/device/{id}/install`) and the
 * technician portal (the "iOS v2 setup" popup on an iOS device), and the device
 * portal (`/{device_id}/install`, on the phone itself), which is why it lives
 * here: MHomsany asked for "the exact same flow" in each, and two copies of
 * a list this size drift. The reasoning behind each step's wording is recorded in
 * `mb-specs/tasks/ios-v2/`; this file keeps only what the code needs to say.
 *
 * **The order, since October 2026: link first, profile last.** "The profile or
 * the enrollment actually link MB Smart to the device. So enrollment should be at
 * the beginning of the flow, profile should be at the end, and we still get
 * everything in between in sync" (MHomsany). So every device, adult or child,
 * redeems an enrolment code straight after the app is installed, and from that
 * moment the app's heartbeat reaches MB Smart and the portal can watch the steps
 * that follow. An adult device installs its configuration profile last.
 *
 *   child: setup_kind, prerequisites, install_app, link_device, extension,
 *          app_setup, filter_on
 *   adult: setup_kind, prerequisites, supervise, install_app, link_device,
 *          extension, app_setup, profile, trust, filter_on
 *
 * The technician's adult list has no prerequisites: what is left of it is MB
 * Smart support, which the technician is, and the time (the owner, 2026-10-07).
 *
 * **No backup, no erase.** Supervision used to erase the device, so the adult path
 * began with an iCloud backup and ended supervision with a restore. MB Smart's
 * installer supervises without erasing since October 2026, so both are gone
 * (MHomsany, 2026-10-08).
 *
 * **How a step is confirmed.** `confirm: 'auto'`: only by the device. The step
 * shows "waiting for the device" and has no button. `confirm: 'attest'`: by
 * pressing "I've done this", or by the device where the step has an `isDone`.
 *
 * **What the device proves** (verified on `api-test.mbsmart.dev`):
 *
 *   - `install_app` and `link_device`: `status.last_sync` leaves the 1970 epoch
 *     on the app's first heartbeat after it redeems the code. A linked device has
 *     the app, so it ticks both.
 *   - `profile`: `GET /device/{id}/apple/profile-install-status`, `installed`.
 *   - `filter_on`: `status.protection`, which is exactly the filter switch.
 *
 * **Only a recent stamp counts** (`RECENT_MS`, 20 minutes, the owner and MHomsany,
 * 2026-10-07). Core keeps `last_sync` and `installed_at` from an earlier install
 * on purpose, so a device set up again would otherwise read as linked and profiled
 * before anything happened. The walkthrough keeps a step done once it has seen it
 * proved, so the window closing later does not undo it.
 */

/**
 * @typedef {'child' | 'adult'} InstallAccountKind
 * @typedef {'enroll' | 'profile'} InstallActionKind
 * @typedef {'auto' | 'attest'} InstallConfirm
 *
 * @typedef {object} InstallStepLink A fixed address a step sends the reader to.
 * @property {string} url May carry `{device_id}`; see `resolveLinkUrl`.
 * @property {string} labelKey
 * @property {'device' | 'anywhere'} reach `device`: only the phone being set up
 *   can act on it, so other browsers get a QR code. `anywhere`: a button on every
 *   browser, opened in a new tab.
 * @property {string} [qrLabelKey]
 * @property {string} [qrCaptionKey]
 *
 * @typedef {object} InstallAccountOption One answer to a step's question.
 * @property {string} labelKey
 * @property {string[]} instructionKeys
 * @property {string} [noteKey] Instead of the step's.
 * @property {string} [checkpointKey] Instead of the step's.
 *
 * @typedef {object} InstallQuestion "Which kind of Apple Account?" Only
 *   `setup_kind` asks it; the steps that depend on the answer just show its lines.
 * @property {string} labelKey
 * @property {boolean} asks
 * @property {Record<InstallAccountKind, InstallAccountOption>} options
 *
 * @typedef {object} InstallStepEvidence What a step may read to prove itself.
 *   `null` until asked.
 * @property {Record<string, any> | null} [status] `GET /device/{id}/status`
 * @property {{ installed?: boolean, installed_at?: string, is_latest?: boolean } | null} [profile]
 * @property {number} [now] When the evidence was read, in ms; `Date.now()` if absent.
 *
 * @typedef {object} InstallStep
 * @property {string} id
 * @property {string} titleKey
 * @property {string} [bodyKey] Only where it changes what the reader does.
 * @property {string[]} [instructionKeys] Absent where they depend on the answer.
 * @property {string[]} [warnKeys] Lines drawn red: a trap.
 * @property {string} [noteKey] An aside to decide on, not a thing to do.
 * @property {string} [checkpointKey] What the app should now read.
 * @property {string} [troubleshootKey] A named symptom, under the action.
 * @property {InstallStepLink} [link]
 * @property {InstallQuestion} [question]
 * @property {InstallActionKind} [action] The credential the portal hands over.
 * @property {string} [confirmLabelKey] Instead of "I've done this"; `attest` only.
 * @property {InstallConfirm} confirm
 * @property {string} [waitKey] Instead of the generic waiting line.
 * @property {string} [confirmedKey] The control row's words once the device proves
 *   it, in place of "Confirmed by the device".
 * @property {(evidence: InstallStepEvidence) => boolean} [isDone]
 * @property {boolean} [filterSwitch] The step offers a button that turns the
 *   filter on from here; see `installStepsFor`'s `filterHere`.
 */

import { APP_STORE_URL, DEVICE_PORTAL_URL } from './links.js';
import { hasInstallSteps } from './platforms.js';

/** Anything before this is a storage placeholder (the 1970 epoch, a zero date). */
const PLAUSIBLE_FLOOR_MS = Date.UTC(2000, 0, 1);

/**
 * Does an API timestamp name a real moment? Naive values are UTC, as the API
 * documents, so a missing zone is supplied rather than read as local time.
 *
 * @param {string | number | undefined | null} value
 * @returns {boolean}
 */
export function hasStamp(value) {
	return stampMs(value) !== null;
}

/**
 * @param {string | number | undefined | null} value
 * @returns {number | null} The moment in ms, or `null` for a placeholder.
 */
function stampMs(value) {
	if (value === null || value === undefined || value === '') return null;
	let ms;
	if (typeof value === 'number') {
		ms = value < 1e11 ? value * 1000 : value;
	} else {
		const text = String(value).trim().replace(' ', 'T');
		if (!text) return null;
		const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(text);
		ms = Date.parse(hasZone || !text.includes('T') ? text : `${text}Z`);
	}
	return Number.isFinite(ms) && ms >= PLAUSIBLE_FLOOR_MS ? ms : null;
}

/** How old a stamp may be and still prove a step: this setup, not an earlier one. */
export const RECENT_MS = 20 * 60_000;

/**
 * Is an API timestamp real and less than `RECENT_MS` old? A stamp ahead of
 * `now` counts: that is the phone's or the server's clock, not an old install.
 *
 * @param {string | number | undefined | null} value
 * @param {number} [now]
 * @returns {boolean}
 */
export function isRecentStamp(value, now = Date.now()) {
	const ms = stampMs(value);
	return ms !== null && now - ms <= RECENT_MS;
}

/** The PIN line on the last step, and what it says on a device with no PIN. */
export const PIN_LINE = {
	key: 'DeviceInstall.step_filter_on_pin',
	without: 'DeviceInstall.step_filter_on_pin_unknown'
};

/** The app's `Mode` tile, in the app's own words. */
export const MODE_LABELS = {
	adult: 'DeviceInstall.mode_adult',
	child: 'DeviceInstall.mode_child'
};

const ACCOUNT_LABELS = {
	child: { labelKey: 'DeviceInstall.account_child_label' },
	adult: { labelKey: 'DeviceInstall.account_adult_label' }
};

/** @type {InstallStep} */
const SETUP_KIND_STEP = {
	id: 'setup_kind',
	// The heading is the question, by the same key, so the two cannot disagree.
	titleKey: 'DeviceInstall.account_question',
	bodyKey: 'DeviceInstall.step_setup_kind_body',
	question: {
		labelKey: 'DeviceInstall.account_question',
		asks: true,
		options: {
			child: { ...ACCOUNT_LABELS.child, instructionKeys: [] },
			adult: { ...ACCOUNT_LABELS.adult, instructionKeys: [] }
		}
	},
	confirmLabelKey: 'DeviceInstall.continue',
	confirm: 'attest'
};

/** @type {InstallStep} */
const PREREQUISITES_STEP = {
	id: 'prerequisites',
	titleKey: 'DeviceInstall.step_prereq_title',
	question: {
		labelKey: 'DeviceInstall.account_question',
		asks: false,
		options: {
			child: {
				...ACCOUNT_LABELS.child,
				instructionKeys: [
					'DeviceInstall.step_prereq_child_1',
					'DeviceInstall.step_prereq_child_2',
					'DeviceInstall.step_prereq_child_3'
				]
			},
			adult: {
				...ACCOUNT_LABELS.adult,
				instructionKeys: [
					'DeviceInstall.step_prereq_adult_1',
					'DeviceInstall.step_prereq_adult_2'
				],
				noteKey: 'DeviceInstall.step_prereq_adult_note'
			}
		}
	},
	confirmLabelKey: 'DeviceInstall.step_prereq_confirm',
	confirm: 'attest'
};

/**
 * Adult only, and before anything is installed. Done by MB Smart support with a
 * Mac tool customers cannot get. Nothing reports supervision, so it is the
 * person's word.
 *
 * @type {InstallStep}
 */
const SUPERVISE_STEP = {
	id: 'supervise',
	titleKey: 'DeviceInstall.step_supervise_title',
	bodyKey: 'DeviceInstall.step_supervise_body',
	instructionKeys: ['DeviceInstall.step_supervise_1', 'DeviceInstall.step_supervise_2'],
	noteKey: 'DeviceInstall.step_supervise_note',
	confirm: 'attest'
};

/** @type {InstallStep} */
const INSTALL_APP_STEP = {
	id: 'install_app',
	titleKey: 'DeviceInstall.step_install_app_title',
	instructionKeys: [
		'DeviceInstall.step_install_app_1',
		'DeviceInstall.step_install_app_2'
	],
	link: {
		url: APP_STORE_URL,
		labelKey: 'DeviceInstall.app_store_open',
		reach: 'device',
		qrLabelKey: 'DeviceInstall.app_store_qr_label',
		qrCaptionKey: 'DeviceInstall.app_store_qr_caption'
	},
	// Nothing reports the app before it links, so it is the person's word, and
	// the link proves it after the fact.
	confirm: 'attest',
	isDone: ({ status, now }) => isRecentStamp(status?.last_sync, now)
};

/**
 * The first contact with the phone, on both paths.
 *
 * The QR carries an `mbsmart://redeem` code; the app redeems it, even before its
 * own onboarding (app team, 2026-10-05), and sends its first heartbeat, which
 * stamps `last_sync`. That stamp is not written at creation, so on a new device
 * it cannot mean anything but "linked". The step watches for a recent one and says
 * so.
 *
 * @type {InstallStep}
 */
const LINK_STEP = {
	id: 'link_device',
	titleKey: 'DeviceInstall.step_link_title',
	bodyKey: 'DeviceInstall.step_link_body',
	instructionKeys: [
		'DeviceInstall.step_link_1',
		'DeviceInstall.step_link_2',
		'DeviceInstall.step_link_3'
	],
	action: 'enroll',
	checkpointKey: 'DeviceInstall.step_link_checkpoint',
	troubleshootKey: 'DeviceInstall.link_troubleshoot',
	confirm: 'auto',
	waitKey: 'DeviceInstall.step_link_wait',
	confirmedKey: 'DeviceInstall.step_link_done',
	isDone: ({ status, now }) => isRecentStamp(status?.last_sync, now)
};

/**
 * The Safari extensions, in Settings. Before Screen Time: a restricted device
 * greys the switches out. Nothing reports the All Websites permission, and the
 * extension's own stamp would tick this with All Websites left on Ask, which is
 * the case the step exists to catch, so it stays the person's word.
 *
 * @type {InstallStep}
 */
const EXTENSION_STEP = {
	id: 'extension',
	titleKey: 'DeviceInstall.step_extension_title',
	instructionKeys: [
		'DeviceInstall.step_extension_1',
		'DeviceInstall.step_extension_2',
		'DeviceInstall.step_extension_3'
	],
	confirm: 'attest'
};

/**
 * The app's child/adult fork and Apple's Screen Time approval. iOS puts "Don't
 * Allow" in the blue button, hence the red lines. The `Mode` checkpoint is the one
 * place a mismatched answer ever shows. Nothing reports Screen Time, so it is the
 * person's word.
 *
 * @type {InstallStep}
 */
const APP_SETUP_STEP = {
	id: 'app_setup',
	titleKey: 'DeviceInstall.step_app_setup_title',
	question: {
		labelKey: 'DeviceInstall.account_question',
		asks: false,
		options: {
			child: {
				...ACCOUNT_LABELS.child,
				instructionKeys: [
					'DeviceInstall.step_app_setup_child_1',
					'DeviceInstall.step_app_setup_child_2',
					'DeviceInstall.step_app_setup_child_3'
				]
			},
			adult: {
				...ACCOUNT_LABELS.adult,
				instructionKeys: [
					'DeviceInstall.step_app_setup_adult_1',
					'DeviceInstall.step_app_setup_adult_2'
				]
			}
		}
	},
	warnKeys: ['DeviceInstall.step_app_setup_child_2', 'DeviceInstall.step_app_setup_adult_2'],
	checkpointKey: 'DeviceInstall.step_app_setup_checkpoint',
	confirmLabelKey: 'DeviceInstall.confirm_seen',
	confirm: 'attest'
};

/**
 * Adult only, and last. The configuration profile is what holds MB Smart on a
 * device with no parent to approve Screen Time.
 *
 * `profile` evidence is asked for only on the adult path; a child device never
 * installs one and would read `installed: false` for ever.
 *
 * @type {InstallStep}
 */
const PROFILE_STEP = {
	id: 'profile',
	titleKey: 'DeviceInstall.step_profile_title',
	bodyKey: 'DeviceInstall.step_profile_body',
	instructionKeys: ['DeviceInstall.step_profile_1', 'DeviceInstall.step_profile_2'],
	action: 'profile',
	checkpointKey: 'DeviceInstall.step_profile_checkpoint',
	confirm: 'auto',
	isDone: ({ profile, now }) =>
		profile?.installed === true && isRecentStamp(profile.installed_at, now)
};

/**
 * Adult only, right after the profile, which is what brings the MB Smart root
 * certificate (MHomsany, 2026-10-07: it comes with the profile, not the app). A
 * root certificate that arrives in a profile is not trusted for SSL until it is
 * turned on under Certificate Trust Settings (support.apple.com/102390). Nothing
 * reports that switch, so it stays the person's word; a step of its own, because
 * the profile step ticks itself as soon as the profile lands.
 *
 * @type {InstallStep}
 */
const TRUST_STEP = {
	id: 'trust',
	titleKey: 'DeviceInstall.step_trust_title',
	instructionKeys: ['DeviceInstall.step_trust_1', 'DeviceInstall.step_trust_2'],
	confirm: 'attest'
};

/**
 * The filter switch is in the device portal, not the app (MHomsany, 2026-09-09).
 *
 * @type {InstallStep}
 */
const FILTER_ON_STEP = {
	id: 'filter_on',
	titleKey: 'DeviceInstall.step_filter_on_title',
	bodyKey: 'DeviceInstall.step_filter_on_body',
	instructionKeys: [
		'DeviceInstall.step_filter_on_1',
		'DeviceInstall.step_filter_on_pin',
		'DeviceInstall.step_filter_on_2',
		'DeviceInstall.step_filter_on_3'
	],
	warnKeys: ['DeviceInstall.step_filter_on_2'],
	link: {
		url: DEVICE_PORTAL_URL,
		labelKey: 'DeviceInstall.device_portal_open',
		reach: 'anywhere'
	},
	noteKey: 'DeviceInstall.step_filter_on_note',
	confirm: 'auto',
	isDone: ({ status }) => status?.protection === true
};

/**
 * @typedef {'customer' | 'technician'} InstallAudience Who is reading. The
 *   technician portal's popup is read by the person the customer's copy tells to
 *   go and find: an MB Smart technician.
 */

/** Drop a line, or give the technician one of their own. */
const forTechnician = (/** @type {string[]} */ keys, /** @type {string[]} */ drop) =>
	keys.filter((key) => !drop.includes(key)).map((key) => TECHNICIAN_LINES[key] ?? key);

/**
 * Lines the technician reads differently. The customer's copy sends them to MB
 * Smart support, to the device portal and through an hour's warning; the
 * technician is that support, turns the filter on from the page behind the popup,
 * and knows how long it takes (the owner, 2026-10-06).
 */
const TECHNICIAN_LINES = /** @type {Record<string, string>} */ ({
	'DeviceInstall.step_supervise_body': 'DeviceInstall.step_supervise_body_tech',
	'DeviceInstall.step_supervise_1': 'DeviceInstall.step_supervise_1_tech',
	'DeviceInstall.step_supervise_2': 'DeviceInstall.step_supervise_2_tech',
	'DeviceInstall.step_filter_on_1': 'DeviceInstall.step_filter_on_1_tech'
});

/** What the technician does not need: the time, the device portal PIN. */
const TECHNICIAN_DROPS = [
	'DeviceInstall.step_prereq_child_3',
	PIN_LINE.key
];

/**
 * @param {InstallStep} step
 * @returns {InstallStep}
 */
function technicianStep(step) {
	const next = { ...step };
	if (step.instructionKeys) next.instructionKeys = forTechnician(step.instructionKeys, TECHNICIAN_DROPS);
	if (step.bodyKey) next.bodyKey = TECHNICIAN_LINES[step.bodyKey] ?? step.bodyKey;
	if (step.question) {
		const options = /** @type {Record<InstallAccountKind, InstallAccountOption>} */ ({});
		for (const [kind, option] of Object.entries(step.question.options)) {
			const { noteKey: _note, ...rest } = option;
			options[/** @type {InstallAccountKind} */ (kind)] = {
				...rest,
				instructionKeys: forTechnician(option.instructionKeys, TECHNICIAN_DROPS)
			};
		}
		next.question = { ...step.question, options };
	}
	// The supervise note only said "contact support", and the filter note was
	// about the device portal. The filter is turned on from the technician
	// portal, so the device portal button goes too.
	if (step.id === 'supervise' || step.id === 'filter_on') delete next.noteKey;
	else if (step.noteKey) next.noteKey = TECHNICIAN_LINES[step.noteKey] ?? step.noteKey;
	if (step.id === 'filter_on') delete next.link;
	return next;
}

/**
 * The lines that say "scan the QR code", for a portal that also or only draws a
 * button (`InstallHandover` in `links.js`). `auto` keeps the scanning lines:
 * the technician reads them on a computer.
 */
const HANDOVER_LINES = /** @type {Record<string, Record<string, string>>} */ ({
	both: {
		'DeviceInstall.step_link_1': 'DeviceInstall.step_link_1_both',
		'DeviceInstall.step_profile_1': 'DeviceInstall.step_profile_1_both',
		'DeviceInstall.link_troubleshoot': 'DeviceInstall.link_troubleshoot_both'
	},
	button: {
		'DeviceInstall.step_link_1': 'DeviceInstall.step_link_1_button',
		'DeviceInstall.step_profile_1': 'DeviceInstall.step_profile_1_button',
		'DeviceInstall.link_troubleshoot': 'DeviceInstall.link_troubleshoot_button'
	}
});

/**
 * @param {InstallStep} step
 * @param {Record<string, string>} lines
 * @returns {InstallStep}
 */
function withLines(step, lines) {
	const swap = (/** @type {string} */ key) => lines[key] ?? key;
	const next = { ...step };
	if (step.instructionKeys) next.instructionKeys = step.instructionKeys.map(swap);
	if (step.troubleshootKey) next.troubleshootKey = swap(step.troubleshootKey);
	return next;
}

/**
 * The last step where the filter is turned on from the walkthrough itself: the
 * device portal, which is where the customer's copy sends them. A button in
 * place of the way there, and no PIN, since this portal is already open.
 *
 * @param {InstallStep} step
 * @returns {InstallStep}
 */
function filterHereStep(step) {
	if (step.id !== 'filter_on') return step;
	const { link: _link, noteKey: _note, ...rest } = step;
	return {
		...rest,
		instructionKeys: (step.instructionKeys ?? [])
			.filter((key) => key !== PIN_LINE.key)
			.map((key) =>
				key === 'DeviceInstall.step_filter_on_1' ? 'DeviceInstall.step_filter_on_1_here' : key
			),
		filterSwitch: true
	};
}

/**
 * @typedef {object} InstallStepOptions
 * @property {import('./links.js').InstallHandover} [handover] How links reach
 *   the phone, which decides whether a line says to scan or to tap.
 * @property {boolean} [filterHere] The portal can turn the filter on itself.
 */

/**
 * The procedure for a device, or an empty list where there is none. An
 * unanswered question gets the shorter (child-shaped) list; answering adult
 * inserts supervision and the profile.
 *
 * @param {string | undefined | null} deviceType
 * @param {InstallAccountKind | null} [accountKind]
 * @param {InstallAudience} [audience]
 * @param {InstallStepOptions} [options]
 * @returns {InstallStep[]}
 */
export function installStepsFor(deviceType, accountKind, audience = 'customer', options = {}) {
	const lines = HANDOVER_LINES[options.handover ?? 'auto'];
	let steps = forAudience(deviceType, accountKind, audience);
	if (lines) steps = steps.map((step) => withLines(step, lines));
	if (options.filterHere) steps = steps.map(filterHereStep);
	return steps;
}

/**
 * @param {string | undefined | null} deviceType
 * @param {InstallAccountKind | null | undefined} accountKind
 * @param {InstallAudience} audience
 * @returns {InstallStep[]}
 */
function forAudience(deviceType, accountKind, audience) {
	if (!hasInstallSteps(deviceType)) return [];
	const head = [SETUP_KIND_STEP, PREREQUISITES_STEP];
	const middle = [INSTALL_APP_STEP, LINK_STEP, EXTENSION_STEP, APP_SETUP_STEP];
	const steps =
		accountKind === 'adult'
			? [...head, SUPERVISE_STEP, ...middle, PROFILE_STEP, TRUST_STEP, FILTER_ON_STEP]
			: [...head, ...middle, FILTER_ON_STEP];
	if (audience !== 'technician') return steps;
	return steps
		.filter((step) => !(accountKind === 'adult' && step.id === 'prerequisites'))
		.map(technicianStep);
}
