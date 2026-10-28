<script>
	/**
	 * A setup flow, one step at a time: the pager the iOS walkthrough is built on,
	 * for any flow with the same shape.
	 *
	 * **What it owns** is the paging, nothing about the steps themselves: the
	 * progress bar, the frame around the step on screen, the summary page after
	 * the last step, and the control row under them. The host says what each step
	 * is called and whether it is done, and draws its body (`step`) and the
	 * summary (`summary`).
	 *
	 * **Two kinds of step.** A step something else proves (the device reports in)
	 * is done when the host says so, and has no button: it waits. A step with
	 * `attest` is done when the reader presses its button; `onattest` tells the
	 * host, which marks it done. `confirmedByDevice` says which of the two made a
	 * finished step done, because only a tick can be taken back (`onundo`).
	 *
	 * **The pager.** It opens on the first unfinished step, again whenever
	 * `startKey` changes (another device starts from nothing). No Next until the
	 * step on screen is done; Previous is always open. The end of the control row
	 * holds the step's button while it is unfinished and Next once it is, so the
	 * press that confirms and the press that pages land under the same finger.
	 * A finished step shows a small mark between them: a button to take a tick
	 * back, or plain text when the step was proved. Finishing a step lands on the
	 * next unfinished one. The summary is the last page. Turning a page moves
	 * focus onto it. The circles in the bar reach any step, finished or not.
	 *
	 * @typedef {object} WizardStep
	 * @property {string} id
	 * @property {string} title Already translated.
	 * @property {boolean} done
	 * @property {boolean} [confirmedByDevice] Done because something proved it, not by a tick.
	 * @property {boolean} [attest] The reader confirms it with a button.
	 * @property {string} [confirmLabel] That button, already translated.
	 * @property {string} [confirmedLabel] The mark on a proved step, already translated.
	 *
	 * @typedef {object} WizardProgress
	 * @property {number} completed The unbroken run of finished steps from the first.
	 * @property {number} total
	 * @property {number} current Page on screen; `total` is the summary.
	 * @property {boolean} onSummary
	 *
	 * @typedef {object} WizardLabels Already translated.
	 * @property {string} back
	 * @property {string} next
	 * @property {string} finish Next, on the last step: it goes to the summary.
	 * @property {string} [markDone] The default for `confirmLabel`; needed only with `attest` steps.
	 * @property {string} [markedDone] The mark on a ticked step.
	 * @property {string} [undo] Its title: pressing it takes the tick back.
	 * @property {string} [detected] The default for `confirmedLabel`.
	 * @property {string} steps The step list's accessible name.
	 * @property {(progress: WizardProgress) => string} bar The bar's accessible name.
	 *
	 * @prop {WizardStep[]} steps
	 * @prop {WizardLabels} labels
	 * @prop {import('svelte').Snippet<[WizardStep, number]>} step The body of the step on screen.
	 * @prop {import('svelte').Snippet} summary The last page.
	 * @prop {string} [startKey] Reopen on the first unfinished step when it changes.
	 * @prop {number} [index] Bindable: the page on screen, for a host that needs to know.
	 * @prop {boolean} [canConfirm] Whether the step on screen may be confirmed yet.
	 * @prop {(progress: WizardProgress) => string} [phrase] The heading over the bar; none when omitted.
	 * @prop {(id: string) => void} [onattest]
	 * @prop {(id: string) => void} [onundo]
	 * @prop {1 | 2} [headingLevel] Of the phrase.
	 * @prop {boolean} [framed] Draw the step in its own card; off inside a popup.
	 */
	import { tick } from 'svelte';
	import { Check, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import CircleButton from '../../atoms/CircleButton.svelte';
	import Island from '../../molecules/Island.svelte';
	import WizardProgressBar from './WizardProgressBar.svelte';

	let {
		steps,
		labels,
		step: stepBody,
		summary,
		startKey = '',
		index = $bindable(-1),
		canConfirm = true,
		phrase,
		onattest = () => {},
		onundo = () => {},
		headingLevel = 1,
		framed = true
	} = $props();

	const firstUnfinished = $derived(steps.findIndex((s) => !s.done));
	const completed = $derived(firstUnfinished === -1 ? steps.length : firstUnfinished);
	const summaryIndex = $derived(steps.length);

	let openedFor = $state(/** @type {string | null} */ (null));
	$effect(() => {
		if (steps.length > 0 && openedFor !== startKey) {
			index = firstUnfinished === -1 ? summaryIndex : firstUnfinished;
			openedFor = startKey;
		}
	});

	const currentIndex = $derived(Math.min(Math.max(index, 0), summaryIndex));
	const onSummary = $derived(steps.length > 0 && currentIndex === summaryIndex);
	const current = $derived(steps[currentIndex]);
	const progress = $derived({ completed, total: steps.length, current: currentIndex, onSummary });

	let pageEl = $state(/** @type {HTMLElement | null} */ (null));

	/** Only a gesture moves focus; arriving on the page does not. */
	async function focusPage() {
		await tick();
		pageEl?.focus();
	}

	/** @param {number} to */
	function goTo(to) {
		index = Math.min(Math.max(to, 0), summaryIndex);
		focusPage();
	}

	/**
	 * Forward first, then the earliest gap, then the summary: the steps in
	 * between can already be done.
	 *
	 * @param {string} id
	 */
	function attest(id) {
		onattest(id);
		const done = steps.map((s, i) => i === currentIndex || s.done);
		const ahead = done.findIndex((d, i) => i >= currentIndex && !d);
		const gap = done.indexOf(false);
		goTo(ahead !== -1 ? ahead : gap !== -1 ? gap : summaryIndex);
	}

	/** @param {string} id */
	function undo(id) {
		onundo(id);
		focusPage();
	}
</script>

<div class="space-y-4">
	<WizardProgressBar
		titles={steps.map((s) => s.title)}
		done={steps.map((s) => s.done)}
		{currentIndex}
		{completed}
		phrase={phrase?.(progress) ?? ''}
		label={labels.bar(progress)}
		stepsLabel={labels.steps}
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
				{@render summary()}
			{:else if current}
				{#key current.id}
					{@render stepBody(current, currentIndex)}
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
					label={labels.back}
					onclick={() => goTo(currentIndex - 1)}
				/>
			{/if}
		</div>

		<div class="min-w-0 justify-self-center">
			{#if !onSummary && current?.done}
				{#if current.confirmedByDevice}
					<p
						class="inline-flex items-center gap-1.5 text-center text-sm font-medium text-green-alt-600 dark:text-green-alt-300"
					>
						<Check size={16} strokeWidth={2} class="shrink-0" aria-hidden="true" />
						<span>{current.confirmedLabel ?? labels.detected}</span>
					</p>
				{:else}
					<button
						type="button"
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-center text-sm font-medium text-green-alt-600 hover:bg-green-alt-50 dark:text-green-alt-300 dark:hover:bg-green-alt-950/40"
						title={labels.undo}
						aria-pressed="true"
						onclick={() => undo(current.id)}
					>
						<Check size={16} strokeWidth={2} class="shrink-0" aria-hidden="true" />
						<span>{labels.markedDone}</span>
					</button>
				{/if}
			{/if}
		</div>

		<div class="justify-self-end">
			{#if onSummary || !current}
				<!-- Nothing left to confirm and nowhere further to page. -->
			{:else if current.done}
				<CircleButton
					icon={ChevronRight}
					iconClassName="rtl:-scale-x-100"
					label={currentIndex === summaryIndex - 1 ? labels.finish : labels.next}
					className="flex-row-reverse"
					onclick={() => goTo(currentIndex + 1)}
				/>
			{:else if canConfirm && current.attest}
				<CircleButton
					color="azure"
					label={current.confirmLabel ?? labels.markDone}
					onclick={() => attest(current.id)}
				/>
			{/if}
		</div>
	</div>
</div>
