<script>
	/**
	 * The iOS v2 install walkthrough, one step at a time.
	 *
	 * **One component, three portals.** The customer portal renders it as the
	 * `/install` page; the technician portal renders it in the "iOS v2 setup" popup
	 * on an iOS device; the device portal renders it as its `/install` page, on the
	 * phone being set up. MHomsany asked for "the exact same flow" in all of them,
	 * so the steps, the copy and the behaviour live here and each portal passes in
	 * only what genuinely differs: how it reaches the API (`api`), what the done
	 * button says and does, where the walkthrough sits in its page's headings, and
	 * how a link reaches the phone (`handover`).
	 *
	 * **It watches the device itself.** It asks `api.getStatus()` on arrival and
	 * then on a clock while anything is unfinished: every 5 seconds while the step
	 * on screen is waiting on the device (the link step, the profile, the filter),
	 * every 15 otherwise, never behind a hidden tab, and not at all once every step
	 * is done. It also asks `api.getProfileStatus()` until the profile is in.
	 *
	 * **Two kinds of step.** A step the device proves (`confirm: 'auto'`) is done
	 * when its status says so, and has no button: it waits. Every other step is
	 * done when someone presses "I've done this", or when the device proves it
	 * after the fact (installing the app, once the device links). Those
	 * presses, the Screen Time choice and the Adult or Child answer live in this
	 * component only, so they last as long as it is mounted; nothing is written
	 * to the browser.
	 *
	 * **Screen Time is opt-in.** The link step has a box for it, off by default;
	 * ticking it adds the Screen Time step after the Safari extensions, which is where the
	 * Adult or Child question is asked.
	 *
	 * **The pager** is `Wizard`, shared with any other setup flow: one step on
	 * screen, opened on the first unfinished one, no Next until it is done, a
	 * small mark on a finished step (a button to take a tick back, or plain text
	 * when the device proved it: un-ticking would re-tick on the next poll), and
	 * the summary as the last page. This file is what is particular to iOS: the
	 * steps, the copy, watching the device and the step panels.
	 *
	 * @typedef {object} InstallWalkthroughApi How this portal reaches core.
	 * @property {() => Promise<Record<string, any> | null>} getStatus
	 *   `GET /device/{id}/status`, or whatever the portal reads the same fields from.
	 * @property {() => Promise<{ installed?: boolean, installed_at?: string }>} getProfileStatus
	 *   `GET /device/{id}/apple/profile-install-status`.
	 * @property {(kind: 'enroll' | 'profile') => Promise<{ link?: string | null }>} getLink
	 *   See `InstallLinkAction`.
	 * @property {() => Promise<void>} [turnFilterOn] Only where the portal can turn
	 *   the filter on itself (the device portal, the technician portal). The last
	 *   step then offers a button for it instead of sending the reader elsewhere.
	 * @property {() => Promise<void>} [enableConfigMode] Turns v2 config mode on;
	 *   called when a `configModeOnConfirm` step is confirmed.
	 *
	 * @prop {string} deviceId
	 * @prop {string} deviceType
	 * @prop {string} [devicePin]
	 * @prop {Record<string, any> | null} [initialStatus] For the first paint.
	 * @prop {InstallWalkthroughApi} api
	 * @prop {string} doneLabel The summary's button, already translated.
	 * @prop {() => void} onDone
	 * @prop {1 | 2} [headingLevel] Of the progress phrase; step titles sit one below.
	 * @prop {boolean} [showPhrase] The progress phrase over the bar; off in the technician popup.
	 * @prop {boolean} [closeHint] Say on the summary that the tab can be closed.
	 * @prop {boolean} [showCopy] Offer "Copy link" under each QR code.
	 * @prop {'customer' | 'technician'} [audience] Who reads it. `technician`
	 *   drops the lines that send the reader to MB Smart support, the time it takes
	 *   and the device portal; see `installStepsFor`.
	 * @prop {import('../../../utils/install/links.js').InstallHandover} [handover]
	 *   `auto` (the technician), `both` (the customer portal) or `button` (the
	 *   device portal); see `links.js`.
	 * @prop {boolean} [supervised] The device is already supervised (the device
	 *   portal): no supervise line, and no prerequisites.
	 * @prop {boolean} [mdm] `ios_settings_mdm_config_mode_all_restrictions` is on: the MDM path.
	 */
	import { onMount } from 'svelte';
	import { BadgeCheck } from '@lucide/svelte';
	import { t } from '../../../utils/i18n/i18n.js';
	import { language } from '../../../utils/i18n/languageStore.js';
	import { loadInstallTranslations } from '../../../utils/install/i18n.js';
	import { installStepsFor } from '../../../utils/install/steps.js';
	import { installProgressPhraseKey } from '../../../utils/install/progress.js';
	import ControlButton from '../../atoms/ControlButton.svelte';
	import Skeleton from '../../atoms/Skeleton.svelte';
	import Wizard from '../wizard/Wizard.svelte';
	import InstallStepPanel from './InstallStepPanel.svelte';

	let {
		deviceId,
		deviceType,
		devicePin = '',
		initialStatus = null,
		api,
		doneLabel,
		onDone,
		headingLevel = 1,
		showPhrase = true,
		closeHint = false,
		showCopy = false,
		framed = true,
		audience = 'customer',
		handover = 'auto',
		supervised = false,
		mdm = false
	} = $props();

	const FAST_POLL_MS = 5_000;
	const SLOW_POLL_MS = 15_000;

	// The copy arrives in its own chunk; nothing is drawn until it has, rather
	// than a frame of raw keys.
	let ready = $state(false);
	$effect(() => {
		const lang = $language;
		loadInstallTranslations(lang).then(() => (ready = true));
	});

	// svelte-ignore state_referenced_locally
	let status = $state(initialStatus);
	/** `null` until asked. */
	let profile = $state(/** @type {any} */ (null));
	/** When the evidence was last read: a stamp proves a step only while recent. */
	let readAt = $state(Date.now());
	/** The first status and profile read, which the MDM path's stamps must differ from. */
	let before = $state(/** @type {{ status?: any, profile?: any }} */ ({}));

	let attested = $state(/** @type {string[]} */ ([]));
	/**
	 * Steps the device has proved since the walkthrough opened. A proof is a
	 * recent stamp, and stays a proof after the stamp ages out of the window.
	 */
	let proven = $state(/** @type {string[]} */ ([]));
	let accountKind = $state(/** @type {'child' | 'adult' | null} */ (null));
	let screenTime = $state(false);
	// Another device starts from nothing.
	let answersFor = $state('');
	$effect(() => {
		if (answersFor !== deviceId) {
			attested = [];
			proven = [];
			accountKind = null;
			screenTime = false;
			before = {};
			answersFor = deviceId;
		}
	});

	const stepOptions = $derived({
		handover,
		filterHere: !!api.turnFilterOn,
		supervised,
		screenTime,
		mdm
	});
	const steps = $derived(installStepsFor(deviceType, audience, stepOptions));
	const evidence = $derived({ status, profile, before, now: readAt });

	$effect(() => {
		const fresh = steps.filter((step) => step.isDone?.(evidence) && !proven.includes(step.id));
		if (fresh.length) proven = [...proven, ...fresh.map((step) => step.id)];
	});

	/** @param {import('../../../utils/install/steps.js').InstallStep} step */
	const isProven = (step) => proven.includes(step.id) || (step.isDone?.(evidence) ?? false);

	/** @param {import('../../../utils/install/steps.js').InstallStep} step */
	const isStepDone = (step) =>
		step.confirm === 'auto' ? isProven(step) : isProven(step) || attested.includes(step.id);

	/** The steps as the pager sees them. */
	const wizardSteps = $derived(
		steps.map((step) => ({
			id: step.id,
			title: $t(step.titleKey),
			done: isStepDone(step),
			confirmedByDevice: isProven(step),
			attest: step.confirm === 'attest',
			confirmLabel: step.confirmLabelKey ? $t(step.confirmLabelKey) : undefined,
			confirmedLabel: step.confirmedKey ? $t(step.confirmedKey) : undefined
		}))
	);
	const allDone = $derived(steps.length > 0 && wizardSteps.every((step) => step.done));

	/** The page on screen, kept by the pager. */
	let viewIndex = $state(-1);
	const currentStep = $derived(steps[Math.max(viewIndex, 0)]);
	const currentDone = $derived(!!wizardSteps[Math.max(viewIndex, 0)]?.done);

	/** Is the step on screen waiting on the device right now? Then ask often. */
	const waitingOnDevice = $derived(
		!!currentStep && !currentDone && currentStep.confirm === 'auto'
	);

	const wantsProfile = $derived(
		steps.some((step) => step.id === 'profile') && !proven.includes('profile')
	);

	let refreshing = false;
	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		try {
			const next = await api.getStatus().catch(() => null);
			if (next) status = next;
			if (next && !('status' in before)) before = { ...before, status: next };
			if (wantsProfile) {
				const read = await api.getProfileStatus().catch(() => null);
				if (read) profile = read;
				if (read && !('profile' in before)) before = { ...before, profile: read };
			}
			readAt = Date.now();
		} finally {
			refreshing = false;
		}
	}

	onMount(() => {
		refresh();
		const onVisible = () => {
			if (document.visibilityState === 'visible' && !allDone) refresh();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	});

	$effect(() => {
		if (allDone) return;
		const id = setInterval(
			() => {
				if (document.visibilityState !== 'hidden') refresh();
			},
			waitingOnDevice ? FAST_POLL_MS : SLOW_POLL_MS
		);
		return () => clearInterval(id);
	});

	let actionPending = $state(false);
	const awaitingAnswer = $derived(!!currentStep?.question && !accountKind);
	const canConfirm = $derived(!awaitingAnswer && !actionPending);

	const labels = $derived({
		back: $t('DeviceInstall.back'),
		next: $t('DeviceInstall.next'),
		finish: $t('DeviceInstall.finish_up'),
		markDone: $t('DeviceInstall.mark_done'),
		markedDone: $t('DeviceInstall.marked_done'),
		undo: $t('DeviceInstall.undo'),
		detected: $t('DeviceInstall.detected'),
		steps: $t('DeviceInstall.steps_label'),
		bar: (/** @type {import('../wizard/Wizard.svelte').WizardProgress} */ p) =>
			p.onSummary
				? $t('DeviceInstall.bar_label_summary', { total: p.total })
				: $t('DeviceInstall.bar_label', {
						percent: Math.round((p.completed / p.total) * 100),
						current: p.current + 1,
						total: p.total
					})
	});

	/** @param {import('../wizard/Wizard.svelte').WizardProgress} p */
	const phrase = (p) => $t(installProgressPhraseKey(p.completed, p.total));

	/** Turns the filter on, then looks at once, so the step ticks without waiting. */
	async function turnFilterOn() {
		await api.turnFilterOn?.();
		await refresh();
	}

	/** Say "protecting" only when the device says the filter is on. */
	const protectedNow = $derived(status?.protection === true);
</script>

<div class="w-full">
	{#if !ready || steps.length === 0}
		<Skeleton rows={['h-8', 'h-6', 'h-24']} />
	{:else}
		<Wizard
			steps={wizardSteps}
			{labels}
			phrase={showPhrase ? phrase : undefined}
			startKey={deviceId}
			bind:index={viewIndex}
			{canConfirm}
			onattest={(id) => {
				// A failure resurfaces on the profile link, which turns it on again first
				if (steps.find((step) => step.id === id)?.configModeOnConfirm)
					api.enableConfigMode?.().catch(() => {});
				if (!attested.includes(id)) attested = [...attested, id];
			}}
			onundo={(id) => (attested = attested.filter((other) => other !== id))}
			{headingLevel}
			{framed}
		>
			{#snippet step(_, index)}
				<InstallStepPanel
					step={steps[index]}
					done={wizardSteps[index].done}
					{deviceId}
					{devicePin}
					{accountKind}
					onChooseAccount={(/** @type {'child' | 'adult'} */ kind) => (accountKind = kind)}
					{screenTime}
					onScreenTime={(/** @type {boolean} */ on) => (screenTime = on)}
					onActionPending={(/** @type {boolean} */ pending) => (actionPending = pending)}
					getLink={api.getLink}
					{showCopy}
					{handover}
					turnFilterOn={api.turnFilterOn ? turnFilterOn : undefined}
					headingLevel={headingLevel + 1}
				/>
			{/snippet}

			{#snippet summary()}
				<div class="space-y-5 py-4 text-center">
					<BadgeCheck
						size={76}
						strokeWidth={1.5}
						class="mx-auto text-green-alt-600 dark:text-green-alt-300"
						aria-hidden="true"
					/>
					<div class="space-y-2">
						<p class="text-sm text-gray-600 dark:text-gray-300">
							{$t(
								protectedNow ? 'DeviceInstall.all_done_body' : 'DeviceInstall.all_done_unconfirmed'
							)}
						</p>
						{#if closeHint}
							<p class="text-base font-semibold text-green-alt-700 dark:text-green-alt-300">
								{$t('DeviceInstall.all_done_close')}
							</p>
						{/if}
					</div>
					<ControlButton color="azure" onclick={onDone}>{doneLabel}</ControlButton>
				</div>
			{/snippet}
		</Wizard>
	{/if}
</div>
