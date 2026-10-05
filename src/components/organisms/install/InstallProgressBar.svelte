<script>
	/**
	 * The walkthrough's one bar, saying two things at once.
	 *
	 * **How far you have got** is the phrase, the fill and the head riding it:
	 * "Almost there", not "60%". The percentage survives in `aria-valuenow` and the
	 * label, which is the only position a screen reader gets from a bar.
	 * **Where you are looking** is a small grey dot on its own row under the track,
	 * drawn only when the reader has paged back to re-read a finished step. Nothing
	 * can be viewed ahead of the run, since there is no Next until a step is done.
	 *
	 * Progress counts the unbroken run of finished steps from the first, so a later
	 * step the device already proved does not claim a position the reader is not at.
	 *
	 * Everything positional is logical (`inline-size`, `justify-end`, `-me`), so RTL
	 * needs no second rule; only the gradient is mirrored by hand.
	 *
	 * @prop {number} total
	 * @prop {number} currentIndex Page on screen; `total` is the summary.
	 * @prop {number} completed
	 * @prop {string} phrase Already translated. The heading.
	 * @prop {string} label Already translated. The bar's accessible name.
	 * @prop {1 | 2 | 3} [headingLevel] 1 where the bar leads a page, 2 inside a popup.
	 */
	let { total, currentIndex, completed, phrase, label, headingLevel = 1 } = $props();

	const donePercent = $derived(total > 0 ? (completed / total) * 100 : 0);
	const viewPercent = $derived(total > 0 ? (Math.min(currentIndex, total) / total) * 100 : 0);
	const lookingBack = $derived(currentIndex < completed);

	/**
	 * The phrase walks the track's azure to green ramp one step deeper than the
	 * track (it is large text, so 3:1 is the bar: about 4.2:1 and 3.4:1 at the light
	 * ends). Custom properties carry the ends so `dark:` can move them; the plain
	 * utility underneath is the fallback where `color-mix` is missing.
	 */
	const TINT =
		'[--tint-from:var(--color-azure-600)] [--tint-to:var(--color-green-alt-600)] dark:[--tint-from:var(--color-azure-400)] dark:[--tint-to:var(--color-green-alt-400)]';

	const headingTag = $derived(`h${headingLevel}`);
	const headingSize = $derived(headingLevel === 1 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl');
</script>

<div class="space-y-3">
	<svelte:element
		this={headingTag}
		class="text-center font-bold text-balance text-azure-600 dark:text-azure-400 {headingSize} {TINT}"
		style="color: color-mix(in oklab, var(--tint-from), var(--tint-to) {donePercent}%)"
	>
		{phrase}
	</svelte:element>

	<div>
		<div
			class="relative h-5"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(donePercent)}
			aria-label={label}
		>
			<div
				class="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-750"
			>
				<!-- The gradient spans the whole track and is revealed by the cover
				     retreating, so a point on the track is always the same colour. -->
				<div
					class="absolute inset-0 from-azure-500 to-green-alt-400 ltr:bg-linear-to-r rtl:bg-linear-to-l"
				></div>
				<div
					class="absolute inset-y-0 end-0 bg-gray-100 transition-[inline-size] duration-500 ease-out dark:bg-zinc-750"
					style="inline-size: {100 - donePercent}%"
				></div>
			</div>

			<!-- Inset by half the head, so neither end hangs outside the column. -->
			<div class="pointer-events-none absolute inset-y-0 start-2.5 end-2.5">
				<div
					class="absolute inset-y-0 start-0 flex items-center justify-end transition-all duration-500 ease-out"
					style="inline-size: {donePercent}%"
				>
					<span
						class="-me-2.5 h-5 w-5 shrink-0 rounded-full bg-azure-500"
						style="background-color: color-mix(in srgb, var(--color-azure-500), var(--color-green-alt-400) {donePercent}%)"
					></span>
				</div>
			</div>
		</div>

		<!-- The row is always there and only the dot is conditional, so paging back
		     and forth does not jog the page. -->
		<div class="pointer-events-none relative h-3">
			<div class="absolute inset-y-0 start-2.5 end-2.5">
				{#if lookingBack}
					<div
						class="absolute inset-y-0 start-0 flex items-center justify-end transition-all duration-500 ease-out"
						style="inline-size: {viewPercent}%"
					>
						<span class="-me-1.5 h-3 w-3 shrink-0 rounded-full bg-gray-500/50"></span>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
