import fs from 'node:fs/promises';
import path from 'node:path';
import type { Meeting, DashboardStats, AppSettings } from '$lib/types';
import { INITIAL_MEETINGS, DEFAULT_SETTINGS } from './seed';

const DATA_DIR = process.env.DATA_DIR 
	? path.resolve(process.env.DATA_DIR) 
	: path.resolve(process.cwd(), 'data');

const MEETINGS_DIR = path.join(DATA_DIR, 'meetings');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

let initialized = false;

export async function ensureDataDirectories(): Promise<void> {
	if (initialized) return;
	initialized = true;

	await fs.mkdir(MEETINGS_DIR, { recursive: true });
	await fs.mkdir(AUDIO_DIR, { recursive: true });

	// Seed sample meetings if directory is empty
	const meetingFiles = await fs.readdir(MEETINGS_DIR);
	if (meetingFiles.filter((f) => f.endsWith('.json')).length === 0) {
		for (const meeting of INITIAL_MEETINGS) {
			await writeJsonFile(path.join(MEETINGS_DIR, `${meeting.id}.json`), meeting);
		}
	}

	// Seed settings if missing
	try {
		await fs.access(SETTINGS_FILE);
	} catch {
		await writeJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
	}
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(content) as T;
	} catch (error: unknown) {
		const err = error as NodeJS.ErrnoException;
		if (err && err.code === 'ENOENT') return null;
		throw error;
	}
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAllMeetings(): Promise<Meeting[]> {
	await ensureDataDirectories();
	const files = await fs.readdir(MEETINGS_DIR);
	const meetings: Meeting[] = [];
	for (const file of files) {
		if (file.endsWith('.json')) {
			const meeting = await readJsonFile<Meeting>(path.join(MEETINGS_DIR, file));
			if (meeting) meetings.push(meeting);
		}
	}
	return meetings.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
	await ensureDataDirectories();
	return readJsonFile<Meeting>(path.join(MEETINGS_DIR, `${id}.json`));
}

export async function saveMeeting(meeting: Meeting): Promise<Meeting> {
	await ensureDataDirectories();
	meeting.updatedAt = new Date().toISOString();
	await writeJsonFile(path.join(MEETINGS_DIR, `${meeting.id}.json`), meeting);
	return meeting;
}

export async function deleteMeeting(id: string): Promise<boolean> {
	await ensureDataDirectories();
	try {
		const meeting = await getMeetingById(id);
		if (meeting?.audioFileName) {
			const audioPath = path.join(AUDIO_DIR, meeting.audioFileName);
			try { await fs.unlink(audioPath); } catch {}
		}
		await fs.unlink(path.join(MEETINGS_DIR, `${id}.json`));
		return true;
	} catch {
		return false;
	}
}

export async function getDashboardStats(): Promise<DashboardStats> {
	const meetings = await getAllMeetings();
	const totalDurationSeconds = meetings.reduce((acc, m) => acc + (m.durationSeconds || 0), 0);
	const totalWords = meetings.reduce((acc, m) => {
		const text = m.fullText || m.segments?.map((s) => s.text).join(' ') || '';
		return acc + (text ? text.split(/\s+/).filter(Boolean).length : 0);
	}, 0);

	let pendingActionItemsCount = 0;
	for (const m of meetings) {
		if (m.summary?.actionItems) {
			pendingActionItemsCount += m.summary.actionItems.filter((a) => !a.completed).length;
		}
	}

	return {
		totalMeetings: meetings.length,
		totalDurationSeconds,
		totalWords,
		completedCount: meetings.filter((m) => m.status === 'completed').length,
		pendingActionItemsCount
	};
}

export async function getSettings(): Promise<AppSettings> {
	await ensureDataDirectories();
	const settings = await readJsonFile<AppSettings>(SETTINGS_FILE);
	const result = settings || DEFAULT_SETTINGS;
	if (process.env.GEMINI_API_KEY && !result.geminiApiKey) {
		result.geminiApiKey = process.env.GEMINI_API_KEY;
	}
	result.hasCustomKey = !!result.geminiApiKey;
	return result;
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
	await ensureDataDirectories();
	const current = await getSettings();
	const updated = { ...current, ...settings };
	await writeJsonFile(SETTINGS_FILE, updated);
	return updated;
}

export function getAudioStorageDir(): string {
	return AUDIO_DIR;
}
