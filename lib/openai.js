import OpenAI from 'openai';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// OpenAI client with user's API key
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
