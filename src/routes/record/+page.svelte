<script lang="ts">
	import AudioRecorder from '$lib/components/AudioRecorder.svelte';
	import { ArrowLeft, Sparkles, Mic, FileText, CheckCircle2 } from '@lucide/svelte';
</script>

<div class="space-y-6 max-w-4xl mx-auto">
	<!-- Breadcrumb / Back button -->
	<div class="flex items-center justify-between">
		<a
			href="/"
			class="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
		>
			<ArrowLeft class="w-4 h-4" />
			<span>Back to Meetings</span>
		</a>

		<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
			<Sparkles class="w-3.5 h-3.5" />
			<span>Gemini 3.5 Transcribe Live Studio</span>
		</div>
	</div>

	<!-- Recording Component -->
	<AudioRecorder />

	<!-- Features grid / Tips -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
		<div class="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-2">
			<div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
				<Mic class="w-4 h-4" />
			</div>
			<h4 class="text-xs font-bold text-zinc-900">Multi-Speaker Diarization</h4>
			<p class="text-[11px] text-zinc-500 leading-relaxed">
				Gemini 3.5 automatically identifies different voices (spk_1, spk_2) and attributes each spoken section.
			</p>
		</div>

		<div class="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-2">
			<div class="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
				<FileText class="w-4 h-4" />
			</div>
			<h4 class="text-xs font-bold text-zinc-900">Word-Level Timestamps</h4>
			<p class="text-[11px] text-zinc-500 leading-relaxed">
				Every single recognized word is tagged with millisecond offsets for precise click-to-seek playback.
			</p>
		</div>

		<div class="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-2">
			<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
				<CheckCircle2 class="w-4 h-4" />
			</div>
			<h4 class="text-xs font-bold text-zinc-900">Action Items & Decisions</h4>
			<p class="text-[11px] text-zinc-500 leading-relaxed">
				Automatic AI extraction of key discussion points, agreements, and next steps with assigned owners.
			</p>
		</div>
	</div>
</div>
