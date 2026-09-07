<script lang="ts">
	import { X, UploadCloud, FileAudio, Sparkles, Check, AlertCircle } from '@lucide/svelte';
	import { meetingStore } from '$lib/stores/meetings.svelte';
	import { goto } from '$app/navigation';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();

	let selectedFile: File | null = $state(null);
	let title = $state('');
	let description = $state('');
	let mode = $state<'verbatim' | 'smart'>('verbatim');
	let languageCode = $state('');
	let customVocab = $state('');
	let isUploading = $state(false);
	let uploadProgressText = $state('');
	let errorMessage = $state<string | null>(null);

	const languages = [
		{ code: '', label: 'Auto-Detect (85+ Locales)' },
		{ code: 'en-US', label: 'English (United States)' },
		{ code: 'en-GB', label: 'English (Great Britain)' },
		{ code: 'nl-NL', label: 'Dutch (Nederlands)' },
		{ code: 'de-DE', label: 'German (Deutsch)' },
		{ code: 'fr-FR', label: 'French (Français)' },
		{ code: 'es-ES', label: 'Spanish (Español)' },
		{ code: 'it-IT', label: 'Italian (Italiano)' },
		{ code: 'pt-BR', label: 'Portuguese (Brasil)' },
		{ code: 'ja-JP', label: 'Japanese (日本語)' },
		{ code: 'ko-KR', label: 'Korean (한국어)' },
		{ code: 'cmn-Hans-CN', label: 'Mandarin Chinese' }
	];

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			setFile(target.files[0]);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			setFile(e.dataTransfer.files[0]);
		}
	}

	function setFile(file: File) {
		selectedFile = file;
		if (!title) {
			// Prepopulate title from file name
			title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
		}
	}

	async function handleSubmit() {
		if (!selectedFile) return;
		isUploading = true;
		errorMessage = null;
		uploadProgressText = 'Uploading audio file to storage...';

		try {
			const meeting = await meetingStore.uploadAudio(
				selectedFile,
				title.trim() || selectedFile.name,
				description.trim()
			);

			if (meeting) {
				uploadProgressText = 'Submitting to Gemini 3.5 Transcribe engine...';
				const vocabArray = customVocab
					.split(/[,;\n]/)
					.map((s) => s.trim())
					.filter(Boolean);

				await meetingStore.transcribe(meeting.id, {
					mode,
					diarization: mode === 'verbatim',
					timestamps: mode === 'verbatim',
					languageCode: languageCode || undefined,
					customVocabulary: vocabArray.length > 0 ? vocabArray : undefined
				});

				onclose();
				goto(`/meetings/${meeting.id}`);
			}
		} catch (err: any) {
			console.error('Upload & Transcribe error:', err);
			errorMessage = err.message || 'Failed to upload or transcribe audio.';
		} finally {
			isUploading = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="fixed inset-0 bg-black/30 backdrop-blur-xs" onclick={onclose} role="presentation"></div>

		<div class="relative w-full max-w-xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between border-b border-zinc-100 pb-4">
				<div>
					<h3 class="text-base font-bold text-zinc-900">Upload & Transcribe Audio</h3>
					<p class="text-xs text-zinc-500 mt-0.5">Processes recorded meetings with Gemini 3.5 Transcribe</p>
				</div>
				<button onclick={onclose} class="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
					<X class="w-5 h-5" />
				</button>
			</div>

			{#if errorMessage}
				<div class="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
					<AlertCircle class="w-4 h-4 shrink-0" />
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				<!-- Dropzone -->
				<div
					ondrop={handleDrop}
					ondragover={(e) => e.preventDefault()}
					class="border-2 border-dashed border-zinc-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-zinc-50/50"
				>
					<input
						type="file"
						accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.flac,.aac"
						onchange={handleFileSelect}
						class="hidden"
						id="audio-file-input"
					/>
					<label for="audio-file-input" class="cursor-pointer block space-y-2">
						{#if selectedFile}
							<div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
								<FileAudio class="w-5 h-5" />
							</div>
							<div>
								<p class="text-xs font-semibold text-zinc-900">{selectedFile.name}</p>
								<p class="text-[11px] text-zinc-400 mt-0.5">
									{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to transcribe
								</p>
							</div>
						{:else}
							<div class="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
								<UploadCloud class="w-5 h-5" />
							</div>
							<div>
								<p class="text-xs font-semibold text-zinc-800">Choose audio file or drag & drop</p>
								<p class="text-[11px] text-zinc-400 mt-0.5">Supports WAV, MP3, M4A, OGG, FLAC, WebM (up to 1 hour)</p>
							</div>
						{/if}
					</label>
				</div>

				<!-- Meeting Title -->
				<div>
					<label for="meeting-title" class="block text-xs font-semibold text-zinc-700 mb-1">Meeting Title</label>
					<input
						id="meeting-title"
						type="text"
						bind:value={title}
						placeholder="e.g. Weekly Strategy Sync"
						class="w-full px-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
						required
					/>
				</div>

				<!-- Transcription Mode Options -->
				<div>
					<label class="block text-xs font-semibold text-zinc-700 mb-1.5">Transcription Mode</label>
					<div class="grid grid-cols-2 gap-3">
						<button
							type="button"
							onclick={() => (mode = 'verbatim')}
							class="p-3 text-left rounded-2xl border transition-all {mode === 'verbatim'
								? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
								: 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}"
						>
							<span class="block text-xs font-bold text-zinc-900">Verbatim + Diarization</span>
							<span class="block text-[10px] text-zinc-500 mt-0.5">Speaker labels + word timestamps</span>
						</button>

						<button
							type="button"
							onclick={() => (mode = 'smart')}
							class="p-3 text-left rounded-2xl border transition-all {mode === 'smart'
								? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
								: 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}"
						>
							<span class="block text-xs font-bold text-zinc-900">Smart Transcription</span>
							<span class="block text-[10px] text-zinc-500 mt-0.5">Removes fillers & auto-formats</span>
						</button>
					</div>
				</div>

				<!-- Language selection -->
				<div>
					<label for="language-select" class="block text-xs font-semibold text-zinc-700 mb-1">Language Hint</label>
					<select
						id="language-select"
						bind:value={languageCode}
						class="w-full px-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
					>
						{#each languages as lang}
							<option value={lang.code}>{lang.label}</option>
						{/each}
					</select>
				</div>

				<!-- Custom vocabulary -->
				{#if mode === 'verbatim'}
					<div>
						<label for="custom-vocab-input" class="block text-xs font-semibold text-zinc-700 mb-1">
							Custom Vocabulary <span class="font-normal text-zinc-400">(Optional)</span>
						</label>
						<input
							id="custom-vocab-input"
							type="text"
							bind:value={customVocab}
							placeholder="Domain terms, company names (comma-separated)"
							class="w-full px-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
						/>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
					<button
						type="button"
						onclick={onclose}
						disabled={isUploading}
						class="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={!selectedFile || isUploading}
						class="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
					>
						<Sparkles class="w-4 h-4" />
						<span>{isUploading ? uploadProgressText || 'Processing...' : 'Upload & Transcribe'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
