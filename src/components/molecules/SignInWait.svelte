<!--
	SignInWait - The whole screen while a sign-in hops between sites: a bare spinner,
	"Signing in…" after `slowAfter` ms, then after `failAfter` ms what to do instead.
-->
<script>
	import { onMount } from 'svelte';
	import Spinner from '../atoms/Spinner.svelte';
	import ControlButton from '../atoms/ControlButton.svelte';
	import { t } from '../../utils/i18n/i18n.js';

	let { slowAfter = 4000, failAfter = 20000, onretry = () => location.reload() } = $props();

	let stage = $state('quiet');

	onMount(() => {
		const timers = [
			setTimeout(() => (stage = 'slow'), slowAfter),
			setTimeout(() => (stage = 'stuck'), failAfter)
		];
		return () => timers.forEach(clearTimeout);
	});
</script>

<div
	class="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-100 p-4 text-center dark:bg-zinc-750"
	role="status"
>
	{#if stage === 'stuck'}
		<p class="m-0 text-base font-medium text-gray-900 dark:text-gray-100">
			{$t('auth.sign_in_slow')}
		</p>
		<p class="m-0 text-sm text-gray-700 dark:text-gray-200">
			{$t('auth.sign_in_slow_hint')}
		</p>
		<ControlButton onclick={onretry}>{$t('auth.try_again')}</ControlButton>
	{:else}
		<Spinner size={40} block={false} color="text-azure-700 dark:text-azure-500" />
		{#if stage === 'slow'}
			<p class="m-0 text-sm text-gray-700 dark:text-gray-200">
				{$t('auth.signing_in')}
			</p>
		{/if}
	{/if}
</div>
