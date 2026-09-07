import { json } from '@sveltejs/kit';
import path from 'node:path';
import type { RequestHandler } from './$types';
import { getMeetingById, saveMeeting, getAudioStorageDir, getSettings } from '$lib/server/storage';
import { transcribeAudioWithGemini, generateMeetingSummary } from '$lib/server/gemini';

export const POST: RequestHandler = async ({ request }) => {
	const { meetingId, options = {} } = await request.json();

	const meeting = await getMeetingById(meetingId);
	if (!meeting) {
		return json({ error: 'Meeting not found' }, { status: 404 });
	}

	if (!meeting.audioFileName) {
		return json({ error: 'Meeting does not have an attached audio file' }, { status: 400 });
	}

	const audioPath = path.join(getAudioStorageDir(), meeting.audioFileName);

	// Mark meeting as transcribing
	meeting.status = 'transcribing';
	meeting.statusMessage = 'Uploading to Gemini 3.5 Transcribe engine...';
	await saveMeeting(meeting);

	try {
		const transcriptResult = await transcribeAudioWithGemini(
			audioPath,
			meeting.mimeType || 'audio/wav',
			options
		);

		meeting.status = 'completed';
		meeting.statusMessage = undefined;
		meeting.fullText = transcriptResult.fullText;
		meeting.smartTranscript = transcriptResult.smartTranscript;
		meeting.segments = transcriptResult.segments;
		meeting.speakers = transcriptResult.speakers;
		meeting.mode = options.mode || 'verbatim';
		if (options.languageCode) {
			meeting.languageCode = options.languageCode;
		}

		// Calculate duration from segments if missing
		if (!meeting.durationSeconds && transcriptResult.segments.length > 0) {
			const lastSeg = transcriptResult.segments[transcriptResult.segments.length - 1];
			meeting.durationSeconds = Math.ceil(lastSeg.endTime);
		}

		// Auto-generate summary if enabled in settings
		const settings = await getSettings();
		if (settings.autoSummarize && transcriptResult.fullText) {
			try {
				const summary = await generateMeetingSummary(transcriptResult.fullText, transcriptResult.segments);
				meeting.summary = summary;
			} catch (sumErr) {
				console.warn('Auto-summary skipped:', sumErr);
			}
		}

		await saveMeeting(meeting);
		return json({ success: true, meeting });
	} catch (err: any) {
		meeting.status = 'error';
		meeting.statusMessage = err.message || 'Transcription failed';
		await saveMeeting(meeting);
		return json({ error: err.message || 'Transcription failed' }, { status: 500 });
	}
};
