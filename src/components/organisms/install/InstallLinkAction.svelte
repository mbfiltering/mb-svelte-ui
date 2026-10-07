<script>
	/**
	 * The portal's half of a step: getting a credential onto the phone as a QR code.
	 *
	 * Two kinds, one structure (mount, fetch, QR, renew on a clock, four outcomes):
	 * `enroll` is the app's `mbsmart://` deep link, `profile` the Apple
	 * configuration profile's `https://` URL. The host portal supplies `getLink`,
	 * because the two portals reach the same credentials by different routes; this
	 * component validates whatever comes back before drawing or following it.
	 *
	 * **Mounting is the gesture.** The panel renders this only while the step is
	 * unfinished, so a finished step never spends a credential, and the link is
	 * fetched once per arrival (not per re-render: the walkthrough polls). It is
	 * fetched again when its clock runs out, never behind a hidden tab, and a
	 * refusal or a failure is not retried on a timer.
	 *
	 * `kind` is read once: the panel keys this component on it, so a change of kind
	 * is a remount with the right clock and validator, not a prop update.
	 *
	 * @prop {string} deviceId
	 * @prop {'enroll' | 'profile'} kind
	 * @prop {(kind: 'enroll' | 'profile') => Promise<{ link?: string | null }>} getLink
	 *   Resolves with the raw link; rejects with an error carrying `status` (403:
	 *   refused) or anything else for a failure.
	 * @prop {boolean} [showCopy] A "Copy link" button under the QR, for a
	 *   technician who is sending the link to someone rather than holding the phone.
	 * @prop {(pending: boolean) => void} [onPending] True while there is nothing on
	 *   screen to act on, so the walkthrough can hold back "I've done this".
	 */
	import { onDestroy, onMount } from 'svelte';
	import { Copy, Download, Loader, Smartphone } from '@lucide/svelte';
	import { t } from '../../../utils/i18n/i18n.js';
	import {
		buildConfigLink,
		buildEnrollLink,
		isAppleMobileBrowser,
		CONFIG_LINK_TTL_MS,
		ENROLL_CODE_TTL_MS
	} from '../../../utils/install/links.js';
	import { createLinkRenewal } from '../../../utils/install/linkRenewal.js';
	import Callout from '../../atoms/Callout.svelte';
	import ControlButton from '../../atoms/ControlButton.svelte';
	import QrCode from '../../atoms/QrCode.svelte';

	let { deviceId, kind, getLink, showCopy = false, onPending } = $props();

	const VARIANTS = {
		enroll: {
			ttl: ENROLL_CODE_TTL_MS,
			build: (/** @type {string | null | undefined} */ raw) => buildEnrollLink(raw, deviceId),
			icon: Smartphone,
			qrLabel: 'DeviceInstall.enroll_qr_label',
			creating: 'DeviceInstall.enroll_creating',
			openHere: 'DeviceInstall.enroll_open_here',
			error: 'DeviceInstall.enroll_error',
			locked: 'DeviceInstall.enroll_locked'
		},
		profile: {
			ttl: CONFIG_LINK_TTL_MS,
			build: (/** @type {string | null | undefined} */ raw) => buildConfigLink(raw),
			icon: Download,
			qrLabel: 'DeviceInstall.profile_qr_label',
			creating: 'DeviceInstall.profile_creating',
			openHere: 'DeviceInstall.profile_open_here',
			error: 'DeviceInstall.profile_error',
			locked: 'DeviceInstall.profile_locked'
		}
	};

	// One instance serves one kind; see above.
	// svelte-ignore state_referenced_locally
	const variant = VARIANTS[kind];
	const OpenIcon = variant.icon;
	const renewal = createLinkRenewal(variant.ttl, () => fetchLink());

	let link = $state(/** @type {string | null} */ (null));
	let errorMessage = $state('');
	let locked = $state(false);
	let fetching = $state(false);
	let copied = $state(false);

	onMount(() => {
		fetchLink();
	});

	onDestroy(() => {
		renewal.destroy();
		link = null;
		onPending?.(false);
	});

	async function fetchLink() {
		errorMessage = '';
		locked = false;
		link = null;
		fetching = true;
		onPending?.(true);
		try {
			const response = await getLink(kind);
			const built = variant.build(response?.link);
			if (!built) {
				errorMessage = $t(variant.error);
				return;
			}
			link = built;
			renewal.arm();
		} catch (error) {
			const status = /** @type {any} */ (error)?.status;
			if (status === 403) locked = true;
			else errorMessage = $t(variant.error);
		} finally {
			fetching = false;
			onPending?.(false);
		}
	}

	/**
	 * A top-level navigation, never `window.open`: mobile browsers drop a custom
	 * scheme in a new tab, and iOS hands a `.mobileconfig` to Settings and leaves a
	 * new tab behind empty.
	 */
	function openHere() {
		if (link) window.location.href = link;
	}

	async function copyLink() {
		if (!link) return;
		try {
			await navigator.clipboard.writeText(link);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch {
			// Nothing to do: the link is on screen in the QR, and the button stays.
		}
	}

	const canOpenHere = isAppleMobileBrowser();
</script>

<div class="space-y-3">
	{#if link}
		<div class="mx-auto max-w-60">
			<QrCode value={link} label={$t(variant.qrLabel)} />
		</div>
		{#if canOpenHere || showCopy}
			<div class="flex flex-wrap justify-center gap-2">
				{#if canOpenHere}
					<ControlButton color="azure" onclick={openHere}>
						<OpenIcon size={16} aria-hidden="true" />
						{$t(variant.openHere)}
					</ControlButton>
				{/if}
				{#if showCopy}
					<ControlButton color="azure" onclick={copyLink}>
						<Copy size={16} aria-hidden="true" />
						<span aria-live="polite">
							{copied ? $t('DeviceInstall.link_copied') : $t('DeviceInstall.copy_link')}
						</span>
					</ControlButton>
				{/if}
			</div>
		{/if}
	{:else if locked}
		<!-- Orange, not red: nothing is broken, this way in is closed. -->
		<Callout color="orange"><p>{$t(variant.locked)}</p></Callout>
	{:else if errorMessage}
		<div class="space-y-3">
			<Callout color="red"><p>{errorMessage}</p></Callout>
			<ControlButton
				color="azure"
				loading={fetching}
				loadingLabel={$t(variant.creating)}
				onclick={fetchLink}
			>
				{$t('DeviceInstall.try_again')}
			</ControlButton>
		</div>
	{:else}
		<p class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
			<Loader size={16} class="shrink-0 animate-spin" aria-hidden="true" />
			<span>{$t(variant.creating)}</span>
		</p>
	{/if}
</div>
