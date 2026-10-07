<script>
	/**
	 * How to find out whether the device in your hand is on an adult or a child
	 * Apple Account. Opened by the third button on the walkthrough's question ("I
	 * don't know, show me"), which records nothing: the two real answers are still
	 * there when the reader comes back with one.
	 *
	 * The copy quotes Apple's own labels, so those spans are bold (`RichText`).
	 *
	 * @prop {boolean} [isOpen]
	 * @prop {() => void} onClose
	 */
	import { CircleHelp } from '@lucide/svelte';
	import { t } from '../../../utils/i18n/i18n.js';
	import ModalIsland from '../ModalIsland.svelte';
	import Callout from '../../atoms/Callout.svelte';
	import ControlButton from '../../atoms/ControlButton.svelte';
	import RichText from '../../atoms/RichText.svelte';

	let { isOpen = false, onClose } = $props();
</script>

{#snippet rich(/** @type {string} */ key)}
	<RichText text={$t(key)} />
{/snippet}

<ModalIsland
	{isOpen}
	{onClose}
	portal
	icon={CircleHelp}
	title={$t('DeviceInstall.account_help_title')}
	closeLabel={$t('DeviceInstall.close')}
>
	<div class="space-y-5 text-sm text-gray-700 dark:text-gray-200">
		<section class="space-y-2">
			<h4 class="text-base font-semibold text-gray-700 dark:text-gray-200">
				{$t('DeviceInstall.account_help_step1_title')}
			</h4>
			<!-- Outside markers: the last item carries a list of its own. -->
			<ol class="list-decimal space-y-1.5 ps-5">
				<li>{@render rich('DeviceInstall.account_help_step1_1')}</li>
				<li>{@render rich('DeviceInstall.account_help_step1_2')}</li>
				<li>{@render rich('DeviceInstall.account_help_step1_3')}</li>
				<li>
					{@render rich('DeviceInstall.account_help_step1_4')}
					<ul class="mt-1.5 list-disc space-y-1.5 ps-5">
						<li>{@render rich('DeviceInstall.account_help_role_adult')}</li>
						<li>{@render rich('DeviceInstall.account_help_role_child')}</li>
					</ul>
				</li>
			</ol>
		</section>

		<!-- An under-18 birthday outside Family Sharing still reports as an
		     individual to Apple, never as a child, so the birth date is not a test. -->
		<Callout color="azure">
			<p>{@render rich('DeviceInstall.account_help_no_family')}</p>
		</Callout>
	</div>

	{#snippet footer()}
		<div class="flex justify-end">
			<ControlButton color="azure" onclick={onClose}>
				{$t('DeviceInstall.account_help_close')}
			</ControlButton>
		</div>
	{/snippet}
</ModalIsland>
