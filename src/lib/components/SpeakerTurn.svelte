<script lang="ts">
	import type { TranscriptSegment, SpeakerProfile, WordAnnotation } from '$lib/types';
	import { Play, UserCheck, Edit3 } from '@lucide/svelte';

	interface Props {
		segment: TranscriptSegment;
		speakerProfile?: SpeakerProfile;
		currentTime: number;
		onseek: (seconds: number) => void;
		oneditSpeaker: (speakerId: string) => void;
	}

	let { segment, speakerProfile, currentTime, onseek, oneditSpeaker }: Props = $props();

	function formatTime(seconds: number): string {
		if (isNaN(seconds)) return '00:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function parseOffset(offset?: string | number): number {
		if (!offset) return 0;
		if (typeof offset === 'number') return offset;
		const match = offset.match(/([\d.]+)s?/);
		return match ? parseFloat(match[1]) : 0;
	}

	function isWordActive(word: WordAnnotation, nowSeconds: number): boolean {
		const start = word.startMs !== undefined ? word.startMs / 1000 : parseOffset(word.startOffset);
		const end = word.endMs !== undefined ? word.endMs / 1000 : parseOffset(word.endOffset);
		return nowSeconds >= start && nowSeconds <= end;
	}

	let isSegmentActive = $derived(
		currentTime >= segment.startTime && currentTime <= (segment.endTime || segment.startTime + 5)
	);
</script>

<div
	class="p-5 rounded-2xl border transition-all duration-200 {isSegmentActive
		? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
		: 'bg-white border-zinc-200/80 hover:border-zinc-300'}"
>
	<!-- Speaker Header -->
	<div class="flex items-center justify-between gap-3 mb-3">
		<div class="flex items-center gap-2.5">
			<!-- Speaker Avatar / Initial Badge -->
			<div
				class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-xs"
				style="background-color: {speakerProfile?.color || '#4f46e5'}"
			>
				{(segment.speakerName || segment.speaker).substring(0, 1).toUpperCase()}
			</div>

			<button
				onclick={() => oneditSpeaker(segment.speaker)}
				class="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-indigo-600 transition-colors group"
				title="Rename speaker"
			>
				<span>{segment.speakerName || segment.speaker}</span>
				<Edit3 class="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
			</button>

			<span class="text-[11px] font-mono text-zinc-400">
				{formatTime(segment.startTime)} - {formatTime(segment.endTime)}
			</span>
		</div>

		<!-- Play Segment Action -->
		<button
			onclick={() => onseek(segment.startTime)}
			class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-600 hover:text-indigo-600 hover:bg-zinc-100 transition-colors"
			title="Play from this speaker turn"
		>
			<Play class="w-3 h-3 fill-current" />
			<span>Play</span>
		</button>
	</div>

	<!-- Transcript Content with Clickable Words -->
	<p class="text-sm leading-relaxed text-zinc-800 selection:bg-indigo-100">
		{#if segment.words && segment.words.length > 0}
			{#each segment.words as word}
				{@const active = isWordActive(word, currentTime)}
				<span
					onclick={() => onseek(word.startMs !== undefined ? word.startMs / 1000 : parseOffset(word.startOffset))}
					class="cursor-pointer rounded-sm px-0.5 transition-all {active
						? 'bg-indigo-600 text-white font-medium shadow-xs ring-2 ring-indigo-600/30'
						: 'hover:bg-zinc-100 hover:text-indigo-700'}"
					title="Click to seek to {word.startOffset || ''}"
				>
					{word.text}{' '}
				</span>
			{/each}
		{:else}
			<span>{segment.text}</span>
		{/if}
	</p>
</div>
