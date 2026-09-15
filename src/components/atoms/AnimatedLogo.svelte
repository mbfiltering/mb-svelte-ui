<script>
	import logoLight from '../../assets/logo-animated-light.webp';
	import logoDark from '../../assets/logo-animated-dark.webp';

	/**
	 * AnimatedLogo - the spinning 3D MB cube in a white circle, straddling the top
	 * edge of the sign-in card. Place it inside a `relative` container.
	 *
	 * The two variants are CSS backgrounds keyed on `.dark`, not two `<img>`s. A
	 * hidden `<img>` is still downloaded, and the variants are ~200 KB each, while a
	 * background under a selector that does not match is never fetched. That also
	 * holds on a server-rendered page, where script cannot know the scheme yet.
	 * They are two files, not one, because the cube is drawn onto its circle's
	 * colour (white, zinc-800) with no transparency.
	 *
	 * Decorative: `aria-hidden`, and out of the tab order when it is a button.
	 *
	 * @param {(event: MouseEvent) => void} [onclick] - Renders a button, for a hidden gesture.
	 * @param {string} [className] - Extra classes on the circle.
	 */
	let { onclick = undefined, className = '' } = $props();

	const CIRCLE =
		'absolute -top-8 right-1/2 flex h-16 w-16 translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg sm:h-20 sm:w-20 dark:border dark:border-zinc-750 dark:bg-zinc-800';
</script>

{#snippet cube()}
	<span
		class="block size-[52px] bg-(image:--mb-logo-light) bg-contain bg-center bg-no-repeat sm:size-[72px] dark:bg-(image:--mb-logo-dark)"
		style="--mb-logo-light: url('{logoLight}'); --mb-logo-dark: url('{logoDark}')"
	></span>
{/snippet}

{#if onclick}
	<button type="button" aria-hidden="true" tabindex="-1" {onclick} class="{CIRCLE} {className}">
		{@render cube()}
	</button>
{:else}
	<div aria-hidden="true" class="{CIRCLE} {className}">
		{@render cube()}
	</div>
{/if}
