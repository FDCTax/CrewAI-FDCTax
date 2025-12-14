import { NextResponse } from 'next/server';
import { generateLunaResponse } from '@/lib/lunaAI';

/**
 * Luna Chat API Route
 * 
 * NOTE: Currently using KB-based responses with fallback logic.
 * TODO: Once Emergent LLM endpoint is properly configured, replace generateLunaResponse
 * with actual LLM integration using the Emergent Universal Key.
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

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Generate Luna's response using KB + intelligent fallbacks
    const { content, sources } = await generateLunaResponse(
      lastUserMessage.content,
      formContext
    );

    // Return response in OpenAI-compatible format
    return NextResponse.json({
      message: {
        role: 'assistant',
        content
      },
      kbSources: sources,
      sessionId,
      note: 'Using KB-based responses. Emergent LLM integration pending endpoint configuration.'
    });
  } catch (error) {
    console.error('Luna Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing your request' },
      { status: 500 }
    );
  }
}
