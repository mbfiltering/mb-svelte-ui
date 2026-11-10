<script>
	import { ChevronDown } from '@lucide/svelte';
	import {
		getNavButtonColorClasses,
		getNavButtonStateClasses,
		getNavMenuItemClasses,
		NAV_PANEL_CLASSES
	} from './navButtonStyles.js';
	import { dismissOnOutside } from '../../utils/dismiss.js';

	let {
		config = [],
		icon = null,
		label = '',
		title = '',
		color = 'azure',
		disabled = false,
		className = '',
		dropdownClassName = '',
		// Replaces the button's styling and content; gets `isOpen`
		trigger = undefined,
		// Rendered above the items, inside the panel
		panelTop = undefined
	} = $props();

	let isOpen = $state(false);
	let dropdownElement = null;
	let triggerElement = $state(null);

	// Ties the trigger to the panel it controls, per instance.
	// ($props.id() has to be the whole initializer — it cannot be interpolated.)
	const uid = $props.id();
	const panelId = `nav-dropdown-${uid}`;

	const items = $derived(Array.isArray(config) ? config.filter(Boolean) : []);
	const isTriggerDisabled = $derived(disabled || items.length === 0);
	const triggerClasses = $derived(
		trigger
			? className
			: `flex items-center gap-2 g2 rounded-lg border px-2 py-2 font-medium transition-colors xl:px-4 ${getNavButtonColorClasses(color)} ${className}`
	);
	const triggerStateClasses = $derived(getNavButtonStateClasses(isTriggerDisabled));

	function toggleDropdown() {
		if (isTriggerDisabled) return;
		isOpen = !isOpen;
	}

	function closeDropdown() {
		if (!isOpen) return;
		isOpen = false;
		// Escape and outside-clicks destroy the panel; without this, focus falls to
		// <body> and the keyboard user restarts from the top of the document.
		triggerElement?.focus();
	}

	function handleItemClick(item, event) {
		if (item.disabled) {
			event.preventDefault();
			return;
		}

		item.onclick?.(event);
		closeDropdown();
	}

	$effect(() => {
		if (!isOpen) return;
		return dismissOnOutside(() => dropdownElement, closeDropdown);
	});
</script>

<div class="relative inline-block max-w-full" bind:this={dropdownElement}>
	<button
		type="button"
		bind:this={triggerElement}
		onclick={toggleDropdown}
		disabled={isTriggerDisabled}
		class="{triggerClasses} {triggerStateClasses}"
		title={title || label}
		aria-label={title || label}
		aria-expanded={isOpen}
		aria-controls={panelId}
	>
		{#if trigger}
			{@render trigger(isOpen)}
		{:else}
			{#if icon}
				{@const IconComponent = icon}
				<IconComponent size={18} strokeWidth={2} />
			{/if}
			{#if label}
				<span class="hidden text-sm xl:inline">{label}</span>
			{/if}
			<ChevronDown
				size={16}
				strokeWidth={2}
				class="transition-transform {isOpen ? 'rotate-180' : ''}"
			/>
		{/if}
	</button>

	{#if isOpen}
		<!-- A disclosure of links, not an ARIA menu. `role="menu"` would promise
		     arrow-key navigation and a roving tabindex that this does not implement;
		     aria-expanded + aria-controls describe it correctly, and Tab works. -->
		<ul id={panelId} class="{NAV_PANEL_CLASSES} {dropdownClassName}" aria-label={title || label}>
			{#if panelTop}
				<li>{@render panelTop()}</li>
			{/if}
			{#each items as item}
				<li>
					{#if item.href && !item.onclick}
						<a
							href={item.disabled ? undefined : item.href}
							onclick={(event) => handleItemClick(item, event)}
							class={getNavMenuItemClasses(item)}
							title={item.title || item.label}
							aria-disabled={item.disabled}
							tabindex={item.disabled ? -1 : 0}
						>
							{#if item.icon}
								{@const ItemIcon = item.icon}
								<ItemIcon size={18} strokeWidth={2} aria-hidden="true" />
							{/if}
							{#if item.label}
								<span>{item.label}</span>
							{/if}
						</a>
					{:else}
						<button
							type="button"
							onclick={(event) => handleItemClick(item, event)}
							disabled={item.disabled}
							class={getNavMenuItemClasses(item)}
							title={item.title || item.label}
						>
							{#if item.icon}
								{@const ItemIcon = item.icon}
								<ItemIcon size={18} strokeWidth={2} aria-hidden="true" />
							{/if}
							{#if item.label}
								<span>{item.label}</span>
							{/if}
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>