'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Upload, Search, Activity, Code, Sparkles, FileText, CheckCircle, XCircle, Loader2, Lock, Edit, Mail, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import CKEditor to avoid SSR issues
const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor), { ssr: false });
const ClassicEditor = dynamic(() => import('@ckeditor/ckeditor5-build-classic'), { ssr: false });

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
  const [useLocalModel, setUseLocalModel] = useState(false); // false = OpenAI (default), true = Ollama
  const [chatMode, setChatMode] = useState('educator'); // Always start with 'educator' on server
  const chatEndRef = useRef(null);

  // Load from sessionStorage on mount (client-side only)
  useEffect(() => {
    const savedMode = sessionStorage.getItem('lunaMode');
    if (savedMode && (savedMode === 'educator' || savedMode === 'internal')) {
      setChatMode(savedMode);
    }
  }, []);

  // Persist mode to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('lunaMode', chatMode);
  }, [chatMode]);

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

  // KB Library state
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  
  // Edit Document state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Add New Article state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState('');
  const [newArticleCategory, setNewArticleCategory] = useState('General');
  const [newArticleDescription, setNewArticleDescription] = useState('');
  const [newArticleContent, setNewArticleContent] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  
  // Email Templates state
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);

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
          form_context: {},
          use_fallback: useLocalModel,  // true = Ollama, false = OpenAI (default)
          mode: chatMode  // 'educator' or 'internal'
        })
      });

      const data = await res.json();
      
      // Ensure message has proper structure
      const assistantMessage = {
        role: data.message?.role || 'assistant',
        content: data.message?.content || data.message || 'No response received'
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
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
      formData.append('title', uploadTitle || uploadFile.name);

      const res = await fetch('/api/luna-rag/ingest/file', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setUploadStatus({
        success: true,
        message: `Successfully ingested ${uploadFile.name}! Created ${data.chunks_created} chunks.`,
        data
      });
      setUploadFile(null);
      setUploadTitle('');
      checkHealth(); // Refresh document count
      
      // Auto-refresh KB Library if we're on that tab
      if (activeTab === 'library') {
        loadDocuments();
      }
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

  const loadDocuments = async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch('/api/luna-rag/kb/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLibraryLoading(false);
    }
  };

  const viewDocument = async (docId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/luna-rag/kb/documents/${docId}`);
      const data = await res.json();
      setSelectedDoc(data);
      setShowDocModal(true);
    } catch (error) {
      alert(`Error loading document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId) => {
    // Find the document to get its title
    const doc = documents.find(d => d.doc_id === docId);
    const docTitle = doc?.title || selectedDoc?.title || 'this document';
    
    // Show confirmation with document title
    const confirmed = window.confirm(
      `⚠️ DELETE CONFIRMATION\n\nAre you sure you want to delete "${docTitle}"?\n\nThis will permanently remove:\n• The document\n• All ${doc?.chunk_count || selectedDoc?.chunk_count || ''} chunks\n• This cannot be undone!\n\nClick OK to delete, Cancel to keep.`
    );
    
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }

    setLoading(true);
    console.log(`Deleting document: ${docTitle} (ID: ${docId})`);
    
    try {
      const res = await fetch(`/api/luna-rag/kb/documents/${docId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Delete response:', data);
      
      // Close modal if it's open
      setShowDocModal(false);
      
      // Show success message
      alert(`✅ Successfully deleted "${docTitle}"!\n\n${data.chunks_deleted || 0} chunks removed.`);
      
      // Refresh library and health
      await loadDocuments();
      checkHealth();
    } catch (error) {
      console.error('Delete error:', error);
      alert(`❌ Error deleting document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (doc) => {
    setEditingDoc(doc);
    setEditLoading(true);
    setShowEditModal(true);
    
    try {
      // Fetch full document content
      const res = await fetch(`/api/luna-rag/kb/documents/${doc.doc_id}`);
      const data = await res.json();
      
      // Combine all chunks to get full content
      const fullContent = data.chunks?.map(c => c.content).join('\n\n') || '';
      setEditContent(fullContent);
    } catch (error) {
      alert(`Error loading document: ${error.message}`);
      setShowEditModal(false);
    } finally {
      setEditLoading(false);
    }
  };
  
  const saveDocumentEdit = async () => {
    if (!editingDoc || !editContent.trim()) return;
    
    setEditLoading(true);
    try {
      // Delete the old document
      await fetch(`/api/luna-rag/kb/documents/${editingDoc.doc_id}`, {
        method: 'DELETE'
      });
      
      // Re-ingest with new content
      const formData = new FormData();
      const blob = new Blob([editContent], { type: 'text/plain' });
      const file = new File([blob], editingDoc.filename, { type: 'text/plain' });
      formData.append('file', file);
      formData.append('category', editingDoc.category);
      formData.append('title', editingDoc.title);
      
      const res = await fetch('/api/luna-rag/ingest/file', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      alert(`✅ Document updated successfully!\n\n${data.chunks_created} chunks created.`);
      setShowEditModal(false);
      setEditingDoc(null);
      setEditContent('');
      
      // Refresh
      await loadDocuments();
      checkHealth();
    } catch (error) {
      alert(`❌ Error saving document: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };
  
  const openAddArticleModal = () => {
    setNewArticleTitle('');
    setNewArticleCategory('General');
    setNewArticleDescription('');
    setNewArticleContent('');
    setShowAddModal(true);
  };
  
  const saveNewArticle = async () => {
    if (!newArticleTitle.trim() || !newArticleContent.trim()) {
      alert('Please provide both a title and content for the article.');
      return;
    }
    
    setAddLoading(true);
    try {
      // Create article content with optional description
      let fullContent = newArticleContent;
      if (newArticleDescription.trim()) {
        fullContent = `${newArticleDescription}\n\n${newArticleContent}`;
      }
      
      // Create a text file from the content
      const formData = new FormData();
      const blob = new Blob([fullContent], { type: 'text/plain' });
      const filename = `${newArticleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      const file = new File([blob], filename, { type: 'text/plain' });
      
      formData.append('file', file);
      formData.append('category', newArticleCategory);
      formData.append('title', newArticleTitle);
      
      const res = await fetch('/api/luna-rag/ingest/file', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      alert(`✅ Article created successfully!\n\n${data.chunks_created} chunks created.`);
      setShowAddModal(false);
      
      // Refresh
      await loadDocuments();
      checkHealth();
    } catch (error) {
      alert(`❌ Error creating article: ${error.message}`);
    } finally {
      setAddLoading(false);
    }
  };
  
  const loadEmailTemplates = async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch('/api/email-templates');
      const data = await res.json();
      setEmailTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setTemplateLoading(false);
    }
  };
  
  const openTemplateEditor = (template) => {
    setSelectedTemplate(template);
    setTemplateSubject(template.subject);
    setTemplateBody(template.html_body);
    setShowTemplateModal(true);
  };
  
  const saveEmailTemplate = async () => {
    if (!selectedTemplate) return;
    
    setTemplateLoading(true);
    try {
      const res = await fetch(`/api/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: templateSubject,
          html_body: templateBody
        })
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      alert('✅ Email template saved successfully!');
      setShowTemplateModal(false);
      await loadEmailTemplates();
    } catch (error) {
      alert(`❌ Error saving template: ${error.message}`);
    } finally {
      setTemplateLoading(false);
    }
  };

  const exportKB = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/luna-rag/kb/export');
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fdc-kb-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Error exporting KB: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'library') {
      loadDocuments();
    } else if (activeTab === 'email-templates') {
      loadEmailTemplates();
    }
  }, [activeTab]);

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
            { id: 'library', label: 'KB Library', icon: FileText },
            { id: 'email-templates', label: 'Email Templates', icon: Mail },
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Chat with Luna</h2>
                
                {/* Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChatMode('educator')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      chatMode === 'educator'
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    👨‍🏫 Educator Mode
                  </button>
                  <button
                    onClick={() => setChatMode('internal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      chatMode === 'internal'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🔧 Internal Mode
                  </button>
                </div>
              </div>
              
              {/* Mode Description */}
              <div className={`p-3 rounded-lg border-l-4 ${
                chatMode === 'educator'
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-orange-50 border-orange-500 text-orange-800'
              }`}>
                <p className="text-sm font-medium">
                  {chatMode === 'educator' 
                    ? '👨‍🏫 Educator Mode: Brief responses, bullet points, plain language for clients'
                    : '🔧 Internal Mode: Full detail, conversational, tax agent shorthand'}
                </p>
              </div>
              
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
                    <div className="bg-gradient-to-r from-[#15ADC2]/10 to-[#6366F1]/10 rounded-2xl px-4 py-3 border border-[#15ADC2]/30">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#15ADC2]" />
                        <span className="text-sm text-gray-700 animate-pulse">
                          Luna is thinking...
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        First query may take 2-3 minutes (warming up)
                      </p>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Model Selection Toggle */}
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">AI Model:</span>
                  <span className={`text-sm font-semibold ${useLocalModel ? 'text-gray-500' : 'text-[#15ADC2]'}`}>
                    {useLocalModel ? 'Ollama (llama3:8b - slower)' : 'OpenAI (GPT-4o - faster) ⚡'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLocalModel}
                    onChange={(e) => setUseLocalModel(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#15ADC2] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"></div>
                  <span className="ml-3 text-xs text-gray-600">Use local model</span>
                </label>
              </div>

              <form onSubmit={handleChat} className="flex gap-2 items-end">
                <textarea
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    // Submit on Enter (without Shift)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChat(e);
                    }
                  }}
                  placeholder="Ask Luna about tax, ABN, GST, deductions... (Shift+Enter for new line)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2] focus:border-transparent resize-none overflow-hidden min-h-[48px] max-h-[200px]"
                  disabled={chatLoading}
                  rows={1}
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
                    Select File (PDF, DOCX, RTF, or TXT)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.rtf,.txt"
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

          {/* KB Library Tab */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Knowledge Base Library</h2>
                <div className="flex gap-2">
                  <button
                    onClick={openAddArticleModal}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Article
                  </button>
                  <button
                    onClick={loadDocuments}
                    disabled={libraryLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {libraryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    Refresh
                  </button>
                  <button
                    onClick={exportKB}
                    disabled={loading || documents.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>
              </div>

              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#15ADC2]" />
                </div>
              ) : documents.length === 0 ? (
                <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
                  <p className="text-gray-600 mb-4">Upload your first FDC tax document to get started!</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-2 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Go to Upload
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{documents.length} document(s) loaded</p>
                  
                  {documents.map((doc) => {
                    const isCore = doc.category === 'Core';
                    
                    return (
                      <div
                        key={doc.doc_id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {isCore ? (
                                <Lock className="w-5 h-5 text-amber-500" />
                              ) : (
                                <FileText className="w-5 h-5 text-[#15ADC2]" />
                              )}
                              <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded ${
                                isCore 
                                  ? 'bg-amber-50 text-amber-700 font-medium'
                                  : 'bg-[#15ADC2]/10 text-[#15ADC2]'
                              }`}>
                                {doc.category}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>📄 File: {doc.filename}</p>
                              <p>🧩 Chunks: {doc.chunk_count}</p>
                              <p className="text-xs text-gray-500">ID: {doc.doc_id}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDocument(doc.doc_id);
                              }}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(doc);
                              }}
                              className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors text-sm flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            {!isCore && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDocument(doc.doc_id);
                                }}
                                disabled={loading}
                                className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Email Templates Tab */}
          {activeTab === 'email-templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
                <button
                  onClick={loadEmailTemplates}
                  disabled={templateLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {templateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  Refresh
                </button>
              </div>

              {templateLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#15ADC2]" />
                </div>
              ) : emailTemplates.length === 0 ? (
                <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
                  <p className="text-gray-600">Email templates will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{emailTemplates.length} template(s)</p>
                  
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-5 h-5 text-[#6366F1]" />
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded font-mono">
                              {template.slug}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium">{template.subject}</p>
                            <p className="text-xs text-gray-500">Last updated: {new Date(template.updated_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openTemplateEditor(template)}
                          className="px-4 py-2 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
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

      {/* Document Detail Modal */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedDoc.title}</h2>
                  <p className="text-white/90 text-sm">
                    {selectedDoc.category} • {selectedDoc.chunk_count} chunks • {selectedDoc.filename}
                  </p>
                </div>
                <button
                  onClick={() => setShowDocModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Document ID:</strong> {selectedDoc.doc_id}
                </p>
              </div>

              {selectedDoc.chunks.map((chunk, idx) => (
                <div key={chunk.chunk_id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Chunk {chunk.chunk_index + 1} of {selectedDoc.chunk_count}
                    </span>
                    <span className="text-xs text-gray-500">{chunk.chunk_id}</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-between">
              <button
                onClick={() => deleteDocument(selectedDoc.doc_id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete Document
              </button>
              <button
                onClick={() => setShowDocModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-green-600" />
                  Add New Article
                </h3>
                <p className="text-sm text-gray-600 mt-1">Create a new knowledge base article</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewArticleTitle('');
                  setNewArticleCategory('General');
                  setNewArticleDescription('');
                  setNewArticleContent('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                  placeholder="e.g., GST Registration Guide for FDC Educators"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newArticleCategory}
                  onChange={(e) => setNewArticleCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                >
                  <option value="General">General</option>
                  <option value="Tax">Tax</option>
                  <option value="Deductions">Deductions</option>
                  <option value="GST">GST</option>
                  <option value="ABN">ABN</option>
                  <option value="BAS">BAS</option>
                  <option value="Core">Core (Protected)</option>
                </select>
              </div>

              {/* Description Field (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newArticleDescription}
                  onChange={(e) => setNewArticleDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2]"
                  placeholder="Brief summary (will be added at the start)"
                />
              </div>

              {/* Content WYSIWYG */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newArticleContent}
                  onChange={(e) => setNewArticleContent(e.target.value)}
                  className="w-full h-[300px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2] font-mono text-sm"
                  placeholder="Write your article content here... This will be chunked and embedded into Luna's knowledge base."
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Articles are automatically chunked and embedded. Write clear, structured content for best results.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewArticleTitle('');
                  setNewArticleCategory('General');
                  setNewArticleDescription('');
                  setNewArticleContent('');
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNewArticle}
                disabled={addLoading || !newArticleTitle.trim() || !newArticleContent.trim()}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && editingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit className="w-6 h-6 text-green-600" />
                  Edit Document
                </h3>
                <p className="text-sm text-gray-600 mt-1">{editingDoc.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDoc(null);
                  setEditContent('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {editLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#15ADC2]" />
                  <span className="ml-3 text-gray-600">Loading document...</span>
                </div>
              ) : (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-[400px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15ADC2] font-mono text-sm"
                  placeholder="Edit document content..."
                />
              )}
              
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Saving will re-chunk and re-embed this document in the knowledge base.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDoc(null);
                  setEditContent('');
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDocumentEdit}
                disabled={editLoading || !editContent.trim()}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Editor Modal */}
      {showTemplateModal && selectedTemplate && typeof window !== 'undefined' && ClassicEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-purple-600" />
                  Edit Email Template
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTemplate.name} <span className="font-mono text-xs">({selectedTemplate.slug})</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  placeholder="Email subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body (HTML)
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <CKEditor
                    editor={ClassicEditor}
                    data={templateBody}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setTemplateBody(data);
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
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Available Variables:</strong>
                </p>
                <code className="text-xs text-blue-900">
                  {'{{client_name}}'}, {'{{portal_url}}'}, {'{{bas_frequency}}'}
                </code>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEmailTemplate}
                disabled={templateLoading || !templateSubject.trim()}
                className="px-6 py-2 bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {templateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
