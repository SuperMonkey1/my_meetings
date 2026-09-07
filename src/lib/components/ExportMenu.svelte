<script lang="ts">
	import type { Meeting } from '$lib/types';
	import { Download, Copy, Check, FileText, ChevronDown } from '@lucide/svelte';

	interface Props {
		meeting: Meeting;
	}

	let { meeting }: Props = $props();

	let open = $state(false);
	let copied = $state(false);

	function formatTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function formatSrtTimestamp(sec: number): string {
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		const s = Math.floor(sec % 60);
		const ms = Math.floor((sec % 1) * 1000);
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
	}

	function formatVttTimestamp(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		const ms = Math.floor((sec % 1) * 1000);
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
	}

	function getMarkdown(): string {
		let md = `# ${meeting.title}\n\n`;
		md += `**Date:** ${new Date(meeting.date).toLocaleString()}\n`;
		md += `**Duration:** ${formatTime(meeting.durationSeconds)}\n\n`;

		if (meeting.summary?.overview) {
			md += `## Executive Summary\n${meeting.summary.overview}\n\n`;
		}

		if (meeting.summary?.actionItems && meeting.summary.actionItems.length > 0) {
			md += `## Action Items\n`;
			for (const a of meeting.summary.actionItems) {
				md += `- [${a.completed ? 'x' : ' '}] **${a.task}** (${a.assignee || 'Team'}, Due: ${a.dueDate || 'ASAP'})\n`;
			}
			md += `\n`;
		}

		md += `## Transcript\n\n`;
		if (meeting.segments && meeting.segments.length > 0) {
			for (const seg of meeting.segments) {
				md += `### ${seg.speakerName || seg.speaker} (${formatTime(seg.startTime)} - ${formatTime(seg.endTime)})\n`;
				md += `${seg.text}\n\n`;
			}
		} else {
			md += `${meeting.fullText || ''}\n`;
		}

		return md;
	}

	function getText(): string {
		if (meeting.segments && meeting.segments.length > 0) {
			return meeting.segments
				.map((s) => `[${formatTime(s.startTime)}] ${s.speakerName || s.speaker}: ${s.text}`)
				.join('\n\n');
		}
		return meeting.fullText || '';
	}

	function getSrt(): string {
		if (!meeting.segments) return '';
		return meeting.segments
			.map((seg, idx) => {
				return `${idx + 1}\n${formatSrtTimestamp(seg.startTime)} --> ${formatSrtTimestamp(seg.endTime)}\n${seg.speakerName || seg.speaker}: ${seg.text}\n`;
			})
			.join('\n');
	}

	function getVtt(): string {
		if (!meeting.segments) return 'WEBVTT\n\n';
		let vtt = 'WEBVTT\n\n';
		vtt += meeting.segments
			.map((seg) => {
				return `${formatVttTimestamp(seg.startTime)} --> ${formatVttTimestamp(seg.endTime)}\n<v ${seg.speakerName || seg.speaker}>${seg.text}\n`;
			})
			.join('\n');
		return vtt;
	}

	function downloadFile(content: string, filename: string, mimeType: string) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		open = false;
	}

	async function copyTranscript() {
		const text = getText();
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
		open = false;
	}
</script>

<div class="relative inline-block text-left">
	<button
		onclick={() => (open = !open)}
		class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-xs"
	>
		<Download class="w-3.5 h-3.5 text-zinc-500" />
		<span>Export</span>
		<ChevronDown class="w-3 h-3 text-zinc-400 ml-0.5" />
	</button>

	{#if open}
		<div class="fixed inset-0 z-20" onclick={() => (open = false)} role="presentation"></div>

		<div class="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-xl py-1.5 z-30 space-y-0.5">
			<button
				onclick={copyTranscript}
				class="w-full px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
			>
				{#if copied}
					<Check class="w-3.5 h-3.5 text-emerald-600" />
					<span class="text-emerald-700 font-medium">Copied!</span>
				{:else}
					<Copy class="w-3.5 h-3.5 text-zinc-400" />
					<span>Copy Transcript</span>
				{/if}
			</button>

			<div class="border-t border-zinc-100 my-1"></div>

			<button
				onclick={() => downloadFile(getMarkdown(), `${meeting.title}.md`, 'text/markdown')}
				class="w-full px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
			>
				<FileText class="w-3.5 h-3.5 text-zinc-400" />
				<span>Markdown (.md)</span>
			</button>

			<button
				onclick={() => downloadFile(getText(), `${meeting.title}.txt`, 'text/plain')}
				class="w-full px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
			>
				<FileText class="w-3.5 h-3.5 text-zinc-400" />
				<span>Plain Text (.txt)</span>
			</button>

			<button
				onclick={() => downloadFile(getSrt(), `${meeting.title}.srt`, 'application/x-subrip')}
				class="w-full px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
			>
				<FileText class="w-3.5 h-3.5 text-zinc-400" />
				<span>Subtitles (.srt)</span>
			</button>

			<button
				onclick={() => downloadFile(getVtt(), `${meeting.title}.vtt`, 'text/vtt')}
				class="w-full px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
			>
				<FileText class="w-3.5 h-3.5 text-zinc-400" />
				<span>WebVTT (.vtt)</span>
			</button>

			<button
				onclick={() => downloadFile(JSON.stringify(meeting, null, 2), `${meeting.title}.json`, 'application/json')}
				class="w-full px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
			>
				<FileText class="w-3.5 h-3.5 text-zinc-400" />
				<span>JSON Export</span>
			</button>
		</div>
	{/if}
</div>
