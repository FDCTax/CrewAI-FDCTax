import OpenAI from 'openai';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Emergent Universal LLM Key works directly with OpenAI SDK
// The key is routed internally by Emergent's platform
export const openai = new OpenAI({
  apiKey: process.env.EMERGENT_API_KEY,
  // No baseURL needed - Emergent handles routing
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
