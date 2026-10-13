<script>
	import { RefreshCw } from '@lucide/svelte';
	import { Badge, SvgIcon } from '../atoms/index.js';
	import ListCard from './ListCard.svelte';

	let {
		device,
		href = '#',
		onclick = null,
		disabled = false,
		disabledTitle = '',
		variant = 'default',
		static: isStatic = false,
		showArrow = true,
		showOpenInNewTab = true,
		openInNewTabHref = '',
		showSyncButton = false,
		showIcon = true,
		showPlanBadge = true,
		showPaymentStatus = true,
		showDeviceInfo = true,
		showLinkcode = true,
		showNote = false,
		syncing = false,
		onSync = null,
		onSyncStart = null,
		onSyncEnd = null,
		labels = {},
		// Aliased: the `actions` snippet below would otherwise shadow this prop.
		actions: actionsSnippet = undefined
	} = $props();

	const deviceIcons = {
		ios: 'apple-logo',
		android: 'android-logo',
		mac: 'mac-logo',
		chrome: 'chrome-logo',
		windows: 'windows-logo',
		default: 'squircle-dashed'
	};

	const mergedLabels = $derived({
		unknownDevice: 'Unknown device',
		pro: 'Pro',
		basic: 'Basic',
		paid: 'Paid',
		unpaid: 'Unpaid',
		blockAll: 'Block All',
		syncDevice: 'Sync device',
		notYetSupportedInPortal: 'Not yet supported in portal',
		openInNewTab: 'Open in new tab',
		...labels
	});

	const deviceId = $derived(String(device?.id ?? ''));
	const deviceName = $derived(device?.name || deviceId || mergedLabels.unknownDevice);
	const deviceType = $derived(String(device?.device_type ?? device?.deviceType ?? '').toLowerCase());
	const deviceInfo = $derived(device?.device_info ?? device?.deviceInfo ?? device?.deviceModel ?? '');
	const isPro = $derived(Boolean(device?.is_pro ?? device?.isPro ?? false));
	const paymentStatus = $derived(String(device?.payment_status ?? device?.paymentStatus ?? ''));
	const isBlockAll = $derived(String(device?.account ?? '') === '-tag--tagblockall-');
	const linkcode = $derived(device?.account ? String(device.account).replaceAll('--', '/').replaceAll('-', '') : '');
	const note = $derived(device?.notes ?? device?.note ?? '');
	const resolvedDisabled = $derived(disabled || variant === 'disabled');
	const resolvedDisabledTitle = $derived(disabledTitle || (variant === 'disabled' ? mergedLabels.notYetSupportedInPortal : ''));

	let internalSyncing = $state(false);
	const isSyncing = $derived(syncing || internalSyncing);

	function getDeviceIcon(type) {
		if (!type) return deviceIcons.default;
		return deviceIcons[type] || deviceIcons.default;
	}

	async function handleSync(event) {
		event.preventDefault();
		event.stopPropagation();

		if (!onSync || isSyncing) return;

		internalSyncing = true;
		onSyncStart?.(deviceId);

		try {
			await onSync(device);
		} finally {
			internalSyncing = false;
			onSyncEnd?.(deviceId);
		}
	}
</script>

<ListCard
	href={href}
	{onclick}
	disabled={resolvedDisabled}
	disabledTitle={resolvedDisabledTitle}
	static={isStatic}
	{showArrow}
	{showOpenInNewTab}
	{openInNewTabHref}
	openInNewTabLabel={mergedLabels.openInNewTab}
>
	{#snippet icon()}
		{#if showIcon}
			<div class="flex shrink-0 flex-col items-center">
				<div class="flex h-10 w-10 compact:h-8 compact:w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-750">
					<SvgIcon
						name={getDeviceIcon(deviceType)}
						size="w-5 h-5"
						className="text-gray-700 dark:text-gray-200"
					/>
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet children()}
		<p class="truncate font-medium text-gray-900 dark:text-gray-50">
			{deviceName}
			{#if showPlanBadge}
				<Badge color={isPro ? 'mulberry' : 'azure'} size="tiny">
					{isPro ? mergedLabels.pro : mergedLabels.basic}
				</Badge>
			{/if}
			{#if showPaymentStatus && paymentStatus}
				<Badge color={paymentStatus === 'payed' ? 'green' : 'red'} size="tiny">
					{paymentStatus === 'payed' ? mergedLabels.paid : mergedLabels.unpaid}
				</Badge>
			{/if}
			{#if isBlockAll}
				<Badge color="red" size="tiny">
					{mergedLabels.blockAll}
				</Badge>
			{/if}
		</p>
		<p class="truncate text-sm text-gray-900/75 dark:text-gray-50/75">{deviceId}</p>
		{#if showLinkcode && linkcode}
			<p class="truncate text-xs text-gray-500 dark:text-gray-400">{linkcode}</p>
		{/if}
		{#if showDeviceInfo && deviceInfo && deviceInfo !== ' :'}
			<p class="truncate text-xs text-gray-500 dark:text-gray-400">{deviceInfo}</p>
		{/if}
		{#if showNote && note}
			<p class="mt-1 truncate text-xs italic text-amber-600 dark:text-amber-400">{note}</p>
		{/if}
	{/snippet}

	{#snippet actions()}
		{#if actionsSnippet}{@render actionsSnippet()}{/if}
		{#if showSyncButton && onSync}
			<button
				type="button"
				onclick={handleSync}
				disabled={isSyncing}
				class="hidden xs:flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-azure-100 text-azure-700 transition-colors hover:bg-azure-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-750 dark:text-azure-200 dark:hover:bg-zinc-700"
				title={mergedLabels.syncDevice}
			>
				<RefreshCw size="16" strokeWidth="2" class={isSyncing ? 'animate-spin' : ''} />
			</button>
		{/if}
	{/snippet}
</ListCard>