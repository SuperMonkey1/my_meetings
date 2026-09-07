import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSettings, saveSettings } from '$lib/server/storage';

export const GET: RequestHandler = async () => {
	const settings = await getSettings();
	return json({
		...settings,
		// Mask key for safety in UI
		geminiApiKey: settings.geminiApiKey
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const updated = await saveSettings(body);
	return json({ success: true, settings: updated });
};
