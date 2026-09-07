<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { Key, Sparkles, Check, ExternalLink, ShieldCheck, FileAudio, Globe, Sliders } from '@lucide/svelte';

	let apiKey = $state('');
	let defaultMode = $state<'verbatim' | 'smart'>('verbatim');
	let defaultLanguage = $state('');
	let autoSummarize = $state(true);
	let showKey = $state(false);

	$effect(() => {
		if (settingsStore.settings) {
			apiKey = settingsStore.settings.geminiApiKey || '';
			defaultMode = settingsStore.settings.defaultMode || 'verbatim';
			defaultLanguage = settingsStore.settings.defaultLanguage || '';
			autoSummarize = settingsStore.settings.autoSummarize ?? true;
		}
	});

	async function handleSave() {
		await settingsStore.save({
			geminiApiKey: apiKey.trim(),
			defaultMode,
			defaultLanguage,
			autoSummarize
		});
	}

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
		{ code: 'ko-KR', label: 'Korean (한국어)' }
	];
</script>

<div class="space-y-8 max-w-4xl mx-auto">
	<div>
		<h1 class="text-2xl font-bold text-zinc-900 tracking-tight">Settings & Engine Configuration</h1>
		<p class="text-xs text-zinc-500 mt-1">Manage your Gemini API access and transcription preferences</p>
	</div>

	<!-- API Key Card -->
	<div class="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
		<div class="flex items-center justify-between border-b border-zinc-100 pb-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
					<Key class="w-5 h-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-zinc-900">Google Gemini API Key</h3>
					<p class="text-xs text-zinc-500">Required for Gemini 3.5 Transcribe & Interactions API</p>
				</div>
			</div>

			<a
				href="https://aistudio.google.com/apikey"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
			>
				<span>Get API Key</span>
				<ExternalLink class="w-3.5 h-3.5" />
			</a>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
			<div>
				<label for="gemini-api-key" class="block text-xs font-semibold text-zinc-700 mb-1.5">API Key</label>
				<div class="relative flex items-center">
					<input
						id="gemini-api-key"
						type={showKey ? 'text' : 'password'}
						bind:value={apiKey}
						placeholder="AIzaSy..."
						autocomplete="new-password"
						class="w-full pl-4 pr-20 py-2.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
					/>
					<button
						type="button"
						onclick={() => (showKey = !showKey)}
						class="absolute right-3 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800"
					>
						{showKey ? 'Hide' : 'Show'}
					</button>
				</div>
				<p class="text-[11px] text-zinc-400 mt-1.5">
					Your key is saved locally in <code class="font-mono text-zinc-600">data/settings.json</code> and never transmitted to any third-party servers.
				</p>
			</div>

			<div class="flex items-center justify-between pt-2">
				<div class="flex items-center gap-2">
					{#if settingsStore.savedSuccess}
						<span class="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
							<Check class="w-4 h-4" />
							<span>Settings Saved Successfully</span>
						</span>
					{/if}
				</div>

				<button
					type="submit"
					disabled={settingsStore.loading}
					class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
				>
					{settingsStore.loading ? 'Saving...' : 'Save Settings'}
				</button>
			</div>
		</form>
	</div>

	<!-- Transcription Defaults Card -->
	<div class="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
		<div class="flex items-center gap-3 border-b border-zinc-100 pb-4">
			<div class="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
				<Sliders class="w-5 h-5" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-zinc-900">Transcription Preferences</h3>
				<p class="text-xs text-zinc-500">Configure default mode and speech engine options</p>
			</div>
		</div>

		<div class="space-y-4">
			<!-- Default Mode -->
			<div>
				<label class="block text-xs font-semibold text-zinc-700 mb-2">Default Transcription Mode</label>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label
						class="p-4 rounded-2xl border cursor-pointer transition-all {defaultMode === 'verbatim'
							? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
							: 'bg-zinc-50 border-zinc-200'}"
					>
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold text-zinc-900">Verbatim & Diarization</span>
							<input
								type="radio"
								name="mode"
								value="verbatim"
								checked={defaultMode === 'verbatim'}
								onchange={() => (defaultMode = 'verbatim')}
								class="text-indigo-600"
							/>
						</div>
						<p class="text-[11px] text-zinc-500 mt-1">Includes speaker turns and word-level timestamps for interactive playback.</p>
					</label>

					<label
						class="p-4 rounded-2xl border cursor-pointer transition-all {defaultMode === 'smart'
							? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
							: 'bg-zinc-50 border-zinc-200'}"
					>
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold text-zinc-900">Smart Transcription</span>
							<input
								type="radio"
								name="mode"
								value="smart"
								checked={defaultMode === 'smart'}
								onchange={() => (defaultMode = 'smart')}
								class="text-indigo-600"
							/>
						</div>
						<p class="text-[11px] text-zinc-500 mt-1">Cleans conversational filler words, stuttering, and formats lists automatically.</p>
					</label>
				</div>
			</div>

			<!-- Language -->
			<div>
				<label for="default-language" class="block text-xs font-semibold text-zinc-700 mb-1.5">Default Language</label>
				<select
					id="default-language"
					bind:value={defaultLanguage}
					class="w-full px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					{#each languages as l}
						<option value={l.code}>{l.label}</option>
					{/each}
				</select>
			</div>

			<!-- Auto Summarize Toggle -->
			<div class="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
				<div class="space-y-0.5">
					<span class="text-xs font-semibold text-zinc-900">Auto-Generate Meeting Summary</span>
					<p class="text-[11px] text-zinc-500">Automatically extracts key decisions and action items after transcription.</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input type="checkbox" bind:checked={autoSummarize} class="sr-only peer" />
					<div class="w-10 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
				</label>
			</div>

			<div class="pt-2 text-right">
				<button
					onclick={handleSave}
					class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
				>
					Save Preferences
				</button>
			</div>
		</div>
	</div>

	<!-- Specifications & Guidance Card -->
	<div class="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
		<h3 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
			<Sparkles class="w-4 h-4 text-indigo-600" />
			<span>Gemini 3.5 Transcribe Specifications</span>
		</h3>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600">
			<div class="p-4 bg-zinc-50 rounded-2xl space-y-1.5">
				<span class="font-bold text-zinc-900 block">Supported Audio Formats</span>
				<p class="text-[11px] text-zinc-500">
					WAV (<code class="font-mono text-zinc-700">audio/wav</code>), MP3, AIFF, AAC, OGG, FLAC, M4A, Opus, WebM.
				</p>
			</div>

			<div class="p-4 bg-zinc-50 rounded-2xl space-y-1.5">
				<span class="font-bold text-zinc-900 block">Diarization & Limits</span>
				<p class="text-[11px] text-zinc-500">
					Supports up to 8 distinct speakers per audio file. Files up to 1 hour (30 min for full word timestamps).
				</p>
			</div>
		</div>
	</div>
</div>
