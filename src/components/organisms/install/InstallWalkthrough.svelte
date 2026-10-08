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
	 * is done. On the adult path it also asks `api.getProfileStatus()` until the
	 * profile is in.
	 *
	 * **Two kinds of step.** A step the device proves (`confirm: 'auto'`) is done
	 * when its status says so, and has no button: it waits. Every other step is
	 * done when someone presses "I've done this", or when the device proves it
	 * after the fact (installing the app, once the device links). Those
	 * presses and the Adult or Child answer live in this component only, so they
	 * last as long as it is mounted; nothing is written to the browser.
	 *
	 * **The pager.** One step on screen, opened on the first unfinished one. No Next
	 * until the step on screen is done; Previous is always open. The end of the
	 * control row holds "I've done this" while a step the reader confirms is
	 * unfinished and Next once it is, so the press that confirms and the press that
	 * pages land under the same finger.
	 * A finished step shows a small mark between them: a button to take a tick back,
	 * or plain text when the device proved it (un-ticking would re-tick on the next
	 * poll). The summary is the last page. Turning a page moves focus onto it.
	 * The circles in the bar reach any step, finished or not.
	 *
	 * @typedef {object} InstallWalkthroughApi How this portal reaches core.
	 * @property {() => Promise<Record<string, any> | null>} getStatus
	 *   `GET /device/{id}/status`, or whatever the portal reads the same fields from.
	 * @property {() => Promise<{ installed?: boolean, installed_at?: string }>} getProfileStatus
	 *   `GET /device/{id}/apple/profile-install-status`.
	 * @property {(kind: 'enroll' | 'profile') => Promise<{ link?: string | null }>} getLink
	 *   See `InstallLinkAction`.
	 * @property {() => Promise<void>} [turnFilterOn] Only where the portal can turn
	 *   the filter on itself (the device portal). The last step then offers a
	 *   button for it instead of sending the reader to the device portal.
	 *
	 * @prop {string} deviceId
	 * @prop {string} deviceType
	 * @prop {string} [devicePin]
	 * @prop {Record<string, any> | null} [initialStatus] For the first paint.
	 * @prop {InstallWalkthroughApi} api
	 * @prop {string} doneLabel The summary's button, already translated.
	 * @prop {() => void} onDone
	 * @prop {1 | 2} [headingLevel] Of the progress phrase; step titles sit one below.
	 * @prop {boolean} [closeHint] Say on the summary that the tab can be closed.
	 * @prop {boolean} [showCopy] Offer "Copy link" under each QR code.
	 * @prop {'customer' | 'technician'} [audience] Who reads it. `technician`
	 *   drops the lines that send the reader to MB Smart support, the time it takes
	 *   and the device portal; see `installStepsFor`.
	 * @prop {import('../../../utils/install/links.js').InstallHandover} [handover]
	 *   `auto` (the technician), `both` (the customer portal) or `button` (the
	 *   device portal); see `links.js`.
	 */
	import { onMount, tick } from 'svelte';
	import { BadgeCheck, Check, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { t } from '../../../utils/i18n/i18n.js';
	import { language } from '../../../utils/i18n/languageStore.js';
	import { loadInstallTranslations } from '../../../utils/install/i18n.js';
	import { installStepsFor } from '../../../utils/install/steps.js';
	import { installProgressPhraseKey } from '../../../utils/install/progress.js';
	import CircleButton from '../../atoms/CircleButton.svelte';
	import ControlButton from '../../atoms/ControlButton.svelte';
	import Island from '../../molecules/Island.svelte';
	import Skeleton from '../../atoms/Skeleton.svelte';
	import InstallProgressBar from './InstallProgressBar.svelte';
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
		closeHint = false,
		showCopy = false,
		framed = true,
		audience = 'customer',
		handover = 'auto'
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

	let attested = $state(/** @type {string[]} */ ([]));
	/**
	 * Steps the device has proved since the walkthrough opened. A proof is a
	 * recent stamp, and stays a proof after the stamp ages out of the window.
	 */
	let proven = $state(/** @type {string[]} */ ([]));
	let accountKind = $state(/** @type {'child' | 'adult' | null} */ (null));
	// Another device starts from nothing.
	let answersFor = $state('');
	$effect(() => {
		if (answersFor !== deviceId) {
			attested = [];
			proven = [];
			accountKind = null;
			answersFor = deviceId;
		}
	});

	const stepOptions = $derived({ handover, filterHere: !!api.turnFilterOn });
	const steps = $derived(installStepsFor(deviceType, accountKind, audience, stepOptions));
	const evidence = $derived({ status, profile, now: readAt });

	$effect(() => {
		const fresh = steps.filter((step) => step.isDone?.(evidence) && !proven.includes(step.id));
		if (fresh.length) proven = [...proven, ...fresh.map((step) => step.id)];
	});

	/** @param {import('../../../utils/install/steps.js').InstallStep} step */
	const isProven = (step) => proven.includes(step.id) || (step.isDone?.(evidence) ?? false);

	/** @param {import('../../../utils/install/steps.js').InstallStep} step */
	const isStepDone = (step) =>
		step.confirm === 'auto' ? isProven(step) : isProven(step) || attested.includes(step.id);

	const stepStates = $derived(
		steps.map((step) => ({ confirmedByDevice: isProven(step), done: isStepDone(step) }))
	);
	const firstUnfinished = $derived(stepStates.findIndex((state) => !state.done));
	const allDone = $derived(steps.length > 0 && firstUnfinished === -1);
	const completedCount = $derived(firstUnfinished === -1 ? steps.length : firstUnfinished);

	const summaryIndex = $derived(steps.length);
	let viewIndex = $state(-1);
	let openedFor = $state('');
	$effect(() => {
		if (steps.length > 0 && openedFor !== deviceId) {
			viewIndex = firstUnfinished === -1 ? summaryIndex : firstUnfinished;
			openedFor = deviceId;
		}
	});

	const currentIndex = $derived(Math.min(Math.max(viewIndex, 0), summaryIndex));
	const onSummary = $derived(steps.length > 0 && currentIndex === summaryIndex);
	const currentStep = $derived(steps[currentIndex]);
	const currentState = $derived(stepStates[currentIndex]);

	/** Is the step on screen waiting on the device right now? Then ask often. */
	const waitingOnDevice = $derived(
		!!currentStep && !currentState?.done && currentStep.confirm === 'auto'
	);

	const wantsProfile = $derived(accountKind === 'adult' && !proven.includes('profile'));

	let refreshing = false;
	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		try {
			const next = await api.getStatus().catch(() => null);
			if (next) status = next;
			if (wantsProfile) profile = (await api.getProfileStatus().catch(() => null)) ?? profile;
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

	// Choosing adult asks for the profile straight away rather than on the next tick.
	$effect(() => {
		if (wantsProfile && profile === null) refresh();
	});

	let actionPending = $state(false);
	const awaitingAnswer = $derived(!!currentStep?.question && !accountKind);
	const canConfirm = $derived(!awaitingAnswer && !actionPending);

	let pageEl = $state(/** @type {HTMLElement | null} */ (null));

	/** Only a gesture moves focus; arriving on the page does not. */
	async function focusPage() {
		await tick();
		pageEl?.focus();
	}

	/** @param {number} index */
	function goTo(index) {
		viewIndex = Math.min(Math.max(index, 0), summaryIndex);
		focusPage();
	}

	/**
	 * Finishing a step lands on the next unfinished one, which can be several
	 * along when the device already proved the steps in between. Forward first,
	 * then the earliest gap, then the summary.
	 *
	 * @param {string} stepId
	 */
	function handleAttest(stepId) {
		if (!attested.includes(stepId)) attested = [...attested, stepId];
		const states = steps.map((step) => ({ done: isStepDone(step) }));
		const ahead = states.findIndex((state, index) => index >= currentIndex && !state.done);
		const gap = states.findIndex((state) => !state.done);
		goTo(ahead !== -1 ? ahead : gap !== -1 ? gap : summaryIndex);
	}

	/** @param {string} stepId */
	function handleUndo(stepId) {
		attested = attested.filter((id) => id !== stepId);
		focusPage();
	}

	/**
	 * The answer adds or removes steps ahead of the reader, so the page they are
	 * reading is found again by id rather than left at a shifted index.
	 *
	 * @param {'child' | 'adult'} kind
	 */
	function handleChooseAccount(kind) {
		if (kind === accountKind) return;
		const readingId = onSummary ? null : currentStep?.id;
		accountKind = kind;
		if (!readingId) return;
		const next = installStepsFor(deviceType, kind, audience, stepOptions).findIndex((step) => step.id === readingId);
		if (next !== -1) viewIndex = next;
	}

	const phrase = $derived($t(installProgressPhraseKey(completedCount, steps.length)));
	const barLabel = $derived(
		onSummary
			? $t('DeviceInstall.bar_label_summary', { total: steps.length })
			: $t('DeviceInstall.bar_label', {
					percent: Math.round((completedCount / steps.length) * 100),
					current: currentIndex + 1,
					total: steps.length
				})
	);

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
		<div class="space-y-4">
			<InstallProgressBar
				titles={steps.map((step) => $t(step.titleKey))}
				done={stepStates.map((state) => state.done)}
				{currentIndex}
				completed={completedCount}
				{phrase}
				label={barLabel}
				stepsLabel={$t('DeviceInstall.steps_label')}
				onselect={goTo}
				{headingLevel}
			/>

			{#snippet frame(/** @type {import('svelte').Snippet} */ content)}
				{#if framed}
					<Island collapsible={false}>{@render content()}</Island>
				{:else}
					<div class="border-y border-neutral-100 py-4 dark:border-zinc-750">
						{@render content()}
					</div>
				{/if}
			{/snippet}

			{#snippet page()}
				<div bind:this={pageEl} tabindex="-1" class="focus:outline-none">
					{#if onSummary}
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
										protectedNow
											? 'DeviceInstall.all_done_body'
											: 'DeviceInstall.all_done_unconfirmed'
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
					{:else}
						{#key currentStep.id}
							<InstallStepPanel
								step={currentStep}
								done={currentState.done}
								{deviceId}
								{devicePin}
								{accountKind}
								onChooseAccount={handleChooseAccount}
								onActionPending={(/** @type {boolean} */ pending) => (actionPending = pending)}
								getLink={api.getLink}
								{showCopy}
								{handover}
								turnFilterOn={api.turnFilterOn ? turnFilterOn : undefined}
								headingLevel={headingLevel + 1}
							/>
						{/key}
					{/if}
				</div>
			{/snippet}

			{@render frame(page)}

			<!-- Back, the done mark, and the one control that moves on. -->
			<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
				<div class="justify-self-start">
					{#if currentIndex > 0}
						<CircleButton
							icon={ChevronLeft}
							iconClassName="rtl:-scale-x-100"
							label={$t('DeviceInstall.back')}
							onclick={() => goTo(currentIndex - 1)}
						/>
					{/if}
				</div>

				<div class="min-w-0 justify-self-center">
					{#if !onSummary && currentState?.done}
						{#if currentState.confirmedByDevice}
							<p
								class="inline-flex items-center gap-1.5 text-center text-sm font-medium text-green-alt-600 dark:text-green-alt-300"
							>
								<Check size={16} strokeWidth={2} class="shrink-0" aria-hidden="true" />
								<span>{$t(currentStep.confirmedKey ?? 'DeviceInstall.detected')}</span>
							</p>
						{:else}
							<button
								type="button"
								class="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-center text-sm font-medium text-green-alt-600 hover:bg-green-alt-50 dark:text-green-alt-300 dark:hover:bg-green-alt-950/40"
								title={$t('DeviceInstall.undo')}
								aria-pressed="true"
								onclick={() => handleUndo(currentStep.id)}
							>
								<Check size={16} strokeWidth={2} class="shrink-0" aria-hidden="true" />
								<span>{$t('DeviceInstall.marked_done')}</span>
							</button>
						{/if}
					{/if}
				</div>

				<div class="justify-self-end">
					{#if onSummary}
						<!-- Nothing left to confirm and nowhere further to page. -->
					{:else if currentState.done}
						<CircleButton
							icon={ChevronRight}
							iconClassName="rtl:-scale-x-100"
							label={currentIndex === summaryIndex - 1
								? $t('DeviceInstall.finish_up')
								: $t('DeviceInstall.next')}
							className="flex-row-reverse"
							onclick={() => goTo(currentIndex + 1)}
						/>
					{:else if canConfirm && currentStep.confirm === 'attest'}
						<CircleButton
							color="azure"
							label={$t(currentStep.confirmLabelKey ?? 'DeviceInstall.mark_done')}
							onclick={() => handleAttest(currentStep.id)}
						/>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
