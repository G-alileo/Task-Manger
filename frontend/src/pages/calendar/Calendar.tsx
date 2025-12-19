import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Circle
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import type { Task, TaskPriority, TaskStatus } from '../../types/task';
import { getTasks, updateTask } from '../../services/tasksService';

type ViewMode = 'month' | 'week';

export default function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks({});
      setTasks(response.results || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date);
    sunday.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(sunday);
      currentDay.setDate(sunday.getDate() + i);
      days.push(currentDay);
    }
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={12} className="text-green-400" />;
      case 'in_progress':
        return <Clock size={12} className="text-blue-400" />;
      case 'cancelled':
        return <Circle size={12} className="text-red-400" />;
      default:
        return <Circle size={12} className="text-gray-400" />;
    }
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-2" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayTasks = getTasksForDate(date);
      const isToday = 
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      
      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.02 }}
          onClick={() => setSelectedDate(date)}
          className={`aspect-square p-2 border border-white/10 rounded-xl cursor-pointer transition-all ${
            isToday ? 'bg-[#6b668c]/20 border-[#6b668c]' : 'bg-white/5 hover:bg-white/10'
          } ${isSelected ? 'ring-2 ring-[#928dab]' : ''}`}
        >
          <div className="h-full flex flex-col">
            <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#928dab]' : 'text-white'}`}>
              {day}
            </div>
            <div className="flex-1 overflow-hidden space-y-0.5">
              {dayTasks.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  className={`text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${
                    task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    task.is_overdue ? 'bg-red-500/20 text-red-400' :
                    'bg-white/10 text-gray-300'
                  }`}
                >
                  <div className={`w-1 h-1 rounded-full shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span className="truncate">{task.title}</span>
                </div>
              ))}
              {dayTasks.length > 2 && (
                <div className="text-xs text-gray-500 px-1.5">+{dayTasks.length - 2} more</div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }
    
    return days;
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    
    return weekDays.map((date, index) => {
      const dayTasks = getTasksForDate(date);
      const isToday = 
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();
      
      return (
        <div key={index} className="flex-1 min-w-0">
          <div className={`text-center p-3 border-b border-white/10 ${isToday ? 'bg-[#6b668c]/20' : ''}`}>
            <div className="text-xs text-gray-400 font-medium">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-[#928dab]' : 'text-white'}`}>
              {date.getDate()}
            </div>
          </div>
          <div className="p-3 space-y-2 min-h-[500px]">
            {dayTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full mt-1 ${getPriorityColor(task.priority)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">{task.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {getStatusIcon(task.status)}
                  <button
                    onClick={() => {
                      const nextStatus: TaskStatus = 
                        task.status === 'todo' ? 'in_progress' :
                        task.status === 'in_progress' ? 'completed' : 'todo';
                      handleStatusChange(task.id, nextStatus);
                    }}
                    className="text-xs px-2 py-1 bg-white/5 hover:bg-[#6b668c] rounded border border-white/10 text-gray-400 hover:text-white transition-all"
                  >
                    Update
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Calendar</h1>
            <p className="text-gray-400">View and manage tasks by date</p>
          </div>

          {/* Controls */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6 shadow-xl">
            <div className="flex items-center justify-between">
              {/* Month/Year Display */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                
                <div className="flex items-center gap-2">
                  <CalendarIcon size={20} className="text-[#928dab]" />
                  <h2 className="text-xl font-bold text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                </div>
                
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>
                
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all"
                >
                  Today
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'month'
                      ? 'bg-[#6b668c] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'week'
                      ? 'bg-[#6b668c] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="w-12 h-12 border-4 border-[#6b668c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : viewMode === 'month' ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {renderMonthView()}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex">
                {renderWeekView()}
              </div>
            </div>
          )}

          {/* Selected Date Tasks */}
          {selectedDate && viewMode === 'month' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="space-y-3">
                {getTasksForDate(selectedDate).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white mb-1">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const nextStatus: TaskStatus = 
                          task.status === 'todo' ? 'in_progress' :
                          task.status === 'in_progress' ? 'completed' : 'todo';
                        handleStatusChange(task.id, nextStatus);
                      }}
                      className="text-sm px-4 py-2 bg-white/5 hover:bg-[#6b668c] rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                      Update Status
                    </button>
                  </div>
                ))}
                {getTasksForDate(selectedDate).length === 0 && (
                  <p className="text-center text-gray-400 py-8">No tasks scheduled for this date</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
