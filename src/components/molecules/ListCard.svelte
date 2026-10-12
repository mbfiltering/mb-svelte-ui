<script>
	import { SquareArrowOutUpRight } from '@lucide/svelte';

	let {
		href = '#',
		onclick = null,
		disabled = false,
		disabledTitle = '',
		static: isStatic = false,
		showArrow = true,
		showOpenInNewTab = true,
		openInNewTabHref = '',
		icon = undefined,
		actions = undefined,
		children
	} = $props();

	const newTabUrl = $derived(openInNewTabHref || href);

	function handleNewTab(event) {
		event.preventDefault();
		event.stopPropagation();
		window.open(newTabUrl, '_blank');
	}
</script>

{#if disabled}
	<div
		class="flex cursor-not-allowed items-center gap-3 border-b border-neutral-100 p-3 compact:py-1.5 opacity-60 transition-colors last:border-b-0 dark:border-zinc-750"
		title={disabledTitle}
	>
		{#if icon}{@render icon()}{/if}
		<div class="min-w-0 flex-1">{@render children()}</div>
	</div>
{:else if isStatic}
	<div class="flex items-center gap-3 border-b border-neutral-100 p-3 compact:py-1.5 last:border-b-0 dark:border-zinc-750">
		{#if icon}{@render icon()}{/if}
		<div class="min-w-0 flex-1">{@render children()}</div>
		{#if actions}{@render actions()}{/if}
		{#if showOpenInNewTab}
			<button
				type="button"
				onclick={handleNewTab}
				class="hidden xs:flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-azure-100 text-azure-700 transition-colors hover:bg-azure-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-750 dark:text-azure-200 dark:hover:bg-zinc-700"
				title="Open in new tab"
			>
				<SquareArrowOutUpRight size="16" strokeWidth="2" />
			</button>
		{/if}
	</div>
{:else}
	<a
		{href}
		{onclick}
		data-sveltekit-reload={true}
		class="flex items-center gap-3 border-b border-neutral-100 p-3 compact:py-1.5 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-zinc-750 dark:hover:bg-zinc-750"
	>
		{#if icon}{@render icon()}{/if}
		<div class="min-w-0 flex-1">{@render children()}</div>
		{#if actions}{@render actions()}{/if}
		{#if showOpenInNewTab}
			<button
				type="button"
				onclick={handleNewTab}
				class="hidden xs:flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-azure-100 text-azure-700 transition-colors hover:bg-azure-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-750 dark:text-azure-200 dark:hover:bg-zinc-700"
				title="Open in new tab"
			>
				<SquareArrowOutUpRight size="16" strokeWidth="2" />
			</button>
		{/if}
		{#if showArrow}
			<svg
				class="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500 rtl:rotate-180"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		{/if}
	</a>
{/if}