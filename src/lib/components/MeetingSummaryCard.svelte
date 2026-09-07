<script lang="ts">
	import type { AISummary, ActionItem } from '$lib/types';
	import { Sparkles, CheckSquare, ListChecks, Lightbulb, FileText, CheckCircle2, RotateCw } from '@lucide/svelte';

	interface Props {
		summary?: AISummary;
		smartTranscript?: string;
		onregenerate?: () => void;
		ontoggleActionItem?: (itemId: string) => void;
		isGenerating?: boolean;
	}

	let { summary, smartTranscript, onregenerate, ontoggleActionItem, isGenerating = false }: Props = $props();

	let activeTab = $state<'summary' | 'actions' | 'decisions' | 'smart'>('summary');
</script>

<div class="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
	<!-- Card Header with Tabs -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
		<div class="flex items-center gap-2">
			<div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
				<Sparkles class="w-4 h-4" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-zinc-900">Meeting Intelligence</h3>
				<p class="text-[11px] text-zinc-400">Gemini AI Executive Summary & Action Items</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- Tabs -->
			<div class="flex items-center bg-zinc-100 p-1 rounded-xl gap-1">
				<button
					onclick={() => (activeTab = 'summary')}
					class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all {activeTab === 'summary'
						? 'bg-white text-zinc-900 shadow-xs font-semibold'
						: 'text-zinc-600 hover:text-zinc-900'}"
				>
					Summary
				</button>
				<button
					onclick={() => (activeTab = 'actions')}
					class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 {activeTab === 'actions'
						? 'bg-white text-zinc-900 shadow-xs font-semibold'
						: 'text-zinc-600 hover:text-zinc-900'}"
				>
					<span>Actions</span>
					{#if summary?.actionItems && summary.actionItems.length > 0}
						<span class="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
							{summary.actionItems.length}
						</span>
					{/if}
				</button>
				<button
					onclick={() => (activeTab = 'decisions')}
					class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all {activeTab === 'decisions'
						? 'bg-white text-zinc-900 shadow-xs font-semibold'
						: 'text-zinc-600 hover:text-zinc-900'}"
				>
					Decisions
				</button>
				{#if smartTranscript}
					<button
						onclick={() => (activeTab = 'smart')}
						class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all {activeTab === 'smart'
							? 'bg-white text-zinc-900 shadow-xs font-semibold'
							: 'text-zinc-600 hover:text-zinc-900'}"
					>
						Smart Text
					</button>
				{/if}
			</div>

			<!-- Regenerate button -->
			{#if onregenerate}
				<button
					onclick={onregenerate}
					disabled={isGenerating}
					class="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 transition-colors"
					title="Regenerate Summary"
				>
					<RotateCw class="w-4 h-4 {isGenerating ? 'animate-spin text-indigo-600' : ''}" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Tab Contents -->
	{#if activeTab === 'summary'}
		<div class="space-y-4">
			{#if summary?.overview}
				<div class="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
					<p class="text-xs leading-relaxed text-zinc-800">{summary.overview}</p>
				</div>
			{/if}

			{#if summary?.keyPoints && summary.keyPoints.length > 0}
				<div>
					<h4 class="text-xs font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
						<Lightbulb class="w-3.5 h-3.5 text-amber-500" />
						<span>Key Takeaways</span>
					</h4>
					<ul class="space-y-1.5">
						{#each summary.keyPoints as point}
							<li class="text-xs text-zinc-700 flex items-start gap-2">
								<span class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
								<span>{point}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if summary?.topics && summary.topics.length > 0}
				<div class="flex flex-wrap gap-1.5 pt-2">
					{#each summary.topics as topic}
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600">
							#{topic}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	{:else if activeTab === 'actions'}
		<div class="space-y-2">
			{#if !summary?.actionItems || summary.actionItems.length === 0}
				<p class="text-xs text-zinc-400 italic py-4 text-center">No explicit action items detected</p>
			{:else}
				<div class="divide-y divide-zinc-100">
					{#each summary.actionItems as item}
						<div class="py-2.5 flex items-start justify-between gap-3 group">
							<label class="flex items-start gap-2.5 cursor-pointer flex-1">
								<input
									type="checkbox"
									checked={item.completed}
									onchange={() => ontoggleActionItem?.(item.id)}
									class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
								/>
								<div class="space-y-0.5">
									<p class="text-xs font-medium {item.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}">
										{item.task}
									</p>
									<div class="flex items-center gap-2 text-[10px] text-zinc-400">
										{#if item.assignee}
											<span class="font-medium text-zinc-600">Assignee: {item.assignee}</span>
										{/if}
										{#if item.dueDate}
											<span>• Due: {item.dueDate}</span>
										{/if}
									</div>
								</div>
							</label>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if activeTab === 'decisions'}
		<div class="space-y-2">
			{#if !summary?.decisions || summary.decisions.length === 0}
				<p class="text-xs text-zinc-400 italic py-4 text-center">No distinct decisions recorded</p>
			{:else}
				<ul class="space-y-2">
					{#each summary.decisions as decision}
						<li class="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
							<CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
							<span>{decision}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else if activeTab === 'smart'}
		<div class="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap font-sans">
			{smartTranscript || 'No smart transcript available.'}
		</div>
	{/if}
</div>
