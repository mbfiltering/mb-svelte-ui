<script>
	import { onMount, tick } from 'svelte';
	import SvgIcon from '../atoms/SvgIcon.svelte';
	import Kbd from '../atoms/Kbd.svelte';
	import ControlButton from '../atoms/ControlButton.svelte';
	import Modal from '../organisms/Modal.svelte';
	import { Search, X, ListCollapse, Ellipsis } from '@lucide/svelte';
	import { fuzzyIncludes } from '../../utils/stringUtils.js';

	// Browser detection (works without SvelteKit's $app/environment)
	const browser = typeof window !== 'undefined';

	/**
	 * SectionedPage - A reusable template component for pages with:
	 * - Sidebar navigation with section tabs
	 * - Magic search functionality
	 * - Expand/collapse all islands
	 *
	 * Usage:
	 * <SectionedPage
	 *   sections={[{ key: 'info', name: 'Info', icon: User, shortcut: 'I', unimportant: false }]}
	 *   navActions={[{ label: 'Action', icon: Star, onclick: () => {} }]}
	 *   loading={false}
	 *   error=""
	 *   onRetry={() => {}}
	 * >
	 *   {#snippet header()}...{/snippet}
	 *   {#snippet sidebarSkeleton()}...{/snippet}
	 *   {#snippet mainSkeleton()}...{/snippet}
	 *   {#snippet sectionContent(ctx)}...{/snippet}
	 * </SectionedPage>
	 *
	 * ctx object provides:
	 * - activeSection: current active section key
	 * - magicSearchActive: boolean if magic search is active
	 * - magicSearchQuery: current search query
	 * - allIslandsExpanded: boolean for island default state
	 * - islandResetKey: key to force island re-render
	 * - isVisible(sectionKey): returns true if section should be shown
	 * - isVisibleMulti(sectionKey, ...additionalKeys): returns true if any key matches
	 * - islandProps: object with defaultExpanded and forceExpanded for Islands
	 */

	// Props
	let {
		// Section configuration
		sections = [],

		// Navigation action buttons (e.g., Presets Library, Filter Removal)
		navActions = [],

		// Loading states
		loading = false,
		error = '',
		onRetry = () => {},

		// True while islands are still fetching after the page shell has loaded.
		// A search then says results may be missing instead of "nothing found".
		searchPending = false,

		// i18n text props
		magicSearchPlaceholder = 'Magic search...',
		magicSearchNoResultsPrefix = 'Nothing found for',
		magicSearchNoResultsSuffix = 'Check your spelling, or try searching for related words.',
		magicSearchPendingText = 'Still loading. Some results may not show yet.',
		collapseAllSectionsTitle = 'Collapse all sections',
		expandAllSectionsTitle = 'Expand all sections',
		disabledDuringSearchTitle = 'Disabled during search',
		advancedText = 'advanced',
		overflowMenuTitle = 'More',
		magicSearchLabel = 'Magic search',
		clearSearchLabel = 'Clear search',
		sectionsLabel = 'Sections',
		retryText = 'Try Again',

		// Default expanded state for all Islands (used on initial render)
		defaultIslandsExpanded = true,

		// Keyboard shortcuts (Alt+Shift+<letter>, double-tap CC) and their
		// Kbd hints — on by default, some host apps opt out entirely.
		hotkeysEnabled = true,

		// Master switch for magic search — on by default. Set false to hide the search
		// input, its no-results message and hints, and stop bare-key typing
		// from feeding the search. Section tabs and the collapse/expand-all control remain.
		magicSearchEnabled = true,

		// Master switch for the collapse/expand-all control — on by default. Set false to
		// hide the collapse-all button and stop the double-tap CC hotkey from toggling all
		// islands. Individual islands can still collapse via their own headers.
		collapseAllEnabled = true,

		// Snippets (sidebarSkeleton and mainSkeleton are required for loading states)
		header = undefined,
		sidebarSkeleton = undefined,
		mainSkeleton = undefined,
		sectionContent = undefined
	} = $props();

	// Internal state
	let activeSection = $state('');
	// Initial position only; the expand/collapse-all control owns it afterwards.
	// svelte-ignore state_referenced_locally
	let allIslandsExpanded = $state(defaultIslandsExpanded);
	let islandResetKey = $state(0);
	let magicSearchQuery = $state('');
	let magicSearchInput = $state(null);
	let magicSearchFocused = $state(false);
	let magicSearchNoMatches = $state(false);
	let contentArea = $state(null);
	let overflowMenuOpen = $state(false);

	// Derived state
	let magicSearchActive = $derived(magicSearchEnabled && magicSearchQuery.trim().length > 0);

	// Split sections into important (shown on bottom bar) and unimportant (tucked into overflow)
	let importantSections = $derived(sections.filter((s) => !s.unimportant));
	let unimportantSections = $derived(sections.filter((s) => s.unimportant));
	let hasOverflowItems = $derived(unimportantSections.length > 0 || navActions.length > 0);
	let unimportantSectionActive = $derived(unimportantSections.some((s) => s.key === activeSection));

	// Typing-vs-hotkey disambiguation. Bare printable keys are buffered briefly
	// so a double-tap shortcut combo (the same key twice — e.g. CC to collapse
	// all, or host-page combos like QQ/AA/SS) can be told apart from the start
	// of typing into magic search. A *different* follow-up key flushes the
	// buffer immediately, so real typing stays responsive; the full delay only
	// applies to a lone key followed by a pause. The window matches the common
	// double-tap threshold so a combo is never split partway through.
	let bufferedKey = null;
	let keyBufferTimer = null;
	const typingHotkeyDelay = 300; // milliseconds (matches double-tap threshold)

	// Initialize active section from first available section
	$effect(() => {
		if (sections.length > 0 && !activeSection) {
			// Check URL hash first
			if (browser) {
				const hash = window.location.hash.slice(1);
				if (hash && sections.some((s) => s.key === hash)) {
					activeSection = hash;
					return;
				}
			}
			// Default to first section
			activeSection = sections[0].key;
		}
	});

	// Validate active section when sections change
	$effect(() => {
		if (!browser || sections.length === 0) return;

		const validKeys = sections.map((s) => s.key);
		if (activeSection && !validKeys.includes(activeSection)) {
			// Invalid section - reset to first available
			const firstSection = sections[0]?.key || '';
			activeSection = firstSection;
			// Clear hash from URL without adding to history
			window.history.replaceState(null, '', window.location.pathname);
		}
	});

	// Toggle all islands expanded/collapsed
	function toggleAllIslands() {
		allIslandsExpanded = !allIslandsExpanded;
		islandResetKey++; // Force re-render all islands with new default
	}

	// Select a section
	function selectSection(key) {
		activeSection = key;
		// Update URL hash using native assignment (adds to browser history naturally)
		if (browser) {
			window.location.hash = key;
		}
	}

	// Handle browser back/forward with hash changes
	function handleHashChange() {
		const hash = window.location.hash.slice(1);
		const validKeys = sections.map((s) => s.key);

		if (hash && validKeys.includes(hash)) {
			// Valid hash - update active section
			activeSection = hash;
		} else if (hash && !validKeys.includes(hash)) {
			// Invalid hash - clear it without adding to history
			window.history.replaceState(null, '', window.location.pathname);
			activeSection = sections[0]?.key || '';
		}
		// If no hash, leave activeSection as-is (don't interfere with normal navigation)
	}

	// Magic search: mark every data-magicsearch element under `root` as a match or not
	function applyMagicSearch(root, query) {
		const searchableElements = root.querySelectorAll('[data-magicsearch]');

		// Track if any islands match
		let hasAnyIslandMatch = false;

		searchableElements.forEach((el) => {
			const terms = (el.dataset.magicsearch || '').toLowerCase();

			if (!query) {
				// No search active - remove all match classes
				el.classList.remove('magicsearch-match', 'magicsearch-island-match');
			} else if (fuzzyIncludes(query, terms)) {
				// This element matches the query (with 1-character typo tolerance)
				el.classList.add('magicsearch-match');
				// If it's an island, also add island-match so all children are shown
				if (el.classList.contains('magicsearch-island')) {
					el.classList.add('magicsearch-island-match');
					hasAnyIslandMatch = true;
				}
			} else {
				// This element doesn't match
				el.classList.remove('magicsearch-match', 'magicsearch-island-match');
			}
		});

		// Check if any island is visible
		if (query) {
			const visibleIslands = root.querySelectorAll(
				'.magicsearch-island.magicsearch-match, .magicsearch-island:has(.magicsearch-match)'
			);
			magicSearchNoMatches = visibleIslands.length === 0;
		} else {
			magicSearchNoMatches = false;
		}
	}

	// Run the search on every keystroke, and again whenever the content changes while
	// a query is active. Islands that finish loading after the query was typed mount
	// unmarked, and the CSS hides every unmarked island, so without the observer a
	// matching island stays hidden until the next keystroke. Mutation records arrive
	// batched once per microtask, before paint, so a newly mounted island never shows
	// a frame in the wrong state. Our own class changes are not observed (only
	// `data-magicsearch` is), so the callback cannot trigger itself.
	$effect(() => {
		const root = contentArea;
		if (!root) return;

		const query = magicSearchQuery.trim().toLowerCase();
		applyMagicSearch(root, query);
		if (!query) return;

		const observer = new MutationObserver(() => applyMagicSearch(root, query));
		observer.observe(root, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['data-magicsearch']
		});
		return () => observer.disconnect();
	});

	// Clear magic search
	function clearMagicSearch() {
		magicSearchQuery = '';
	}

	// Focus the magic search input and append typed text, placing the caret at the end.
	async function typeIntoMagicSearch(text) {
		if (!magicSearchEnabled) return; // Search disabled — swallow the keystroke.
		magicSearchQuery = (magicSearchQuery || '') + text;
		await tick();
		magicSearchInput?.focus();
		const len = magicSearchInput?.value.length ?? 0;
		magicSearchInput?.setSelectionRange?.(len, len);
	}

	// Is this a bare printable character keystroke (typing), not a command/shortcut?
	// Space is excluded so it keeps its native page-scroll behavior, except while the
	// page is loading and a query has started: the input is not on screen yet to take
	// it, so without this "apps list" typed early would arrive as "appslist".
	function isTypingKey(event) {
		const continuesQuery = loading && (magicSearchQuery !== '' || bufferedKey !== null);
		return (
			event.key.length === 1 &&
			(event.key !== ' ' || continuesQuery) &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey
		);
	}

	// A keystroke that is search typing belongs to the search alone. Without this a
	// host page's own double-tap shortcuts see it too: typed while the page is still
	// loading (no input on screen to take focus), "apps list" carries two s's inside
	// the double-tap window and opened the technician portal's Site Lookup. The
	// listener runs in the capture phase so this holds whichever listener was added
	// first. A buffered first key is not claimed, so a real double-tap still reaches
	// the host.
	function claimKey(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	// Keyboard shortcut handler
	function handleKeyDown(event) {
		// Ignore if user is typing in an input or textarea
		if (
			event.target.tagName === 'INPUT' ||
			event.target.tagName === 'TEXTAREA' ||
			event.target.isContentEditable
		) {
			return;
		}

		if (hotkeysEnabled) {
			// Alt + Shift + letter section navigation (definite shortcut — bypass typing delay)
			if (event.altKey && event.shiftKey) {
				const key = event.key.toUpperCase();
				const section = sections.find((s) => s.shortcut === key);
				if (section) {
					event.preventDefault();
					selectSection(section.key);
				}
				return;
			}
		}

		// Anything else with a command/control modifier is a browser/OS shortcut — leave it alone
		if (event.ctrlKey || event.metaKey || event.altKey) return;

		// Typing-vs-hotkey disambiguation for bare keys
		if (isTypingKey(event)) {
			const char = event.key;

			// With hotkeys off there are no double-tap combos to disambiguate from —
			// every bare key is typing, so route it straight into magic search.
			if (!hotkeysEnabled) {
				claimKey(event);
				typeIntoMagicSearch(char);
				return;
			}

			// A bare key is already buffered and a second keystroke arrived in time.
			if (bufferedKey !== null) {
				clearTimeout(keyBufferTimer);
				const prev = bufferedKey;
				bufferedKey = null;
				keyBufferTimer = null;

				if (char.toLowerCase() === prev.toLowerCase()) {
					// Same key twice = a double-tap shortcut combo, not typing.
					// "c" (collapse/expand all) is owned here when the control is
					// enabled; any other combo (e.g. QQ/AA/SS) is owned by the host
					// page, whose own keydown listener tracked both presses
					// independently — so we just step aside and let it fire.
					if (collapseAllEnabled && prev.toLowerCase() === 'c') {
						event.preventDefault();
						toggleAllIslands();
					}
					return;
				}

				// Different key = the user is typing.
				claimKey(event);
				typeIntoMagicSearch(prev + char);
				return;
			}

			// First bare key while not already searching: buffer it briefly so a
			// double-tap shortcut can be told apart from the start of typing.
			if (!magicSearchActive) {
				event.preventDefault();
				bufferedKey = char;
				keyBufferTimer = setTimeout(() => {
					const pending = bufferedKey;
					bufferedKey = null;
					keyBufferTimer = null;
					// No follow-up within the window → treat the lone key as typing.
					if (pending !== null) typeIntoMagicSearch(pending);
				}, typingHotkeyDelay);
				return;
			}

			// Magic search is already active but the input isn't focused →
			// continue typing into it.
			claimKey(event);
			typeIntoMagicSearch(char);
			return;
		}
	}

	onMount(() => {
		// Add keyboard event listener
		window.addEventListener('keydown', handleKeyDown, true);
		// Add hashchange listener for browser back/forward
		window.addEventListener('hashchange', handleHashChange);

		return () => {
			window.removeEventListener('keydown', handleKeyDown, true);
			window.removeEventListener('hashchange', handleHashChange);
			if (keyBufferTimer !== null) clearTimeout(keyBufferTimer);
		};
	});

	// Context object passed to sectionContent snippet
	let sectionContext = $derived({
		// Raw state values
		activeSection,
		magicSearchActive,
		magicSearchQuery,
		allIslandsExpanded,
		islandResetKey,

		// Helper: Check if a section should be visible
		// Returns true if magic search is active OR if the section matches activeSection
		isVisible: (sectionKey) => {
			if (magicSearchActive) return true;
			return activeSection === sectionKey;
		},

		// Helper: Check if any of multiple sections should be visible
		// Useful for content shared across multiple tabs (e.g., New Apps in both Apps and Requests)
		isVisibleMulti: (...sectionKeys) => {
			if (magicSearchActive) return true;
			return sectionKeys.includes(activeSection);
		},

		// Helper: Props to spread on Island components for expand/collapse behavior
		// Usage: <Island {...ctx.islandProps}>
		islandProps: {
			defaultExpanded: allIslandsExpanded,
			forceExpanded: magicSearchActive
		}
	});
</script>

<div>
	<div class="relative flex">
		<!-- Sidebar -->
		<!-- Mobile: height fits icon button + in-flow label (not absolute — absolute labels
		     collapsed to zero layout height and got clipped by overflow/h-18). -->
		<div
			class="lg:w-96 fixed bottom-0 left-0 z-10 flex h-auto min-h-18 w-full shrink-0 flex-col space-y-4 sm:sticky sm:top-14 sm:h-[calc(100%-3.5rem)] sm:min-h-0 sm:w-24 sm:pt-8"
		>
			{#if loading}
				{#if sidebarSkeleton}
					{@render sidebarSkeleton()}
				{/if}
			{:else}
				<!-- Header slot (hidden on mobile, shown on desktop) -->
				{#if header}
					<div class="lgv:inline-block hidden ps-4">
						{@render header()}
					</div>
				{/if}

				<!-- Navigation tabs -->
				<div
					class="g2 no-scrollbar h-18 sm:h-full max-h-full w-full space-y-2 overflow-x-auto overflow-y-auto border-t border-gray-900/25 bg-white p-2 pb-1.5 shadow-lg sm:w-auto sm:rounded-e-xl sm:border-0 sm:border-none sm:pb-2 dark:border-white/25 dark:bg-zinc-800"
				>
					<!-- space-y only from sm up (vertical sidebar). On mobile the bar is horizontal —
					     space-y would stagger tabs. Labels are in-flow under icons, so sm gap is modest. -->
					<ul
						aria-label={sectionsLabel}
						class="flex items-start justify-evenly sm:space-y-3 lg:space-y-2 sm:inline sm:w-auto sm:justify-normal"
					>
					<!-- Nav action buttons (hidden on mobile, shown on sm+ sidebar) -->
					{#if navActions.length > 0}
						<div
							class="lg:mt-0 mt-1.5 px-1.5 sm:mt-1 hidden sm:flex flex-row justify-between gap-6 lg:gap-2 sm:flex-col {navActions.length > 2 ? 'lg:grid lg:grid-cols-2 lg:justify-items-stretch' : ''}"
							>
								{#each navActions as action}
									<li class="flex flex-col items-center">
										<button
											class="cursor-pointer text-xs font-medium text-azure-700 hover:text-azure-900 hover:underline dark:text-azure-400 dark:hover:text-azure-600 sm:flex sm:justify-center sm:w-full lgv:block lg:block"
											title={action.title || action.label}
											onclick={action.onclick}
										>
											<div class="lg:flex hidden gap-1">
												<action.icon size={16} />
												<p class="lg:inline hidden">{action.label}</p>
											</div>
											<div class="lg:hidden inline">
												<action.icon size={24} />
											</div>
										</button>
										<!-- Sidebar label (sm to lg only) — in flow so it reserves height -->
										<p class="hidden sm:block lg:hidden mt-0.5 max-w-full text-center text-[10px] leading-tight truncate font-medium text-azure-600 dark:text-azure-400">{action.label}</p>
									</li>
								{/each}
							</div>
						{/if}

					<!-- Section tabs (unimportant ones hidden on mobile) -->
					{#each sections as section}
						<li class="flex flex-col items-center me-2 sm:me-0 px-0 sm:px-[1.375rem] lgv:px-0 lg:px-0 {section.unimportant ? 'hidden sm:list-item' : ''}">
								<button
									type="button"
									onclick={() => selectSection(section.key)}
									title={section.name}
									aria-current={activeSection === section.key ? 'true' : undefined}
									class="g2 lg:px-4 flex lg:w-full items-center justify-between rounded-lg border px-2 py-2 transition-colors gap-1 sm:justify-center lgv:justify-between lg:justify-between {magicSearchActive
										? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-700/50 opacity-50 dark:border-gray-800/25 dark:bg-gray-900 dark:text-gray-200/50'
										: activeSection === section.key
											? 'cursor-pointer border-azure-500 bg-gradient-to-bl from-azure-500 to-azure-700 text-white hover:bg-azure-900'
											: 'cursor-pointer border-azure-100 bg-azure-50 text-azure-700 hover:bg-azure-100 dark:border-zinc-750 dark:bg-zinc-800 dark:text-azure-200 dark:hover:bg-zinc-750'}"
									disabled={magicSearchActive}
								>
								<div class="sm:flex-row sm:gap-2 flex items-center lg:gap-2">
									{#if section.svgIcon}
										<SvgIcon name={section.svgIcon} size="w-[18px] h-[18px]" />
									{:else if section.icon}
										<section.icon size={18} strokeWidth={2} />
									{/if}
										<p class="lg:inline-block hidden font-medium truncate">{section.name}</p>
										{#if section.shortcut}
											<div class="lg:inline-block hidden">
												<Kbd>Alt + Shift + {section.shortcut}</Kbd>
											</div>
										{/if}
									</div>
									{#if section.advanced}
										<p class="lg:block hidden text-sm truncate">{advancedText}</p>
									{/if}
								</button>
								<!-- Label under button (mobile + sm-to-lg sidebar, hidden at lg+) — in flow -->
								<p class="lg:hidden mt-0.5 max-w-full text-center text-[10px] leading-tight truncate {magicSearchActive ? 'font-medium text-gray-400 dark:text-gray-500' : activeSection === section.key ? 'font-bold text-azure-700 dark:text-azure-200' : 'font-medium text-gray-500 dark:text-gray-400'}">{section.name}</p>
							</li>
						{/each}

						<!-- Overflow / Ellipsis menu button (mobile only) -->
						{#if hasOverflowItems}
							<li class="flex flex-col items-center sm:hidden">
								<button
									type="button"
									onclick={() => (overflowMenuOpen = true)}
									title={overflowMenuTitle}
									class="g2 flex w-full items-center justify-center rounded-lg border px-2 py-2 transition-colors cursor-pointer {unimportantSectionActive
										? 'border-azure-500 bg-gradient-to-bl from-azure-500 to-azure-700 text-white hover:bg-azure-900'
										: 'border-azure-100 bg-azure-50 text-azure-700 hover:bg-azure-100 dark:border-zinc-750 dark:bg-zinc-800 dark:text-azure-200 dark:hover:bg-zinc-750'}"
								>
									<Ellipsis size={18} strokeWidth={2} />
								</button>
								<!-- Mobile label: show active overflow section name (e.g. Billing) when one is selected -->
								<p class="mt-0.5 max-w-full text-center text-[10px] leading-tight truncate {unimportantSectionActive ? 'font-bold text-azure-700 dark:text-azure-200' : 'font-medium text-gray-500 dark:text-gray-400'}">{unimportantSectionActive ? (unimportantSections.find((s) => s.key === activeSection)?.name || overflowMenuTitle) : overflowMenuTitle}</p>
							</li>
						{/if}
					</ul>
				</div>
			{/if}
		</div>

		<!-- Main content area -->
		<!-- Not searching while the page skeleton is up: the search CSS would hide it. -->
		<div
			bind:this={contentArea}
			class="w-full space-y-3 p-4 sm:space-y-6 sm:p-8 {magicSearchActive && !loading
				? 'magicsearch-active'
				: ''} {magicSearchNoMatches && !searchPending ? 'magicsearch-nomatches' : ''}"
		>
			{#if loading}
				{#if mainSkeleton}
					{@render mainSkeleton()}
				{/if}
			{:else if error}
				<div role="alert" class="mb-4 px-4 py-3 text-red-alt-600 dark:text-red-alt-500">{error}</div>
				<ControlButton onclick={onRetry} color="azure" size="md">{retryText}</ControlButton>
			{:else}
				<!-- Header on mobile (shown on mobile, hidden on desktop since it's in sidebar) -->
				{#if header}
					<div class="lgv:hidden inline-block w-full">
						{@render header()}
					</div>
				{/if}

				<!-- Magic Search Bar -->
				<div class="flex gap-1 px-4">
					{#if magicSearchEnabled}
					<div class="lg:px-0 relative flex-1">
						<div class="relative">
							<div
								class="pointer-events-none absolute top-1/2 rtl:right-3 ltr:left-3 -translate-y-1/2 text-gray-400 peer-focus:text-azure-700 dark:text-gray-500 dark:peer-focus:text-azure-200"
							>
								<Search size={16} />
							</div>
							<input
								type="text"
								bind:this={magicSearchInput}
								bind:value={magicSearchQuery}
								placeholder={magicSearchPlaceholder}
								aria-label={magicSearchLabel}
								onfocus={() => (magicSearchFocused = true)}
								onblur={() => (magicSearchFocused = false)}
								onkeydown={(e) => {
									if (e.key === 'Escape') {
										e.preventDefault();
										magicSearchInput?.blur();
									}
								}}
								class="peer g2 w-full rounded-lg border border-gray-900/25 bg-neutral-100 py-2 pe-9 ps-9 text-sm text-gray-700 placeholder-gray-400/80 transition-colors focus:border-azure-700 focus:pe-8 focus:outline-none dark:border-white/25 dark:bg-zinc-750 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-azure-500"
							/>
							{#if magicSearchFocused}
								<div
									class="helper pointer-events-none absolute top-1/2 rtl:left-2 ltr:right-2 -translate-y-4"
								>
									<Kbd>Esc</Kbd>
								</div>
							{/if}
							{#if magicSearchActive && !magicSearchFocused}
								<button
									type="button"
									onclick={clearMagicSearch}
									class="absolute top-1/2 ltr:right-2 rtl:left-2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
									aria-label={clearSearchLabel}
									title={clearSearchLabel}
								>
									<X size={14} aria-hidden="true" />
								</button>
							{/if}
						</div>
					</div>
					{/if}
					<!-- Collapse/Expand All -->
					{#if collapseAllEnabled}
					<button
						class="h-full rounded-full p-2 transition-colors {magicSearchEnabled
							? ''
							: 'ms-auto'} {magicSearchActive
							? 'cursor-not-allowed text-gray-400 opacity-50 dark:text-gray-500'
							: 'cursor-pointer text-gray-700 hover:bg-gray-900/10 dark:text-gray-200 dark:hover:bg-gray-50/10'}"
						title={magicSearchActive
							? disabledDuringSearchTitle
							: allIslandsExpanded
								? `${collapseAllSectionsTitle}${hotkeysEnabled ? ' (CC)' : ''}`
								: `${expandAllSectionsTitle}${hotkeysEnabled ? ' (CC)' : ''}`}
						onclick={toggleAllIslands}
						disabled={magicSearchActive}
					>
						<ListCollapse
							size={20}
							class="transition-transform {allIslandsExpanded ? '' : 'rotate-180'}"
						/>
					</button>
					{/if}
				</div>

				<!-- Magic search: some islands are still loading, so they cannot match yet -->
				{#if magicSearchActive && searchPending}
					<p class="px-4 text-sm text-gray-900/50 dark:text-gray-50/50" role="status">
						{magicSearchPendingText}
					</p>
				{/if}

				<!-- Magic search: No results message -->
				{#if magicSearchEnabled}
				<div class="magicsearch-noresults p-8 text-center">
					<p class="text-gray-900/50 dark:text-gray-50/50">
						{magicSearchNoResultsPrefix} <span class="font-medium text-gray-700 dark:text-gray-200"
							>"{magicSearchQuery}"</span
						><br /><br />
						{magicSearchNoResultsSuffix}
					</p>
				</div>
				{/if}

				<!-- Section content -->
				{#key islandResetKey}
					{#if sectionContent}
						{@render sectionContent(sectionContext)}
					{/if}
				{/key}
			{/if}
		</div>
	</div>
</div>

<!-- Overflow menu Modal (mobile) -->
<Modal isOpen={overflowMenuOpen} onClose={() => (overflowMenuOpen = false)} verticalAlign="bottom">
	<div class="g2 rounded-t-2xl bg-white p-4 pt-6 dark:bg-zinc-800">
		<ul class="space-y-1">
			<!-- Unimportant section tabs -->
			{#each unimportantSections as section}
				<li>
					<button
						type="button"
						onclick={() => { selectSection(section.key); overflowMenuOpen = false; }}
						disabled={magicSearchActive}
						class="{magicSearchActive
							? 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-500'
							: activeSection === section.key
								? 'cursor-pointer bg-azure-50 text-azure-700 dark:bg-azure-900/30 dark:text-azure-200'
								: 'cursor-pointer text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-750'} g2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors"
					>
						{#if section.svgIcon}
							<SvgIcon name={section.svgIcon} size="w-[20px] h-[20px]" />
						{:else if section.icon}
							<section.icon size={20} strokeWidth={2} />
						{/if}
						<span class="{activeSection === section.key ? 'font-semibold' : 'font-medium'}">{section.name}</span>
					</button>
				</li>
			{/each}

			<!-- Divider between sections and nav actions -->
			{#if unimportantSections.length > 0 && navActions.length > 0}
				<li class="py-1"><hr class="border-gray-200 dark:border-zinc-700" /></li>
			{/if}

			<!-- Nav action buttons -->
			{#each navActions as action}
				<li>
					<button
						class="g2 cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start font-medium text-azure-700 transition-colors hover:bg-gray-100 dark:text-azure-400 dark:hover:bg-zinc-750"
						onclick={() => { action.onclick?.(); overflowMenuOpen = false; }}
					>
						<action.icon size={20} />
						<span>{action.label}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
</Modal>
