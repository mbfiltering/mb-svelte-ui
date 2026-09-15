<script>
	import defaultDarkImage from '../../assets/error-dark.webp';
	import defaultLightImage from '../../assets/error-light.webp';
	import { paintedDark } from '../../utils/theme.js';

	/**
	 * ErrorPage - Full-screen error page template
	 *
	 * Displays an error status code, message, optional images (light/dark),
	 * and a customisable action button via a snippet.
	 * Includes bundled default images; override with your own via props.
	 *
	 * @example
	 * <ErrorPage statusCode={404} message="Page not found">
	 *   {#snippet action()}
	 *     <ControlButton onclick={goHome} color="azure" size="lg">Go Home</ControlButton>
	 *   {/snippet}
	 * </ErrorPage>
	 */
	let {
		/** @type {number} HTTP status code */
		statusCode = 404,

		/** @type {string} Error message displayed below the status code */
		message = '',

		/** @type {string} Image shown in dark mode */
		darkImage = defaultDarkImage,

		/** @type {string} Image shown in light mode */
		lightImage = defaultLightImage,

		/** @type {string} Alt text for the images */
		imageAlt = '',

		/** @type {import('svelte').Snippet} Action button snippet */
		action = undefined
	} = $props();

	// Browser detection (works without SvelteKit's $app/environment)
	const browser = typeof window !== 'undefined';
</script>

<div
	class="flex min-h-screen w-full flex-col items-center justify-center bg-neutral-100 px-8 dark:bg-zinc-750"
>
	<div class="text-center">
		<!-- In the browser, only the image for the scheme on screen: a `dark:hidden`
		     <img> is still downloaded. The server cannot know the scheme (the
		     pre-paint script sets it), so a server-rendered error page keeps both
		     behind CSS, and hydration swaps to the single image. -->
		{#if browser}
			{@const src = $paintedDark ? darkImage : lightImage}
			{#if src}
				<img {src} alt={imageAlt} class="mx-auto mb-2 block w-72 max-w-lg sm:w-auto" />
			{/if}
		{:else}
			{#if darkImage}
				<img
					src={darkImage}
					alt={imageAlt}
					class="mx-auto mb-2 hidden w-72 max-w-lg sm:w-auto dark:block"
				/>
			{/if}
			{#if lightImage}
				<img
					src={lightImage}
					alt={imageAlt}
					class="mx-auto mb-2 block w-72 max-w-lg sm:w-auto dark:hidden"
				/>
			{/if}
		{/if}

		<h1 class="mb-2 text-3xl font-bold text-gray-700 dark:text-gray-200">{statusCode}</h1>

		{#if message}
			<p class="text-md mb-8 text-gray-700 sm:text-lg dark:text-gray-200">
				{message}
			</p>
		{/if}

		{#if action}
			<br />
			{@render action()}
		{/if}
	</div>
</div>
