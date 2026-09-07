import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllMeetings, saveMeeting, getDashboardStats } from '$lib/server/storage';
import type { Meeting } from '$lib/types';

export const GET: RequestHandler = async () => {
	const meetings = await getAllMeetings();
	const stats = await getDashboardStats();
	return json({ meetings, stats });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const newMeeting: Meeting = {
		id: `meeting-${Date.now()}`,
		title: body.title || 'New Meeting',
		description: body.description || '',
		date: body.date || new Date().toISOString(),
		durationSeconds: body.durationSeconds || 0,
		status: body.status || 'recorded',
		mode: body.mode || 'verbatim',
		languageCode: body.languageCode || '',
		tags: body.tags || ['Meeting'],
		speakers: body.speakers || {},
		segments: body.segments || [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	await saveMeeting(newMeeting);
	return json(newMeeting, { status: 201 });
};
