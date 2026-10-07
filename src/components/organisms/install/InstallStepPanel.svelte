<script>
	/**
	 * The one step on screen: its title, the question where it has one, the
	 * numbered instructions, a fixed link, a note, the credential QR, the
	 * troubleshooting line, the checkpoint, and the line saying the page is
	 * waiting for the device. Previous, Next, "I've done this" and the device's
	 * own confirmation are the walkthrough's control row, not this panel's.
	 *
	 * **Only `setup_kind` asks the child or adult question.** Steps that depend on
	 * the answer just show its lines (the owner, 2026-10-07: no "You said this
	 * device is on…"); the answer is changed on the first step, which the bar's
	 * first circle reaches. "I don't know, show me" is a third button that records
	 * nothing and opens `AccountKindHelp`, beside the walkthrough, not inside it.
	 *
	 * Every line is drawn through `RichText`, so the labels the reader has to find
	 * on a phone screen are bold.
	 *
	 * **A finished link or profile step can be done again.** Its QR is not drawn
	 * (a finished step never spends a credential by itself), but a "Link it again" or
	 * "Download the profile again" button brings it back (MHomsany, 2026-10-06:
	 * an already-linked device has to be relinkable).
	 *
	 * @prop {import('../../../utils/install/steps.js').InstallStep} step
	 * @prop {boolean} done
	 * @prop {import('../../../utils/install/steps.js').InstallStepEvidence} evidence
	 * @prop {string} deviceId
	 * @prop {string} [devicePin]
	 * @prop {'child' | 'adult' | null} accountKind
	 * @prop {(kind: 'child' | 'adult') => void} onChooseAccount
	 * @prop {(pending: boolean) => void} onActionPending
	 * @prop {(kind: 'enroll' | 'profile') => Promise<{ link?: string | null, expiresAt?: number }>} getLink
	 * @prop {boolean} [showCopy]
	 * @prop {2 | 3 | 4} [headingLevel]
	 */
	import { CircleHelp, Loader, QrCode } from '@lucide/svelte';
	import { t } from '../../../utils/i18n/i18n.js';
	import { MODE_LABELS, PIN_LINE } from '../../../utils/install/steps.js';
	import Callout from '../../atoms/Callout.svelte';
	import ControlButton from '../../atoms/ControlButton.svelte';
	import RichText from '../../atoms/RichText.svelte';
	import AccountKindHelp from './AccountKindHelp.svelte';
	import InstallLinkAction from './InstallLinkAction.svelte';
	import InstallStepLink from './InstallStepLink.svelte';

	let {
		step,
		done,
		evidence,
		deviceId,
		devicePin = '',
		accountKind,
		onChooseAccount,
		onActionPending,
		getLink,
		showCopy = false,
		headingLevel = 2
	} = $props();

	/** Adult leads: it is the ordinary case, not the better one. */
	const ACCOUNT_ORDER = /** @type {const} */ (['adult', 'child']);

	/** One figure at two heights: the only thing an icon can say about an account. */
	const ACCOUNT_ICON_HEIGHT = { adult: 'h-11', child: 'h-8' };
	const ACCOUNT_ICON_ROW = 'flex h-12 items-center justify-center text-gray-700 dark:text-gray-300';

	const questionId = $props.id();

	const AGAIN_KEYS = {
		enroll: 'DeviceInstall.enroll_again',
		profile: 'DeviceInstall.profile_again'
	};

	let helpOpen = $state(false);
	/** The reader asked for a finished step's QR again, to relink or reinstall. */
	let again = $state(false);
	const asking = $derived(!!step.question && (step.question.asks || !accountKind));
	const labelIsHeading = $derived(step.question?.labelKey === step.titleKey);
	const chosen = $derived(accountKind ? step.question?.options[accountKind] : undefined);
	const instructionKeys = $derived(step.instructionKeys ?? chosen?.instructionKeys ?? []);
	const noteKey = $derived(chosen?.noteKey ?? step.noteKey);
	const checkpointKey = $derived(chosen?.checkpointKey ?? step.checkpointKey);
	const actionKind = $derived(step.action);

	/** Handed to every line; interpolation only fills the tokens a string carries. */
	const values = $derived({
		pin: devicePin,
		mode: accountKind ? $t(MODE_LABELS[accountKind]) : ''
	});

	/** @param {string} key */
	const lineKey = (key) => (key === PIN_LINE.key && !devicePin ? PIN_LINE.without : key);

	const showCheckpoint = $derived(!!checkpointKey && !done && (!step.question || !!accountKind));

	/** Wait only where the device can prove the step and core is sending the field. */
	const showWait = $derived(
		!done && step.confirm === 'auto' && (step.isReported?.(evidence) ?? true)
	);

	const titleTag = $derived(`h${headingLevel}`);

	/** @param {'child' | 'adult'} kind */
	function chooseAccount(kind) {
		onChooseAccount(kind);
	}

	/** @param {string} key */
	const isWarn = (key) => step.warnKeys?.includes(key);
</script>

{#snippet person(/** @type {string} */ height)}
	<svg
		viewBox="0 0 296 682"
		fill="currentColor"
		fill-rule="evenodd"
		clip-rule="evenodd"
		class="{height} w-auto"
		aria-hidden="true"
	>
		<path d="M138.428,169.024c16.885,-0.72 33.801,0.111 50.534,2.482c30.873,4.11 62.642,15.902 81.94,41.714c31.918,42.964 23.186,99.714 23.152,149.729c-0.015,17.004 0.992,35.045 0.064,51.913c-0.826,14.969 -18.125,26.33 -32.771,23.726c-23.96,-4.261 -19.928,-28.931 -20.097,-47.022l-0.621,-69.19c-0.116,-7.226 -0.211,-14.427 -0.143,-21.654c0.031,-3.331 0.055,-6.776 -1.854,-9.608c-3.026,-4.49 -11.879,-4.469 -15.734,-1.521c-1.846,1.417 -3.065,3.499 -3.396,5.803c-0.604,4.192 -0.239,18.464 -0.242,23.587l-0.035,49.718l-0.101,199.572l-0.054,57.933c0.003,9.342 0.796,21.05 -0.36,30.044c-0.96,7.473 -4.711,14.599 -10.723,19.223c-6.504,5.001 -15.409,6.458 -23.417,5.371c-10.173,-1.381 -19.603,-8.228 -23.392,-17.913c-3.47,-8.87 -2.689,-38.333 -2.86,-49.237c-0.65,-39.348 -0.991,-78.697 -1.024,-118.049l0.092,-37.688c0.041,-7.451 0.266,-15.166 -0.187,-22.575c-0.24,-3.922 -0.954,-6.126 -3.329,-9.278c-2.188,-1.74 -3.389,-2.382 -6.219,-2.344c-9.801,0.14 -9.575,12.561 -9.514,19.578c0.037,4.337 0.102,8.485 0.155,12.727c0.131,11.195 0.198,22.394 0.2,33.592c0.091,40.983 -0.127,81.965 -0.654,122.944l-0.345,25.787c-0.102,6.481 0.252,15.222 -1.328,21.325c-7.752,29.942 -54.939,28.701 -58.51,-3.065c-1.185,-10.542 -0.577,-23.118 -0.598,-33.736l-0.114,-65.165l-0.667,-167.988l-0.233,-65.325c-0.062,-9.494 0.519,-20.916 -0.558,-30.112c-0.959,-8.178 -19.71,-10.069 -20.409,1.545c-0.434,7.216 -0.266,14.381 -0.301,21.569l-0.567,70.492c-0.082,9.742 -0.026,19.635 -0.328,29.38c-0.128,1.313 -0.214,2.744 -0.518,4.027c-4.931,20.759 -30.449,22.56 -43.739,9.9c-4.158,-3.899 -6.95,-9.036 -7.963,-14.649c-0.773,-4.118 -0.572,-13.422 -0.548,-17.913l0.172,-27.923c-0.068,-18.94 -0.444,-37.88 -1.129,-56.806c-3.039,-100.016 39.205,-142.014 138.275,-144.925Z" />
		<path d="M142.422,0.149c36.942,-2.448 68.845,25.585 71.179,62.544c2.334,36.959 -25.789,68.784 -62.745,71.006c-36.796,2.212 -68.446,-25.771 -70.77,-62.57c-2.324,-36.799 25.554,-68.543 62.336,-70.98Z" />
	</svg>
{/snippet}

<div class="space-y-4">
	<svelte:element
		this={titleTag}
		class="text-lg font-semibold text-gray-700 sm:text-xl dark:text-gray-200"
	>
		{$t(step.titleKey)}
	</svelte:element>

	{#if step.bodyKey}
		<p class="text-sm text-gray-600 dark:text-gray-300">
			<RichText text={$t(step.bodyKey, values)} />
		</p>
	{/if}

	{#if step.question}
		{@const question = step.question}
		<div class="space-y-2">
			{#if asking}
				<p
					class={labelIsHeading
						? 'sr-only'
						: 'text-base font-medium text-gray-700 dark:text-gray-200'}
					id={questionId}
				>
					{$t(question.labelKey)}
				</p>
				<div class="grid gap-2 sm:grid-cols-3" role="group" aria-labelledby={questionId}>
					{#each ACCOUNT_ORDER as key (key)}
						<button
							type="button"
							aria-pressed={accountKind === key}
							onclick={() => chooseAccount(key)}
							class="cursor-pointer rounded-2xl border p-3 text-center transition-colors g2 {accountKind ===
							key
								? 'border-azure-600 bg-azure-50 dark:border-azure-500 dark:bg-azure-950/40'
								: 'border-gray-200 hover:border-azure-500 dark:border-gray-700 dark:hover:border-azure-400'}"
						>
							<span class={ACCOUNT_ICON_ROW}>{@render person(ACCOUNT_ICON_HEIGHT[key])}</span>
							<span class="mt-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
								{$t(question.options[key].labelKey)}
							</span>
						</button>
					{/each}
					<!-- Not an answer: it records nothing. -->
					<button
						type="button"
						aria-haspopup="dialog"
						onclick={() => (helpOpen = true)}
						class="cursor-pointer rounded-2xl border border-dashed border-gray-300 p-3 text-center transition-colors g2 hover:border-azure-500 dark:border-gray-600 dark:hover:border-azure-400"
					>
						<span class={ACCOUNT_ICON_ROW}>
							<CircleHelp size={28} class="shrink-0" aria-hidden="true" />
						</span>
						<span class="mt-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
							{$t('DeviceInstall.account_unknown_label')}
						</span>
					</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if instructionKeys.length > 1}
		<ol
			class="list-inside list-decimal space-y-2 text-base font-normal text-gray-700 dark:text-gray-200"
		>
			{#each instructionKeys as key (key)}
				<li class={isWarn(key) ? 'font-bold text-red-alt-600 dark:text-red-alt-400' : ''}>
					<RichText text={$t(lineKey(key), values)} />
				</li>
			{/each}
		</ol>
	{:else if instructionKeys.length === 1}
		<p
			class="text-base {isWarn(instructionKeys[0])
				? 'font-bold text-red-alt-600 dark:text-red-alt-400'
				: 'font-medium text-gray-700 dark:text-gray-200'}"
		>
			<RichText text={$t(lineKey(instructionKeys[0]), values)} />
		</p>
	{/if}

	{#if step.link}
		<InstallStepLink link={step.link} {deviceId} />
	{/if}

	{#if noteKey}
		<Callout color="azure">
			<p><RichText text={$t(noteKey, values)} /></p>
		</Callout>
	{/if}

	{#if actionKind && (!done || again)}
		{#key actionKind}
			<InstallLinkAction
				{deviceId}
				kind={actionKind}
				{getLink}
				{showCopy}
				onPending={onActionPending}
			/>
		{/key}
	{:else if actionKind}
		<!-- A finished step can still be redone: a phone reset or reinstalled since,
		     or a profile removed. The QR is only fetched when asked for. -->
		<ControlButton color="azure" onclick={() => (again = true)}>
			<QrCode size={16} aria-hidden="true" />
			{$t(AGAIN_KEYS[actionKind])}
		</ControlButton>
	{/if}

	{#if step.troubleshootKey && !done}
		<div
			class="rounded-2xl bg-gray-50 p-3 text-sm text-gray-600 g2 dark:bg-zinc-800 dark:text-gray-300"
		>
			<p><RichText text={$t(step.troubleshootKey, values)} /></p>
		</div>
	{/if}

	{#if showCheckpoint && checkpointKey}
		<Callout color="green">
			<p><RichText text={$t(checkpointKey, values)} /></p>
		</Callout>
	{/if}

	{#if showWait}
		<!-- Polite, so the line is announced when it appears. -->
		<p
			class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
			aria-live="polite"
		>
			<Loader size={16} class="shrink-0 animate-spin" aria-hidden="true" />
			<span>{$t(step.waitKey ?? 'DeviceInstall.waiting')}</span>
		</p>
	{/if}
</div>

<AccountKindHelp isOpen={helpOpen} onClose={() => (helpOpen = false)} />
