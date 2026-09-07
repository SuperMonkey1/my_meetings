<script lang="ts">
	import { X, Check } from '@lucide/svelte';
	import type { SpeakerProfile } from '$lib/types';

	interface Props {
		open: boolean;
		speakerId: string;
		speakerProfile?: SpeakerProfile;
		onclose: () => void;
		onsave: (speakerId: string, newName: string, newColor: string) => void;
	}

	let { open, speakerId, speakerProfile, onclose, onsave }: Props = $props();

	let name = $state('');
	let color = $state('#4f46e5');

	const colorPalette = [
		'#4f46e5', // Indigo
		'#0284c7', // Sky
		'#059669', // Emerald
		'#d97706', // Amber
		'#dc2626', // Red
		'#7c3aed', // Violet
		'#db2777', // Pink
		'#0891b2'  // Cyan
	];

	$effect(() => {
		if (open && speakerProfile) {
			name = speakerProfile.name;
			color = speakerProfile.color;
		}
	});

	function handleSubmit() {
		if (!name.trim()) return;
		onsave(speakerId, name.trim(), color);
		onclose();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="fixed inset-0 bg-black/30 backdrop-blur-xs" onclick={onclose} role="presentation"></div>

		<div class="relative w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl z-10 space-y-5">
			<div class="flex items-center justify-between border-b border-zinc-100 pb-3">
				<div>
					<h3 class="text-base font-bold text-zinc-900">Rename Speaker</h3>
					<p class="text-xs text-zinc-500 mt-0.5">Customize speaker tag across the transcript</p>
				</div>
				<button onclick={onclose} class="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
					<X class="w-5 h-5" />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				<div>
					<label for="speaker-name-input" class="block text-xs font-semibold text-zinc-700 mb-1.5">Speaker Name</label>
					<input
						id="speaker-name-input"
						type="text"
						bind:value={name}
						placeholder="e.g. Frederik, Sarah Chen, Alice"
						class="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
						required
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold text-zinc-700 mb-2">Badge Color</label>
					<div class="flex items-center gap-2">
						{#each colorPalette as c}
							<button
								type="button"
								onclick={() => (color = c)}
								class="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
								style="background-color: {c}"
							>
								{#if color === c}
									<Check class="w-4 h-4 text-white" />
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
					<button
						type="button"
						onclick={onclose}
						class="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
					>
						Save Changes
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
