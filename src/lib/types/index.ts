export interface WordAnnotation {
	text: string;
	speaker?: string;
	startOffset?: string;
	endOffset?: string;
	startMs?: number;
	endMs?: number;
}

export interface TranscriptSegment {
	id: string;
	speaker: string; // e.g., "spk_1", "spk_2"
	speakerName: string; // e.g., "Frederik", "Sarah"
	startTime: number; // in seconds
	endTime: number; // in seconds
	text: string;
	words: WordAnnotation[];
}

export interface ActionItem {
	id: string;
	task: string;
	assignee?: string;
	dueDate?: string;
	completed: boolean;
}

export interface AISummary {
	overview: string;
	keyPoints: string[];
	decisions: string[];
	actionItems: ActionItem[];
	sentiment?: string;
	topics?: string[];
}

export interface SpeakerProfile {
	id: string;
	name: string;
	color: string;
	talkTimeSeconds?: number;
	percentage?: number;
}

export interface Meeting {
	id: string;
	title: string;
	description?: string;
	date: string;
	durationSeconds: number;
	audioFileName?: string;
	audioPath?: string;
	mimeType?: string;
	fileSizeBytes?: number;
	status: 'recorded' | 'uploading' | 'transcribing' | 'completed' | 'error';
	statusMessage?: string;
	mode: 'verbatim' | 'smart';
	languageCode?: string;
	speakers: Record<string, SpeakerProfile>;
	segments: TranscriptSegment[];
	smartTranscript?: string;
	fullText?: string;
	summary?: AISummary;
	notes?: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface DashboardStats {
	totalMeetings: number;
	totalDurationSeconds: number;
	totalWords: number;
	completedCount: number;
	pendingActionItemsCount: number;
}

export interface TranscriptionOptions {
	mode?: 'verbatim' | 'smart';
	diarization?: boolean;
	timestamps?: boolean;
	languageCode?: string;
	customVocabulary?: string[];
}

export interface AppSettings {
	geminiApiKey: string;
	defaultLanguage: string;
	defaultMode: 'verbatim' | 'smart';
	autoSummarize: boolean;
	autoDiarize: boolean;
	hasCustomKey?: boolean;
}
