import { NextResponse } from 'next/server';
import { openai, callWithRetry } from '@/lib/openai';
import { searchKnowledgeBase } from '@/lib/knowledgeBase';

/**
 * Luna Chat API Route with RAG (Retrieval-Augmented Generation)
 * Uses OpenAI GPT-4 + Knowledge Base for smart, accurate responses
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, sessionId, formContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Get the last user message for KB search
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Search knowledge base for relevant context (RAG)
    const kbResults = await searchKnowledgeBase(lastUserMessage.content, 3);

    // Build context from KB results
    let kbContext = '';
    if (kbResults.length > 0) {
      kbContext = '\n\nRelevant knowledge base information:\n';
      kbResults.forEach((article, index) => {
        kbContext += `\n${index + 1}. ${article.title}\n${article.content}\n`;
      });
    }

    // Build form context
    let formContextStr = '';
    if (formContext) {
      formContextStr = `\n\nCurrent form context:\n- Stage: ${formContext.currentStage || 'unknown'}\n`;
      if (formContext.hasABN) formContextStr += '- User has ABN\n';
      if (formContext.hasGST) formContextStr += '- User registered for GST\n';
      if (formContext.isSoleTrader) formContextStr += '- User is a sole trader\n';
    }

    // System prompt for Luna with KB context
    const systemPrompt = {
      role: 'system',
      content: `You are Luna, a friendly and professional AI assistant for FDC Tax's client onboarding process. Your role is to:

1. Answer questions about Australian tax, ABN, GST, and the onboarding process
2. Provide clear, accurate information based on the knowledge base provided
3. Help users understand what information is needed and why
4. Be encouraging and supportive throughout the onboarding journey
5. If payment is required, explain the deposit process clearly

Guidelines:
- Keep responses concise and friendly (2-4 sentences typically)
- Use the knowledge base information when available - it's from FDC Tax's official documentation
- If you don't know something specific, acknowledge it and suggest contacting FDC Tax directly
- Be aware of the user's current form stage and provide contextual help
- Use a warm, conversational tone
- Break up longer responses into clear paragraphs
${kbContext}${formContextStr}`
    };

    // Call OpenAI GPT-4 with retry logic
    const response = await callWithRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 500,
      });
    });

    const aiMessage = response.choices[0].message;

    return NextResponse.json({
      message: aiMessage,
      kbSources: kbResults.map(r => ({ title: r.title, category: r.category })),
      sessionId
    });
  } catch (error) {
    console.error('Luna Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing your request' },
      { status: 500 }
    );
  }
}
