import fs from 'node:fs/promises';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAudioStorageDir, saveMeeting } from '$lib/server/storage';
import type { Meeting } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('audio') as File | null;
	const title = (formData.get('title') as string) || 'New Recording';
	const description = (formData.get('description') as string) || '';
	const durationSeconds = parseFloat((formData.get('duration') as string) || '0');

	if (!file) {
		return json({ error: 'No audio file provided' }, { status: 400 });
	}

	const ext = path.extname(file.name) || '.wav';
	const meetingId = `meeting-${Date.now()}`;
	const audioFileName = `${meetingId}${ext}`;
	const audioFilePath = path.join(getAudioStorageDir(), audioFileName);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	await fs.writeFile(audioFilePath, buffer);

	const newMeeting: Meeting = {
		id: meetingId,
		title: title.replace(/\.[^/.]+$/, ''), // strip extension if title came from filename
		description,
		date: new Date().toISOString(),
		durationSeconds: durationSeconds || 0,
		audioFileName,
		audioPath: audioFilePath,
		mimeType: file.type || 'audio/wav',
		fileSizeBytes: buffer.length,
		status: 'recorded',
		mode: 'verbatim',
		tags: ['Recording'],
		speakers: {},
		segments: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	await saveMeeting(newMeeting);
	return json(newMeeting, { status: 201 });
};
