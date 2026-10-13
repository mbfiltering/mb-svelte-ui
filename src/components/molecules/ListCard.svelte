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
		openInNewTabLabel = 'Open in new tab',
		icon = undefined,
		actions = undefined,
		children
	} = $props();

	const newTabUrl = $derived(openInNewTabHref || href);

	// A real link, not window.open. A plain click opens a foreground tab.
	// Ctrl-click, Cmd-click and middle-click open a background tab, which
	// window.open cannot do: it always focuses the new tab.
</script>

{#snippet newTabLink()}
	{#if showOpenInNewTab}
		<a
			href={newTabUrl}
			target="_blank"
			rel="noopener noreferrer"
			onclick={(event) => event.stopPropagation()}
			class="relative z-10 hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-azure-100 text-azure-700 no-underline transition-colors hover:bg-azure-200 xs:flex dark:bg-zinc-750 dark:text-azure-200 dark:hover:bg-zinc-700"
			title={openInNewTabLabel}
			aria-label={openInNewTabLabel}
		>
			<SquareArrowOutUpRight size="16" strokeWidth="2" aria-hidden="true" />
		</a>
	{/if}
{/snippet}

{#if disabled}
	<div
		class="flex cursor-not-allowed items-center gap-3 border-b border-neutral-100 p-3 opacity-60 transition-colors compact:py-1.5 last:border-b-0 dark:border-zinc-750"
		title={disabledTitle}
	>
		{#if icon}{@render icon()}{/if}
		<div class="min-w-0 flex-1">{@render children()}</div>
	</div>
{:else if isStatic}
	<div
		class="flex items-center gap-3 border-b border-neutral-100 p-3 compact:py-1.5 last:border-b-0 dark:border-zinc-750"
	>
		{#if icon}{@render icon()}{/if}
		<div class="min-w-0 flex-1">{@render children()}</div>
		{#if actions}{@render actions()}{/if}
		{@render newTabLink()}
	</div>
{:else}
	<!-- The row link's ::after covers the row, so the padding and the chevron
	     are part of the hit target. Actions and the new-tab link sit above it. -->
	<div
		class="relative flex items-center gap-3 border-b border-neutral-100 p-3 transition-colors compact:py-1.5 last:border-b-0 hover:bg-neutral-50 dark:border-zinc-750 dark:hover:bg-zinc-750"
	>
		{#if icon}
			<div aria-hidden="true">{@render icon()}</div>
		{/if}
		<a
			{href}
			{onclick}
			data-sveltekit-reload={true}
			class="min-w-0 flex-1 after:absolute after:inset-0 after:content-['']"
		>
			{@render children()}
		</a>
		{#if actions}
			<div class="relative z-10">{@render actions()}</div>
		{/if}
		{@render newTabLink()}
		{#if showArrow}
			<svg
				class="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500 rtl:rotate-180"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		{/if}
	</div>
{/if}
