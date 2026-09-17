<script>
	import { X, Minus, SquareArrowOutUpLeft, SquareArrowOutUpRight } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { on } from 'svelte/events';
	import minimizedModals, {
		registerMinimized,
		unregisterMinimized,
		registerOpen,
		unregisterOpen,
		minimizeOthers
	} from '../../utils/minimizedModals.js';

	// Props - Svelte 5 style
	let {
		isOpen = false,
		onClose = () => {},
		showCloseButton = true,
		closeOnBackdrop = true,
		closeOnEscape = true,
		verticalAlign = 'center', // 'top', 'center', or 'bottom'
		overflowVisible = false,
		innerScroll = false, // The dialog does not scroll; its child fills the height and scrolls itself (ModalIsland)
		minimizable = false, // Show the minimize button and allow the corner chip
		ariaLabel = '', // Names the dialog for screen readers — pass the modal's own title
		closeLabel = 'Close modal', // aria-label/title for the close button
		minimizeLabel = 'Minimize modal', // aria-label/title for the minimize button
		maximizeLabel = 'Restore modal', // aria-label/title for the restore button
		minimizedLabel = '', // Text on the minimized chip; falls back to `ariaLabel`
		children = undefined
	} = $props();

	// Swipe-to-dismiss state (mobile bottom-sheet)
	let dragY = $state(0);
	let isDragging = $state(false);
	let dismissing = $state(false);
	let modalHeight = $state(0);

	// Focus management. `aria-modal="true"` tells assistive tech the rest of the
	// page is inert, so the dialog has to actually hold focus or the user is left
	// focused on something their screen reader has just hidden.
	let dialogEl = $state(null);
	/** @type {HTMLElement | null} */
	let returnFocusTo = null;

	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	/** Focusable children, in tab order, skipping anything hidden. */
	function focusableItems() {
		if (!dialogEl) return [];
		return Array.from(dialogEl.querySelectorAll(FOCUSABLE)).filter(
			(el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
		);
	}

	let startY = 0;
	let lastY = 0;
	let lastT = 0;
	let velocity = 0; // px/ms, positive = downward

	const DISMISS_THRESHOLD_RATIO = 0.28; // fraction of modal height
	const DISMISS_VELOCITY = 0.55; // px/ms flick speed
	const SNAP_MS = 200; // matches transition-transform duration

	// --- Minimize to the corner -------------------------------------------------
	// The chip's geometry is fixed and known up front, which is what lets the
	// dialog fly to it: minimizing is one transform on the dialog itself (it stays
	// mounted, so form state and scroll position survive), and the chip crossfades
	// in on top of where it lands.
	const CHIP_WIDTH = 256;
	const CHIP_HEIGHT = 44;
	const CHIP_EDGE = 16; // gap to the viewport edges
	const CHIP_GAP = 8; // gap between stacked chips
	const MINIMIZE_MS = 300; // matches the transition duration on the dialog

	// Ties this instance to its slot in the shared stack.
	const uid = $props.id();

	let minimized = $state(false);
	let animating = $state(false);
	/** @type {{ left: number, top: number, width: number, height: number } | null} Untransformed box, measured at minimize time */
	let baseRect = $state(null);
	let isRtl = $state(false);
	let chipEl = $state(null);
	let chipRestoreEl = $state(null);
	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let animateTimer;

	let stackIndex = $derived(Math.max(0, $minimizedModals.indexOf(uid)));
	let chipBottom = $derived(CHIP_EDGE + stackIndex * (CHIP_HEIGHT + CHIP_GAP));
	let chipLabel = $derived(minimizedLabel || ariaLabel);

	// Where the dialog has to land to sit exactly on top of its chip. Derived, so
	// a chip that slides down when the one below it closes takes the dialog with
	// it and the restore animation still starts from the right place.
	let minimizeTransform = $derived.by(() => {
		if (!baseRect) return '';
		const left = isRtl ? innerWidth - CHIP_EDGE - CHIP_WIDTH : CHIP_EDGE;
		const bottom = innerHeight - chipBottom;
		const scale = CHIP_WIDTH / baseRect.width;
		// Scale is uniform, so the shrunken dialog is taller than the chip: land it
		// on the chip's *bottom* edge, or a tall modal shrinks past the screen edge.
		return `translate(${left - baseRect.left}px, ${bottom - baseRect.top - baseRect.height * scale}px) scale(${scale})`;
	});

	let transform = $derived(
		minimized && minimizeTransform ? minimizeTransform : `translateY(${dragY}px)`
	);

	/** Run the 300ms flight, in either direction. */
	function animateFlight() {
		animating = true;
		clearTimeout(animateTimer);
		animateTimer = setTimeout(() => (animating = false), MINIMIZE_MS);
	}

	function minimize() {
		if (!dialogEl || minimized) return;
		const rect = dialogEl.getBoundingClientRect();
		// getBoundingClientRect() is post-transform; back the swipe offset out of it.
		baseRect = { left: rect.left, top: rect.top - dragY, width: rect.width, height: rect.height };
		// Claim the stack slot before the flight starts, or the dialog aims at
		// whichever slot is free now and hops up to its own one tick later.
		registerMinimized(uid);
		animateFlight();
		minimized = true;
		// Focus follows the modal into the corner, or it would be left on a button
		// inside a dialog that has just gone `inert`.
		requestAnimationFrame(() => chipRestoreEl?.focus());
	}

	function restore() {
		// Exactly one modal is maximized at a time: give up this slot, then send
		// whatever else is up down to the corner — in that order, so the modal
		// arriving lands in the slot this one is vacating instead of above it.
		unregisterMinimized(uid);
		minimizeOthers(uid);
		animateFlight();
		minimized = false;
		requestAnimationFrame(() => {
			const items = focusableItems();
			(items[0] ?? dialogEl)?.focus();
		});
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (dismissing || minimized) return;
		if (closeOnBackdrop && event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle escape key, and keep Tab inside the dialog.
	function handleKeydown(event) {
		if (!isOpen || dismissing) return;
		// A minimized modal has handed the page back to the user: it neither traps
		// Tab nor answers Escape.
		if (minimized) return;
		if (closeOnEscape && event.key === 'Escape') {
			onClose();
			return;
		}
		if (event.key !== 'Tab' || !dialogEl) return;

		const items = focusableItems();
		if (items.length === 0) {
			// Nothing to land on — keep focus on the dialog itself rather than
			// letting Tab escape to the page behind the backdrop.
			event.preventDefault();
			dialogEl.focus();
			return;
		}

		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;

		// Wrap at both ends, and pull focus back in if it has somehow got outside.
		if (event.shiftKey && (active === first || active === dialogEl)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		} else if (!dialogEl.contains(active)) {
			event.preventDefault();
			first.focus();
		}
	}

	// Pointer handlers cover both touch and mouse. Pointer capture keeps the
	// drag alive even when the finger/cursor slides off the small handle.
	function handlePointerDown(event) {
		if (dismissing) return;
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		isDragging = true;
		startY = event.clientY;
		lastY = event.clientY;
		lastT = performance.now();
		velocity = 0;
		try {
			event.currentTarget.setPointerCapture(event.pointerId);
		} catch {
			/* ignore */
		}
	}

	function handlePointerMove(event) {
		if (!isDragging || dismissing) return;
		const y = event.clientY;
		const now = performance.now();
		// Only allow dragging down (positive diff)
		dragY = Math.max(0, y - startY);
		const dt = now - lastT;
		if (dt > 0) velocity = (y - lastY) / dt;
		lastY = y;
		lastT = now;
	}

	function handlePointerUp() {
		if (!isDragging || dismissing) return;
		isDragging = false;

		const shouldDismiss =
			dragY >= modalHeight * DISMISS_THRESHOLD_RATIO || velocity >= DISMISS_VELOCITY;
		if (shouldDismiss) {
			// Animate the sheet off-screen, then close once it's out of view.
			dismissing = true;
			dragY = modalHeight + 48;
			setTimeout(onClose, SNAP_MS);
		} else {
			// Snap back to rest.
			dragY = 0;
		}
	}

	// Reset drag state whenever the modal is closed (externally or by dismiss).
	$effect(() => {
		if (!isOpen) {
			dragY = 0;
			isDragging = false;
			dismissing = false;
			minimized = false;
			animating = false;
			baseRect = null;
		}
	});

	// Hold a slot in the shared stack for exactly as long as this modal is
	// minimized — the teardown also covers closing and unmounting while minimized.
	$effect(() => {
		if (!isOpen || !minimized) return;
		registerMinimized(uid);
		return () => unregisterMinimized(uid);
	});

	// Reachable from a sibling for as long as this modal is open and can minimize.
	$effect(() => {
		if (!isOpen || !minimizable) return;
		registerOpen(uid, minimize);
		return () => unregisterOpen(uid);
	});

	// Window listeners only while open. Closed modals stay mounted all over the
	// portals (a device page holds about twenty), and every handler here already
	// ignores a closed modal, so binding them for the modal's whole life cost a
	// keydown handler and two state writes per resize for nothing. The viewport
	// size is read on open and followed while open, which is when the minimized
	// chip's position depends on it.
	$effect(() => {
		if (!isOpen) return;
		const readViewport = () => {
			innerWidth = window.innerWidth;
			innerHeight = window.innerHeight;
		};
		readViewport();
		const offKeydown = on(window, 'keydown', handleKeydown);
		const offResize = on(window, 'resize', readViewport);
		return () => {
			offKeydown();
			offResize();
		};
	});

	// The chip corner and the restore icon mirror, so read the direction the page
	// is actually rendering in. Re-read on open: the language can change under us.
	$effect(() => {
		if (!isOpen) return;
		isRtl = getComputedStyle(document.documentElement).direction === 'rtl';
	});

	// Move focus in on open and put it back on close. Several call sites focus
	// their own search input on open; that runs after this and wins, which is the
	// behaviour we want — this only guarantees focus lands *somewhere* inside.
	$effect(() => {
		if (!isOpen) return;

		returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		// One frame, so the children the trap needs to find are actually rendered.
		const frame = requestAnimationFrame(() => {
			if (!dialogEl) return;
			if (dialogEl.contains(document.activeElement)) return;
			const items = focusableItems();
			(items[0] ?? dialogEl).focus();
		});

		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(animateTimer);
			// Only take focus back if the dialog still owns it — if something else
			// has deliberately moved focus on close, don't fight it. The chip counts
			// as the dialog here; closing from the corner has to return focus too.
			const active = document.activeElement;
			if (
				!dialogEl ||
				dialogEl.contains(active) ||
				chipEl?.contains(active) ||
				active === document.body
			) {
				returnFocusTo?.focus();
			}
			returnFocusTo = null;
		};
	});

	// Corner buttons: one literal class string, two positions. The trailing corner
	// belongs to close when it is shown, so minimize sits inboard of it.
	const CORNER_BUTTON =
		'g2 hidden sm:block sm:absolute top-1 z-10 cursor-pointer rounded-lg p-2 text-gray-700 transition-colors hover:bg-neutral-100 hover:text-gray-900 sm:top-2 dark:text-gray-200 dark:hover:bg-zinc-750 dark:hover:text-white';
	const CHIP_BUTTON =
		'g2 shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-700 transition-colors hover:bg-neutral-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-zinc-750 dark:hover:text-white';
</script>

{#if isOpen}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 flex {verticalAlign === 'top'
			? 'items-end sm:items-start'
			: verticalAlign === 'bottom'
				? 'items-end'
				: 'items-end sm:items-center'} justify-center transition-colors duration-300 sm:p-6 md:p-8 {minimized
			? 'z-60 pointer-events-none bg-transparent'
			: 'z-50 bg-neutral-900/40 dark:bg-neutral-900/60'}"
		onclick={handleBackdropClick}
	>
		<!-- Modal Content Container -->
		<div
			bind:this={dialogEl}
			bind:clientHeight={modalHeight}
			role="dialog"
			aria-modal={!minimized}
			aria-label={ariaLabel || undefined}
			inert={minimized}
			tabindex="-1"
			class="relative max-h-[90dvh] w-full max-w-3xl focus:outline-none {innerScroll
				? 'flex flex-col overflow-hidden'
				: overflowVisible
					? 'overflow-visible'
					: 'overflow-auto'} {isDragging
				? ''
				: minimized || animating
					? 'transition-[transform,opacity] duration-300 ease-in-out'
					: 'transition-transform duration-200'} {minimized ? 'pointer-events-none opacity-0' : ''}"
			style="transform: {transform}; transform-origin: 0 0;"
		>
			<!-- Close Button -->
			{#if showCloseButton}
				<button
					type="button"
					onclick={onClose}
					class="{CORNER_BUTTON} rtl:left-1 ltr:right-1 ltr:sm:right-2 rtl:sm:left-2"
					aria-label={closeLabel}
					title={closeLabel}
				>
					<X size={20} aria-hidden="true" />
				</button>
			{/if}
			<!-- Minimize Button (modal-level, so it sits beside close whatever the content is) -->
			{#if minimizable}
				<button
					type="button"
					onclick={minimize}
					class="{CORNER_BUTTON} {showCloseButton
						? 'rtl:left-10 ltr:right-10 ltr:sm:right-11 rtl:sm:left-11'
						: 'rtl:left-1 ltr:right-1 ltr:sm:right-2 rtl:sm:left-2'}"
					aria-label={minimizeLabel}
					title={minimizeLabel}
				>
					<Minus size={20} aria-hidden="true" />
				</button>
			{/if}
			<!-- Bottom Sheet Handle (swipe to dismiss on mobile) -->
			<!-- Pointer-only affordance: Escape and the close button already cover
			     keyboard and assistive tech, so it stays out of the a11y tree. -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				aria-hidden="true"
				class="absolute sm:hidden w-full h-8 top-0 left-0 flex pt-2 justify-center cursor-grab active:cursor-grabbing touch-none select-none"
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
			>
				<div class="bg-gray-600 dark:bg-gray-300 rounded-full w-1/4 h-1"></div>
			</div>

			<!-- Slot Content -->
			{@render children?.()}
		</div>

		<!-- Minimized chip. Stacks up from the bottom corner — leading edge, so it
		     lands bottom-right under RTL without a second rule. -->
		{#if minimizable && minimized}
			<div
				bind:this={chipEl}
				in:fade={{ duration: 150, delay: 150 }}
				out:fade={{ duration: 100 }}
				class="pointer-events-auto fixed transition-[bottom] duration-300 ease-in-out"
				style="width: {CHIP_WIDTH}px; height: {CHIP_HEIGHT}px; bottom: {chipBottom}px; inset-inline-start: {CHIP_EDGE}px;"
			>
				<div
					class="g2 flex h-full items-center gap-1 rounded-xl border-2 border-azure-500 bg-white px-2 shadow-lg dark:border-azure-400 dark:bg-zinc-800"
				>
					<button
						type="button"
						onclick={restore}
						class="min-w-0 flex-1 cursor-pointer truncate px-1 text-start text-sm font-medium text-gray-900 dark:text-gray-50"
						title={chipLabel}
					>
						{chipLabel}
					</button>
					<button
						type="button"
						bind:this={chipRestoreEl}
						onclick={restore}
						class={CHIP_BUTTON}
						aria-label={maximizeLabel}
						title={maximizeLabel}
					>
						{#if isRtl}
							<SquareArrowOutUpLeft size={18} aria-hidden="true" />
						{:else}
							<SquareArrowOutUpRight size={18} aria-hidden="true" />
						{/if}
					</button>
					{#if showCloseButton}
						<button
							type="button"
							onclick={onClose}
							class={CHIP_BUTTON}
							aria-label={closeLabel}
							title={closeLabel}
						>
							<X size={18} aria-hidden="true" />
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
