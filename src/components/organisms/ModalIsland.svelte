<script>
	import Modal from './Modal.svelte';
	import Island from '../molecules/Island.svelte';

	/**
	 * A Modal holding one Island: the shape almost every dialog in the portals
	 * takes. The island's header (and `footer`, when given) stay put while only
	 * the content scrolls, with a fade at whichever edge has more to see.
	 *
	 * Deliberately thin. Every other prop goes straight to Modal (`isOpen`,
	 * `onClose`, `minimizable`, `verticalAlign`, the labels, ...). A dialog that
	 * needs more than this, such as two islands, uses Modal and Island directly.
	 */
	let {
		title = '',
		icon = null,
		svgIcon = '',
		ariaLabel = '', // Falls back to `title`
		footer = undefined,
		children = undefined,
		...modalProps
	} = $props();
</script>

<Modal {...modalProps} ariaLabel={ariaLabel || title} innerScroll>
	<Island
		{title}
		{icon}
		{svgIcon}
		{footer}
		collapsible={false}
		scrollBody
		className="rounded-b-none sm:rounded-b-xl"
	>
		{@render children?.()}
	</Island>
</Modal>
