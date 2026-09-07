<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		icon: Component;
		iconColor?: string;
		iconBg?: string;
	}

	let {
		title,
		value,
		subtitle,
		icon: Icon,
		iconColor = 'text-indigo-600',
		iconBg = 'bg-indigo-50'
	}: Props = $props();
</script>

<div class="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs hover:border-zinc-300 transition-all">
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-zinc-500">{title}</span>
		<div class="p-2.5 {iconBg} {iconColor} rounded-xl">
			<Icon class="w-4 h-4" />
		</div>
	</div>
	<div class="mt-3">
		<p class="text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
		{#if subtitle}
			<p class="text-xs text-zinc-500 mt-1">{subtitle}</p>
		{/if}
	</div>
</div>
