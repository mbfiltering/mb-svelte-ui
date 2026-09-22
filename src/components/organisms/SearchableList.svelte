<script>
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import Checkbox from '../atoms/CheckBox.svelte';
	import CircleButton from '../atoms/CircleButton.svelte';
	import TextInput from '../atoms/TextInput.svelte';
	import Grid from '../molecules/Grid.svelte';
	import { fuzzyIncludes } from '../../utils/stringUtils.js';

	// Props - Svelte 5 style
	let {
		title = 'Items',
		items = [],
		searchKeys = [],
		searchPlaceholder = 'Search...',
		searchThreshold = 0, // Only show the search input once items.length reaches this count (0 = always show)
		specialFilters = {},
		emptyMessage = 'No items found',
		itemName = 'item',
		itemNamePlural = '', // Optional plural form (if not provided, will auto-pluralize itemName)
		filterTabs = [], // Array of { key, label, filterFn }
		// Column counts, forwarded to Grid. `columns` is the base (the grid only
		// starts at 640px — below that Grid falls back to normal flow), and every
		// other stop is opt-in: left null it inherits the stop below it. The
		// xl/xl2/2xl trio keeps its historical defaults so existing call sites
		// lay out exactly as before.
		columns = 1, // Number of columns for calculating rows
		columnsSm = null, // 640px+ column count
		columnsSm2 = null, // 700px+ column count
		columnsMd = null, // 768px+ column count
		columnsMd2 = null, // 850px+ column count
		columnsLg = null, // 1024px+ column count
		columnsLg2 = null, // 1150px+ column count
		columnsXl = 1, // 1280px+ column count
		columnsXl2 = 1, // 1440px+ column count
		columns2Xl = 2, // 1536px+ column count
		columns2Xl2 = null, // 1650px+ column count
		columns3Xl = null, // 1920px+ column count
		columns3Xl2 = null, // 2100px+ column count
		disableGrid = false, // When true, items display in normal flow instead of grid
		searchActions = undefined, // Optional actions rendered beside the search input
		children = undefined,
		// Bulk selection props
		bulk = false,
		selected = $bindable([]), // array of selected item ids (bind:selected)
		selectedItems = $bindable([]), // array of selected item objects (bind:selectedItems)
		selectId = 'id',
		idKey = null, // Optional key to use for the each block (overrides auto-detection)
		// Pagination props
		pageSize = 24, // 0 = no pagination, >0 = items per page
		externalQuery = '', // Supplied search query from outside (e.g. SectionedPage magic search)
		// Same string as the enclosing island's data-magicsearch. When
		// externalQuery matches these terms, the island itself is the hit and
		// rows stay unfiltered — CSS already shows every child of a matching
		// island, and emptying the list would make it look like it had none.
		// Omit to fall back to the closest .magicsearch-island after mount.
		containerTerms = '',
		// The built-in search box's text. Bindable so a parent can read what is
		// being searched for — e.g. to widen `items` beyond the category it is
		// currently showing while a query is active — or clear it.
		searchQuery = $bindable(''),
		// Anything the parent narrows `items` by from outside (its own tabs, a
		// category picker). A change sends the list back to page 1, like the
		// built-in search and filter tabs do. `items` itself is not watched, so
		// a refetch of the same view keeps the page it is on.
		resetKey = undefined,
		// i18n text props
		ofText = 'of', // "of" text for "X of Y items"
		selectedText = 'selected', // "selected" text for bulk mode
		pageText = 'Page', // "Page" label for pagination
		prevText = 'Previous', // aria-label for previous button
		nextText = 'Next', // aria-label for next button
		showAllText = 'Show all', // label for the show-all link
		paginateText = 'Paginate', // label to return to paginated view
		filtersLabel = 'Filter', // aria-label for the filter tab group
		selectAllLabel = 'Select all visible', // aria-label for the bulk select-all checkbox
		// Names each row's own bulk checkbox. Gets the item, so the row's subject
		// lands in the label — "Select WhatsApp", not a list of "Select" checkboxes.
		selectItemLabel = undefined,
		// Optional full count-line override (e.g. "You have 3 devices"), applied
		// only when every item is visible at a glance — nothing hidden by search,
		// tabs, or pagination. A non-empty string replaces both "X of Y" and
		// "Y items"; return null/undefined/'' to keep the default forms.
		formatAllCount = null, // (count: number) => string | null | undefined
		// Set false when the parent renders its own count line.
		showResultsCount = true
	} = $props();

	// First tab is the initial selection only; clicking a tab owns it afterwards.
	// svelte-ignore state_referenced_locally
	let activeFilter = $state(filterTabs.length > 0 ? filterTabs[0].key : null);
	let currentPage = $state(1);
	let showAll = $state(false);

	// Only surface the search input once the list is long enough to warrant it.
	const showSearch = $derived(searchThreshold <= 0 || items.length >= searchThreshold);

	let rootEl = $state(null);

	// Island-title hit: the query matched the container, not the rows. Skip
	// the JS filter so the list stays intact (still paginated). Item hits
	// keep filtering so a name on page 3 is findable without mounting the
	// whole array for CSS to scan.
	const containerMatched = $derived.by(() => {
		const q = externalQuery.trim().toLowerCase();
		if (!q) return false;
		const terms = (
			containerTerms ||
			rootEl?.closest('.magicsearch-island')?.dataset.magicsearch ||
			''
		).toLowerCase();
		return terms ? fuzzyIncludes(q, terms) : false;
	});

	// Effective query: externalQuery takes priority over the built-in search,
	// except when the enclosing island already matched — then only the list's
	// own box filters.
	const effectiveQuery = $derived(
		containerMatched ? searchQuery : externalQuery.trim() || searchQuery
	);

	// Reset to page 1 and collapse show-all when search, filter or resetKey changes
	$effect(() => {
		// track dependencies
		void effectiveQuery;
		void activeFilter;
		void resetKey;
		currentPage = 1;
		showAll = false;
	});

	const totalPages = $derived(pageSize > 0 ? Math.max(1, Math.ceil(filteredItems.length / pageSize)) : 1);

	// Clamp page if items shrink
	$effect(() => {
		if (currentPage > totalPages) currentPage = totalPages;
	});

	const paginatedItems = $derived.by(() => {
		if (pageSize <= 0 || showAll) return filteredItems;
		const start = (currentPage - 1) * pageSize;
		return filteredItems.slice(start, start + pageSize);
	});

	// Only show the "X of Y" form when the current page hides some results.
	// When everything fits on one page, "Y items" is clearer than "Y of Y items".
	const isPartialView = $derived(paginatedItems.length < filteredItems.length);

	// Optional count override (e.g. "You have 3 devices"), only while the whole
	// list is on screen — once search, tabs, or pagination hide items, the
	// default "X of Y" / "Y items" forms describe what's visible instead.
	const customCountLabel = $derived(
		typeof formatAllCount === 'function' && paginatedItems.length === items.length
			? formatAllCount(items.length)
			: null
	);

	// Get plural form of item name with proper pluralization rules
	const pluralItemName = $derived.by(() => {
		// If explicit plural provided, use it
		if (itemNamePlural) {
			return items.length === 1 ? itemName : itemNamePlural;
		}

		if (items.length === 1) return itemName;

		// Handle irregular plurals
		const irregularPlurals = {
			category: 'categories',
			app: 'apps',
			item: 'items',
			device: 'devices',
			customer: 'customers'
		};

		if (irregularPlurals[itemName.toLowerCase()]) {
			return irregularPlurals[itemName.toLowerCase()];
		}

		// Handle words ending in 'y' preceded by a consonant
		if (/[^aeiou]y$/i.test(itemName)) {
			return itemName.slice(0, -1) + 'ies';
		}

		// Default: just add 's'
		return `${itemName}s`;
	});

	// Apply tab filter first, then search filter
	const filteredItems = $derived.by(() => {
		// First apply tab filter if active
		let tabFilteredItems = items;
		if (activeFilter && filterTabs.length > 0) {
			const activeTab = filterTabs.find((tab) => tab.key === activeFilter);
			if (activeTab && activeTab.filterFn) {
				tabFilteredItems = items.filter(activeTab.filterFn);
			}
		}

		// Then apply search filter
		if (!effectiveQuery.trim()) {
			return tabFilteredItems;
		}

		const query = effectiveQuery.toLowerCase().trim();

		// Check if query matches any special filter
		for (const [filterKey, filterValue] of Object.entries(specialFilters)) {
			if (query === filterKey.toLowerCase()) {
				return tabFilteredItems.filter((item) => {
					const itemValue = getNestedValue(item, filterValue.path);
					return itemValue === filterValue.value;
				});
			}
		}

		// Regular search across specified keys (with fuzzy matching)
		return tabFilteredItems.filter((item) => {
			return searchKeys.some((key) => {
				const value = getNestedValue(item, key);
				return value && fuzzyIncludes(query, String(value).toLowerCase());
			});
		});
	});

	// Derived list of visible ids for current page
	const visibleIds = $derived.by(() =>
		paginatedItems.map((it) => getItemId(it)).filter((id) => id !== undefined && id !== null)
	);

	const allVisibleSelected = $derived.by(() => {
		const ids = visibleIds;
		if (ids.length === 0) return false;
		return ids.every((id) => selected.indexOf(id) !== -1);
	});

	const someVisibleSelected = $derived.by(() => {
		const ids = visibleIds;
		return ids.some((id) => selected.indexOf(id) !== -1);
	});

	function toggleSelectAllVisible() {
		const ids = visibleIds;
		if (ids.length === 0) return;
		const allSelected = allVisibleSelected;
		if (allSelected) {
			// unselect visible ids
			selected = selected.filter((id) => !ids.includes(id));
			selectedItems = selectedItems.filter((it) => !ids.includes(getItemId(it)));
		} else {
			// add missing visible ids
			const newSelected = Array.from(new Set([...selected, ...ids]));
			selected = newSelected;
			// ensure selectedItems contains the visible objects
			const vis = paginatedItems;
			vis.forEach((it) => {
				const id = getItemId(it);
				if (!selectedItems.some((si) => getItemId(si) === id)) selectedItems.push(it);
			});
		}
	}

	// Helper to get item id by selectId path
	function getItemId(item) {
		return getNestedValue(item, selectId);
	}

	// Toggle selection for an item (by id)
	function toggleSelect(item) {
		const id = getItemId(item);
		if (id === undefined || id === null) return;

		const idx = selected.indexOf(id);
		if (idx === -1) {
			// add
			selected = [...selected, id];
			selectedItems = [...selectedItems, item];
		} else {
			// remove
			selected = selected.filter((s) => s !== id);
			selectedItems = selectedItems.filter((it) => getItemId(it) !== id);
		}
	}

	// Utility: check if item is selected
	function isSelected(item) {
		const id = getItemId(item);
		return id !== undefined && id !== null && selected.indexOf(id) !== -1;
	}

	// Helper function to get nested values from object
	function getNestedValue(obj, path) {
		return path.split('.').reduce((current, prop) => current?.[prop], obj);
	}

</script>

<div class="space-y-4" bind:this={rootEl}>
	<!-- Filter Tabs -->
	{#if filterTabs.length > 0}
		<div
			role="group"
			aria-label={filtersLabel}
			class="flex gap-2 border-b border-neutral-100 dark:border-zinc-750"
		>
			{#each filterTabs as tab}
				<button
					type="button"
					onclick={() => (activeFilter = tab.key)}
					aria-pressed={activeFilter === tab.key}
					class="cursor-pointer border-b-2 px-4 py-2 text-sm transition-colors {activeFilter ===
					tab.key
						? 'border-azure-700 font-semibold text-azure-700 dark:border-azure-200 dark:text-azure-200'
						: 'border-transparent font-medium text-gray-900/50 hover:text-azure-700 dark:text-gray-400 dark:hover:text-azure-200'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Search Bar with Actions -->
	{#if showSearch || searchActions}
		<div class="magicsearch-item flex flex-col items-center gap-3 md:flex-row">
			{#if showSearch}
				<div class="relative flex w-full flex-1 gap-1 md:w-auto">
					{#if bulk}
						<div class="me-2 flex items-center">
							<Checkbox
								checked={allVisibleSelected}
								indeterminate={someVisibleSelected && !allVisibleSelected}
								onclick={toggleSelectAllVisible}
								ariaLabel={selectAllLabel}
							/>
						</div>
					{/if}
					<TextInput
						bind:value={searchQuery}
						placeholder={searchPlaceholder}
						size="sm"
						showSearchIcon
					/>
				</div>
			{/if}
			<!-- Optional actions slot -->
			{#if searchActions}
				<div class="flex w-full shrink-0 gap-2 sm:w-auto">
					{@render searchActions?.(activeFilter)}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Results Count -->
	{#if showResultsCount}
		<div class="magicsearch-item text-sm text-gray-600 dark:text-gray-300">
			{#if customCountLabel != null && customCountLabel !== ''}
				{customCountLabel}{bulk ? `, ${selected.length} ${selectedText}` : ''}
			{:else if isPartialView}
				{paginatedItems.length} {ofText} {filteredItems.length} {pluralItemName}{bulk ? `, ${selected.length} ${selectedText}` : ''}
			{:else}
				{filteredItems.length} {pluralItemName}{bulk ? `, ${selected.length} ${selectedText}` : ''}
			{/if}
		</div>
	{/if}

	<!-- List Container -->
	<Grid
		flow="col"
		itemCount={paginatedItems.length}
		{columns}
		{columnsSm}
		{columnsSm2}
		{columnsMd}
		{columnsMd2}
		{columnsLg}
		{columnsLg2}
		{columnsXl}
		{columnsXl2}
		{columns2Xl}
		{columns2Xl2}
		{columns3Xl}
		{columns3Xl2}
		disabled={disableGrid}
	>
		{#if paginatedItems.length === 0}
			<div class="rounded-lg py-8 text-center text-gray-500 dark:text-gray-400">
				{emptyMessage}
			</div>
		{:else}
			{#each paginatedItems as item, index (idKey ? item[idKey] : item.package || item.url || item.id || index)}
				{#if bulk}
					<div class="flex items-center gap-3">
						<div class="magicsearch-item flex items-start">
							<Checkbox
								checked={isSelected(item)}
								onclick={() => toggleSelect(item)}
								ariaLabel={selectItemLabel?.(item) ?? selectAllLabel}
							/>
						</div>
						<div class="flex-1 min-w-0">{@render children?.(item, activeFilter)}</div>
					</div>
				{:else}
					{@render children?.(item, activeFilter)}
				{/if}
			{/each}
		{/if}
	</Grid>

	<!-- Pagination Controls -->
	{#if pageSize > 0 && totalPages > 1}
		<div class="flex items-center justify-center gap-2 pt-2">
			{#if showAll}
				<button
					type="button"
					onclick={() => (showAll = false)}
					class="cursor-pointer text-sm text-azure-700 hover:underline"
				>
					{paginateText}
				</button>
			{:else}
				<CircleButton
					icon={ChevronLeft}
					title={prevText}
					disabled={currentPage <= 1}
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					color="ghost2"
					size="sm"
					className="rtl:rotate-180"
				/>

				<span class="text-sm text-gray-600 dark:text-gray-300">
					{pageText} {currentPage} {ofText} {totalPages}
				</span>

				<CircleButton
					icon={ChevronRight}
					title={nextText}
					disabled={currentPage >= totalPages}
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					color="ghost2"
					size="sm"
					className="rtl:rotate-180"
				/>

				<span class="text-gray-300 dark:text-gray-600" aria-hidden="true">|</span>

				<button
					type="button"
					onclick={() => (showAll = true)}
					class="cursor-pointer text-sm text-azure-700 hover:underline"
				>
					{showAllText}
				</button>
			{/if}
		</div>
	{/if}
</div>
