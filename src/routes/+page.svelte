<script lang="ts">
	import { meetingStore } from '$lib/stores/meetings.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import UploadModal from '$lib/components/UploadModal.svelte';
	import {
		AudioWaveform,
		Mic,
		UploadCloud,
		Clock,
		FileText,
		ListChecks,
		Users,
		Sparkles,
		Play,
		Trash2,
		ChevronRight,
		Search,
		Filter
	} from '@lucide/svelte';

	let uploadModalOpen = $state(false);
	let searchQuery = $state('');
	let selectedFilter = $state<'all' | 'completed' | 'recorded'>('all');

	function formatDuration(sec: number): string {
		if (isNaN(sec) || sec <= 0) return '0 min';
		const hours = Math.floor(sec / 3600);
		const minutes = Math.floor((sec % 3600) / 60);
		const seconds = Math.floor(sec % 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		if (minutes > 0) return `${minutes}m ${seconds}s`;
		return `${seconds}s`;
	}

	function formatDate(dateStr: string): string {
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}

	let filteredMeetings = $derived.by(() => {
		return meetingStore.list.filter((m) => {
			if (selectedFilter === 'completed' && m.status !== 'completed') return false;
			if (selectedFilter === 'recorded' && m.status === 'completed') return false;
			if (!searchQuery.trim()) return true;

			const q = searchQuery.toLowerCase();
			const matchTitle = m.title.toLowerCase().includes(q);
			const matchDesc = m.description?.toLowerCase().includes(q);
			const matchText = m.fullText?.toLowerCase().includes(q);
			const matchSpeakers = Object.values(m.speakers || {}).some((s) => s.name.toLowerCase().includes(q));

			return matchTitle || matchDesc || matchText || matchSpeakers;
		});
	});

	async function handleDelete(e: Event, id: string) {
		e.preventDefault();
		e.stopPropagation();
		if (confirm('Are you sure you want to delete this meeting recording and transcript?')) {
			await meetingStore.delete(id);
		}
	}
</script>

<div class="space-y-8 max-w-7xl mx-auto">
	<!-- Page Header Banner -->
	<div class="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
		<div class="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
		<div class="relative z-10 max-w-2xl space-y-3">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-indigo-200 text-xs font-medium">
				<Sparkles class="w-3.5 h-3.5 text-indigo-300" />
				<span>Powered by Gemini 3.5 Transcribe</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Meeting Audio Intelligence</h1>
			<p class="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
				Automatic speaker diarization, word-level timestamps, smart disfluency removal, and executive summaries for all your recorded conversations.
			</p>
			<div class="flex flex-wrap items-center gap-3 pt-2">
				<a
					href="/record"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 font-semibold text-xs rounded-xl shadow-xs transition-colors"
				>
					<Mic class="w-4 h-4 text-rose-600" />
					<span>Record Live</span>
				</a>
				<button
					onclick={() => (uploadModalOpen = true)}
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors"
				>
					<UploadCloud class="w-4 h-4" />
					<span>Upload Audio (.wav, .mp3, .m4a)</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			title="Total Meetings"
			value={meetingStore.stats.totalMeetings}
			subtitle="Recorded & Processed"
			icon={AudioWaveform}
			iconBg="bg-indigo-50"
			iconColor="text-indigo-600"
		/>
		<StatCard
			title="Total Audio Duration"
			value={formatDuration(meetingStore.stats.totalDurationSeconds)}
			subtitle="Audio hours captured"
			icon={Clock}
			iconBg="bg-sky-50"
			iconColor="text-sky-600"
		/>
		<StatCard
			title="Words Transcribed"
			value={meetingStore.stats.totalWords.toLocaleString()}
			subtitle="Full-text transcripts"
			icon={FileText}
			iconBg="bg-emerald-50"
			iconColor="text-emerald-600"
		/>
		<StatCard
			title="Action Items"
			value={meetingStore.stats.pendingActionItemsCount}
			subtitle="Pending follow-ups"
			icon={ListChecks}
			iconBg="bg-amber-50"
			iconColor="text-amber-600"
		/>
	</div>

	<!-- Meetings List Section -->
	<div class="space-y-4">
		<!-- Filter & Search Bar -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<h2 class="text-base font-bold text-zinc-900 tracking-tight">Recent Meetings</h2>
				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-200/60 text-zinc-600 font-semibold">
					{filteredMeetings.length}
				</span>
			</div>

			<div class="flex items-center gap-2">
				<!-- Filter Pills -->
				<div class="flex items-center bg-white border border-zinc-200 p-1 rounded-xl shadow-xs">
					<button
						onclick={() => (selectedFilter = 'all')}
						class="px-3 py-1 text-xs font-medium rounded-lg transition-colors {selectedFilter === 'all'
							? 'bg-zinc-100 text-zinc-900 font-semibold'
							: 'text-zinc-500 hover:text-zinc-900'}"
					>
						All
					</button>
					<button
						onclick={() => (selectedFilter = 'completed')}
						class="px-3 py-1 text-xs font-medium rounded-lg transition-colors {selectedFilter === 'completed'
							? 'bg-indigo-50 text-indigo-700 font-semibold'
							: 'text-zinc-500 hover:text-zinc-900'}"
					>
						Transcribed
					</button>
					<button
						onclick={() => (selectedFilter = 'recorded')}
						class="px-3 py-1 text-xs font-medium rounded-lg transition-colors {selectedFilter === 'recorded'
							? 'bg-amber-50 text-amber-700 font-semibold'
							: 'text-zinc-500 hover:text-zinc-900'}"
					>
						Drafts
					</button>
				</div>
			</div>
		</div>

		<!-- Meetings Cards -->
		{#if meetingStore.loading && meetingStore.list.length === 0}
			<div class="p-16 bg-white border border-zinc-200 rounded-3xl text-center text-zinc-400 text-xs">
				Loading meetings...
			</div>
		{:else if filteredMeetings.length === 0}
			<div class="p-16 bg-white border border-dashed border-zinc-300 rounded-3xl text-center space-y-3">
				<div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
					<AudioWaveform class="w-6 h-6" />
				</div>
				<div>
					<h3 class="text-sm font-semibold text-zinc-900">No meetings found</h3>
					<p class="text-xs text-zinc-500 mt-1">Upload an audio recording or record directly from your microphone</p>
				</div>
				<div class="pt-2">
					<button
						onclick={() => (uploadModalOpen = true)}
						class="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-xs"
					>
						Upload First Meeting
					</button>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredMeetings as meeting}
					{@const speakerList = Object.values(meeting.speakers || {})}
					{@const isTranscribing = meetingStore.transcribingId === meeting.id || meeting.status === 'transcribing'}
					<a
						href="/meetings/{meeting.id}"
						class="group bg-white border border-zinc-200 hover:border-indigo-300 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
					>
						<div class="space-y-3">
							<!-- Top row: date & status -->
							<div class="flex items-center justify-between gap-2">
								<span class="text-xs text-zinc-400 font-medium">{formatDate(meeting.date)}</span>
								{#if isTranscribing}
									<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
										<span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
										Transcribing...
									</span>
								{:else if meeting.status === 'completed'}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
										Completed
									</span>
								{:else if meeting.status === 'error'}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
										Error
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
										Ready to Transcribe
									</span>
								{/if}
							</div>

							<!-- Title & Description -->
							<div>
								<h3 class="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
									{meeting.title}
								</h3>
								{#if meeting.description}
									<p class="text-xs text-zinc-500 mt-1 line-clamp-2">{meeting.description}</p>
								{/if}
							</div>
						</div>

						<!-- Bottom section: Speakers & Metadata -->
						<div class="space-y-3 pt-3 border-t border-zinc-100">
							<div class="flex items-center justify-between text-xs text-zinc-500">
								<!-- Speaker Avatars -->
								<div class="flex items-center -space-x-1.5">
									{#if speakerList.length > 0}
										{#each speakerList.slice(0, 4) as speaker}
											<div
												class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white"
												style="background-color: {speaker.color}"
												title="{speaker.name} ({speaker.percentage || 0}%)"
											>
												{speaker.name.substring(0, 1).toUpperCase()}
											</div>
										{/each}
										{#if speakerList.length > 4}
											<span class="w-6 h-6 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
												+{speakerList.length - 4}
											</span>
										{/if}
									{:else}
										<span class="text-[11px] text-zinc-400">Audio uploaded</span>
									{/if}
								</div>

								<!-- Duration & Format -->
								<div class="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
									<Clock class="w-3.5 h-3.5" />
									<span>{formatDuration(meeting.durationSeconds)}</span>
								</div>
							</div>

							<!-- Action Footer -->
							<div class="flex items-center justify-between pt-1 text-xs">
								<div class="flex items-center gap-2 text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
									<span>View Transcript</span>
									<ChevronRight class="w-3.5 h-3.5" />
								</div>

								<button
									onclick={(e) => handleDelete(e, meeting.id)}
									class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
									title="Delete Meeting"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Upload Modal Instance -->
	<UploadModal
		open={uploadModalOpen}
		onclose={() => (uploadModalOpen = false)}
	/>
</div>
