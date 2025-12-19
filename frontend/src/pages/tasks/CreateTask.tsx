import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Flag,
  Save,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { createTask } from '../../services/tasksService';
import type { TaskCreateData } from '../../types/task';

export default function CreateTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<TaskCreateData>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare data with proper formatting
      const submitData: TaskCreateData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        priority: formData.priority,
      };

      // Only include due_date if it's provided, and format it as datetime
      if (formData.due_date) {
        submitData.due_date = `${formData.due_date} 23:59:59`;
      }

      console.log('Submitting task data:', submitData);
      const response = await createTask(submitData);
      console.log('Task created successfully:', response);
      setSuccess(true);
      
      // Show success message then navigate
      setTimeout(() => {
        navigate('/tasks');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating task:', err);
      console.error('Error response:', err.response);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create task. Please try again.';
      
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else {
          // Handle field-specific errors
          const errors = Object.entries(err.response.data)
            .map(([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('; ');
          if (errors) errorMessage = errors;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.description) {
      if (confirm('Are you sure you want to discard this task?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'high':
        return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      case 'low':
        return 'border-green-500/30 bg-green-500/10 text-green-400';
      default:
        return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center max-w-md shadow-xl"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Task Created!</h2>
          <p className="text-gray-400">Redirecting to tasks page...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">Create New Task</h1>
            <p className="text-gray-400">Add a new task to your workflow</p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <X size={18} />
              </button>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl space-y-6">
              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2 uppercase">
                  <FileText size={16} />
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter task title..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] focus:border-[#928dab] transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2 uppercase">
                  <FileText size={16} />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add task description..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] focus:border-[#928dab] transition-all resize-none"
                />
              </div>

              {/* Priority and Due Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2 uppercase">
                    <Flag size={16} />
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6b668c] focus:border-[#928dab] transition-all appearance-none cursor-pointer hover:bg-white/10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23928dab'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25rem'
                      }}
                    >
                      <option value="low" className="bg-[#2A2A2A] text-white">Low Priority</option>
                      <option value="medium" className="bg-[#2A2A2A] text-white">Medium Priority</option>
                      <option value="high" className="bg-[#2A2A2A] text-white">High Priority</option>
                      <option value="urgent" className="bg-[#2A2A2A] text-white">Urgent Priority</option>
                    </select>
                  </div>
                  
                  {/* Priority Preview */}
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${getPriorityColor(formData.priority || 'medium')}`}>
                      <Flag size={14} />
                      {(formData.priority || 'medium').charAt(0).toUpperCase() + (formData.priority || 'medium').slice(1)}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2 uppercase">
                    <Calendar size={16} />
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6b668c] focus:border-[#928dab] transition-all"
                  />
                  {formData.due_date && (
                    <p className="mt-2 text-sm text-gray-400">
                      Due {new Date(formData.due_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6b668c] to-[#928dab] hover:from-[#928dab] hover:to-[#6b668c] rounded-xl text-white font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-initial"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Create Task</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </form>

          {/* Tips Card */}
          <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-3">💡 Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-[#928dab] mt-1">•</span>
                <span>Use clear, action-oriented titles for better task management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#928dab] mt-1">•</span>
                <span>Set realistic due dates to maintain productivity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#928dab] mt-1">•</span>
                <span>Prioritize urgent tasks to stay on top of your workload</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#928dab] mt-1">•</span>
                <span>Add detailed descriptions to provide context for future reference</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
