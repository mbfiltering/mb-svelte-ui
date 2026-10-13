<script>
	import { ChevronDown } from '@lucide/svelte';
	import SaveBadge from './SaveBadge.svelte';

	/**
	 * @typedef {{
	 * 	value: string,
	 * 	label?: string,
	 * 	color?: string,
	 * 	textColor?: string,
	 * 	disabled?: boolean,
	 * 	cursor?: string
	 * }} Option
	 */

	let {
		/** @type {Option[]} */
		options = [], // Array of { value, label, color, textColor, disabled?, cursor? }
		selected = '',
		value = '', // Support both selected and value for backwards compatibility
		onChange = () => {}, // Primary callback
		onSelect = () => {}, // Backwards compatibility
		disabled = false,
		visibleCount = 2,
		// The save state the host tracks for this control: `saving` blocks a new
		// pick and shows a spinner badge, without dimming it; `saved` shows a tick.
		/** @type {'' | 'saving' | 'saved'} */
		status = '',
		ariaLabel = '' // Names the group, e.g. "App status" — without it the
		// buttons announce as loose "Open"/"Closed" with nothing tying them together
	} = $props();

	const currentValue = $derived(selected ?? value);
	const saving = $derived(status === 'saving');

	// Clamp visibleCount to valid range
	const clampedCount = $derived(Math.max(1, Math.min(visibleCount, options.length)));

	// Whether we need a dropdown (more options than visible slots)
	const hasDropdown = $derived(options.length > clampedCount);

	// Fixed buttons shown as standalone toggles
	const fixedOptions = $derived(hasDropdown ? options.slice(0, clampedCount - 1) : options);
	const isDropdownOnly = $derived(hasDropdown && fixedOptions.length === 0);

	// All options that can appear in the dropdown button position
	const toggleableOptions = $derived(hasDropdown ? options.slice(clampedCount - 1) : []);

	// Track the last selected dropdown option (for toggle behavior)
	let lastDropdownSelection = $state(null);

	// Initialize lastDropdownSelection on first render if current value is a toggleable option
	$effect.pre(() => {
		if (lastDropdownSelection === null && toggleableOptions.length > 0) {
			const initialValue = selected ?? value;
			const isToggleableOption = toggleableOptions.some((opt) => opt.value === initialValue);
			if (isToggleableOption) {
				lastDropdownSelection = initialValue;
			}
		}
	});

	// Get the option to display in the dropdown button.
	// The live value wins over the remembered one: when the selection sits in the
	// dropdown's half, that is what the button must show, however it got there —
	// otherwise a change made elsewhere (a preset, a bulk action, a failed save
	// rolling back) leaves a stale label behind. The remembered pick is only the
	// fallback for when a *fixed* option is selected, so clicking the dropdown
	// button toggles back to where the user last was.
	const displayedDropdownOption = $derived.by(() => {
		const current = toggleableOptions.find((opt) => opt.value === currentValue);
		if (current) return current;
		if (lastDropdownSelection) {
			const remembered = toggleableOptions.find((opt) => opt.value === lastDropdownSelection);
			if (remembered) return remembered;
		}
		return toggleableOptions[0];
	});

	// Get the button color based on which option is selected
	function getButtonColor(option, isSelected) {
		if (!option) return 'bg-gray-100 dark:bg-zinc-750';
		// Show actual color only if selected, otherwise gray
		return isSelected
			? option.color || 'bg-gray-100 dark:bg-zinc-750'
			: 'bg-gray-100 dark:bg-zinc-750';
	}

	// Get the text color for a selected option (defaults to white)
	function getTextColor(option, isSelected) {
		if (!isSelected) return 'text-gray-700 dark:text-gray-200';
		return option?.textColor || 'text-white';
	}

	/**
	 * @param {Option | undefined} option
	 * @param {boolean | undefined} isDisabled
	 */
	function getCursorClass(option, isDisabled) {
		if (option?.disabled || isDisabled) return 'cursor-not-allowed';
		if (option?.cursor) return option.cursor;
		return 'cursor-pointer';
	}

	// Handle clicking a fixed option
	function handleFixedClick(optionValue) {
		if (disabled || saving) return;
		const option = options.find((o) => o.value === optionValue);
		if (option?.disabled) return;
		if (onChange) onChange(optionValue);
		if (onSelect) onSelect(optionValue);
	}

	// Handle clicking the dropdown button (toggle back to remembered selection)
	function handleDropdownButtonClick() {
		if (disabled || saving) return;
		if (displayedDropdownOption?.disabled) return;
		const targetValue = displayedDropdownOption?.value;
		lastDropdownSelection = targetValue;
		if (onChange) onChange(targetValue);
		if (onSelect) onSelect(targetValue);
	}

	// Handle selecting from dropdown
	function handleDropdownSelect(event) {
		if (disabled || saving) return;
		const selectedValue = event.target.value;
		lastDropdownSelection = selectedValue; // Remember this selection
		if (onChange) onChange(selectedValue);
		if (onSelect) onSelect(selectedValue);
	}
</script>

<div
	class="relative inline-flex items-center gap-0"
	role="group"
	aria-label={ariaLabel || undefined}
	aria-busy={saving || undefined}
>
	<!-- Fixed Option Buttons -->
	{#each fixedOptions as option, i}
		<button
			type="button"
			onclick={() => handleFixedClick(option.value)}
			disabled={disabled || option?.disabled}
			aria-pressed={currentValue === option?.value}
			class="g2 px-3 py-1.5 text-sm font-medium transition-all {i === 0
				? 'rounded-s-lg'
				: ''} {!hasDropdown && i === fixedOptions.length - 1
				? 'rounded-e-lg'
				: ''} {getButtonColor(option, currentValue === option?.value)} {getTextColor(
				option,
				currentValue === option?.value
			)} {disabled || option?.disabled
				? 'opacity-40'
				: currentValue === option?.value
					? 'opacity-100'
					: 'opacity-100 hover:opacity-80'} {getCursorClass(
				option,
				disabled || option?.disabled
			)}"
		>
			{option?.label || `Option ${i + 1}`}
		</button>
	{/each}

	<!-- Dropdown for remaining options -->
	{#if hasDropdown}
		<div
			class="g2 relative {fixedOptions.length === 0
				? 'rounded-lg'
				: 'rounded-e-lg'} {getButtonColor(
				displayedDropdownOption,
				currentValue === displayedDropdownOption?.value
			)}"
		>
			<button
				type="button"
				onclick={isDropdownOnly ? undefined : handleDropdownButtonClick}
				disabled={disabled || displayedDropdownOption?.disabled}
				aria-pressed={isDropdownOnly
					? undefined
					: currentValue === displayedDropdownOption?.value}
				aria-hidden={isDropdownOnly ? 'true' : undefined}
				tabindex={isDropdownOnly ? -1 : undefined}
				class="flex items-center gap-1 px-3 py-1.5 transition-all {getCursorClass(
					displayedDropdownOption,
					disabled || displayedDropdownOption?.disabled
				)} {disabled || displayedDropdownOption?.disabled ? 'opacity-40' : ''}"
			>
				<span
					class="text-sm font-medium {getTextColor(
						displayedDropdownOption,
						currentValue === displayedDropdownOption?.value
					)}"
				>
					{displayedDropdownOption?.label || 'Select'}
				</span>
				<ChevronDown
					size={14}
					strokeWidth={2}
					class={getTextColor(
						displayedDropdownOption,
						currentValue === displayedDropdownOption?.value
					)}
				/>
			</button>

			<!-- Visually transparent but the real control: it must carry the name. -->
			<select
				onchange={handleDropdownSelect}
				value={currentValue}
				disabled={disabled || saving}
				aria-label={ariaLabel || undefined}
				class="absolute top-0 ltr:right-0 rtl:left-0 {isDropdownOnly
					? 'h-full w-full'
					: 'h-8 w-8'} bg-white text-gray-900 opacity-0 dark:bg-zinc-800 dark:text-gray-100 {disabled
					? 'cursor-not-allowed'
					: 'cursor-pointer'}"
			>
				{#each toggleableOptions as option}
					<option
						value={option.value}
						disabled={option?.disabled}
						class="bg-white text-gray-900 dark:bg-zinc-800 dark:text-gray-100"
					>
						{option.label}
					</option>
				{/each}
			</select>
		</div>
	{/if}
	<SaveBadge {status} />
</div>
