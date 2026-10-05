<script>
	import Island from '../molecules/Island.svelte';
	import {
		Download,
		BookOpen,
		Film,
		Key,
		GraduationCap,
		Package,
		ExternalLink
	} from '@lucide/svelte';

	// Props
	let { 
		gridClasses = 'sm:grid-cols-2 lg:grid-cols-3', 
		title = 'Quick Links',
		links = null,  // Optional: pass translated links array
		scrollBody = false, // Set when the links sit in a Modal with `innerScroll`
		newTabLabel = 'Open in a new tab' // Name of the new-tab button on a same-tab link
	} = $props();

	/*
	 * A link opens in a new tab unless it sets `newTab: false`: a page of the
	 * host app itself, which should open in place. Such a card gets its own
	 * new-tab button at its end, for when a new tab is wanted after all. The two
	 * are sibling links, since a link inside a link is invalid HTML.
	 */

	// Default quick links data (used when links prop is not provided)
	const defaultLinks = [
		{
			name: 'Wiki Docs',
			url: 'https://admin.tag.org/wiki/mb-smart',
			icon: BookOpen,
			description: 'View the documentation on TAG Wiki'
		},
		{
			name: 'Training by MB',
			url: 'https://sites.google.com/view/mb-smart/',
			icon: GraduationCap,
			description: 'Learn about the MB Smart filter'
		},
		{
			name: 'Training by TAG',
			url: 'https://admin.tag.org/lms/mb-smart',
			icon: Film,
			description: 'Learn about the MB Smart filter'
		},
		{
			name: '2-Factor Authentication',
			url: 'https://admin.tag.org/2fa/bm-smart-2fa',
			icon: Key,
			description: 'Get 2FA recovery key'
		},
		{
			name: 'Downloads',
			url: 'https://admin.tag.org/quicklinks#MB%20Smart',
			icon: Download,
			description: 'Download apps and tools'
		},
		{
			name: 'Old Portal',
			url: 'https://portal.mbsmartservices.net',
			icon: Package,
			description: 'Access the old MB Smart portal'
		}
	];
	
	// Use provided links or fall back to defaults
	const quickLinks = $derived(links || defaultLinks);
</script>

<Island
	{title}
	{scrollBody}
	collapsible={false}
	className={scrollBody ? 'rounded-b-none sm:rounded-b-xl' : ''}
>
	<div class="grid gap-3 {gridClasses}">
		{#each quickLinks as link}
			{@const inPlace = link.newTab === false}
			<div
				class="g2 flex min-w-0 items-center overflow-hidden rounded-lg border border-azure-100 bg-azure-50 transition-all hover:bg-azure-100 dark:border-zinc-750 dark:bg-zinc-800 dark:hover:bg-zinc-750"
			>
				<a
					href={link.url}
					target={inPlace ? undefined : '_blank'}
					rel={inPlace ? undefined : 'noopener noreferrer'}
					class="flex min-w-0 flex-1 items-center gap-3 p-1.5 sm:p-3"
				>
					<div
						class="g2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-bl from-azure-500 to-azure-700 text-white"
					>
						<link.icon size={20} />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium text-gray-900 dark:text-gray-50">{link.name}</p>
						<p class="truncate text-xs text-gray-900/75 dark:text-gray-50/75">{link.description}</p>
					</div>
				</a>
				{#if inPlace}
					<a
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="{link.name}: {newTabLabel}"
						title={newTabLabel}
						class="g2 me-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-azure-700 transition-colors hover:bg-azure-200/70 sm:me-3 dark:text-azure-200 dark:hover:bg-zinc-700"
					>
						<ExternalLink size={18} aria-hidden="true" />
					</a>
				{/if}
			</div>
		{/each}
	</div>
</Island>
