import fs from 'node:fs/promises';
import path from 'node:path';
import type { WordAnnotation, TranscriptSegment, AISummary, SpeakerProfile, TranscriptionOptions } from '$lib/types';
import { getSettings } from './storage';

function parseOffsetToSeconds(offset?: string | number): number {
	if (!offset) return 0;
	if (typeof offset === 'number') return offset;
	const match = offset.match(/([\d.]+)s?/);
	return match ? parseFloat(match[1]) : 0;
}

const SPEAKER_COLORS = [
	'#4f46e5', // Indigo
	'#0284c7', // Sky
	'#059669', // Emerald
	'#d97706', // Amber
	'#dc2626', // Red
	'#7c3aed', // Violet
	'#db2777', // Pink
	'#0891b2'  // Cyan
];

/**
 * Upload an audio file to Google AI Files API
 */
async function uploadAudioToGoogle(filePath: string, mimeType: string, apiKey: string): Promise<{ uri: string; mimeType: string }> {
	const fileBuffer = await fs.readFile(filePath);
	const fileName = path.basename(filePath);

	// Upload using Google AI Files API (resumable/direct upload protocol)
	const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

	const metadata = {
		file: {
			display_name: fileName
		}
	};

	const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
	const metadataPart = Buffer.from(
		`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
	);
	const fileHeaderPart = Buffer.from(
		`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
	);
	const footerPart = Buffer.from(`\r\n--${boundary}--\r\n`);

	const body = Buffer.concat([metadataPart, fileHeaderPart, fileBuffer, footerPart]);

	const uploadRes = await fetch(uploadUrl, {
		method: 'POST',
		headers: {
			'X-Goog-Upload-Command': 'upload, finalize',
			'X-Goog-Upload-Header-Content-Length': fileBuffer.length.toString(),
			'X-Goog-Upload-Header-Content-Type': mimeType,
			'Content-Type': `multipart/related; boundary=${boundary}`
		},
		body: body
	});

	if (!uploadRes.ok) {
		const errText = await uploadRes.text();
		throw new Error(`Google Files API upload failed (${uploadRes.status}): ${errText}`);
	}

	const uploadData = await uploadRes.json();
	return {
		uri: uploadData.file.uri,
		mimeType: uploadData.file.mimeType || mimeType
	};
}

/**
 * Call Gemini 3.5 Transcribe via Interactions API
 */
export async function transcribeAudioWithGemini(
	audioFilePath: string,
	mimeType: string,
	options: TranscriptionOptions = {}
): Promise<{
	fullText: string;
	smartTranscript?: string;
	segments: TranscriptSegment[];
	speakers: Record<string, SpeakerProfile>;
}> {
	const settings = await getSettings();
	const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;

	if (!apiKey) {
		throw new Error('Gemini API Key is not configured. Please add your key in Settings.');
	}

	// 1. Upload audio file to Google AI Files API
	const uploadedFile = await uploadAudioToGoogle(audioFilePath, mimeType, apiKey);

	// 2. Prepare Interactions API request payload
	const mode = options.mode || 'verbatim';
	const languageCodes = options.languageCode ? [options.languageCode] : [];

	let transcriptionConfig: any = {};

	if (languageCodes.length > 0) {
		transcriptionConfig.language_codes = languageCodes;
	}

	if (options.customVocabulary && options.customVocabulary.length > 0) {
		transcriptionConfig.custom_vocabulary = options.customVocabulary;
	}

	if (mode === 'smart') {
		transcriptionConfig.mode = 'smart';
	} else {
		const verbatimMode: any = { type: 'verbatim' };
		if (options.diarization !== false) {
			verbatimMode.diarization_mode = 'speaker';
		}
		if (options.timestamps !== false) {
			verbatimMode.timestamp_granularities = ['word'];
		}
		transcriptionConfig.mode = verbatimMode;
	}

	const interactionsUrl = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;

	const requestPayload = {
		model: 'gemini-3.5-transcribe',
		input: [
			{
				type: 'audio',
				uri: uploadedFile.uri,
				mime_type: uploadedFile.mimeType
			}
		],
		generation_config: {
			transcription_config: transcriptionConfig
		}
	};

	const res = await fetch(interactionsUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(requestPayload)
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Gemini 3.5 Transcribe failed (${res.status}): ${errText}`);
	}

	const interaction = await res.json();
	const outputText = interaction.output_text || interaction.outputText || '';

	// 3. Extract word annotations from interaction steps
	const wordAnnotations: WordAnnotation[] = [];

	const steps = interaction.steps || [];
	for (const step of steps) {
		const contents = step.content || [];
		for (const content of contents) {
			const annotations = content.annotations || [];
			for (const annotation of annotations) {
				if (annotation.type === 'word_info' || annotation.word || annotation.text) {
					wordAnnotations.push({
						text: annotation.text || annotation.word || '',
						speaker: annotation.speaker || 'spk_1',
						startOffset: annotation.start_offset || annotation.startOffset,
						endOffset: annotation.end_offset || annotation.endOffset,
						startMs: Math.round(parseOffsetToSeconds(annotation.start_offset || annotation.startOffset) * 1000),
						endMs: Math.round(parseOffsetToSeconds(annotation.end_offset || annotation.endOffset) * 1000)
					});
				}
			}
		}
	}

	// 4. Build speaker profiles and segments
	const speakers: Record<string, SpeakerProfile> = {};
	const segments: TranscriptSegment[] = [];

	if (wordAnnotations.length > 0) {
		let currentSpeaker = wordAnnotations[0].speaker || 'spk_1';
		let currentWords: WordAnnotation[] = [];
		let segStartTime = parseOffsetToSeconds(wordAnnotations[0].startOffset);

		let speakerColorIndex = 0;
		function getSpeakerProfile(spkId: string): SpeakerProfile {
			if (!speakers[spkId]) {
				const num = spkId.replace(/[^\d]/g, '');
				const defaultName = num ? `Speaker ${num}` : spkId;
				speakers[spkId] = {
					id: spkId,
					name: defaultName,
					color: SPEAKER_COLORS[speakerColorIndex % SPEAKER_COLORS.length],
					talkTimeSeconds: 0,
					percentage: 0
				};
				speakerColorIndex++;
			}
			return speakers[spkId];
		}

		for (let i = 0; i < wordAnnotations.length; i++) {
			const w = wordAnnotations[i];
			const spk = w.speaker || 'spk_1';
			getSpeakerProfile(spk);

			const prevWord = currentWords[currentWords.length - 1];
			const currentWordStart = parseOffsetToSeconds(w.startOffset);
			const prevWordEnd = prevWord ? parseOffsetToSeconds(prevWord.endOffset) : currentWordStart;

			// Break segment if speaker changes or there is a long pause (> 2.0s)
			if (spk !== currentSpeaker || (currentWords.length > 0 && currentWordStart - prevWordEnd > 2.0)) {
				const segEndTime = prevWord ? parseOffsetToSeconds(prevWord.endOffset) : currentWordStart;
				const segText = currentWords.map((cw) => cw.text).join(' ');

				segments.push({
					id: `seg-${segments.length + 1}`,
					speaker: currentSpeaker,
					speakerName: speakers[currentSpeaker]?.name || currentSpeaker,
					startTime: segStartTime,
					endTime: segEndTime,
					text: segText,
					words: [...currentWords]
				});

				// Track talk time
				const duration = Math.max(0, segEndTime - segStartTime);
				speakers[currentSpeaker].talkTimeSeconds = (speakers[currentSpeaker].talkTimeSeconds || 0) + duration;

				currentSpeaker = spk;
				currentWords = [w];
				segStartTime = currentWordStart;
			} else {
				currentWords.push(w);
			}
		}

		// Flush remaining words
		if (currentWords.length > 0) {
			const lastWord = currentWords[currentWords.length - 1];
			const segEndTime = parseOffsetToSeconds(lastWord.endOffset);
			const segText = currentWords.map((cw) => cw.text).join(' ');

			segments.push({
				id: `seg-${segments.length + 1}`,
				speaker: currentSpeaker,
				speakerName: speakers[currentSpeaker]?.name || currentSpeaker,
				startTime: segStartTime,
				endTime: segEndTime,
				text: segText,
				words: [...currentWords]
			});

			const duration = Math.max(0, segEndTime - segStartTime);
			speakers[currentSpeaker].talkTimeSeconds = (speakers[currentSpeaker].talkTimeSeconds || 0) + duration;
		}

		// Compute percentages
		const totalTalkTime = Object.values(speakers).reduce((acc, s) => acc + (s.talkTimeSeconds || 0), 0);
		if (totalTalkTime > 0) {
			for (const spk of Object.values(speakers)) {
				spk.percentage = Math.round(((spk.talkTimeSeconds || 0) / totalTalkTime) * 100);
			}
		}
	} else if (outputText) {
		// Fallback single segment if word annotations are not present
		speakers['spk_1'] = {
			id: 'spk_1',
			name: 'Speaker 1',
			color: SPEAKER_COLORS[0],
			talkTimeSeconds: 0,
			percentage: 100
		};
		segments.push({
			id: 'seg-1',
			speaker: 'spk_1',
			speakerName: 'Speaker 1',
			startTime: 0,
			endTime: 0,
			text: outputText,
			words: []
		});
	}

	return {
		fullText: outputText,
		smartTranscript: mode === 'smart' ? outputText : undefined,
		segments,
		speakers
	};
}

/**
 * Generate AI Summary, Action Items & Key Decisions
 */
export async function generateMeetingSummary(
	transcriptText: string,
	segments: TranscriptSegment[]
): Promise<AISummary> {
	const settings = await getSettings();
	const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;

	if (!apiKey) {
		throw new Error('Gemini API Key is required for meeting summarization.');
	}

	const prompt = `You are an executive meeting assistant. Analyze the following meeting transcript and produce a structured JSON summary.

Meeting Transcript:
"""
${transcriptText}
"""

Produce a strict JSON object with this exact schema:
{
  "overview": "A clear, concise executive summary paragraph of what was discussed and the overall outcome.",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "decisions": ["Decision 1 agreed upon", "Decision 2 agreed upon"],
  "actionItems": [
    {
      "id": "act-1",
      "task": "Concrete task description",
      "assignee": "Name of person responsible (or 'Team')",
      "dueDate": "Mentioned timeframe or 'Next meeting'",
      "completed": false
    }
  ],
  "sentiment": "Productive / Constructive / Energetic / Focused",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}

Output ONLY valid JSON. No markdown backticks, no preamble.`;

	const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

	const res = await fetch(generateUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: {
				responseMimeType: 'application/json'
			}
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Gemini summary generation failed: ${err}`);
	}

	const data = await res.json();
	const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
	const parsed = JSON.parse(rawJson);

	return {
		overview: parsed.overview || 'Meeting transcript processed.',
		keyPoints: parsed.keyPoints || [],
		decisions: parsed.decisions || [],
		actionItems: (parsed.actionItems || []).map((a: any, idx: number) => ({
			id: a.id || `act-${idx + 1}`,
			task: a.task || 'Follow up',
			assignee: a.assignee || 'Unassigned',
			dueDate: a.dueDate || 'ASAP',
			completed: false
		})),
		sentiment: parsed.sentiment || 'Constructive',
		topics: parsed.topics || []
	};
}
