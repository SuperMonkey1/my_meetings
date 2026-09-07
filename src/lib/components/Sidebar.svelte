<script lang="ts">
	import { page } from '$app/stores';
	import { meetingStore } from '$lib/stores/meetings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import {
		AudioWaveform,
		Mic,
		UploadCloud,
		Settings,
		LayoutGrid,
		FileText,
		CheckCircle2,
		X,
		Sparkles,
		KeyRound
	} from '@lucide/svelte';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onopenUpload?: () => void;
	}

	let { open = false, onclose, onopenUpload }: Props = $props();

	const navItems = [
		{ href: '/', label: 'All Meetings', icon: LayoutGrid, count: () => meetingStore.list.length },
		{ href: '/record', label: 'Record Studio', icon: Mic },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	function isActive(pathname: string, href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<!-- Desktop Sidebar -->
<aside class="hidden md:flex w-64 flex-col border-r border-zinc-200 bg-white shrink-0">
	<!-- App Branding -->
	<a href="/" class="h-16 px-6 flex items-center gap-3 border-b border-zinc-200 hover:opacity-95 transition-opacity">
		<div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
			<AudioWaveform class="w-4 h-4" />
		</div>
		<div>
			<span class="font-bold text-sm text-zinc-900 tracking-tight block">My Meetings</span>
			<span class="text-[10px] text-zinc-400 font-mono">Gemini 3.5 Transcribe</span>
		</div>
	</a>

	<!-- Primary Action -->
	<div class="p-4 pb-2">
		<button
			onclick={onopenUpload}
			class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all"
		>
			<UploadCloud class="w-4 h-4" />
			<span>Upload Audio</span>
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
		{#each navItems as item}
			{@const active = isActive($page.url.pathname, item.href)}
			{@const Icon = item.icon}
			{@const count = item.count ? item.count() : null}
			<a
				href={item.href}
				class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {active
					? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
					: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}"
			>
				<div class="flex items-center gap-3">
					<Icon class="w-4 h-4 {active ? 'text-indigo-600' : 'text-zinc-400'}" />
					<span>{item.label}</span>
				</div>
				{#if count !== null}
					<span class="px-2 py-0.5 text-[10px] font-mono rounded-full {active ? 'bg-indigo-200/60 text-indigo-800' : 'bg-zinc-100 text-zinc-500'}">
						{count}
					</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Footer status -->
	<div class="p-4 border-t border-zinc-200 bg-zinc-50/50">
		<a href="/settings" class="flex items-center justify-between text-xs text-zinc-600 hover:text-zinc-900">
			<div class="flex items-center gap-2">
				{#if settingsStore.settings.hasCustomKey || settingsStore.settings.geminiApiKey}
					<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
					<span class="text-[11px] font-medium text-zinc-700">Gemini Key Ready</span>
				{:else}
					<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
					<span class="text-[11px] font-medium text-amber-700">Set API Key</span>
				{/if}
			</div>
			<KeyRound class="w-3.5 h-3.5 text-zinc-400" />
		</a>
	</div>
</aside>

<!-- Mobile Drawer -->
{#if open}
	<div class="fixed inset-0 z-50 md:hidden flex">
		<div class="fixed inset-0 bg-black/30 backdrop-blur-xs" onclick={onclose} role="presentation"></div>
		<div class="relative w-64 max-w-[80vw] bg-white h-full flex flex-col shadow-xl z-10">
			<div class="h-16 px-6 flex items-center justify-between border-b border-zinc-200">
				<div class="flex items-center gap-2">
					<div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
						<AudioWaveform class="w-4 h-4" />
					</div>
					<span class="font-bold text-sm text-zinc-900">My Meetings</span>
				</div>
				<button onclick={onclose} class="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100">
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="p-4 pb-2">
				<button
					onclick={() => { onclose?.(); onopenUpload?.(); }}
					class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
				>
					<UploadCloud class="w-4 h-4" />
					<span>Upload Audio</span>
				</button>
			</div>

			<nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
				{#each navItems as item}
					{@const active = isActive($page.url.pathname, item.href)}
					{@const Icon = item.icon}
					<a
						href={item.href}
						onclick={onclose}
						class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium {active
							? 'bg-indigo-50 text-indigo-700 font-semibold'
							: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}"
					>
						<div class="flex items-center gap-3">
							<Icon class="w-4 h-4 {active ? 'text-indigo-600' : 'text-zinc-400'}" />
							<span>{item.label}</span>
						</div>
					</a>
				{/each}
			</nav>
		</div>
	</div>
{/if}
