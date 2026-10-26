<script>
	// Props - Svelte 5 style
	import { ChevronDown } from '@lucide/svelte';
	import SvgIcon from '../atoms/SvgIcon.svelte';

	let {
		title = '',
		icon = null,
		svgIcon = '', // Name of SVG file in /static/icons (without .svg extension)
		defaultExpanded = true,
		forceExpanded = false, // When true, island is always expanded and cannot be collapsed
		onToggle = undefined, // Called with the new expanded state when the header toggles it
		className = '',
		collapsible = true,
		collapseLabel = 'Collapse', // Tooltip text when expanded
		expandLabel = 'Expand', // Tooltip text when collapsed
		scrollBody = false, // Header and footer stay put; only the content scrolls. Needs a height-bounded flex parent (ModalIsland)
		header = undefined, // Snippet pinned above the content in place of the title bar, such as a search field. Wins over `title`
		footer = undefined, // Snippet pinned under the content, for the island's actions
		actions = undefined, // Snippet in the title bar, before the chevron, for small icon buttons
		leading = undefined, // Snippet at the start of the title bar, before the icon, such as a checkbox
		children = undefined
	} = $props();

	// Scroll fades. A zero-height-in-flow sentinel sits at each end of the
	// scrolling content; whichever one is out of view means there is more that
	// way. An IntersectionObserver rather than a scroll handler: it also catches
	// content growing, a resize, or an {#if} opening, with no per-frame work.
	let scrollEl = $state(null);
	let topSentinel = $state(null);
	let bottomSentinel = $state(null);
	let fadeTop = $state(false);
	let fadeBottom = $state(false);

	$effect(() => {
		if (!scrollEl || !topSentinel || !bottomSentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.target === topSentinel) fadeTop = !entry.isIntersecting;
					else fadeBottom = !entry.isIntersecting;
				}
			},
			{ root: scrollEl }
		);
		observer.observe(topSentinel);
		observer.observe(bottomSentinel);
		return () => observer.disconnect();
	});

	// State — `defaultExpanded` is the initial position only; the header button
	// owns it afterwards.
	// svelte-ignore state_referenced_locally
	let internalExpanded = $state(defaultExpanded);

	// Ties the header button to the panel it controls via aria-controls. Islands
	// are rendered in long lists, so the id has to be unique per instance.
	// ($props.id() has to be the whole initializer — it cannot be interpolated.)
	const uid = $props.id();
	const panelId = `island-panel-${uid}`;

	// Use forceExpanded if set, otherwise use internal state
	let isExpanded = $derived(forceExpanded ? true : internalExpanded);

	// Toggle expand/collapse (only works if not forceExpanded)
	function toggleExpanded() {
		if (!forceExpanded) {
			internalExpanded = !internalExpanded;
			onToggle?.(internalExpanded);
		}
	}
</script>

<!-- Island Container -->
<div
	class="g2 bg-white shadow-lg dark:bg-zinc-800 {scrollBody
		? 'flex min-h-0 flex-col'
		: ''} {className} rounded-xl text-gray-900 dark:border dark:border-zinc-750 dark:text-gray-50"
>
	{#if header}
		<!-- Custom header: no title, no toggle. The phone top padding clears the
		     bottom sheet's drag handle (h-8), as the empty strip below does. With
		     no content yet (a search before anything is typed) it is the whole
		     island, so it closes itself off rather than leaving an empty panel. -->
		<div class="shrink-0 px-3 pt-8 sm:px-6 sm:pt-6 compact:sm:px-4 compact:sm:pt-4 {children ? '' : 'pb-3 sm:pb-6 compact:sm:pb-4'}">
			{@render header()}
		</div>
	{:else if title && collapsible && !forceExpanded}
		<!-- Header with collapse functionality. The row toggles too, so the chevron
		     stays clickable with `actions` between it and the button; keyboard
		     users have the button. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="group flex w-full shrink-0 cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-200 {isExpanded
				? 'border-b'
				: ''} border-neutral-100 px-3 py-2 sm:px-6 sm:py-4 compact:py-1.5 compact:sm:px-4 compact:sm:py-2 dark:border-zinc-750"
			onclick={toggleExpanded}
			title={isExpanded ? collapseLabel : expandLabel}
		>
			{#if leading}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div class="flex shrink-0 items-center" onclick={(e) => e.stopPropagation()}>
					{@render leading()}
				</div>
			{/if}
			<button
				type="button"
				class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-start transition-colors group-hover:text-azure-700 dark:group-hover:text-azure-500"
				onclick={(e) => {
					e.stopPropagation();
					toggleExpanded();
				}}
				aria-expanded={isExpanded}
				aria-controls={panelId}
			>
				{#if svgIcon}
					<SvgIcon name={svgIcon} size="w-5 h-5" />
				{:else if icon}
					{@const IconComponent = icon}
					<IconComponent size={20} strokeWidth={2} />
				{/if}
				<h3 class="font-medium wrap-anywhere sm:text-lg compact:sm:text-base">{title}</h3>
			</button>

			{#if actions}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<!-- me-1: a 36px button here centres 40px from the chevron, as the page's
				     buttons above sit from collapse/expand all -->
				<div class="me-1 flex shrink-0 items-center gap-1" onclick={(e) => e.stopPropagation()}>
					{@render actions()}
				</div>
			{/if}

			<!-- Arrow -->
			<ChevronDown
				size={20}
				class="h-5 w-5 shrink-0 transition-transform group-hover:text-azure-700 dark:group-hover:text-azure-500 {isExpanded
					? 'rotate-180'
					: ''}"
				aria-hidden="true"
			/>
		</div>
	{:else if title}
		<!-- Header without collapse functionality -->
		<div
			class="shrink-0 border-b border-neutral-100 px-3 py-2 pt-5 sm:pt-auto text-gray-700 sm:px-6 sm:py-4 compact:sm:px-4 compact:sm:py-2 dark:border-zinc-750 dark:text-gray-200"
		>
			<div class="flex items-center gap-2">
				{#if leading}
					<div class="flex shrink-0 items-center">{@render leading()}</div>
				{/if}
				{#if svgIcon}
					<SvgIcon name={svgIcon} size="w-5 h-5" />
				{:else if icon}
					{@const IconComponent = icon}
					<IconComponent size={20} strokeWidth={2} />
				{/if}
				<h3 class="min-w-0 flex-1 font-medium wrap-anywhere sm:text-lg compact:sm:text-base">{title}</h3>
				{#if actions}
					<div class="flex shrink-0 items-center gap-1">{@render actions()}</div>
				{/if}
			</div>
		</div>
	{:else if scrollBody}
		<!-- No header, so hold the bottom sheet's drag handle (h-8, phone only) clear
		     of the scroller. iOS hands a touch over a scroll area to that area even
		     when the handle sits on top, and a scroller with nothing to scroll passes
		     the swipe on to the page behind instead of closing the sheet. -->
		<div class="h-8 shrink-0 sm:hidden" aria-hidden="true"></div>
	{/if}
	<!-- No header, just content -->
	{#if header && !children}
		<!-- Nothing under the custom header yet -->
	{:else if scrollBody}
		<div
			id={panelId}
			bind:this={scrollEl}
			class="island-scroll min-h-0 overflow-y-auto overscroll-contain {isExpanded ? 'block' : 'hidden'}"
			class:fade-top={fadeTop}
			class:fade-bottom={fadeBottom}
		>
			<!-- 1px tall so a fractional scroll offset still counts as reaching the end;
			     the negative margin keeps it out of the layout. -->
			<div bind:this={topSentinel} class="-mb-px h-px" aria-hidden="true"></div>
			<div class="p-3 sm:p-6 compact:p-2 compact:sm:p-4">
				{@render children?.()}
			</div>
			<div bind:this={bottomSentinel} class="-mt-px h-px" aria-hidden="true"></div>
		</div>
	{:else}
		<div id={panelId} class="p-3 sm:p-6 compact:p-2 compact:sm:p-4 {isExpanded ? 'block' : 'hidden'}">
			{@render children?.()}
		</div>
	{/if}
	{#if footer}
		<div class="shrink-0 px-3 pb-3 sm:px-6 sm:pb-6 compact:px-2 compact:pb-2 compact:sm:px-4 compact:sm:pb-4 {isExpanded ? 'block' : 'hidden'}">
			{@render footer()}
		</div>
	{/if}
</div>

<style>
	/* The scroll fades are a mask on the content, not a white overlay on top of
	   it: nothing to match to the island's colour in either theme, and nothing
	   sitting over the rows to swallow a click. Registered so the edges ease in
	   and out rather than snapping; a browser without @property just snaps. */
	@property --island-fade-top {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}
	@property --island-fade-bottom {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}

	.island-scroll {
		--island-fade-top: 0px;
		--island-fade-bottom: 0px;
		mask-image: linear-gradient(
			to bottom,
			transparent,
			#000 var(--island-fade-top),
			#000 calc(100% - var(--island-fade-bottom)),
			transparent
		);
		transition:
			--island-fade-top 150ms ease-out,
			--island-fade-bottom 150ms ease-out;
	}
	.island-scroll.fade-top {
		--island-fade-top: 1.5rem;
	}
	.island-scroll.fade-bottom {
		--island-fade-bottom: 2rem;
	}
</style>
