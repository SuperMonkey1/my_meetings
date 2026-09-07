import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMeetingById, saveMeeting, deleteMeeting } from '$lib/server/storage';

export const GET: RequestHandler = async ({ params }) => {
	const meeting = await getMeetingById(params.id);
	if (!meeting) {
		return json({ error: 'Meeting not found' }, { status: 404 });
	}
	return json(meeting);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const meeting = await getMeetingById(params.id);
	if (!meeting) {
		return json({ error: 'Meeting not found' }, { status: 404 });
	}

	const body = await request.json();
	const updated = {
		...meeting,
		...body,
		id: meeting.id,
		updatedAt: new Date().toISOString()
	};

	// Update speaker names across segments if speaker profiles were modified
	if (body.speakers && updated.segments) {
		for (const seg of updated.segments) {
			if (body.speakers[seg.speaker]?.name) {
				seg.speakerName = body.speakers[seg.speaker].name;
			}
		}
	}

	await saveMeeting(updated);
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const success = await deleteMeeting(params.id);
	if (!success) {
		return json({ error: 'Meeting not found or failed to delete' }, { status: 404 });
	}
	return json({ success: true });
};