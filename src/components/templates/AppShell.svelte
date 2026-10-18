<script>
	import SvgIcon from '../atoms/SvgIcon.svelte';
	import Avatar from '../atoms/Avatar.svelte';
	import HeaderNav from '../molecules/HeaderNav.svelte';

	/**
	 * AppShell - Full page layout template.
	 *
	 * The header answers "who am I signed in as", the footer answers "what is
	 * this product" — deliberately two places, because the header used to carry
	 * whichever of the two an app happened to pass and the portals drifted apart
	 * over it.
	 *
	 * Includes:
	 * - Sticky header: account chip (avatar + name), app content, nav
	 * - Optional loading progress bar
	 * - Main content area
	 * - Faded brand footer with the product name and version
	 */
	let {
		// Account chip (header, start side)
		userName = '',
		userHref = '/dashboard',
		homeLabel = 'Home',

		// Nav (header, end side) — see HeaderNav for the NavItem shape
		navItems = [],
		menuLabel = 'Menu',
		navLabel = 'Main navigation',

		// The skip link: the first thing in the tab order, so a keyboard user can
		// jump the header (account chip, app search, the whole nav row) that
		// precedes <main> on every page.
		skipToContentLabel = 'Skip to main content',

		// Brand (footer)
		productName = '',
		brandIcon = 'mbsmart-logo',
		versionString = '',

		// Loading bar props
		loadingProgress = 0,
		isFullyLoaded = true,
		loadingLabel = 'Loading page',

		// Styling
		className = '',

		// Content snippets
		headerContent = undefined,
		children = undefined
	} = $props();
</script>

<!-- `--mb-header-h` is the sticky header's own height, published so that
     anything pinning itself underneath the header can read it instead of
     guessing. `PageHeader` is the one consumer today. Keep it in step with the
     `h-14` below: 14 * 4px = 56px. -->
<div
	class="flex min-h-screen flex-col bg-neutral-100 dark:bg-zinc-750 {className}"
	style="--mb-header-h: 56px"
>
	<!-- Skip link: off-screen until focused, then a normal-looking button pinned
	     over the header. `sr-only focus:not-sr-only` is the whole trick — it stays
	     in the tab order (unlike `hidden`) while taking no visual space. -->
	<a
		href="#main"
		class="g2 sr-only rounded-lg bg-white px-4 py-2 text-sm font-medium text-azure-700 shadow-lg focus:not-sr-only focus:absolute focus:top-2 focus:z-50 focus:ltr:left-2 focus:rtl:right-2 dark:bg-zinc-800 dark:text-azure-200"
	>
		{skipToContentLabel}
	</a>

	<!-- Sticky Header -->
	<header class="sticky top-0 z-20 h-14 bg-white px-4 py-2 shadow-lg dark:bg-zinc-800">
		<div class="flex items-center justify-between gap-4">
			<!-- Account chip: who is signed in, and the way home -->
			<a
				href={userHref}
				class="group flex min-w-0 items-center gap-2.5"
				aria-label={homeLabel}
				data-sveltekit-reload
			>
				<Avatar
					className="transition-colors group-hover:bg-azure-200 group-hover:text-azure-900 dark:group-hover:bg-azure-800 dark:group-hover:text-azure-100"
				/>
				{#if userName}
					<!-- leading-normal, not leading-none: `truncate` clips overflow, and a
					     1em line box cuts the descenders off a name like "Greg". -->
					<span
						class="truncate text-sm leading-normal font-semibold text-azure-700 transition-colors group-hover:text-azure-900 lg:text-base dark:text-azure-500 dark:group-hover:text-azure-100"
					>
						{userName}
					</span>
				{/if}
			</a>

			<!-- App content (search and the like), then the nav. Never shrinks, so a
			     long name truncates instead of pushing these off the bar. -->
			<div class="flex shrink-0 grow items-center justify-end gap-2 sm:gap-4">
				{#if headerContent}
					{@render headerContent()}
				{/if}
				<nav aria-label={navLabel}>
					<HeaderNav items={navItems} {menuLabel} />
				</nav>
			</div>
		</div>
	</header>

	<!-- Loading Progress Bar. Once loaded it is not just invisible but gone from
	     the a11y tree, so assistive tech is not left with a stale 100% bar. -->
	<div class="sticky top-14 left-0 z-20 w-full">
		<div
			role="progressbar"
			aria-label={loadingLabel}
			aria-valuenow={Math.round(loadingProgress)}
			aria-valuemin="0"
			aria-valuemax="100"
			aria-hidden={isFullyLoaded ? 'true' : undefined}
			class="absolute h-1 bg-azure-500 transition-all duration-300 ease-out {isFullyLoaded
				? 'opacity-0'
				: 'opacity-100'}"
			style="width: {loadingProgress}%"
		></div>
	</div>

	<!-- Main Content Area. `tabindex="-1"` is what lets the skip link actually
	     move focus here — without it the browser scrolls but focus stays put. -->
	<main id="main" tabindex="-1" class="flex-1 focus:outline-none">
		{#if children}
			{@render children()}
		{/if}
	</main>

	<!-- Brand Footer: faded, in-flow, the way a copyright line sits -->
	{#if productName}
		<footer
			class="flex select-none items-center justify-center gap-2 px-4 py-6 text-gray-900/40 dark:text-gray-50/35"
		>
			<SvgIcon name={brandIcon} size="w-4 h-4" className="shrink-0" />
			<p class="text-xs font-medium">
				{productName}{versionString ? ` · ${versionString}` : ''}
			</p>
		</footer>
	{/if}
</div>
