<script lang="ts">
	import { page } from '$app/stores';
	import { meetingStore } from '$lib/stores/meetings.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import SpeakerTurn from '$lib/components/SpeakerTurn.svelte';
	import SpeakerRenameModal from '$lib/components/SpeakerRenameModal.svelte';
	import MeetingSummaryCard from '$lib/components/MeetingSummaryCard.svelte';
	import ExportMenu from '$lib/components/ExportMenu.svelte';
	import {
		ArrowLeft,
		Sparkles,
		Clock,
		Calendar,
		Users,
		Search,
		Filter,
		Edit2,
		Check,
		RotateCw,
		Trash2,
		AlertCircle,
		FileAudio,
		Layers,
		Volume2
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let meetingId = $derived($page.params.id);
	let meeting = $derived(meetingStore.current);

	let currentTime = $state(0);
	let duration = $state(0);
	let audioPlayerRef: any = $state();

	let transcriptSearch = $state('');
	let selectedSpeakerFilter = $state('all');
	let isEditingTitle = $state(false);
	let editableTitle = $state('');

	let renameModalOpen = $state(false);
	let activeRenameSpeakerId = $state('');
	let isSummarizing = $state(false);
	let isTranscribing = $state(false);

	// Retranscribe modal state
	let retranscribeModalOpen = $state(false);
	let retranscribeMode = $state<'verbatim' | 'smart'>('verbatim');

	onMount(async () => {
		if (meetingId) {
			const loaded = await meetingStore.loadById(meetingId);
			if (loaded) {
				editableTitle = loaded.title;
				duration = loaded.durationSeconds || 0;
			}
		}
	});

	function handleTimeUpdate(t: number) {
		currentTime = t;
	}

	function handleAudioDurationKnown(dur: number) {
		duration = dur;
		if (meeting && (!meeting.durationSeconds || meeting.durationSeconds === 0) && dur > 0) {
			meetingStore.update(meeting.id, { durationSeconds: Math.round(dur) });
		}
	}

	function handleSeek(seconds: number) {
		currentTime = seconds;
		if (audioPlayerRef?.seekTo) {
			audioPlayerRef.seekTo(seconds);
		}
	}

	async function handleSaveTitle() {
		if (!meeting || !editableTitle.trim()) return;
		await meetingStore.update(meeting.id, { title: editableTitle.trim() });
		isEditingTitle = false;
	}

	function openRenameModal(speakerId: string) {
		activeRenameSpeakerId = speakerId;
		renameModalOpen = true;
	}

	async function handleSaveSpeaker(speakerId: string, newName: string, newColor: string) {
		if (!meeting) return;
		const currentSpeakers = { ...(meeting.speakers || {}) };
		if (currentSpeakers[speakerId]) {
			currentSpeakers[speakerId] = {
				...currentSpeakers[speakerId],
				name: newName,
				color: newColor
			};
		} else {
			currentSpeakers[speakerId] = {
				id: speakerId,
				name: newName,
				color: newColor
			};
		}

		await meetingStore.update(meeting.id, { speakers: currentSpeakers });
	}

	async function handleToggleActionItem(itemId: string) {
		if (!meeting || !meeting.summary?.actionItems) return;
		const updatedItems = meeting.summary.actionItems.map((item) =>
			item.id === itemId ? { ...item, completed: !item.completed } : item
		);

		await meetingStore.update(meeting.id, {
			summary: {
				...meeting.summary,
				actionItems: updatedItems
			}
		});
	}

	async function handleRegenerateSummary() {
		if (!meeting) return;
		isSummarizing = true;
		try {
			await meetingStore.summarize(meeting.id);
		} catch (e) {
			console.error('Failed to summarize:', e);
		} finally {
			isSummarizing = false;
		}
	}

	async function runTranscription(modeToRun: 'verbatim' | 'smart') {
		if (!meeting) return;
		isTranscribing = true;
		retranscribeModalOpen = false;
		try {
			await meetingStore.transcribe(meeting.id, {
				mode: modeToRun,
				diarization: modeToRun === 'verbatim',
				timestamps: modeToRun === 'verbatim',
				languageCode: meeting.languageCode || undefined
			});
		} catch (e) {
			console.error('Transcription error:', e);
		} finally {
			isTranscribing = false;
		}
	}

	async function handleDeleteMeeting() {
		if (!meeting) return;
		if (confirm(`Delete "${meeting.title}" and its transcript?`)) {
			await meetingStore.delete(meeting.id);
			goto('/');
		}
	}

	let filteredSegments = $derived.by(() => {
		if (!meeting?.segments) return [];
		return meeting.segments.filter((seg) => {
			if (selectedSpeakerFilter !== 'all' && seg.speaker !== selectedSpeakerFilter) {
				return false;
			}
			if (!transcriptSearch.trim()) return true;

			const q = transcriptSearch.toLowerCase();
			return seg.text.toLowerCase().includes(q) || (seg.speakerName || seg.speaker).toLowerCase().includes(q);
		});
	});

	let speakerList = $derived(Object.values(meeting?.speakers || {}));
	let hasTranscript = $derived(
		(meeting?.segments && meeting.segments.length > 0) ||
		(meeting?.fullText && meeting.fullText.trim().length > 0) ||
		(meeting?.smartTranscript && meeting.smartTranscript.trim().length > 0)
	);
</script>

{#if meetingStore.loading && !meeting}
	<div class="p-16 text-center text-xs text-zinc-400">Loading meeting transcript...</div>
{:else if !meeting}
	<div class="p-16 bg-white border border-zinc-200 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
		<AlertCircle class="w-10 h-10 text-rose-500 mx-auto" />
		<h3 class="text-base font-bold text-zinc-900">Meeting not found</h3>
		<p class="text-xs text-zinc-500">The requested meeting recording does not exist or was deleted.</p>
		<a href="/" class="inline-flex px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
			Return to Dashboard
		</a>
	</div>
{:else}
	<div class="space-y-6 max-w-7xl mx-auto">
		<!-- Header / Top Bar -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="space-y-2">
				<a
					href="/"
					class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
				>
					<ArrowLeft class="w-4 h-4" />
					<span>All Meetings</span>
				</a>

				<!-- Title Editor -->
				<div class="flex items-center gap-3">
					{#if isEditingTitle}
						<form onsubmit={(e) => { e.preventDefault(); handleSaveTitle(); }} class="flex items-center gap-2">
							<input
								type="text"
								bind:value={editableTitle}
								class="text-xl sm:text-2xl font-bold text-zinc-900 bg-white border border-zinc-300 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<button type="submit" class="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
								<Check class="w-4 h-4" />
							</button>
						</form>
					{:else}
						<h1 class="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
							<span>{meeting.title}</span>
							<button
								onclick={() => { editableTitle = meeting.title; isEditingTitle = true; }}
								class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
								title="Edit Title"
							>
								<Edit2 class="w-4 h-4" />
							</button>
						</h1>
					{/if}
				</div>

				<!-- Meeting Metadata Badges -->
				<div class="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
					<span class="flex items-center gap-1">
						<Calendar class="w-3.5 h-3.5" />
						<span>{new Date(meeting.date).toLocaleDateString()}</span>
					</span>
					<span>•</span>
					<span class="flex items-center gap-1">
						<Clock class="w-3.5 h-3.5" />
						<span>{Math.floor((duration || meeting.durationSeconds || 0) / 60)}m {(duration || meeting.durationSeconds || 0) % 60}s</span>
					</span>
					{#if meeting.mode === 'smart'}
						<span>•</span>
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
							Smart Transcription
						</span>
					{:else}
						<span>•</span>
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
							Verbatim & Diarized
						</span>
					{/if}
					{#if meeting.languageCode}
						<span>•</span>
						<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 text-zinc-600">
							{meeting.languageCode}
						</span>
					{/if}
				</div>
			</div>

			<!-- Top Actions -->
			<div class="flex items-center gap-2">
				<button
					onclick={() => (retranscribeModalOpen = true)}
					disabled={isTranscribing}
					class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
				>
					<Sparkles class="w-4 h-4" />
					<span>{isTranscribing ? 'Transcribing...' : hasTranscript ? 'Re-Transcribe' : 'Transcribe Audio'}</span>
				</button>

				{#if hasTranscript}
					<ExportMenu {meeting} />
				{/if}

				<button
					onclick={handleDeleteMeeting}
					class="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 transition-colors"
					title="Delete Meeting"
				>
					<Trash2 class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Audio Player -->
		{#if meeting.audioFileName}
			<AudioPlayer
				bind:this={audioPlayerRef}
				src="/api/meetings/{meeting.id}/audio"
				bind:currentTime
				bind:duration
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleAudioDurationKnown}
			/>
		{/if}

		<!-- Speaker Diarization Overview Bar -->
		{#if speakerList.length > 0 && meeting.mode !== 'smart'}
			<div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Users class="w-4 h-4 text-zinc-400" />
						<h3 class="text-xs font-bold text-zinc-900">Speaker Breakdown ({speakerList.length} voices)</h3>
					</div>
					<span class="text-[11px] text-zinc-400 font-mono">Diarization via Gemini 3.5</span>
				</div>

				<!-- Multi-colored Talk Time Distribution Bar -->
				<div class="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden flex">
					{#each speakerList as speaker}
						<div
							class="h-full transition-all"
							style="width: {speaker.percentage || 20}%; background-color: {speaker.color}"
							title="{speaker.name}: {speaker.percentage || 0}% talk time"
						></div>
					{/each}
				</div>

				<!-- Speaker Chips -->
				<div class="flex flex-wrap items-center gap-2 pt-1">
					{#each speakerList as speaker}
						<button
							onclick={() => openRenameModal(speaker.id)}
							class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-indigo-300 bg-zinc-50/50 hover:bg-white text-xs text-zinc-800 transition-all shadow-2xs"
							title="Click to rename"
						>
							<span class="w-2.5 h-2.5 rounded-full" style="background-color: {speaker.color}"></span>
							<span class="font-semibold">{speaker.name}</span>
							<span class="text-[10px] text-zinc-400 font-mono">{speaker.percentage || 0}%</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Main Two-Column Layout: Transcript & AI Summary -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
			<!-- Left Column: Transcript (7 Cols) -->
			<div class="lg:col-span-7 space-y-4">
				{#if hasTranscript}
					<!-- Transcript Controls -->
					<div class="bg-white border border-zinc-200 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<!-- Search in transcript -->
						<div class="relative flex-1 max-w-sm">
							<Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								type="text"
								bind:value={transcriptSearch}
								placeholder="Search in transcript..."
								class="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							/>
						</div>

						{#if speakerList.length > 1}
							<!-- Speaker Filter -->
							<div class="flex items-center gap-2">
								<Filter class="w-3.5 h-3.5 text-zinc-400" />
								<select
									bind:value={selectedSpeakerFilter}
									class="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
								>
									<option value="all">All Speakers</option>
									{#each speakerList as spk}
										<option value={spk.id}>{spk.name}</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<!-- Transcript Turns Feed -->
					<div class="space-y-3">
						{#if filteredSegments.length > 0}
							{#each filteredSegments as segment (segment.id)}
								{@const spkProfile = meeting.speakers?.[segment.speaker]}
								<SpeakerTurn
									{segment}
									speakerProfile={spkProfile}
									{currentTime}
									onseek={handleSeek}
									oneditSpeaker={openRenameModal}
								/>
							{/each}
						{:else if meeting.smartTranscript || meeting.fullText}
							<div class="p-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-3">
								<div class="flex items-center gap-2 text-xs font-semibold text-indigo-700">
									<Sparkles class="w-4 h-4" />
									<span>Smart Formatted Transcript</span>
								</div>
								<div class="text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap font-sans">
									{meeting.smartTranscript || meeting.fullText}
								</div>
							</div>
						{:else}
							<div class="p-12 bg-white border border-zinc-200 rounded-3xl text-center text-xs text-zinc-400">
								No matching spoken sections found.
							</div>
						{/if}
					</div>
				{:else}
					<!-- Empty State with One-Click Transcribe CTA -->
					<div class="p-12 bg-white border border-dashed border-zinc-300 rounded-3xl text-center space-y-4">
						<div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
							<Sparkles class="w-6 h-6" />
						</div>
						<div class="space-y-1">
							<h3 class="text-sm font-bold text-zinc-900">Audio Ready for Transcription</h3>
							<p class="text-xs text-zinc-500 max-w-sm mx-auto">
								Your audio file is saved on disk. Click below to run Gemini 3.5 Transcribe with speaker diarization and word timestamps.
							</p>
						</div>
						<div class="pt-2 flex flex-wrap justify-center gap-3">
							<button
								onclick={() => runTranscription('verbatim')}
								disabled={isTranscribing}
								class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
							>
								{isTranscribing ? 'Processing...' : 'Transcribe (Verbatim + Diarization)'}
							</button>
							<button
								onclick={() => runTranscription('smart')}
								disabled={isTranscribing}
								class="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-800 text-xs font-semibold rounded-xl transition-colors"
							>
								{isTranscribing ? 'Processing...' : 'Smart Transcription'}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column: AI Meeting Intelligence & Notes (5 Cols) -->
			<div class="lg:col-span-5 space-y-6 sticky top-20">
				<MeetingSummaryCard
					summary={meeting.summary}
					smartTranscript={meeting.smartTranscript}
					onregenerate={handleRegenerateSummary}
					ontoggleActionItem={handleToggleActionItem}
					isGenerating={isSummarizing}
				/>
			</div>
		</div>

		<!-- Retranscribe Options Modal -->
		{#if retranscribeModalOpen}
			<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div class="fixed inset-0 bg-black/30 backdrop-blur-xs" onclick={() => (retranscribeModalOpen = false)} role="presentation"></div>

				<div class="relative w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl z-10 space-y-5">
					<div class="flex items-center justify-between border-b border-zinc-100 pb-3">
						<div>
							<h3 class="text-base font-bold text-zinc-900">Transcribe Audio</h3>
							<p class="text-xs text-zinc-500 mt-0.5">Select your Gemini 3.5 processing mode</p>
						</div>
					</div>

					<div class="space-y-3">
						<button
							type="button"
							onclick={() => (retranscribeMode = 'verbatim')}
							class="w-full p-3.5 text-left rounded-2xl border transition-all {retranscribeMode === 'verbatim'
								? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
								: 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}"
						>
							<span class="block text-xs font-bold text-zinc-900">Verbatim & Diarization</span>
							<span class="block text-[11px] text-zinc-500 mt-0.5">Speaker labels + word-level timestamps + click-to-seek audio</span>
						</button>

						<button
							type="button"
							onclick={() => (retranscribeMode = 'smart')}
							class="w-full p-3.5 text-left rounded-2xl border transition-all {retranscribeMode === 'smart'
								? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
								: 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}"
						>
							<span class="block text-xs font-bold text-zinc-900">Smart Transcription</span>
							<span class="block text-[11px] text-zinc-500 mt-0.5">AI cleaned-up text, filler word removal, formatted lists</span>
						</button>
					</div>

					<div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
						<button
							type="button"
							onclick={() => (retranscribeModalOpen = false)}
							class="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl"
						>
							Cancel
						</button>
						<button
							type="button"
							onclick={() => runTranscription(retranscribeMode)}
							class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
						>
							Start Transcription
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Rename Speaker Modal -->
		<SpeakerRenameModal
			open={renameModalOpen}
			speakerId={activeRenameSpeakerId}
			speakerProfile={meeting.speakers?.[activeRenameSpeakerId]}
			onclose={() => (renameModalOpen = false)}
			onsave={handleSaveSpeaker}
		/>
	</div>
{/if}