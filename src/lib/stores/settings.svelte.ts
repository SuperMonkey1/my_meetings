import type { AppSettings } from '$lib/types';

class SettingsStore {
	settings = $state<AppSettings>({
		geminiApiKey: '',
		defaultLanguage: '',
		defaultMode: 'verbatim',
		autoSummarize: true,
		autoDiarize: true,
		hasCustomKey: false
	});
	loading = $state(false);
	savedSuccess = $state(false);

	async load() {
		this.loading = true;
		try {
			const res = await fetch('/api/settings');
			if (res.ok) {
				this.settings = await res.json();
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		} finally {
			this.loading = false;
		}
	}

	async save(partial: Partial<AppSettings>): Promise<boolean> {
		this.loading = true;
		try {
			const res = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(partial)
			});

			if (res.ok) {
				const data = await res.json();
				this.settings = data.settings;
				this.savedSuccess = true;
				setTimeout(() => {
					this.savedSuccess = false;
				}, 3000);
				return true;
			}
		} catch (e) {
			console.error('Failed to save settings:', e);
		} finally {
			this.loading = false;
		}
		return false;
	}
}

export const settingsStore = new SettingsStore();
