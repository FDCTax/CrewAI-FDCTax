import OpenAI from 'openai';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const openai = new OpenAI({
  apiKey: process.env.EMERGENT_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
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
