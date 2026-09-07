import type { Meeting, DashboardStats, TranscriptionOptions } from '$lib/types';

class MeetingStore {
	list = $state<Meeting[]>([]);
	current = $state<Meeting | null>(null);
	stats = $state<DashboardStats>({
		totalMeetings: 0,
		totalDurationSeconds: 0,
		totalWords: 0,
		completedCount: 0,
		pendingActionItemsCount: 0
	});
	loading = $state(false);
	transcribingId = $state<string | null>(null);
	error = $state<string | null>(null);

	async loadAll() {
		this.loading = true;
		this.error = null;
		try {
			const res = await fetch('/api/meetings');
			if (res.ok) {
				const data = await res.json();
				this.list = data.meetings || [];
				this.stats = data.stats || this.stats;
			}
		} catch (e: any) {
			this.error = e.message || 'Failed to load meetings';
		} finally {
			this.loading = false;
		}
	}

	async loadById(id: string): Promise<Meeting | null> {
		this.loading = true;
		this.error = null;
		try {
			const res = await fetch(`/api/meetings/${id}`);
			if (res.ok) {
				const meeting = await res.json();
				this.current = meeting;
				return meeting;
			}
		} catch (e: any) {
			this.error = e.message || 'Failed to load meeting';
		} finally {
			this.loading = false;
		}
		return null;
	}

	async uploadAudio(file: File, title?: string, description?: string, duration?: number): Promise<Meeting | null> {
		this.loading = true;
		this.error = null;
		try {
			const formData = new FormData();
			formData.append('audio', file);
			if (title) formData.append('title', title);
			if (description) formData.append('description', description);
			if (duration) formData.append('duration', duration.toString());

			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				const newMeeting = await res.json();
				this.list = [newMeeting, ...this.list];
				await this.loadAll();
				return newMeeting;
			} else {
				const errData = await res.json();
				throw new Error(errData.error || 'Upload failed');
			}
		} catch (e: any) {
			this.error = e.message || 'Upload failed';
			throw e;
		} finally {
			this.loading = false;
		}
	}

	async transcribe(meetingId: string, options: TranscriptionOptions = {}): Promise<Meeting | null> {
		this.transcribingId = meetingId;
		this.error = null;
		try {
			const res = await fetch('/api/transcribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ meetingId, options })
			});

			if (res.ok) {
				const data = await res.json();
				const updated = data.meeting;
				this.list = this.list.map((m) => (m.id === updated.id ? updated : m));
				if (this.current?.id === updated.id) {
					this.current = updated;
				}
				await this.loadAll();
				return updated;
			} else {
				const errData = await res.json();
				throw new Error(errData.error || 'Transcription failed');
			}
		} catch (e: any) {
			this.error = e.message || 'Transcription error';
			throw e;
		} finally {
			this.transcribingId = null;
		}
	}

	async update(id: string, partial: Partial<Meeting>): Promise<Meeting | null> {
		try {
			const res = await fetch(`/api/meetings/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(partial)
			});

			if (res.ok) {
				const updated = await res.json();
				this.list = this.list.map((m) => (m.id === updated.id ? updated : m));
				if (this.current?.id === updated.id) {
					this.current = updated;
				}
				return updated;
			}
		} catch (e: any) {
			this.error = e.message;
		}
		return null;
	}

	async delete(id: string): Promise<boolean> {
		try {
			const res = await fetch(`/api/meetings/${id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				this.list = this.list.filter((m) => m.id !== id);
				if (this.current?.id === id) {
					this.current = null;
				}
				await this.loadAll();
				return true;
			}
		} catch (e: any) {
			this.error = e.message;
		}
		return false;
	}

	async summarize(id: string) {
		try {
			const res = await fetch(`/api/meetings/${id}/summarize`, {
				method: 'POST'
			});

			if (res.ok) {
				const data = await res.json();
				if (this.current && this.current.id === id) {
					this.current.summary = data.summary;
				}
				await this.loadAll();
				return data.summary;
			} else {
				const err = await res.json();
				throw new Error(err.error || 'Failed to summarize');
			}
		} catch (e: any) {
			this.error = e.message;
			throw e;
		}
	}
}

export const meetingStore = new MeetingStore();
