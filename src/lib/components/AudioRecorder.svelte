<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Mic, Square, Pause, Play, Sparkles, UploadCloud, RotateCcw, AlertCircle } from '@lucide/svelte';
	import { meetingStore } from '$lib/stores/meetings.svelte';
	import { goto } from '$app/navigation';

	let isRecording = $state(false);
	let isPaused = $state(false);
	let durationSeconds = $state(0);
	let timerInterval: any = null;
	let recordedBlob: Blob | null = $state(null);
	let recordedAudioUrl = $state<string | null>(null);
	let isProcessing = $state(false);
	let errorMessage = $state<string | null>(null);
	let meetingTitle = $state('');

	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let canvasElement: HTMLCanvasElement | undefined = $state();
	let animationFrameId: any = null;

	function formatDuration(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	async function startRecording() {
		errorMessage = null;
		audioChunks = [];
		recordedBlob = null;
		if (recordedAudioUrl) {
			URL.revokeObjectURL(recordedAudioUrl);
			recordedAudioUrl = null;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			// Set up Audio Context and Analyser for live visualizer
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			const source = audioContext.createMediaStreamSource(stream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 128;
			source.connect(analyser);

			drawWaveform();

			// Media recorder
			let mimeType = 'audio/webm';
			if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
				mimeType = 'audio/webm;codecs=opus';
			} else if (MediaRecorder.isTypeSupported('audio/mp4')) {
				mimeType = 'audio/mp4';
			}

			mediaRecorder = new MediaRecorder(stream, { mimeType });

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				recordedBlob = new Blob(audioChunks, { type: mimeType });
				recordedAudioUrl = URL.createObjectURL(recordedBlob);
				stream.getTracks().forEach((track) => track.stop());
				if (audioContext) {
					audioContext.close();
					audioContext = null;
				}
				cancelAnimationFrame(animationFrameId);
			};

			mediaRecorder.start(250);
			isRecording = true;
			isPaused = false;
			durationSeconds = 0;

			timerInterval = setInterval(() => {
				if (!isPaused) {
					durationSeconds++;
				}
			}, 1000);
		} catch (err: any) {
			console.error('Microphone access error:', err);
			errorMessage = err.message || 'Microphone access denied. Please grant audio permissions.';
		}
	}

	function pauseRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.pause();
			isPaused = true;
		}
	}

	function resumeRecording() {
		if (mediaRecorder && mediaRecorder.state === 'paused') {
			mediaRecorder.resume();
			isPaused = false;
		}
	}

	function stopRecording() {
		if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
			mediaRecorder.stop();
			isRecording = false;
			isPaused = false;
			clearInterval(timerInterval);
		}
	}

	function resetRecording() {
		if (isRecording) {
			stopRecording();
		}
		recordedBlob = null;
		if (recordedAudioUrl) {
			URL.revokeObjectURL(recordedAudioUrl);
			recordedAudioUrl = null;
		}
		durationSeconds = 0;
		errorMessage = null;
	}

	function drawWaveform() {
		if (!canvasElement || !analyser) return;
		const canvas = canvasElement;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		function render() {
			animationFrameId = requestAnimationFrame(render);
			if (!analyser || !ctx || !canvas) return;
			analyser.getByteFrequencyData(dataArray);

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const barWidth = (canvas.width / bufferLength) * 2.2;
			let x = 0;

			for (let i = 0; i < bufferLength; i++) {
				const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

				// Beautiful gradient bar
				const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
				gradient.addColorStop(0, '#4f46e5');
				gradient.addColorStop(1, '#818cf8');

				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 4);
				ctx.fill();

				x += barWidth;
			}
		}

		render();
	}

	async function handleUploadAndTranscribe(autoTranscribe = true) {
		if (!recordedBlob) return;
		isProcessing = true;
		errorMessage = null;

		try {
			const title = meetingTitle.trim() || `Live Meeting - ${new Date().toLocaleDateString()}`;
			const file = new File([recordedBlob], `${title.toLowerCase().replace(/\s+/g, '-')}.webm`, {
				type: recordedBlob.type
			});

			const newMeeting = await meetingStore.uploadAudio(file, title, 'Recorded in My Meetings studio', durationSeconds);

			if (newMeeting && autoTranscribe) {
				await meetingStore.transcribe(newMeeting.id, {
					mode: 'verbatim',
					diarization: true,
					timestamps: true
				});
				goto(`/meetings/${newMeeting.id}`);
			} else if (newMeeting) {
				goto(`/meetings/${newMeeting.id}`);
			}
		} catch (err: any) {
			errorMessage = err.message || 'Failed to process recording';
		} finally {
			isProcessing = false;
		}
	}

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
	});
</script>

<div class="max-w-2xl mx-auto bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs space-y-6">
	<div class="text-center space-y-1">
		<h2 class="text-xl font-bold text-zinc-900 tracking-tight">Meeting Recording Studio</h2>
		<p class="text-xs text-zinc-500">Record high-fidelity audio directly from your microphone</p>
	</div>

	{#if errorMessage}
		<div class="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
			<AlertCircle class="w-4 h-4 shrink-0" />
			<span>{errorMessage}</span>
		</div>
	{/if}

	<!-- Live Waveform Canvas -->
	<div class="h-32 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
		{#if isRecording}
			<canvas bind:this={canvasElement} width="600" height="120" class="w-full h-full px-4"></canvas>
			<div class="absolute top-3 left-4 flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-rose-500 {isPaused ? '' : 'animate-ping'}"></span>
				<span class="text-[11px] font-mono font-semibold {isPaused ? 'text-amber-600' : 'text-rose-600'}">
					{isPaused ? 'PAUSED' : 'RECORDING LIVE'}
				</span>
			</div>
		{:else if recordedAudioUrl}
			<div class="w-full px-6 flex flex-col items-center gap-2">
				<audio src={recordedAudioUrl} controls class="w-full h-10"></audio>
				<span class="text-[11px] text-zinc-400 font-mono">Recorded audio preview ({formatDuration(durationSeconds)})</span>
			</div>
		{:else}
			<div class="text-center space-y-2">
				<div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
					<Mic class="w-6 h-6" />
				</div>
				<p class="text-xs text-zinc-400 font-medium">Click Start Recording to begin</p>
			</div>
		{/if}
	</div>

	<!-- Timer Display -->
	<div class="text-center">
		<span class="text-4xl font-mono font-bold text-zinc-900 tracking-wider">
			{formatDuration(durationSeconds)}
		</span>
	</div>

	<!-- Recording Controls -->
	<div class="flex items-center justify-center gap-3">
		{#if !isRecording && !recordedBlob}
			<button
				onclick={startRecording}
				class="flex items-center gap-2.5 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
			>
				<Mic class="w-5 h-5" />
				<span>Start Recording</span>
			</button>
		{:else if isRecording}
			{#if isPaused}
				<button
					onclick={resumeRecording}
					class="p-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-colors"
					title="Resume"
				>
					<Play class="w-5 h-5 fill-current" />
				</button>
			{:else}
				<button
					onclick={pauseRecording}
					class="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl transition-colors"
					title="Pause"
				>
					<Pause class="w-5 h-5 fill-current" />
				</button>
			{/if}

			<button
				onclick={stopRecording}
				class="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm rounded-2xl shadow-xs transition-colors"
			>
				<Square class="w-4 h-4 fill-white" />
				<span>Stop & Preview</span>
			</button>
		{:else if recordedBlob}
			<button
				onclick={resetRecording}
				class="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl text-xs font-medium flex items-center gap-1.5"
			>
				<RotateCcw class="w-4 h-4" />
				<span>Re-record</span>
			</button>

			<div class="flex-1 max-w-xs">
				<input
					type="text"
					bind:value={meetingTitle}
					placeholder="Enter meeting title..."
					class="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
			</div>

			<button
				onclick={() => handleUploadAndTranscribe(true)}
				disabled={isProcessing}
				class="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-2xl shadow-xs transition-colors"
			>
				<Sparkles class="w-4 h-4" />
				<span>{isProcessing ? 'Transcribing...' : 'Transcribe with Gemini'}</span>
			</button>
		{/if}
	</div>
</div>