<script>
	/**
	 * ToggleSwitch
	 *
	 * Naming: pass `ariaLabel` (or the older `customLabel`) and it names the
	 * switch. Pass nothing and no `aria-label` is emitted at all — which is the
	 * point. Almost every call site wraps this in `NamedControl`, whose
	 * `role="group" aria-labelledby` already names the row; an `aria-label` here
	 * would *override* that, and the old `Toggle ${label}` default did exactly
	 * that on every toggle in both portals. It also concatenated English, which
	 * the style guide forbids.
	 *
	 * `status` is the save state the host tracks for this switch. `saving` blocks
	 * clicks and spins in the knob (a badge on the icon variant) without dimming
	 * it: the switch is busy, not unavailable. `saved` shows a tick for as long
	 * as the host keeps it there.
	 */
	import { Check, LoaderCircle } from '@lucide/svelte';
	import SaveBadge from './SaveBadge.svelte';

	let {
		label = '', // Visible-label hint, kept for callers that pass it
		ariaLabel = '',
		customLabel = null,
		checked = false,
		onChange = () => {},
		disabled = false,
		colorOn = 'bg-azure-600',
		colorOff = 'bg-gray-300 dark:bg-gray-600',
		variant = 'default',
		iconOn = null,
		iconOff = null,
		iconSize = 18,
		onText = 'On',
		offText = 'Off',
		/** @type {'' | 'saving' | 'saved'} */
		status = '',
	} = $props();

	const saving = $derived(status === 'saving');
	const blocked = $derived(disabled || saving);

	// Only emit a name when one was actually supplied — see the note above.
	const name = $derived(customLabel || ariaLabel || undefined);

	// Squash-and-stretch plays on every *change*, not on first paint. Two
	// class names (not one) so a second click restarts the animation — a
	// single shared name would keep the computed `animation-name` identical
	// and the browser would not replay it.
	/** @type {null | 'on' | 'off'} */
	let travel = $state(null);
	let primed = false;
	$effect(() => {
		const on = checked;
		if (!primed) {
			primed = true;
			return;
		}
		travel = on ? 'on' : 'off';
	});
</script>

{#if variant === 'icon'}
	<button
		type="button"
		onclick={() => !blocked && onChange(!checked)}
		{disabled}
		aria-busy={saving || undefined}
		class="g2 relative flex items-center gap-2 rounded-lg p-2 transition-colors {saving
			? 'cursor-progress'
			: 'cursor-pointer'} disabled:cursor-default disabled:opacity-50 {checked
			? colorOn.replace('bg-', 'bg-') + ' text-white dark:text-zinc-750'
			: colorOff.replace('bg-', 'bg-') + ' text-gray-700 dark:text-gray-200'}"
		aria-label={name}
		title={name}
		role="switch"
		aria-checked={checked}
	>
		{#if checked && iconOn}
			{@const IconOn = iconOn}
			<IconOn size={iconSize} />
		{:else if !checked && iconOff}
			{@const IconOff = iconOff}
			<IconOff size={iconSize} />
		{/if}
		<SaveBadge {status} />
	</button>
{:else}
	<div class="flex gap-2 items-center">
		<p class="text-sm font-medium text-gray-700 dark:text-gray-200">
			{checked ? onText : offText}
		</p>
		<button
			type="button"
			onclick={() => !blocked && onChange(!checked)}
			{disabled}
			aria-busy={saving || undefined}
			class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {saving
				? 'cursor-progress'
				: 'cursor-pointer'} disabled:cursor-default disabled:opacity-50 {checked
				? colorOn
				: colorOff}"
			aria-label={name}
			role="switch"
			aria-checked={checked}
		>
			<span
				class="knob pointer-events-none absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white"
				class:on={checked}
				class:travel-on={travel === 'on'}
				class:travel-off={travel === 'off'}
			>
				{#if saving}
					<LoaderCircle size={12} strokeWidth={3} class="animate-spin text-azure-600" />
				{:else if status === 'saved'}
					<Check size={12} strokeWidth={3} class="text-green-alt-600" />
				{/if}
			</span>
		</button>
	</div>
{/if}

<style>
	/*
	  Position is `inset-inline-start` so LTR and RTL share one path; the
	  squish is a scale animation that Tailwind cannot express (start and
	  end are both 1, the stretch lives in the middle).
	*/
	.knob {
		--knob-off: 0.25rem;
		--knob-on: 1.5rem;
		inset-inline-start: var(--knob-off);
		transition: inset-inline-start 260ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.knob.on {
		inset-inline-start: var(--knob-on);
	}

	.knob.travel-on {
		animation: knob-squish-on 260ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.knob.travel-off {
		animation: knob-squish-off 260ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes knob-squish-on {
		0%,
		100% {
			transform: scale(1, 1);
		}
		40% {
			transform: scale(1.16, 0.86);
		}
		78% {
			transform: scale(0.96, 1.04);
		}
	}

	@keyframes knob-squish-off {
		0%,
		100% {
			transform: scale(1, 1);
		}
		40% {
			transform: scale(1.16, 0.86);
		}
		78% {
			transform: scale(0.96, 1.04);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.knob {
			transition: inset-inline-start 150ms ease;
		}

		.knob.travel-on,
		.knob.travel-off {
			animation: none;
		}
	}
</style>
