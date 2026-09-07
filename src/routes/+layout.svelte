<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Header from '$lib/components/Header.svelte';
	import UploadModal from '$lib/components/UploadModal.svelte';
	import { meetingStore } from '$lib/stores/meetings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let uploadModalOpen = $state(false);
	let globalSearchQuery = $state('');

	onMount(async () => {
		// Clean up any stale Service Worker or cache from previous localhost sessions
		if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
			try {
				const registrations = await navigator.serviceWorker.getRegistrations();
				for (const registration of registrations) {
					await registration.unregister();
				}
				if ('caches' in window) {
					const keys = await caches.keys();
					for (const key of keys) {
						await caches.delete(key);
					}
				}
			} catch (e) {
				console.warn('Could not clear stale service workers:', e);
			}
		}

		await Promise.all([
			meetingStore.loadAll(),
			settingsStore.load()
		]);
	});
</script>

<div class="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900">
	<!-- Sidebar -->
	<Sidebar
		open={mobileMenuOpen}
		onclose={() => (mobileMenuOpen = false)}
		onopenUpload={() => (uploadModalOpen = true)}
	/>

	<!-- Main content area -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
		<Header
			ontoggleMobileMenu={() => (mobileMenuOpen = !mobileMenuOpen)}
			onopenUpload={() => (uploadModalOpen = true)}
			searchQuery={globalSearchQuery}
			onsearchChange={(q) => (globalSearchQuery = q)}
		/>

		<main class="flex-1 overflow-y-auto p-4 md:p-8">
			{@render children()}
		</main>
	</div>

	<!-- Global Upload & Transcribe Modal -->
	<UploadModal
		open={uploadModalOpen}
		onclose={() => (uploadModalOpen = false)}
	/>
</div>
