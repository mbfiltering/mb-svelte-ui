<script>
	/**
	 * Skeleton loading placeholder component
	 *
	 * @prop {string} height - Height class for the skeleton (default: 'h-48')
	 * @prop {string} width - Width class for the skeleton (default: '')
	 * @prop {string} rounded - Border radius class (default: 'g2 rounded-xl'). Pass a
	 *   plain radius (e.g. 'rounded-full') to opt out of the g2/squircle corner —
	 *   a skeleton should trace the shape of whatever it stands in for.
	 * @prop {string} className - Additional CSS classes
	 * @prop {Array} rows - Array of row definitions for sub-skeletons inside the main skeleton
	 *
	 * Row definition formats:
	 * - String: Full-width row with that height class, e.g. 'h-4'
	 * - Object with columns: Grid layout
	 *   { columns: 2, height: 'h-6' } - 2-column grid with equal widths
	 *   { columns: 3, height: 'h-4', gap: 'gap-4' } - 3-column grid with custom gap
	 *   { columns: [1, 2], height: 'h-6' } - Grid with column spans (1fr, 2fr)
	 *
	 * Example:
	 * <Skeleton rows={[
	 *   'h-6',                              // Full-width row
	 *   { columns: 2, height: 'h-4' },      // 2-column grid
	 *   'h-4',                              // Full-width row
	 *   { columns: [1, 3], height: 'h-8' }, // Grid with 1fr and 3fr columns
	 * ]} />
	 */

	let { height = 'h-48', width = '', rounded = 'g2 rounded-xl', className = '', rows = [] } =
		$props();

	// Process rows into a consistent format
	let processedRows = $derived(
		rows.map((row) => {
			if (typeof row === 'string') {
				// Simple full-width row
				return { type: 'full', height: row };
			} else if (row.columns) {
				// Grid row
				const columns = Array.isArray(row.columns) ? row.columns : Array(row.columns).fill(1);
				return {
					type: 'grid',
					columns,
					height: row.height || 'h-4',
					gap: row.gap || 'gap-3'
				};
			}
			return { type: 'full', height: 'h-4' };
		})
	);

	// Generate grid-template-columns style from column definitions
	function getGridStyle(columns) {
		return `grid-template-columns: ${columns.map((c) => `${c}fr`).join(' ')}`;
	}
</script>

{#if rows.length > 0}
	<!-- Skeleton with sub-rows -->
	<div data-skeleton class="{rounded} bg-gray-900/10 p-4 dark:bg-gray-50/10 {className}">
		<div class="flex flex-col gap-3">
			{#each processedRows as row}
				{#if row.type === 'full'}
					<div class="{row.height} animate-pulse rounded bg-gray-900/15 dark:bg-gray-50/15"></div>
				{:else if row.type === 'grid'}
					<div class="grid {row.gap}" style={getGridStyle(row.columns)}>
						{#each row.columns as _, i}
							<div
								class="{row.height} animate-pulse rounded bg-gray-900/15 dark:bg-gray-50/15"
							></div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{:else}
	<!-- Simple skeleton -->
	<div
		data-skeleton
		class="{height} {width} {rounded} animate-pulse bg-gray-900/10 dark:bg-gray-50/10 {className}"
	></div>
{/if}
