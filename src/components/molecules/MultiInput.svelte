<script>
	import { toast } from '../../utils/toastStore.js';
	import CircleButton from '../atoms/CircleButton.svelte';
	import Clipboard from '../atoms/Clipboard.svelte';
	import TextInput from '../atoms/TextInput.svelte';
	import { Pencil, Check, X, Eye, EyeClosed } from '@lucide/svelte';

	// Props - Svelte 5 style
	let {
		fields = [],
		initialData = {},
		onSave = async () => {},
		onUpdate = () => {},
		// i18n props, the same set SingleInput takes
		editTitle = 'Edit',
		saveTitle = 'Save',
		savingTitle = 'Saving...',
		cancelTitle = 'Cancel',
		noChangesMessage = 'No changes to save',
		failedMessage = 'Update failed'
	} = $props();

	// Seeded from the first `initialData`; the $effect below re-seeds on change,
	// and the form owns the values in between.
	// svelte-ignore state_referenced_locally
	let formData = $state({ ...initialData });
	// svelte-ignore state_referenced_locally
	let originalFormData = $state({ ...initialData });
	let isEditing = $state(false);
	let isSaving = $state(false);

	// Track visibility for hidden fields (key -> boolean)
	let visibleFields = $state({});

	// Update form data when initialData changes
	$effect(() => {
		formData = { ...initialData };
		originalFormData = { ...initialData };
	});

	function toggleEdit() {
		if (isEditing) {
			// Cancel edit - reset form data
			formData = { ...originalFormData };
		}
		isEditing = !isEditing;
	}

	function toggleFieldVisibility(key) {
		visibleFields[key] = !visibleFields[key];
	}

	function getMaskedValue(value) {
		if (!value) return '';
		return '•'.repeat(value.length);
	}

	async function handleSave() {
		isSaving = true;

		// Only send fields that have changed
		const changedFields = {};
		let hasChanges = false;

		for (const key in formData) {
			if (formData[key] !== originalFormData[key]) {
				changedFields[key] = formData[key];
				hasChanges = true;
			}
		}

		// If nothing changed, just exit edit mode
		if (!hasChanges) {
			toast.info(noChangesMessage);
			isEditing = false;
			isSaving = false;
			return;
		}

		try {
			const result = await onSave(changedFields);

			if (result?.error) {
				toast.error(result.error);
			} else if (result?.ok || result === true) {
				isEditing = false;

				// Update original form data to match current values
				originalFormData = { ...formData };

				// Notify parent of the update
				onUpdate(formData);
			} else {
				toast.error(failedMessage);
			}
		} catch (error) {
			toast.error(failedMessage);
			console.error('Save error:', error);
		}

		isSaving = false;
	}
</script>

<form onsubmit={handleSave} class="space-y-6">
	<!-- Dynamic Fields Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each fields as field}
			{#if field.fullWidth}
				<!-- Full Width Field -->
				<div class="md:col-span-2">
					<label
						for="field-{field.key}"
						class="mb-2 flex h-6.5 items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200"
					>
						{field.label}
						{#if formData[field.key] && !isEditing}
							<Clipboard content={formData[field.key]} />
						{/if}
					</label>
					<TextInput
						id="field-{field.key}"
						type={field.type || 'text'}
						bind:value={formData[field.key]}
						disabled={!isEditing}
						rows={field.rows || 4}
						placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
					/>
				</div>
			{:else}
				<!-- Regular Field -->
				<div>
					<label
						for="field-{field.key}"
						class="flex h-6.5 items-center gap-1 text-sm font-medium text-gray-700 sm:mb-2 dark:text-gray-200"
					>
						{field.label}
						{#if formData[field.key] && !isEditing && (!field.hidden || visibleFields[field.key])}
							<Clipboard content={formData[field.key]} />
						{/if}
					</label>
					<div class="relative">
						{#if field.hidden && !isEditing}
							<!-- Hidden field display mode -->
							<div class="flex items-center gap-2">
								<TextInput
									id="field-{field.key}"
									type="text"
									value={visibleFields[field.key]
										? formData[field.key]
										: getMaskedValue(formData[field.key])}
									disabled={true}
									placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
								/>
								<button
									type="button"
									onclick={() => toggleFieldVisibility(field.key)}
									class="g2 flex p-3 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:bg-neutral-100 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-zinc-750 dark:hover:text-gray-200"
									title={visibleFields[field.key] ? 'Hide' : 'Show'}
								>
									{#if visibleFields[field.key]}
										<EyeClosed size={20} />
									{:else}
										<Eye size={20} />
									{/if}
								</button>
							</div>
						{:else}
							<!-- Normal input (editing mode or non-hidden field) -->
							<TextInput
								id="field-{field.key}"
								type={field.type || 'text'}
								bind:value={formData[field.key]}
								disabled={!isEditing}
								placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
							/>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Action Buttons -->
	<div class="flex gap-2">
		{#if !isEditing}
			<CircleButton onclick={toggleEdit} title={editTitle} icon={Pencil} />
		{:else}
			<CircleButton onclick={toggleEdit} disabled={isSaving} title={cancelTitle} icon={X} />
			<CircleButton type="submit" disabled={isSaving} loading={isSaving} title={isSaving ? savingTitle : saveTitle} color="azure" icon={Check} />
		{/if}
	</div>
</form>
