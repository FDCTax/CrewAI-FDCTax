'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, BookOpen } from 'lucide-react';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState([]);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = entries.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(entries);
    }
  }, [searchTerm, entries]);

  const loadEntries = async () => {
    try {
      const res = await fetch('/api/kb');
      const data = await res.json();
      setEntries(data.entries || []);
      setFilteredEntries(data.entries || []);
    } catch (error) {
      console.error('Error loading KB entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#15ADC2]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
                <p className="text-sm text-gray-600 mt-1">Manage Luna's answers for FDC tax topics</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/kb/new')}
              className="px-6 py-3 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Entry
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search knowledge base by title, tags, or content..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
            />
          </div>
        </div>

        {/* Entries Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15ADC2] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading knowledge base...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No entries found' : 'No entries yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : 'Create your first knowledge base entry'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push('/kb/new')}
                className="px-6 py-2 bg-[#15ADC2] text-white rounded-lg hover:bg-[#0F8A9A] transition-colors"
              >
                Add Entry
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{entry.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {entry.tags?.split(',').slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {stripHtml(entry.answer).substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/kb/edit/${entry.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredEntries.length} of {entries.length} entries
          </div>
        )}
      </div>
    </div>
  );
}