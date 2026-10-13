<script>
	import { Check, LoaderCircle } from '@lucide/svelte';

	/**
	 * SaveBadge
	 *
	 * The small round mark a control wears while its change is being saved
	 * (`saving`, a spinner) and for a moment after the server confirmed it
	 * (`saved`, a tick). Absolutely positioned on the control's top end corner,
	 * so it never moves the layout; the parent must be `relative`.
	 *
	 * Decorative: the control itself carries `aria-busy`, which is what assistive
	 * tech reads. The host decides how long `saved` stays up.
	 */
	let {
		/** @type {'' | 'saving' | 'saved'} */
		status = ''
	} = $props();
</script>

{#if status}
	<span
		class="pointer-events-none absolute -top-1.5 -end-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow ring-1 ring-gray-200 dark:bg-zinc-800 dark:ring-zinc-600"
		aria-hidden="true"
	>
		{#if status === 'saving'}
			<LoaderCircle size={11} strokeWidth={3} class="animate-spin text-azure-600 dark:text-azure-300" />
		{:else}
			<Check size={11} strokeWidth={3} class="text-green-alt-600 dark:text-green-alt-400" />
		{/if}
	</span>
{/if}
