<script>
	/**
	 * A fixed place a step sends the reader: the App Store page, the device portal.
	 * Nothing to fetch, expire or fail, which is why it is not `InstallLinkAction`.
	 *
	 * `reach: 'device'` is a link only the phone can act on: a QR code, a button,
	 * or both, as `handover` says. The button is followed in place, since iOS
	 * hands App Store links to the App Store and progress survives the trip.
	 * Under `auto` the QR stands alone except on the phone, where the button
	 * replaces it: someone holding the device should not scan their own screen.
	 * `reach: 'anywhere'` is a button on every browser, opened in a new tab so the
	 * reader comes back here to tick the step.
	 *
	 * @prop {import('../../../utils/install/steps.js').InstallStepLink} link
	 * @prop {string} deviceId Fills the device portal's `{device_id}`.
	 * @prop {import('../../../utils/install/links.js').InstallHandover} [handover]
	 */
	import { Download, ExternalLink } from '@lucide/svelte';
	import { t } from '../../../utils/i18n/i18n.js';
	import { handoverParts, resolveLinkUrl } from '../../../utils/install/links.js';
	import ControlButton from '../../atoms/ControlButton.svelte';
	import QrCode from '../../atoms/QrCode.svelte';

	let { link, deviceId, handover = 'auto' } = $props();

	// The browser does not change under the reader.
	const parts = $derived(handoverParts(handover));
	const phoneOnly = $derived(link.reach === 'device');
	const showQr = $derived(phoneOnly && parts.qr && !(handover === 'auto' && parts.button));
	const showButton = $derived(!phoneOnly || parts.button);
	const Icon = $derived(link.reach === 'device' ? Download : ExternalLink);
	const href = $derived(resolveLinkUrl(link.url, deviceId));

	function open() {
		if (link.reach === 'device') window.location.href = href;
		else window.open(href, '_blank', 'noopener,noreferrer');
	}
</script>

<!-- The button first: the QR's caption reads "Or scan this code". -->
<div class="space-y-3">
	{#if showButton}
		<div class="flex justify-center">
			<ControlButton color="azure" onclick={open}>
				<Icon size={16} aria-hidden="true" />
				{$t(link.labelKey)}
			</ControlButton>
		</div>
	{/if}
	{#if showQr}
		<div class="space-y-2">
			{#if link.qrCaptionKey}
				<p class="text-sm text-gray-600 dark:text-gray-300">{$t(link.qrCaptionKey)}</p>
			{/if}
			<div class="mx-auto max-w-44">
				<QrCode value={href} label={$t(link.qrLabelKey ?? link.labelKey)} />
			</div>
		</div>
	{/if}
</div>
