'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  User, Building2, Calendar, Percent, FileText, MessageSquare, 
  FolderOpen, Calculator, Bot, ArrowLeft, CheckCircle, Clock,
  AlertCircle, Download, Upload, Plus, Edit, X, Send, Loader2,
  Eye, Trash2, DollarSign
} from 'lucide-react';

// Dynamically import CKEditor
const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor), { ssr: false });
const ClassicEditor = dynamic(() => import('@ckeditor/ckeditor5-build-classic'), { ssr: false });

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [calculations, setCalculations] = useState([]);
  const [lunaLogs, setLunaLogs] = useState([]);

  // New Task Modal State
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    input_type: 'none',
    custom_options: '',
    notify_on_complete: true
  });
  const [savingTask, setSavingTask] = useState(false);

  // Task Detail Modal State
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskMessages, setTaskMessages] = useState([]);
  const [taskDocuments, setTaskDocuments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const data = await res.json();
      
      if (data.client) {
        setClient(data.client);
        setTasks(data.tasks || []);
        setMessages(data.messages || []);
        setDocuments(data.documents || []);
        setCalculations(data.calculations || []);
        setLunaLogs(data.luna_logs || []);
      }
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-orange-100 text-orange-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      'submitted': 'bg-purple-100 text-purple-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-700',
      'medium': 'bg-blue-100 text-blue-700',
      'high': 'bg-orange-100 text-orange-700',
      'urgent': 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getSenderColor = (sender) => {
    const colors = {
      'client': 'bg-blue-100 text-blue-700',
      'agent': 'bg-purple-100 text-purple-700',
      'system': 'bg-gray-100 text-gray-700',
      'luna': 'bg-teal-100 text-teal-700'
    };
    return colors[sender] || 'bg-gray-100 text-gray-700';
  };

  // New Task Functions
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setSavingTask(true);
    try {
      const payload = {
        client_id: parseInt(clientId),
        title: newTask.title,
        description: newTask.description,
        due_date: newTask.due_date || null,
        priority: newTask.priority,
        input_type: newTask.input_type,
        custom_options: newTask.input_type === 'dropdown' || newTask.input_type === 'radio' 
          ? newTask.custom_options.split('\n').filter(o => o.trim())
          : [],
        notify_on_complete: newTask.notify_on_complete
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setShowNewTaskModal(false);
        setNewTask({
          title: '',
          description: '',
          due_date: '',
          priority: 'medium',
          input_type: 'none',
          custom_options: '',
          notify_on_complete: true
        });
        loadClientData(); // Reload to get the new task
      } else {
        alert('Failed to create task: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  // Task Detail Functions
  const openTaskDetail = async (task) => {
    setSelectedTask(task);
    setAgentNotes(task.agent_notes || '');
    setReplyText('');
    setShowTaskDetailModal(true);

    // Load task-specific messages and documents
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      const data = await res.json();
      setTaskMessages(data.messages || []);
      setTaskDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading task details:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedTask) return;
    setUpdatingTask(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', agent_notes: agentNotes })
      });

      const data = await res.json();
      if (data.success) {
        setShowTaskDetailModal(false);
        loadClientData();
      } else {
        alert('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTask) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, sender: 'agent' })
      });

      const data = await res.json();
      if (data.success) {
        setReplyText('');
        // Reload task messages
        const taskRes = await fetch(`/api/tasks/${selectedTask.id}`);
        const taskData = await taskRes.json();
        setTaskMessages(taskData.messages || []);
      } else {
        alert('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTask) return;
    setUpdatingTask(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_notes: agentNotes })
      });

      const data = await res.json();
      if (data.success) {
        alert('Notes saved');
        loadClientData();
      } else {
        alert('Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setUpdatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366F1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Client not found</h2>
          <button
            onClick={() => router.push('/clients')}
            className="text-[#6366F1] hover:text-[#4F46E5]"
          >
            ← Back to clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/clients')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">{client.business_name || 'FDC Educator'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {client.gst_registered && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  GST Registered
                </span>
              )}
              <span className={`px-3 py-1 text-sm rounded-lg ${
                client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {client.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'tasks', label: 'Tasks', icon: FileText, badge: tasks.filter(t => t.status === 'pending' || t.status === 'submitted').length },
              { id: 'messages', label: 'Messages', icon: MessageSquare, badge: messages.length },
              { id: 'documents', label: 'Documents', icon: FolderOpen, badge: documents.length },
              { id: 'calculations', label: 'Calculations', icon: Calculator, badge: calculations.length },
              { id: 'luna-logs', label: 'Luna Logs', icon: Bot, badge: lunaLogs.length }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#6366F1] text-[#6366F1]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="px-2 py-0.5 bg-[#6366F1] text-white text-xs rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#6366F1]" />
                    Personal Information
                  </h3>
                  <button className="text-[#6366F1] hover:text-[#4F46E5] text-sm flex items-center gap-1">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Full Name</label>
                    <p className="text-gray-900 font-medium">{client.first_name} {client.last_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Preferred Name</label>
                    <p className="text-gray-900">{client.casual_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="text-gray-900">{client.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Mobile</label>
                    <p className="text-gray-900">{client.mobile || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <p className="text-gray-900">{client.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="text-gray-900">{client.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#6366F1]" />
                  Business Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Business Name</label>
                    <p className="text-gray-900 font-medium">{client.business_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">ABN</label>
                    <p className="text-gray-900 font-mono">{client.abn || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">FDC Percentage</label>
                    <p className="text-gray-900 font-bold text-2xl flex items-center gap-1">
                      {client.fdc_percent || 0}
                      <Percent className="w-5 h-5" />
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Start Date</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {client.start_date ? new Date(client.start_date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#6366F1]" />
                Tax Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs text-gray-500">GST Registration</label>
                  <p className={`mt-1 px-3 py-2 rounded-lg w-fit ${
                    client.gst_registered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {client.gst_registered ? 'Registered' : 'Not Registered'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">BAS Quarter</label>
                  <p className="text-gray-900 font-medium mt-1">{client.bas_quarter || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Notes</label>
                  <p className="text-gray-600 mt-1">{client.notes || 'No notes'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
              <button 
                onClick={() => setShowNewTaskModal(true)}
                className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>
            
            {tasks.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No tasks yet</p>
                <button 
                  onClick={() => setShowNewTaskModal(true)}
                  className="mt-4 text-[#6366F1] hover:text-[#4F46E5]"
                >
                  Create your first task →
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Input Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{task.description.replace(/<[^>]+>/g, '')}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.input_type || 'none'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => openTaskDetail(task)}
                            className="text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Message History</h3>
            {messages.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No messages yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {messages.map(msg => (
                  <div key={msg.id} className="flex gap-4">
                    <div className={`px-3 py-1 rounded h-fit text-xs font-medium ${getSenderColor(msg.sender)}`}>
                      {msg.sender}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{msg.message_text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <button className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
            
            {documents.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No documents yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{doc.file_name}</div>
                          <div className="text-sm text-gray-500">{doc.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(doc.upload_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {doc.uploaded_by || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1 ml-auto"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Calculations Tab */}
        {activeTab === 'calculations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tax Calculations</h3>
            {calculations.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No calculations yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calculations.map(calc => (
                  <div key={calc.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{calc.type.replace('_', ' ').toUpperCase()}</h4>
                        <p className="text-sm text-gray-500">{new Date(calc.timestamp).toLocaleString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                        {calc.tax_year}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Input Data</h5>
                        <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                          {JSON.stringify(calc.input_data, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Output</h5>
                        <pre className="bg-green-50 p-4 rounded text-xs overflow-x-auto">
                          {JSON.stringify(calc.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    {calc.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">{calc.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Luna Logs Tab */}
        {activeTab === 'luna-logs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-teal-500" />
              Luna Conversation Logs
            </h3>
            {lunaLogs.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No Luna interactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lunaLogs.map(log => (
                  <div key={log.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">
                          {log.mode}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs font-medium text-blue-700 mb-1">Client Query:</p>
                        <p className="text-gray-900">{log.query}</p>
                      </div>
                      
                      <div className="bg-teal-50 p-4 rounded-lg">
                        <p className="text-xs font-medium text-teal-700 mb-1">Luna Response:</p>
                        <p className="text-gray-900">{log.response}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">New Task for {client.first_name}</h2>
              <button onClick={() => setShowNewTaskModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  placeholder="e.g., Upload Q1 receipts"
                />
              </div>

              {/* Description (Rich Text) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {typeof window !== 'undefined' && ClassicEditor && (
                  <CKEditor
                    editor={ClassicEditor}
                    data={newTask.description}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setNewTask({ ...newTask, description: data });
                    }}
                    config={{
                      toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', 'link']
                    }}
                  />
                )}
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Input Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Input Required
                </label>
                <select
                  value={newTask.input_type}
                  onChange={(e) => setNewTask({ ...newTask, input_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                >
                  <option value="none">None - Acknowledgement only</option>
                  <option value="amount">$ Amount - Dollar input</option>
                  <option value="text">Text - Free text response</option>
                  <option value="file">File Upload - Document required</option>
                  <option value="dropdown">Dropdown - Select from options</option>
                  <option value="radio">Radio - Choose one option</option>
                </select>
              </div>

              {/* Custom Options (for dropdown/radio) */}
              {(newTask.input_type === 'dropdown' || newTask.input_type === 'radio') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options (one per line)
                  </label>
                  <textarea
                    value={newTask.custom_options}
                    onChange={(e) => setNewTask({ ...newTask, custom_options: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              {/* Notify on Complete */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify"
                  checked={newTask.notify_on_complete}
                  onChange={(e) => setNewTask({ ...newTask, notify_on_complete: e.target.checked })}
                  className="w-4 h-4 text-[#6366F1] rounded"
                />
                <label htmlFor="notify" className="text-sm text-gray-700">
                  Email me when client submits this task
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={savingTask}
                className="px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50 flex items-center gap-2"
              >
                {savingTask ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowTaskDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Task Description */}
              {selectedTask.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <div 
                    className="prose prose-sm text-gray-600 bg-gray-50 p-4 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                  />
                </div>
              )}

              {/* Client Submission */}
              {selectedTask.status === 'submitted' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Client Submission
                  </h4>
                  
                  {selectedTask.client_response && (
                    <div className="mb-3">
                      <label className="text-xs text-purple-600">Response:</label>
                      <p className="text-gray-900">{selectedTask.client_response}</p>
                    </div>
                  )}
                  
                  {selectedTask.client_amount && (
                    <div className="mb-3">
                      <label className="text-xs text-purple-600">Amount:</label>
                      <p className="text-gray-900 font-semibold flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {parseFloat(selectedTask.client_amount).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {selectedTask.client_comment && (
                    <div className="mb-3">
                      <label className="text-xs text-purple-600">Comment:</label>
                      <p className="text-gray-900">{selectedTask.client_comment}</p>
                    </div>
                  )}
                  
                  {selectedTask.client_files && (
                    typeof selectedTask.client_files === 'string' 
                      ? JSON.parse(selectedTask.client_files || '[]') 
                      : selectedTask.client_files
                  ).length > 0 && (
                    <div>
                      <label className="text-xs text-purple-600">Uploaded Files:</label>
                      <div className="mt-1 space-y-1">
                        {(typeof selectedTask.client_files === 'string' 
                          ? JSON.parse(selectedTask.client_files) 
                          : selectedTask.client_files
                        ).map((file, idx) => (
                          <a 
                            key={idx} 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[#6366F1] hover:text-[#4F46E5]"
                          >
                            <Download className="w-4 h-4" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedTask.submitted_at && (
                    <p className="text-xs text-purple-500 mt-3">
                      Submitted: {new Date(selectedTask.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Task Documents */}
              {taskDocuments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {taskDocuments.map(doc => (
                      <a 
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{doc.file_name}</span>
                        <Download className="w-4 h-4 text-gray-400 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Thread */}
              {taskMessages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Messages</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                    {taskMessages.map(msg => (
                      <div key={msg.id} className="flex gap-3">
                        <span className={`px-2 py-0.5 text-xs rounded h-fit ${getSenderColor(msg.sender)}`}>
                          {msg.sender}
                        </span>
                        <div>
                          <p className="text-gray-900 text-sm">{msg.message_text}</p>
                          <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Box */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Send Reply to Client</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50"
                  >
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Agent Notes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Internal Notes (not visible to client)</h4>
                <textarea
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  rows={3}
                  placeholder="Add private notes..."
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={updatingTask}
                  className="mt-2 text-sm text-[#6366F1] hover:text-[#4F46E5]"
                >
                  Save Notes
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between">
              <button
                onClick={() => setShowTaskDetailModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              {selectedTask.status !== 'completed' && (
                <button
                  onClick={handleMarkComplete}
                  disabled={updatingTask}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingTask ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
