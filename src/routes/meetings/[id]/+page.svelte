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
		Layers
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

	onMount(async () => {
		if (meetingId) {
			const loaded = await meetingStore.loadById(meetingId);
			if (loaded) {
				editableTitle = loaded.title;
				duration = loaded.durationSeconds || 0;
			}
		}
	});

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

	async function handleReTranscribe() {
		if (!meeting) return;
		try {
			await meetingStore.transcribe(meeting.id, {
				mode: 'verbatim',
				diarization: true,
				timestamps: true
			});
		} catch (e) {
			console.error('Re-transcribe error:', e);
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
								autofocus
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
						<span>{Math.floor((meeting.durationSeconds || 0) / 60)}m {(meeting.durationSeconds || 0) % 60}s</span>
					</span>
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
				{#if meeting.status === 'recorded' || meeting.status === 'error'}
					<button
						onclick={handleReTranscribe}
						class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
					>
						<Sparkles class="w-4 h-4" />
						<span>Transcribe with Gemini 3.5</span>
					</button>
				{/if}

				<ExportMenu {meeting} />

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
				onTimeUpdate={(t) => (currentTime = t)}
			/>
		{/if}

		<!-- Speaker Diarization Overview Bar -->
		{#if speakerList.length > 0}
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
				</div>

				<!-- Transcript Turns Feed -->
				<div class="space-y-3">
					{#if filteredSegments.length === 0}
						<div class="p-12 bg-white border border-zinc-200 rounded-3xl text-center text-xs text-zinc-400">
							{#if transcriptSearch}
								No matching spoken sections found for "{transcriptSearch}"
							{:else}
								No transcript segments available yet.
							{/if}
						</div>
					{:else}
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
					{/if}
				</div>
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

		<!-- Rename Modal -->
		<SpeakerRenameModal
			open={renameModalOpen}
			speakerId={activeRenameSpeakerId}
			speakerProfile={meeting.speakers?.[activeRenameSpeakerId]}
			onclose={() => (renameModalOpen = false)}
			onsave={handleSaveSpeaker}
		/>
	</div>
{/if}
