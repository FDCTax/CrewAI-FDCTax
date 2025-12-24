'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, X, BookOpen } from 'lucide-react';
import dynamic from 'next/dynamic';

const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor), { ssr: false });
const ClassicEditor = dynamic(() => import('@ckeditor/ckeditor5-build-classic'), { ssr: false });

export default function EditKBEntryPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [variations, setVariations] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (!isNew) {
      loadEntry();
    }
  }, [params.id]);

  const loadEntry = async () => {
    try {
      const res = await fetch(`/api/kb/${params.id}`);
      const data = await res.json();
      
      if (data.entry) {
        setTitle(data.entry.title);
        setTags(data.entry.tags || '');
        setVariations(data.entry.variations || '');
        setAnswer(data.entry.answer);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
      alert('Error loading entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !answer.trim()) {
      alert('Please fill in Title and Answer');
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? '/api/kb' : `/api/kb/${params.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, tags, variations, answer })
      });

      const data = await res.json();
      
      if (data.success) {
        alert(isNew ? 'Entry created successfully!' : 'Entry updated successfully!');
        router.push('/kb');
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (error) {
      alert('Error saving entry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15ADC2] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading entry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#15ADC2]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isNew ? 'New Knowledge Base Entry' : 'Edit Knowledge Base Entry'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">Configure Luna's response for this topic</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/kb')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Claiming Toy Expenses"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., toys, expenses, deductions"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
            />
            <p className="text-xs text-gray-500 mt-1">Used for search and categorization</p>
          </div>

          {/* Variations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Variations (comma-separated)
            </label>
            <input
              type="text"
              value={variations}
              onChange={(e) => setVariations(e.target.value)}
              placeholder="e.g., can I claim toys, toy deductions, claiming toy expenses"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
            />
            <p className="text-xs text-gray-500 mt-1">Different ways educators might ask this question</p>
          </div>

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer <span className="text-red-500">*</span>
            </label>
            {typeof window !== 'undefined' && ClassicEditor && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <CKEditor
                  editor={ClassicEditor}
                  data={answer}
                  onChange={(event, editor) => {
                    setAnswer(editor.getData());
                  }}
                  config={{
                    toolbar: [
                      'heading', '|',
                      'bold', 'italic', 'link', '|',
                      'bulletedList', 'numberedList', '|',
                      'blockQuote', 'insertTable', '|',
                      'undo', 'redo'
                    ]
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Luna will use this as the authoritative answer</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/kb')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}