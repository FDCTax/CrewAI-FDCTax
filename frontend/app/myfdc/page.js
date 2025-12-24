'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, AlertCircle, FileText, Upload, Send,
  ChevronRight, User, Calendar, DollarSign, MessageSquare,
  X, Loader2, ArrowLeft, Users
} from 'lucide-react';

export default function MyFDCDashboard() {
  // Test clients for sandbox - aligned with CRM clients
  const testClients = [
    { id: 143003, name: 'Sarah Test (MyFDC Only)', email: 'sarah.testclient@fdctax.com.au' },
    { id: 143004, name: 'Mike Test (DIY/Luna)', email: 'mike.testclient@fdctax.com.au' },
    { id: 143005, name: 'Emma Test (DIY/Luna)', email: 'emma.testclient@fdctax.com.au' },
    { id: 143006, name: 'James Test (Full Service)', email: 'james.testclient@fdctax.com.au' },
    { id: 143007, name: 'Lisa Test (Full Service)', email: 'lisa.testclient@fdctax.com.au' }
  ];
  
  const [userId, setUserId] = useState(143003);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  
  // Task submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [taskResponse, setTaskResponse] = useState('');
  const [taskAmount, setTaskAmount] = useState('');
  const [taskComment, setTaskComment] = useState('');
  const [taskFiles, setTaskFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      // Load user context
      const userRes = await fetch(`/api/user/context?user_id=${userId}`);
      const userData = await userRes.json();
      if (userData.user) {
        setUser(userData.user);
      }
      
      // Load tasks
      const tasksRes = await fetch(`/api/myfdc/tasks?user_id=${userId}`);
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setTaskResponse(task.client_response || '');
    setTaskAmount(task.client_amount || '');
    setTaskComment(task.client_comment || '');
    setTaskFiles([]);
    setSubmitSuccess(false);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
    setTaskResponse('');
    setTaskAmount('');
    setTaskComment('');
    setTaskFiles([]);
    setSubmitSuccess(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('client_id', userId);
      formData.append('task_id', selectedTask.id);
      formData.append('uploaded_by', 'client');
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setTaskFiles([...taskFiles, data.file]);
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;
    
    // Validate required input
    if (selectedTask.input_type === 'amount' && !taskAmount) {
      alert('Please enter an amount');
      return;
    }
    if (selectedTask.input_type === 'text' && !taskResponse) {
      alert('Please enter a response');
      return;
    }
    if (selectedTask.input_type === 'file' && taskFiles.length === 0) {
      alert('Please upload a file');
      return;
    }
    if ((selectedTask.input_type === 'dropdown' || selectedTask.input_type === 'radio') && !taskResponse) {
      alert('Please select an option');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_response: taskResponse,
          client_amount: taskAmount ? parseFloat(taskAmount) : null,
          client_files: taskFiles,
          client_comment: taskComment
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        // Reload tasks to update list
        loadData();
      } else {
        alert('Failed to submit task: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'submitted': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'submitted': return 'Submitted';
      case 'pending': return 'Action Required';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderInputField = () => {
    if (!selectedTask) return null;
    
    switch (selectedTask.input_type) {
      case 'amount':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={taskAmount}
                onChange={(e) => setTaskAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Response
            </label>
            <textarea
              value={taskResponse}
              onChange={(e) => setTaskResponse(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
              rows={4}
              placeholder="Enter your response..."
            />
          </div>
        );
      
      case 'file':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {taskFiles.length > 0 ? (
                <div className="space-y-2">
                  {taskFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm text-green-700">{file.name}</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                  <label className="cursor-pointer text-[#6366F1] hover:text-[#4F46E5] text-sm">
                    + Add another file
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer">
                  {uploadingFile ? (
                    <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400 mt-1">PDF, DOC, JPG up to 10MB</p>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                </label>
              )}
            </div>
          </div>
        );
      
      case 'dropdown':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select an Option
            </label>
            <select
              value={taskResponse}
              onChange={(e) => setTaskResponse(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
            >
              <option value="">Choose...</option>
              {(selectedTask.custom_options || []).map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      case 'radio':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select an Option
            </label>
            <div className="space-y-2">
              {(selectedTask.custom_options || []).map((option, idx) => (
                <label key={idx} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="taskOption"
                    value={option}
                    checked={taskResponse === option}
                    onChange={(e) => setTaskResponse(e.target.value)}
                    className="w-4 h-4 text-[#6366F1]"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#15ADC2]/10 via-white to-[#6366F1]/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#6366F1] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const submittedTasks = tasks.filter(t => t.status === 'submitted');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#15ADC2]/10 via-white to-[#6366F1]/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {user?.casual_name || user?.name || user?.first_name || 'there'}!
                </h1>
                <p className="text-white/80 text-sm">MyFDC Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Test Client Selector - Sandbox Only */}
              <div className="relative">
                <button 
                  onClick={() => setShowClientSelector(!showClientSelector)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <Users className="w-4 h-4" />
                  Switch User
                </button>
                {showClientSelector && (
                  <div className="absolute right-0 top-full mt-2 bg-white text-gray-900 rounded-lg shadow-xl py-2 w-64 z-50">
                    <div className="px-3 py-1 text-xs text-gray-500 border-b">Test Clients (Sandbox)</div>
                    {testClients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setUserId(client.id);
                          setShowClientSelector(false);
                          setLoading(true);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${
                          userId === client.id ? 'bg-[#6366F1]/10 text-[#6366F1] font-medium' : ''
                        }`}
                      >
                        {client.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <a 
                href="/" 
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Luna
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                <p className="text-xs text-gray-500">Action Required</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{submittedTasks.length}</p>
                <p className="text-xs text-gray-500">Submitted</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Required Section */}
        {pendingTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Action Required
            </h2>
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => openTaskDetail(task)}
                  className="w-full bg-white rounded-xl shadow-sm border border-orange-200 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {task.description.replace(/<[^>]+>/g, '')}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submitted Section */}
        {submittedTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Submitted - Awaiting Review
            </h2>
            <div className="space-y-3">
              {submittedTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-sm border border-blue-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <p className="text-xs text-gray-500">
                        Submitted {task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {completedTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Completed
            </h2>
            <div className="space-y-3">
              {completedTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-sm border p-4 opacity-75"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">You have no pending tasks at the moment.</p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
              <button onClick={closeTaskModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Task Submitted!</h3>
                  <p className="text-gray-600 mb-6">Your response has been sent to the FDC Tax team.</p>
                  <button
                    onClick={closeTaskModal}
                    className="px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Task Info */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded border ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                      {selectedTask.due_date && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(selectedTask.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedTask.title}</h3>
                    {selectedTask.description && (
                      <div 
                        className="prose prose-sm text-gray-600"
                        dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                      />
                    )}
                  </div>

                  {/* Already Submitted */}
                  {selectedTask.status === 'submitted' || selectedTask.status === 'completed' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-700 text-sm">
                        This task has already been submitted and is being reviewed by our team.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Input Field */}
                      {renderInputField()}

                      {/* Comment Field */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          Add a Comment (optional)
                        </label>
                        <textarea
                          value={taskComment}
                          onChange={(e) => setTaskComment(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                          rows={3}
                          placeholder="Any additional notes or questions..."
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmitTask}
                        disabled={submitting}
                        className="w-full py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Submit Task
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
