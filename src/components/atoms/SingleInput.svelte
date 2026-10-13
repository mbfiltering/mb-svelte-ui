<script>
	import { toast } from '../../utils/toastStore.js';
	import CircleButton from './CircleButton.svelte';
	import Clipboard from './Clipboard.svelte';
	import TextInput from './TextInput.svelte';
	import { Pencil, Check, X } from '@lucide/svelte';

	// Props - Svelte 5 style
	let {
		label = 'Field',
		hideLabel = false,
		value = '',
		placeholder = 'Enter value...',
		rows = 3,
		type = 'textarea', // 'textarea' or 'text'
		size = 'sm', // 'sm' | 'lg' — display text size (default sm)
		showClipboard = true,
		onSave = async () => {},
		onUpdate = () => {},
		// i18n props for button titles
		editTitle = 'Edit',
		saveTitle = 'Save',
		savingTitle = 'Saving...',
		cancelTitle = 'Cancel',
		noChangesMessage = 'No changes to save',
		failedMessage = 'Update failed',
		emptyMessage = '', // Full message for empty state (overrides default)
		disabled = false
	} = $props();

	// Compute the message to show when empty
	const emptyText = $derived(emptyMessage || `No ${label.toLowerCase()} added yet.`);
	const textSizeClass = $derived(size === 'lg' ? 'text-lg' : 'text-sm');
	const inputSize = $derived(size === 'lg' ? 'lg' : 'sm');

	let isEditing = $state(false);
	// Initial value only by design — the $effect below keeps it in sync with the prop
	// svelte-ignore state_referenced_locally
	let currentValue = $state(value);
	let isSaving = $state(false);
	let saveError = $state('');

	// Update currentValue when value prop changes
	$effect(() => {
		currentValue = value;
	});

	function startEditing() {
		if (disabled) return;
		saveError = '';
		isEditing = true;
	}

	function cancelEditing() {
		currentValue = value;
		saveError = '';
		isEditing = false;
	}

	async function save() {
		// Check if value actually changed
		if (currentValue === value) {
			toast.info(noChangesMessage);
			isEditing = false;
			return;
		}

		isSaving = true;
		saveError = '';

		try {
			const result = await onSave(currentValue);

			if (result?.error) {
				saveError = result.error;
			} else if (result?.ok || result === true) {
				isEditing = false;
				// Notify parent of the update
				onUpdate(currentValue);
			} else {
				saveError = failedMessage;
			}
		} catch (error) {
			saveError = failedMessage;
			console.error('Save error:', error);
		}

		isSaving = false;
	}
</script>

<div
	class="mb-1 flex w-full items-start justify-between gap-1 {textSizeClass} font-medium text-gray-700 dark:text-gray-200"
>
	<div class="mt-[0.4rem] flex w-full items-start gap-1">
		{#if !hideLabel}
			<span class="whitespace-nowrap">
				{label}:
			</span>
		{/if}
		{#if showClipboard && value && !isEditing}
			<Clipboard content={value} />
		{/if}
		{#if isEditing}
			<TextInput
				{type}
				bind:value={currentValue}
				disabled={isSaving || disabled}
				{rows}
				{placeholder}
				size={inputSize}
				error={saveError}
			/>
		{:else if type === 'textarea'}
			<p
				class="flex-1 {textSizeClass} whitespace-pre-wrap {value
					? 'text-gray-700 dark:text-gray-200'
					: 'text-gray-400/80 dark:text-gray-500'}"
			>
				{value || emptyText}
			</p>
		{:else}
			<p
				class="flex-1 {textSizeClass} {value
					? 'text-gray-700 dark:text-gray-200'
					: 'text-gray-400/80 dark:text-gray-500'}"
			>
				{value || emptyText}
			</p>
		{/if}
	</div>

	{#if isEditing}
		<div class="flex flex-col gap-1">
			<CircleButton
				onclick={cancelEditing}
				disabled={isSaving || disabled}
				title={cancelTitle}
				icon={X}
			/>
			<CircleButton
				onclick={save}
				disabled={isSaving || disabled}
				loading={isSaving}
				title={isSaving ? savingTitle : saveTitle}
				color="azure"
				icon={Check}
			/>
		</div>
	{:else}
		<div class="flex items-start gap-1">
			<CircleButton onclick={startEditing} title={editTitle} icon={Pencil} {disabled} />
		</div>
	{/if}
</div>
