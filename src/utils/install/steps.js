/**
 * The iOS v2 install walkthrough, as data.
 *
 * Shared by the customer portal (`/customer/devices/device/{id}/install`) and the
 * technician portal (the "iOS v2 setup" popup on an iOS device), which is why it
 * lives here: MHomsany asked for "the exact same flow" in both, and two copies of
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
 *          extension, app_setup, profile, filter_on
 *
 * **How a step is confirmed.** `isDone` is the device's own proof and is
 * consulted on every step that has one; device proof outranks a person's word.
 * `confirm: 'auto'` only decides whether a "waiting for the device" line is drawn,
 * and `isReported` keeps that line away while core is not sending the field the
 * step waits on, so it can never spin for ever. Absent fields are "no news",
 * never "no". Every step can also be ticked by hand, because a signal that has
 * not arrived yet looks exactly like one that never will.
 *
 * **What proves what, today** (verified on `api-test.mbsmart.dev`, 2026-10-05):
 *
 *   - `link_device`: `status.last_sync` leaves the 1970 epoch on the app's first
 *     heartbeat after it redeems the code. Stamped once and held.
 *   - `profile`: `GET /device/{id}/apple/profile-install-status`, `installed`.
 *   - `filter_on`: `status.protection`, which is exactly the filter switch.
 *   - `install_app` and `app_setup` have predicates for fields core does not send
 *     to these tokens yet (`last_app_sync`, `managed_settings_active`,
 *     `family_controls_status`). They tick by themselves the day it does.
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
 *   `setup_kind` asks it; the steps that depend on the answer recall it with a
 *   "Change this" beside it.
 * @property {string} labelKey
 * @property {boolean} asks
 * @property {Record<InstallAccountKind, InstallAccountOption>} options
 *
 * @typedef {object} InstallStepEvidence What a step may read to prove itself.
 *   `null` while nothing has answered.
 * @property {Record<string, any> | null} [status] `GET /device/{id}/status`
 * @property {{ installed?: boolean, installed_at?: string, is_latest?: boolean } | null} [profile]
 *
 * @typedef {object} InstallStep
 * @property {string} id
 * @property {string} titleKey
 * @property {string} [bodyKey] Only where it changes what the reader does.
 * @property {string[]} [instructionKeys] Absent where they depend on the answer.
 * @property {string[]} [warnKeys] Lines drawn red: a trap or an erase.
 * @property {string} [noteKey] An aside to decide on, not a thing to do.
 * @property {string} [checkpointKey] What the app should now read.
 * @property {string} [troubleshootKey] A named symptom, under the action.
 * @property {InstallStepLink} [link]
 * @property {InstallQuestion} [question]
 * @property {InstallActionKind} [action] The credential the portal hands over.
 * @property {string} [confirmLabelKey] Instead of "I've done this".
 * @property {InstallConfirm} confirm
 * @property {string} [waitKey] Instead of the generic waiting line.
 * @property {string} [confirmedKey] Said, in green, once the device proves it.
 * @property {(evidence: InstallStepEvidence) => boolean} [isDone]
 * @property {(evidence: InstallStepEvidence) => boolean} [isReported]
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
	if (value === null || value === undefined || value === '') return false;
	if (typeof value === 'number') {
		const ms = value < 1e11 ? value * 1000 : value;
		return Number.isFinite(ms) && ms >= PLAUSIBLE_FLOOR_MS;
	}
	const text = String(value).trim().replace(' ', 'T');
	if (!text) return false;
	const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(text);
	const ms = Date.parse(hasZone || !text.includes('T') ? text : `${text}Z`);
	return !Number.isNaN(ms) && ms >= PLAUSIBLE_FLOOR_MS;
}

/**
 * Apple's Screen Time authorization, reduced to approved or not. The spelling is
 * a guess (the field is on no customer payload yet), so case and separators are
 * folded: matching too narrowly only costs someone a tick they make by hand.
 *
 * @param {string | undefined | null} value
 */
export function isFamilyControlsApproved(value) {
	if (!value) return false;
	return value.toLowerCase().replace(/[^a-z]/g, '') === 'approved';
}

/** The PIN line on the last step, and what a row with no PIN falls back to. */
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
	bodyKey: 'DeviceInstall.step_prereq_body',
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
					'DeviceInstall.step_prereq_adult_2',
					'DeviceInstall.step_prereq_adult_3'
				],
				noteKey: 'DeviceInstall.step_prereq_adult_note'
			}
		}
	},
	warnKeys: ['DeviceInstall.step_prereq_adult_2'],
	confirmLabelKey: 'DeviceInstall.step_prereq_confirm',
	confirm: 'attest'
};

/**
 * Adult only, and before anything is installed: supervising erases the device.
 * Done by MB Smart support with a Mac tool customers cannot get. Nothing reports
 * supervision, so it is the person's word.
 *
 * @type {InstallStep}
 */
const SUPERVISE_STEP = {
	id: 'supervise',
	titleKey: 'DeviceInstall.step_supervise_title',
	bodyKey: 'DeviceInstall.step_supervise_body',
	instructionKeys: [
		'DeviceInstall.step_supervise_1',
		'DeviceInstall.step_supervise_2',
		'DeviceInstall.step_supervise_3'
	],
	warnKeys: ['DeviceInstall.step_supervise_1'],
	noteKey: 'DeviceInstall.step_supervise_note',
	confirm: 'attest'
};

/** @type {InstallStep} */
const INSTALL_APP_STEP = {
	id: 'install_app',
	titleKey: 'DeviceInstall.step_install_app_title',
	instructionKeys: [
		'DeviceInstall.step_install_app_1',
		'DeviceInstall.step_install_app_2',
		'DeviceInstall.step_install_app_3'
	],
	link: {
		url: APP_STORE_URL,
		labelKey: 'DeviceInstall.app_store_open',
		reach: 'device',
		qrLabelKey: 'DeviceInstall.app_store_qr_label',
		qrCaptionKey: 'DeviceInstall.app_store_qr_caption'
	},
	confirm: 'auto',
	// The app's heartbeat, or a device that has already linked (which it cannot
	// do without the app).
	isDone: ({ status }) =>
		hasStamp(status?.last_app_sync) ||
		status?.managed_settings_active === true ||
		hasStamp(status?.last_sync),
	// Wait only once core sends one of the app's own fields at all.
	isReported: ({ status }) =>
		status?.last_app_sync !== undefined || status?.managed_settings_active !== undefined
};

/**
 * The first contact with the phone, on both paths.
 *
 * The QR carries an `mbsmart://redeem` code; the app redeems it, even before its
 * own onboarding (app team, 2026-10-05), and sends its first heartbeat, which
 * stamps `last_sync`. That stamp is not written at creation, so on a new device
 * it cannot mean anything but "linked". The step watches for it and says so.
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
	confirmLabelKey: 'DeviceInstall.confirm_seen',
	confirm: 'auto',
	waitKey: 'DeviceInstall.step_link_wait',
	confirmedKey: 'DeviceInstall.step_link_done',
	isDone: ({ status }) => hasStamp(status?.last_sync) || hasStamp(status?.last_app_sync)
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
	bodyKey: 'DeviceInstall.step_extension_body',
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
 * place a mismatched answer ever shows, so it stays even once the step can tick
 * itself.
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
					'DeviceInstall.step_app_setup_adult_2',
					'DeviceInstall.step_app_setup_adult_3'
				]
			}
		}
	},
	warnKeys: ['DeviceInstall.step_app_setup_child_2', 'DeviceInstall.step_app_setup_adult_2'],
	checkpointKey: 'DeviceInstall.step_app_setup_checkpoint',
	confirmLabelKey: 'DeviceInstall.confirm_seen',
	// `attest` with a real `isDone`: it ticks itself when Screen Time reads
	// approved, but no field reports the app's own fork, so it promises no wait.
	confirm: 'attest',
	isDone: ({ status }) => isFamilyControlsApproved(status?.family_controls_status)
};

/**
 * Adult only, and last. The configuration profile is what holds MB Smart on a
 * device with no parent to approve Screen Time.
 *
 * `profile` evidence is asked for only on the adult path; a child device never
 * installs one and would read `installed: false` for ever. `installed_at` is
 * required as well as `installed`, which costs nothing if core keeps to its
 * documented shape and protects the tick if an ack row ever exists without one.
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
	confirmLabelKey: 'DeviceInstall.confirm_seen',
	confirm: 'auto',
	isDone: ({ profile }) => profile?.installed === true && !!profile.installed_at,
	// The route is on `api-test` only; elsewhere it 404s and the answer is `null`.
	isReported: ({ profile }) => profile !== null && profile !== undefined
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
		'DeviceInstall.step_filter_on_2'
	],
	warnKeys: ['DeviceInstall.step_filter_on_2'],
	link: {
		url: DEVICE_PORTAL_URL,
		labelKey: 'DeviceInstall.device_portal_open',
		reach: 'anywhere'
	},
	noteKey: 'DeviceInstall.step_filter_on_note',
	checkpointKey: 'DeviceInstall.step_filter_on_checkpoint',
	confirmLabelKey: 'DeviceInstall.confirm_seen',
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
	'DeviceInstall.step_supervise_2': 'DeviceInstall.step_supervise_2_tech',
	'DeviceInstall.step_supervise_3': 'DeviceInstall.step_supervise_3_tech',
	'DeviceInstall.step_filter_on_1': 'DeviceInstall.step_filter_on_1_tech',
	'DeviceInstall.step_filter_on_note': 'DeviceInstall.step_filter_on_note_tech'
});

/** What the technician does not need: support, the time, the device portal PIN. */
const TECHNICIAN_DROPS = [
	'DeviceInstall.step_prereq_adult_1',
	'DeviceInstall.step_prereq_adult_3',
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
	// The supervise note only said "contact support"; the filter note keeps its
	// warning about Update Rules. The filter is turned on from the technician
	// portal, so the device portal button goes.
	if (step.id === 'supervise') delete next.noteKey;
	else if (step.noteKey) next.noteKey = TECHNICIAN_LINES[step.noteKey] ?? step.noteKey;
	if (step.id === 'filter_on') delete next.link;
	return next;
}

/**
 * The procedure for a device, or an empty list where there is none. An
 * unanswered question gets the shorter (child-shaped) list; answering adult
 * inserts supervision and the profile.
 *
 * @param {string | undefined | null} deviceType
 * @param {InstallAccountKind | null} [accountKind]
 * @param {InstallAudience} [audience]
 * @returns {InstallStep[]}
 */
export function installStepsFor(deviceType, accountKind, audience = 'customer') {
	if (!hasInstallSteps(deviceType)) return [];
	const head = [SETUP_KIND_STEP, PREREQUISITES_STEP];
	const middle = [INSTALL_APP_STEP, LINK_STEP, EXTENSION_STEP, APP_SETUP_STEP];
	const steps =
		accountKind === 'adult'
			? [...head, SUPERVISE_STEP, ...middle, PROFILE_STEP, FILTER_ON_STEP]
			: [...head, ...middle, FILTER_ON_STEP];
	return audience === 'technician' ? steps.map(technicianStep) : steps;
}
