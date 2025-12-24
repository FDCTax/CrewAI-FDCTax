import { query } from './db.js';

/**
 * Search knowledge base using full-text search
 * @param {string} searchQuery - User's search query
 * @param {number} limit - Max number of results to return
 * @returns {Array} - Array of relevant KB articles
 */
export async function searchKnowledgeBase(searchQuery, limit = 5) {
  try {
    // Use PostgreSQL full-text search
    const result = await query(
      `
      SELECT 
        id,
        title,
        content,
        category,
        tags,
        ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) AS rank
      FROM knowledge_base
      WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT $2
      `,
      [searchQuery, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}

/**
 * Get KB articles by category
 * @param {string} category - Category name
 * @param {number} limit - Max number of results
 * @returns {Array} - Array of KB articles
 */
export async function getKBByCategory(category, limit = 10) {
  try {
    const result = await query(
      'SELECT id, title, content, category, tags FROM knowledge_base WHERE category = $1 ORDER BY created_at DESC LIMIT $2',
      [category, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching KB by category:', error);
    return [];
  }
}

/**
 * Get all KB categories
 * @returns {Array} - Array of unique categories
 */
export async function getKBCategories() {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM knowledge_base WHERE category IS NOT NULL ORDER BY category'
    );
    return result.rows.map(row => row.category);
  } catch (error) {
    console.error('Error fetching KB categories:', error);
    return [];
  }
}
