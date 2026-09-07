import type { Meeting, AppSettings } from '$lib/types';

export const DEFAULT_SETTINGS: AppSettings = {
	geminiApiKey: process.env.GEMINI_API_KEY || '',
	defaultLanguage: '',
	defaultMode: 'verbatim',
	autoSummarize: true,
	autoDiarize: true
};

export const INITIAL_MEETINGS: Meeting[] = [
	{
		id: 'meeting-q3-product-strategy',
		title: 'Q3 Product Strategy & Roadmap Sync',
		description: 'Discussion on Gemini 3.5 Transcribe integration, speaker diarization UI, and Electron desktop packaging.',
		date: '2026-09-02T14:30:00.000Z',
		durationSeconds: 184,
		mimeType: 'audio/wav',
		status: 'completed',
		mode: 'verbatim',
		languageCode: 'en-US',
		tags: ['Strategy', 'Product', 'AI'],
		createdAt: '2026-09-02T14:30:00.000Z',
		updatedAt: '2026-09-02T15:00:00.000Z',
		speakers: {
			spk_1: {
				id: 'spk_1',
				name: 'Frederik',
				color: '#4f46e5',
				talkTimeSeconds: 110,
				percentage: 60
			},
			spk_2: {
				id: 'spk_2',
				name: 'Sarah Chen',
				color: '#0284c7',
				talkTimeSeconds: 74,
				percentage: 40
			}
		},
		segments: [
			{
				id: 'seg-1',
				speaker: 'spk_1',
				speakerName: 'Frederik',
				startTime: 0.5,
				endTime: 12.8,
				text: 'Welcome everyone to our product sync. Today we are reviewing the new audio transcription engine powered by Gemini 3.5 Transcribe.',
				words: [
					{ text: 'Welcome', speaker: 'spk_1', startOffset: '0.500s', endOffset: '1.100s', startMs: 500, endMs: 1100 },
					{ text: 'everyone', speaker: 'spk_1', startOffset: '1.120s', endOffset: '1.680s', startMs: 1120, endMs: 1680 },
					{ text: 'to', speaker: 'spk_1', startOffset: '1.700s', endOffset: '1.850s', startMs: 1700, endMs: 1850 },
					{ text: 'our', speaker: 'spk_1', startOffset: '1.860s', endOffset: '2.050s', startMs: 1860, endMs: 2050 },
					{ text: 'product', speaker: 'spk_1', startOffset: '2.080s', endOffset: '2.500s', startMs: 2080, endMs: 2500 },
					{ text: 'sync.', speaker: 'spk_1', startOffset: '2.520s', endOffset: '3.000s', startMs: 2520, endMs: 3000 },
					{ text: 'Today', speaker: 'spk_1', startOffset: '3.500s', endOffset: '3.900s', startMs: 3500, endMs: 3900 },
					{ text: 'we', speaker: 'spk_1', startOffset: '3.920s', endOffset: '4.100s', startMs: 3920, endMs: 4100 },
					{ text: 'are', speaker: 'spk_1', startOffset: '4.120s', endOffset: '4.300s', startMs: 4120, endMs: 4300 },
					{ text: 'reviewing', speaker: 'spk_1', startOffset: '4.320s', endOffset: '4.950s', startMs: 4320, endMs: 4950 },
					{ text: 'the', speaker: 'spk_1', startOffset: '4.980s', endOffset: '5.100s', startMs: 4980, endMs: 5100 },
					{ text: 'new', speaker: 'spk_1', startOffset: '5.120s', endOffset: '5.400s', startMs: 5120, endMs: 5400 },
					{ text: 'audio', speaker: 'spk_1', startOffset: '5.420s', endOffset: '5.900s', startMs: 5420, endMs: 5900 },
					{ text: 'transcription', speaker: 'spk_1', startOffset: '5.920s', endOffset: '6.800s', startMs: 5920, endMs: 6800 },
					{ text: 'engine', speaker: 'spk_1', startOffset: '6.820s', endOffset: '7.300s', startMs: 6820, endMs: 7300 },
					{ text: 'powered', speaker: 'spk_1', startOffset: '7.500s', endOffset: '8.000s', startMs: 7500, endMs: 8000 },
					{ text: 'by', speaker: 'spk_1', startOffset: '8.020s', endOffset: '8.200s', startMs: 8020, endMs: 8200 },
					{ text: 'Gemini', speaker: 'spk_1', startOffset: '8.220s', endOffset: '8.750s', startMs: 8220, endMs: 8750 },
					{ text: '3.5', speaker: 'spk_1', startOffset: '8.780s', endOffset: '9.300s', startMs: 8780, endMs: 9300 },
					{ text: 'Transcribe.', speaker: 'spk_1', startOffset: '9.320s', endOffset: '10.200s', startMs: 9320, endMs: 10200 }
				]
			},
			{
				id: 'seg-2',
				speaker: 'spk_2',
				speakerName: 'Sarah Chen',
				startTime: 13.5,
				endTime: 26.2,
				text: 'The speaker diarization and word-level timestamps have been tested across WAV and MP3 files. It accurately separates speakers and allows interactive click-to-seek playback.',
				words: [
					{ text: 'The', speaker: 'spk_2', startOffset: '13.500s', endOffset: '13.700s', startMs: 13500, endMs: 13700 },
					{ text: 'speaker', speaker: 'spk_2', startOffset: '13.720s', endOffset: '14.200s', startMs: 13720, endMs: 14200 },
					{ text: 'diarization', speaker: 'spk_2', startOffset: '14.220s', endOffset: '15.100s', startMs: 14220, endMs: 15100 },
					{ text: 'and', speaker: 'spk_2', startOffset: '15.120s', endOffset: '15.300s', startMs: 15120, endMs: 15300 },
					{ text: 'word-level', speaker: 'spk_2', startOffset: '15.320s', endOffset: '16.000s', startMs: 15320, endMs: 16000 },
					{ text: 'timestamps', speaker: 'spk_2', startOffset: '16.020s', endOffset: '16.800s', startMs: 16020, endMs: 16800 },
					{ text: 'have', speaker: 'spk_2', startOffset: '16.850s', endOffset: '17.050s', startMs: 16850, endMs: 17050 },
					{ text: 'been', speaker: 'spk_2', startOffset: '17.080s', endOffset: '17.300s', startMs: 17080, endMs: 17300 },
					{ text: 'tested', speaker: 'spk_2', startOffset: '17.320s', endOffset: '17.900s', startMs: 17320, endMs: 17900 },
					{ text: 'across', speaker: 'spk_2', startOffset: '17.920s', endOffset: '18.400s', startMs: 17920, endMs: 18400 },
					{ text: 'WAV', speaker: 'spk_2', startOffset: '18.450s', endOffset: '18.900s', startMs: 18450, endMs: 18900 },
					{ text: 'and', speaker: 'spk_2', startOffset: '18.920s', endOffset: '19.100s', startMs: 18920, endMs: 19100 },
					{ text: 'MP3', speaker: 'spk_2', startOffset: '19.120s', endOffset: '19.650s', startMs: 19120, endMs: 19650 },
					{ text: 'files.', speaker: 'spk_2', startOffset: '19.680s', endOffset: '20.200s', startMs: 19680, endMs: 20200 },
					{ text: 'It', speaker: 'spk_2', startOffset: '20.500s', endOffset: '20.700s', startMs: 20500, endMs: 20700 },
					{ text: 'accurately', speaker: 'spk_2', startOffset: '20.720s', endOffset: '21.400s', startMs: 20720, endMs: 21400 },
					{ text: 'separates', speaker: 'spk_2', startOffset: '21.420s', endOffset: '22.100s', startMs: 21420, endMs: 22100 },
					{ text: 'speakers', speaker: 'spk_2', startOffset: '22.120s', endOffset: '22.800s', startMs: 22120, endMs: 22800 },
					{ text: 'and', speaker: 'spk_2', startOffset: '22.820s', endOffset: '23.000s', startMs: 22820, endMs: 23000 },
					{ text: 'allows', speaker: 'spk_2', startOffset: '23.020s', endOffset: '23.500s', startMs: 23020, endMs: 23500 },
					{ text: 'interactive', speaker: 'spk_2', startOffset: '23.520s', endOffset: '24.300s', startMs: 23520, endMs: 24300 },
					{ text: 'click-to-seek', speaker: 'spk_2', startOffset: '24.320s', endOffset: '25.200s', startMs: 24320, endMs: 25200 },
					{ text: 'playback.', speaker: 'spk_2', startOffset: '25.220s', endOffset: '26.100s', startMs: 25220, endMs: 26100 }
				]
			},
			{
				id: 'seg-3',
				speaker: 'spk_1',
				speakerName: 'Frederik',
				startTime: 27.0,
				endTime: 38.5,
				text: 'Excellent. Patrick has also added automatic Desktop shortcuts in the "my apps" folder and GitHub publishing via GitHub CLI.',
				words: [
					{ text: 'Excellent.', speaker: 'spk_1', startOffset: '27.000s', endOffset: '27.800s', startMs: 27000, endMs: 27800 },
					{ text: 'Patrick', speaker: 'spk_1', startOffset: '28.100s', endOffset: '28.600s', startMs: 28100, endMs: 28600 },
					{ text: 'has', speaker: 'spk_1', startOffset: '28.620s', endOffset: '28.800s', startMs: 28620, endMs: 28800 },
					{ text: 'also', speaker: 'spk_1', startOffset: '28.820s', endOffset: '29.200s', startMs: 28820, endMs: 29200 },
					{ text: 'added', speaker: 'spk_1', startOffset: '29.220s', endOffset: '29.600s', startMs: 29220, endMs: 29600 },
					{ text: 'automatic', speaker: 'spk_1', startOffset: '29.620s', endOffset: '30.300s', startMs: 29620, endMs: 30300 },
					{ text: 'Desktop', speaker: 'spk_1', startOffset: '30.320s', endOffset: '30.900s', startMs: 30320, endMs: 30900 },
					{ text: 'shortcuts', speaker: 'spk_1', startOffset: '30.920s', endOffset: '31.600s', startMs: 30920, endMs: 31600 },
					{ text: 'in', speaker: 'spk_1', startOffset: '31.620s', endOffset: '31.800s', startMs: 31620, endMs: 31800 },
					{ text: 'the', speaker: 'spk_1', startOffset: '31.820s', endOffset: '32.000s', startMs: 31820, endMs: 32000 },
					{ text: '"my', speaker: 'spk_1', startOffset: '32.020s', endOffset: '32.300s', startMs: 32020, endMs: 32300 },
					{ text: 'apps"', speaker: 'spk_1', startOffset: '32.320s', endOffset: '32.800s', startMs: 32320, endMs: 32800 },
					{ text: 'folder', speaker: 'spk_1', startOffset: '32.820s', endOffset: '33.400s', startMs: 32820, endMs: 33400 },
					{ text: 'and', speaker: 'spk_1', startOffset: '33.420s', endOffset: '33.600s', startMs: 33420, endMs: 33600 },
					{ text: 'GitHub', speaker: 'spk_1', startOffset: '33.620s', endOffset: '34.200s', startMs: 33620, endMs: 34200 },
					{ text: 'publishing', speaker: 'spk_1', startOffset: '34.220s', endOffset: '35.000s', startMs: 34220, endMs: 35000 },
					{ text: 'via', speaker: 'spk_1', startOffset: '35.050s', endOffset: '35.300s', startMs: 35050, endMs: 35300 },
					{ text: 'GitHub', speaker: 'spk_1', startOffset: '35.320s', endOffset: '35.800s', startMs: 35320, endMs: 35800 },
					{ text: 'CLI.', speaker: 'spk_1', startOffset: '35.820s', endOffset: '36.500s', startMs: 35820, endMs: 36500 }
				]
			}
		],
		fullText: 'Welcome everyone to our product sync. Today we are reviewing the new audio transcription engine powered by Gemini 3.5 Transcribe. The speaker diarization and word-level timestamps have been tested across WAV and MP3 files. It accurately separates speakers and allows interactive click-to-seek playback. Excellent. Patrick has also added automatic Desktop shortcuts in the "my apps" folder and GitHub publishing via GitHub CLI.',
		smartTranscript: '1. Review Gemini 3.5 Transcribe integration\n2. Verify speaker diarization across multi-speaker audio recordings\n3. Confirm Desktop shortcuts in "my apps" and GitHub repository deployment.',
		summary: {
			overview: 'The team discussed and verified the integration of Gemini 3.5 Transcribe via the Interactions API, highlighting robust speaker diarization and word timestamps for interactive playback.',
			keyPoints: [
				'Gemini 3.5 Transcribe powers word-level timestamps and speaker identification.',
				'Supported audio inputs include pre-recorded WAV, MP3, and live microphone captures.',
				'Applications are styled in clean light mode and packaged for Electron desktop.'
			],
			decisions: [
				'Adopt Gemini 3.5 Transcribe as the primary speech intelligence engine.',
				'Enable click-to-seek word navigation as the default transcript interaction.'
			],
			actionItems: [
				{
					id: 'act-1',
					task: 'Test microphone audio capture in real-world meeting scenario',
					assignee: 'Frederik',
					dueDate: 'Friday',
					completed: false
				},
				{
					id: 'act-2',
					task: 'Configure production Gemini API key in application settings',
					assignee: 'Sarah Chen',
					dueDate: 'Tomorrow',
					completed: true
				}
			],
			sentiment: 'Highly Productive & Enthusiastic',
			topics: ['AI Speech', 'Gemini 3.5', 'Electron', 'UI/UX']
		}
	}
];
