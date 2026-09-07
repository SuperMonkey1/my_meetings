import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMeetingById, saveMeeting } from '$lib/server/storage';
import { generateMeetingSummary } from '$lib/server/gemini';

export const POST: RequestHandler = async ({ params }) => {
	const meeting = await getMeetingById(params.id);
	if (!meeting) {
		return json({ error: 'Meeting not found' }, { status: 404 });
	}

	const transcriptText = meeting.fullText || meeting.segments.map((s) => `${s.speakerName || s.speaker}: ${s.text}`).join('\n');
	if (!transcriptText || !transcriptText.trim()) {
		return json({ error: 'Cannot summarize empty transcript' }, { status: 400 });
	}

	try {
		const summary = await generateMeetingSummary(transcriptText, meeting.segments);
		meeting.summary = summary;
		await saveMeeting(meeting);
		return json({ success: true, summary });
	} catch (err: any) {
		console.error('Summary error:', err);
		return json({ error: err.message || 'Failed to generate summary' }, { status: 500 });
	}
};