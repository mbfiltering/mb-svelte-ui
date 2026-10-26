<script>
	import { onMount } from 'svelte';
	import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@lucide/svelte';

	// Props - Svelte 5 style
	let {
		message = '',
		type = 'success',
		duration = 8000,
		onClose = () => {},
		dismissLabel = 'Dismiss'
	} = $props();

	let visible = $state(false);
	let mounted = $state(false);

	// Type-specific styles
	const typeStyles = {
		success: 'bg-green-alt-500 text-white',
		error: 'bg-red-alt-500 text-white',
		info: 'bg-azure-700 text-white',
		warning: 'bg-yellow-500 text-white'
	};

	// Type-specific Lucide icons
	const typeIcons = {
		success: CheckCircle,
		error: XCircle,
		info: Info,
		warning: AlertTriangle
	};

	const IconComponent = $derived(typeIcons[type]);

	// Auto-dismiss is a time limit on reading the message (2.2.1), so it pauses
	// while the pointer is over the toast or focus is inside it — that is what
	// gives someone who needs longer a way to extend it.
	let paused = $state(false);
	// `duration` is fixed for the life of a toast; this seeds the countdown.
	// svelte-ignore state_referenced_locally
	let remaining = $state(duration);
	let lastTick = 0;
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let ticker;

	onMount(() => {
		// Trigger mount state first
		mounted = true;
		// Then trigger visible state for animation
		setTimeout(() => {
			visible = true;
		}, 10);

		if (duration <= 0) return;

		lastTick = performance.now();
		ticker = setInterval(() => {
			const now = performance.now();
			if (!paused) remaining -= now - lastTick;
			lastTick = now;
			if (remaining <= 0) {
				clearInterval(ticker);
				close();
			}
		}, 100);

		return () => clearInterval(ticker);
	});

	function close() {
		visible = false;
		setTimeout(() => {
			onClose();
		}, 300); // Wait for fade-out animation
	}
</script>

<!-- The toast itself is the message (role="alert"); dismissing it is a real
     button, so it works from the keyboard and announces its own name.
     `pointer-events-auto` undoes the container's `pointer-events-none`, which
     is inherited: the gaps around the toasts stay click-through, but the toast
     and its dismiss button take clicks (and hover, which pauses auto-dismiss). -->
<div
	class="g2 pointer-events-auto flex max-w-full items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 ease-out {typeStyles[
		type
	]} {visible ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-95 opacity-0'}"
	role="alert"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
>
	<!-- Icon -->
	<IconComponent size={20} class="shrink-0" aria-hidden="true" />

	<!-- Message -->
	<div class="min-w-0 flex-1 text-sm font-medium wrap-anywhere">{message}</div>

	<button
		type="button"
		onclick={close}
		class="-me-1 shrink-0 cursor-pointer rounded p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
		aria-label={dismissLabel}
	>
		<X size={16} aria-hidden="true" />
	</button>
</div>
