import OpenAI from 'openai';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// OpenAI client for Luna Knowledge Base queries
// Uses OPENAI_API_KEY_LUNA (falls back to OPENAI_API_KEY for backwards compatibility)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_LUNA || process.env.OPENAI_API_KEY,
});

// OpenAI client for OCR/Vision expense scanning
// Uses OPENAI_API_KEY_OCR (falls back to OPENAI_API_KEY for backwards compatibility)
export const openaiOCR = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_OCR || process.env.OPENAI_API_KEY,
});

export async function callWithRetry(apiCall, retries = MAX_RETRIES) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return callWithRetry(apiCall, retries - 1);
    }
    throw error;
  }
}
