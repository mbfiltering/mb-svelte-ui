<script>
	/**
	 * A value drawn as a QR code, as inline SVG built from `qrcode-generator`'s
	 * module matrix: one `<path>`, no `{@html}`, scales to its box.
	 *
	 * **Always dark-on-white, in both colour schemes.** Scanners expect dark
	 * modules on a light field and plenty refuse an inverted code, so a QR that
	 * matched the page but would not scan would be worse than one that does not
	 * match. The white quiet zone is drawn here for the same reason.
	 *
	 * @prop {string} value What the code encodes.
	 * @prop {string} label Accessible name: what this code *is*, not its value.
	 * @prop {string} [className]
	 */
	import qrcode from 'qrcode-generator';

	let { value, label, className = '' } = $props();

	/** 'M' recovers ~15%. The links drawn here are short; more would only densify. */
	const ERROR_CORRECTION = 'M';

	/** The spec's minimum quiet zone, in modules. Below four, scans get flaky. */
	const MARGIN = 4;

	const code = $derived.by(() => {
		// 0 picks the smallest version the data fits in.
		const qr = qrcode(0, ERROR_CORRECTION);
		qr.addData(value);
		qr.make();
		return qr;
	});

	const moduleCount = $derived(code.getModuleCount());

	const path = $derived.by(() => {
		let d = '';
		for (let row = 0; row < moduleCount; row += 1) {
			for (let col = 0; col < moduleCount; col += 1) {
				if (code.isDark(row, col)) d += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`;
			}
		}
		return d;
	});

	const extent = $derived(moduleCount + MARGIN * 2);
</script>

<svg
	viewBox="0 0 {extent} {extent}"
	class="h-auto w-full max-w-full rounded-xl bg-white g2 {className}"
	role="img"
	aria-label={label}
	shape-rendering="crispEdges"
>
	<rect width={extent} height={extent} fill="#ffffff" />
	<path d={path} fill="#000000" />
</svg>
