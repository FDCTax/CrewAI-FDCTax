import { NextResponse } from 'next/server';
import { searchKnowledgeBase, getKBCategories } from '@/lib/knowledgeBase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query) {
      // If no query, return categories
      const categories = await getKBCategories();
      return NextResponse.json({ categories });
    }

    const results = await searchKnowledgeBase(query, limit);

    return NextResponse.json({
      query,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('KB Search API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
