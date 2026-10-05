<script>
	/**
	 * A translated line with its `**bold**` spans picked out as `<strong>`.
	 *
	 * Markers rather than markup because the strings are edited by hand in six
	 * languages: a stray unclosed tag would be `{@html}` shipping broken layout,
	 * while a stray `**` is a visible, harmless pair of asterisks. An unpaired marker
	 * emphasises the tail rather than throwing.
	 *
	 * Emits spans and no wrapper, so the caller keeps its own element and classes.
	 *
	 * @prop {string} text
	 */
	let { text } = $props();

	const parts = $derived(
		String(text ?? '')
			.split('**')
			.map((part, index) => ({ part, bold: index % 2 === 1 }))
	);
</script>

{#each parts as { part, bold }, index (index)}{#if bold}<strong class="font-semibold">{part}</strong
		>{:else}{part}{/if}{/each}
