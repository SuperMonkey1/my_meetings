import fs from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from './$types';
import { getMeetingById, getAudioStorageDir } from '$lib/server/storage';

export const GET: RequestHandler = async ({ params, request }) => {
	const meeting = await getMeetingById(params.id);
	if (!meeting || !meeting.audioFileName) {
		return new Response('Audio not found', { status: 404 });
	}

	const audioPath = path.join(getAudioStorageDir(), meeting.audioFileName);
	if (!fs.existsSync(audioPath)) {
		return new Response('Audio file missing on disk', { status: 404 });
	}

	const stat = fs.statSync(audioPath);
	const fileSize = stat.size;
	const range = request.headers.get('range');
	const mimeType = meeting.mimeType || 'audio/wav';

	if (range) {
		const parts = range.replace(/bytes=/, '').split('-');
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
		const chunkSize = end - start + 1;
		const stream = fs.createReadStream(audioPath, { start, end });

		return new Response(stream as any, {
			status: 206,
			headers: {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunkSize.toString(),
				'Content-Type': mimeType
			}
		});
	} else {
		const stream = fs.createReadStream(audioPath);
		return new Response(stream as any, {
			headers: {
				'Content-Length': fileSize.toString(),
				'Content-Type': mimeType,
				'Accept-Ranges': 'bytes'
			}
		});
	}
};