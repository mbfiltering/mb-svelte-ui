<script>
	/**
	 * The walkthrough's one bar: a phrase over a track of numbered steps.
	 *
	 * **How far you have got** is the phrase and the fill: "Almost there", not
	 * "60%". The percentage survives in `aria-valuenow` and the label, which is the
	 * only position a screen reader gets from a bar.
	 * **The steps** sit on the track as small numbered circles, one per step of the
	 * list the reader is on, so answering adult or child redraws them (the adult
	 * list has supervision, the profile and the certificate). A finished step is
	 * filled, the step on screen is ringed, and every circle is a button that goes
	 * straight to its step (the owner, 2026-10-07), ahead of the run as well as back.
	 *
	 * The fill runs to the first unfinished step, so a later step the device
	 * already proved is filled on its own without claiming the track up to it.
	 *
	 * Positions are `inset-inline-start`, so RTL needs no second rule; only the
	 * gradient is mirrored by hand.
	 *
	 * @prop {string[]} titles Already translated, one per step, in order.
	 * @prop {boolean[]} done One per step.
	 * @prop {number} currentIndex Page on screen; `titles.length` is the summary.
	 * @prop {number} completed The unbroken run of finished steps from the first.
	 * @prop {string} phrase Already translated. The heading.
	 * @prop {string} label Already translated. The bar's accessible name.
	 * @prop {string} stepsLabel Already translated. The step list's accessible name.
	 * @prop {(index: number) => void} onselect
	 * @prop {1 | 2 | 3} [headingLevel] 1 where the bar leads a page, 2 inside a popup.
	 */
	let {
		titles,
		done,
		currentIndex,
		completed,
		phrase,
		label,
		stepsLabel,
		onselect,
		headingLevel = 1
	} = $props();

	const total = $derived(titles.length);
	const donePercent = $derived(total > 0 ? (completed / total) * 100 : 0);

	/** Where step `index` sits on the track: the first at the start, the last at the end. */
	const at = (/** @type {number} */ index) => (total > 1 ? (index / (total - 1)) * 100 : 0);
	const fillPercent = $derived(completed >= total ? 100 : at(completed));

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

<div class="space-y-4">
	<svelte:element
		this={headingTag}
		class="text-center font-bold text-balance text-azure-600 dark:text-azure-400 {headingSize} {TINT}"
		style="color: color-mix(in oklab, var(--tint-from), var(--tint-to) {donePercent}%)"
	>
		{phrase}
	</svelte:element>

	<!-- Inset by half a circle, so neither end hangs outside the column. -->
	<div class="relative h-7">
		<div class="absolute inset-y-0 start-3 end-3">
			<div
				class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(donePercent)}
				aria-label={label}
			>
				<!-- The gradient spans the whole track and is revealed by the cover
				     retreating, so a point on the track is always the same colour. -->
				<div
					class="absolute inset-0 from-azure-500 to-green-alt-400 ltr:bg-linear-to-r rtl:bg-linear-to-l"
				></div>
				<div
					class="absolute inset-y-0 end-0 bg-gray-200 transition-[inline-size] duration-500 ease-out dark:bg-zinc-700"
					style="inline-size: {100 - fillPercent}%"
				></div>
			</div>

			<ol aria-label={stepsLabel}>
				{#each titles as title, index (index)}
					{@const isDone = done[index]}
					{@const isCurrent = index === currentIndex}
					<li
						class="absolute top-1/2 -translate-y-1/2"
						style="inset-inline-start: calc({at(index)}% - 0.75rem)"
					>
						<button
							type="button"
							class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-500
								{isDone
								? 'text-white'
								: 'border-2 border-gray-300 bg-white text-gray-600 hover:border-azure-400 hover:text-azure-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-300 dark:hover:border-azure-400 dark:hover:text-azure-300'}
								{isCurrent ? 'ring-2 ring-azure-500 ring-offset-2 ring-offset-white dark:ring-azure-400 dark:ring-offset-zinc-800' : ''}"
							style={isDone
								? `background-color: color-mix(in srgb, var(--color-azure-600), var(--color-green-alt-700) ${at(index)}%)`
								: undefined}
							title={title}
							aria-current={isCurrent ? 'step' : undefined}
							onclick={() => onselect(index)}
						>
							<span aria-hidden="true">{index + 1}</span>
							<span class="sr-only">{index + 1}. {title}</span>
						</button>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</div>
