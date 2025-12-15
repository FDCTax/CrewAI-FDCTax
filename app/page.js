'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Upload, Search, Activity, Code, Sparkles, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function LunaDashboard() {
  const [activeTab, setActiveTab] = useState('chat');
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m Luna, your FDC Tax assistant. Ask me anything about tax, ABN, GST, or deductions!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Tax');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // API Tester state
  const [apiEndpoint, setApiEndpoint] = useState('/chat');
  const [apiPayload, setApiPayload] = useState(JSON.stringify({
    messages: [{ role: 'user', content: 'What is an ABN?' }],
    session_id: 'test-123'
  }, null, 2));
  const [apiResponse, setApiResponse] = useState('');

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/luna-rag/health');
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      setHealth({ status: 'error', error: error.message });
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/luna-rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          session_id: 'dashboard-session',
          form_context: {}
        })
      });

      const data = await res.json();
      setChatMessages(prev => [...prev, data.message]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setLoading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      if (uploadTitle) formData.append('title', uploadTitle);

      const res = await fetch('/api/luna-rag/ingest/file', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      setUploadStatus({
        success: true,
        message: `Successfully ingested ${uploadFile.name}! Created ${data.chunks_created} chunks.`,
        data
      });
      setUploadFile(null);
      setUploadTitle('');
      checkHealth(); // Refresh document count
    } catch (error) {
      setUploadStatus({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const res = await fetch('/api/luna-rag/kb/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 })
      });

      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleApiTest = async () => {
    setLoading(true);
    setApiResponse('');

    try {
      const payload = JSON.parse(apiPayload);
      const res = await fetch(`/api/luna-rag${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#15ADC2]/10 via-white to-[#6366F1]/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Luna AI Dashboard</h1>
          </div>
          <p className="text-white/90">FDC Tax Knowledge Base & RAG System Testing</p>
          
          {/* Health Status */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              {health?.status === 'healthy' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>{health?.status || 'Checking...'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <FileText className="w-4 h-4" />
              <span>{health?.kb_documents || 0} documents in KB</span>
            </div>
            <button
              onClick={checkHealth}
              className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'chat', label: 'Chat with Luna', icon: MessageCircle },
            { id: 'upload', label: 'Upload Documents', icon: Upload },
            { id: 'search', label: 'Search KB', icon: Search },
            { id: 'api', label: 'API Tester', icon: Code },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Chat with Luna</h2>
              
              <div className="border border-gray-200 rounded-xl p-4 h-96 overflow-y-auto bg-gray-50">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                      <Loader2 className="w-4 h-4 animate-spin text-[#15ADC2]" />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Luna about tax, ABN, GST, deductions..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2] focus:border-transparent"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Send
                </button>
              </form>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Try asking:</strong> "What deductions can educators claim?" or "How do I register for GST?" or "What is the exclusive area rule?"
                </p>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Documents</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File (PDF or DOCX)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                  >
                    <option>Tax</option>
                    <option>ABN</option>
                    <option>GST</option>
                    <option>Deductions</option>
                    <option>General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g., Example of FDC Expenses"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Ingest
                    </>
                  )}
                </button>
              </form>

              {uploadStatus && (
                <div className={`p-4 rounded-lg border ${
                  uploadStatus.success
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="font-medium">{uploadStatus.message}</p>
                  {uploadStatus.data && (
                    <p className="text-sm mt-2">Document ID: {uploadStatus.data.doc_id}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Knowledge Base</h2>
              
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for tax information, deductions, GST..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-6 py-3 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium flex items-center gap-2"
                >
                  {searchLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Results ({searchResults.length})</h3>
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {result.metadata?.title || 'Untitled'}
                        </h4>
                        <span className="text-xs bg-[#15ADC2]/10 text-[#15ADC2] px-2 py-1 rounded">
                          {result.metadata?.category || 'General'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">{result.content}</p>
                      {result.distance && (
                        <p className="text-xs text-gray-500 mt-2">
                          Relevance: {(100 - result.distance * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searchLoading && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                  No results found. Try uploading some documents first!
                </div>
              )}
            </div>
          )}

          {/* API Tester Tab */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">API Endpoint Tester</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint
                </label>
                <select
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                >
                  <option value="/chat">POST /chat</option>
                  <option value="/kb/search">POST /kb/search</option>
                  <option value="/ingest/document">POST /ingest/document</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Payload (JSON)
                </label>
                <textarea
                  value={apiPayload}
                  onChange={(e) => setApiPayload(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2] font-mono text-sm"
                />
              </div>

              <button
                onClick={handleApiTest}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Code className="w-5 h-5" />
                    Send Request
                  </>
                )}
              </button>

              {apiResponse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response
                  </label>
                  <pre className="w-full px-4 py-3 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
                    {apiResponse}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
