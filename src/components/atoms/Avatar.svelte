<script>
	import { Crown } from '@lucide/svelte';

	/**
	 * Avatar - Circular identity mark carrying a plain-SVG person glyph.
	 *
	 * Decorative by default: it sits beside the account name, which is the real
	 * label, so the circle stays out of the a11y tree. Pass `ariaLabel` only
	 * where it stands alone.
	 *
	 * `rounded-full` deliberately carries no `g2` — a squircle at 50% radius is
	 * an app-icon blob rather than a circle.
	 *
	 * `owner` sets a small crown on the circle's top edge: the signed-in person owns the account.
	 */
	let { size = 'h-8 w-8', className = '', ariaLabel = '', owner = false } = $props();
</script>

<span
	class="{size} {className} relative inline-flex shrink-0 items-center justify-center rounded-full bg-azure-100 text-azure-700 dark:bg-azure-900 dark:text-azure-200"
	role={ariaLabel ? 'img' : undefined}
	aria-label={ariaLabel || undefined}
	aria-hidden={ariaLabel ? undefined : 'true'}
>
	<svg viewBox="0 0 24 24" fill="currentColor" class="h-3/5 w-3/5" aria-hidden="true">
		<circle cx="12" cy="8" r="3.9" />
		<path
			d="M12 13.6c-4 0-6.9 2.2-6.9 5.2 0 .5.4.9.9.9h12c.5 0 .9-.4.9-.9 0-3-2.9-5.2-6.9-5.2Z"
		/>
	</svg>
	{#if owner}
		<Crown
			class="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 fill-yellow-400 text-yellow-600 dark:text-yellow-400"
			aria-hidden="true"
		/>
	{/if}
</span>
