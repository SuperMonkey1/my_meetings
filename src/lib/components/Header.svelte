<script lang="ts">
	import { Menu, Mic, UploadCloud, Search, Sparkles } from '@lucide/svelte';

	interface Props {
		ontoggleMobileMenu?: () => void;
		onopenUpload?: () => void;
		searchQuery?: string;
		onsearchChange?: (q: string) => void;
	}

	let { ontoggleMobileMenu, onopenUpload, searchQuery = '', onsearchChange }: Props = $props();
</script>

<header class="h-16 px-4 md:px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-30">
	<div class="flex items-center gap-3 flex-1 max-w-md">
		<button
			onclick={ontoggleMobileMenu}
			class="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100"
			aria-label="Open menu"
		>
			<Menu class="w-5 h-5" />
		</button>

		<!-- Search input -->
		<div class="relative w-full">
			<Search class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
			<input
				type="text"
				value={searchQuery}
				oninput={(e) => onsearchChange?.(e.currentTarget.value)}
				placeholder="Search meeting titles, transcripts, or notes..."
				class="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
			/>
		</div>
	</div>

	<div class="flex items-center gap-3">
		<a
			href="/record"
			class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-xs"
		>
			<Mic class="w-3.5 h-3.5 text-rose-500" />
			<span class="hidden sm:inline">Record</span>
		</a>

		<button
			onclick={onopenUpload}
			class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
		>
			<UploadCloud class="w-3.5 h-3.5" />
			<span>Transcribe</span>
		</button>
	</div>
</header>
