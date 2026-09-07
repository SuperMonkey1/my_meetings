<script lang="ts">
	import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from '@lucide/svelte';

	interface Props {
		src: string;
		currentTime?: number;
		duration?: number;
		onTimeUpdate?: (time: number) => void;
		onLoadedMetadata?: (duration: number) => void;
	}

	let { src, currentTime = $bindable(0), duration = $bindable(0), onTimeUpdate, onLoadedMetadata }: Props = $props();

	let audioElement: HTMLAudioElement | undefined = $state();
	let isPlaying = $state(false);
	let playbackRate = $state(1.0);
	let volume = $state(1.0);
	let isMuted = $state(false);
	let isDragging = $state(false);

	const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

	function formatTime(seconds: number): string {
		if (isNaN(seconds) || seconds < 0) return '00:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	export function togglePlay() {
		if (!audioElement) return;
		if (audioElement.paused) {
			audioElement.play();
			isPlaying = true;
		} else {
			audioElement.pause();
			isPlaying = false;
		}
	}

	export function seekTo(seconds: number) {
		if (!audioElement) return;
		audioElement.currentTime = seconds;
		currentTime = seconds;
		onTimeUpdate?.(seconds);
	}

	export function skip(secondsDelta: number) {
		if (!audioElement) return;
		seekTo(Math.max(0, Math.min(duration, audioElement.currentTime + secondsDelta)));
	}

	function setSpeed(rate: number) {
		playbackRate = rate;
		if (audioElement) audioElement.playbackRate = rate;
	}

	function handleScrubberInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseFloat(target.value);
		seekTo(val);
	}

	function handleAudioTimeUpdate() {
		if (!audioElement || isDragging) return;
		currentTime = audioElement.currentTime;
		onTimeUpdate?.(currentTime);
	}

	function handleLoadedMetadata() {
		if (audioElement) {
			duration = audioElement.duration;
			onLoadedMetadata?.(duration);
		}
	}
</script>

<div class="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
	<audio
		bind:this={audioElement}
		{src}
		preload="metadata"
		ontimeupdate={handleAudioTimeUpdate}
		onloadedmetadata={handleLoadedMetadata}
		onplay={() => (isPlaying = true)}
		onpause={() => (isPlaying = false)}
		onended={() => (isPlaying = false)}
	></audio>

	<!-- Progress bar & Scrubber -->
	<div class="space-y-1.5 mb-3">
		<div class="flex items-center justify-between text-xs font-mono text-zinc-500">
			<span>{formatTime(currentTime)}</span>
			<span>{formatTime(duration)}</span>
		</div>
		<div class="relative w-full flex items-center">
			<input
				type="range"
				min="0"
				max={duration || 100}
				step="0.05"
				value={currentTime}
				oninput={handleScrubberInput}
				class="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
			/>
		</div>
	</div>

	<!-- Controls row -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<!-- Left: Speeds -->
		<div class="flex items-center gap-1">
			{#each speeds as speed}
				<button
					onclick={() => setSpeed(speed)}
					class="px-2 py-1 text-[11px] font-mono rounded-lg transition-colors {playbackRate === speed
						? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
						: 'text-zinc-500 hover:bg-zinc-100'}"
				>
					{speed}x
				</button>
			{/each}
		</div>

		<!-- Center: Main Playback buttons -->
		<div class="flex items-center gap-2">
			<button
				onclick={() => skip(-5)}
				class="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
				title="Rewind 5s"
			>
				<RotateCcw class="w-4 h-4" />
			</button>

			<button
				onclick={togglePlay}
				class="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
				title={isPlaying ? 'Pause' : 'Play'}
			>
				{#if isPlaying}
					<Pause class="w-5 h-5 fill-white" />
				{:else}
					<Play class="w-5 h-5 fill-white ml-0.5" />
				{/if}
			</button>

			<button
				onclick={() => skip(5)}
				class="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
				title="Forward 5s"
			>
				<RotateCw class="w-4 h-4" />
			</button>
		</div>

		<!-- Right: Volume -->
		<div class="flex items-center gap-2">
			<button
				onclick={() => {
					isMuted = !isMuted;
					if (audioElement) audioElement.muted = isMuted;
				}}
				class="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100"
			>
				{#if isMuted || volume === 0}
					<VolumeX class="w-4 h-4" />
				{:else}
					<Volume2 class="w-4 h-4" />
				{/if}
			</button>
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				bind:value={volume}
				oninput={(e) => {
					const v = parseFloat((e.target as HTMLInputElement).value);
					if (audioElement) audioElement.volume = v;
					isMuted = v === 0;
				}}
				class="w-16 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
			/>
		</div>
	</div>
</div>
