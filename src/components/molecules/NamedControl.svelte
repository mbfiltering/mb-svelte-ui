<script>
	import Info from '../atoms/Info.svelte';

	// Props - Svelte 5 style
	let {
		label = '',
		description = '',
		info = false,
		infoLabel = '',
		infoDirectory = null, // Custom info directory for i18n
		// Accessible name for the info trigger. Host apps pass a translated string;
		// left unset it falls back to Info's own English default.
		infoAriaLabel = undefined,
		prefix = undefined,
		children = undefined
	} = $props();

	// The visible label is the only thing naming the control(s) in the slot, and
	// a plain span names nothing. Grouping the row and pointing at that span
	// gives every wrapped toggle, selector and input an accessible name without
	// each call site having to repeat the label.
	// ($props.id() has to be the whole initializer — it cannot be interpolated.)
	const uid = $props.id();
	const labelId = `named-control-${uid}`;
</script>

<div
	role="group"
	aria-labelledby={labelId}
	class="g2 my-3 flex w-full flex-col justify-between gap-2 rounded-xl border border-neutral-100 p-3 sm:my-0 sm:flex-row sm:items-center sm:rounded-none sm:border-t-0 sm:border-r-0 sm:border-l-0 sm:px-0 compact:my-2 compact:p-2 compact:sm:my-0 compact:sm:px-0 compact:sm:py-2 dark:border-zinc-750"
>
	<div class="w-full sm:w-auto sm:flex-1">
		<div class="mb-1 flex items-center gap-2 font-medium text-gray-900 sm:mb-0 dark:text-gray-50">
			{#if prefix}
				{@render prefix()}
			{/if}
			<span id={labelId} class="">{label}</span>
			<span class="hidden h-5 sm:inline-block">
				{#if info}
					<Info label={infoLabel || label} {infoDirectory} ariaLabel={infoAriaLabel} />
				{/if}
			</span>
		</div>
		{#if description}
			<div class="text-sm text-gray-600 dark:text-gray-300">{description}</div>
		{/if}
		<div class="inline sm:hidden">
			{#if info}
				<Info label={infoLabel || label} variant="inline" {infoDirectory} ariaLabel={infoAriaLabel} />
			{/if}
		</div>
	</div>
	<div class="ms-auto">
		{@render children?.()}
	</div>
</div>
