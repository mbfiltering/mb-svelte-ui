<script module>
	/**
	 * One fetch per icon per page lifetime, shared by every instance: the markup
	 * each icon resolved to, and the requests still in flight. Without it every
	 * mount went back to the network, so a section switch or collapse-all (which
	 * re-keys every island) re-requested every icon on screen and drew empty boxes
	 * until they landed.
	 *
	 * @type {Map<string, string>}
	 */
	const loaded = new Map();
	/** @type {Map<string, Promise<string>>} */
	const inFlight = new Map();

	/** @param {string} name */
	function loadIcon(name) {
		let request = inFlight.get(name);
		if (!request) {
			request = fetch(`/icons/${name}.svg`)
				.then((response) => {
					if (!response.ok) throw new Error('SVG not found');
					return response.text();
				})
				.then((text) => {
					loaded.set(name, text);
					return text;
				})
				// A failure is not remembered, so the next mount tries again, as before.
				.finally(() => inFlight.delete(name));
			inFlight.set(name, request);
		}
		return request;
	}
</script>

<script>
	import { onMount } from 'svelte';

	/**
	 * SvgIcon Component
	 * Inlines custom SVG icons from the /static/icons directory
	 * Allows full CSS control including colors via currentColor
	 *
	 * @param {string} name - Icon filename (without .svg extension)
	 * @param {string} size - Tailwind size class (e.g., 'w-6 h-6', 'w-4 h-4')
	 * @param {string} className - Additional CSS classes
	 */
	let { name, size = 'w-6 h-6', className = '' } = $props();

	// An icon another instance already fetched renders on the first frame.
	// svelte-ignore state_referenced_locally
	let svgContent = $state(loaded.get(name) ?? '');
	let loading = $state(!svgContent);
	let error = $state(false);

	// Icons are first-party assets served from /icons. Restrict the name to a
	// safe slug so a caller-supplied value can never redirect the fetch to an
	// arbitrary path (traversal) or feed the {@html} sink from an unexpected URL.
	const SAFE_ICON_NAME = /^[a-zA-Z0-9_-]+$/;

	onMount(async () => {
		if (!loading) return;

		if (!name || !SAFE_ICON_NAME.test(name)) {
			console.error(`Invalid SVG icon name: ${name}`);
			error = true;
			loading = false;
			return;
		}

		try {
			svgContent = await loadIcon(name);
			loading = false;
		} catch (err) {
			console.error(`Error loading SVG icon: ${name}`, err);
			error = true;
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="{size} {className}"></div>
{:else if error}
	<div class="{size} {className} rounded bg-gray-100"></div>
{:else}
	<div class="{size} {className} inline-block">
		{@html svgContent}
	</div>
{/if}

<style>
	div :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
