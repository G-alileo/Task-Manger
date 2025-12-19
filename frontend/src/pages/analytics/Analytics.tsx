import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Sidebar } from '../../components/Sidebar';
import { getTasks } from '../../services/tasksService';
import type { Task } from '../../types/task';

export default function Analytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tasksResponse = await getTasks({});
      setTasks(tasksResponse.results || []);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate productivity data
  const getProductivityData = () => {
    const now = new Date();
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(t => 
        t.created_at.startsWith(dateStr) || 
        (t.completed_at && t.completed_at.startsWith(dateStr))
      );
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created: dayTasks.filter(t => t.created_at.startsWith(dateStr)).length,
        completed: dayTasks.filter(t => t.completed_at?.startsWith(dateStr)).length,
      });
    }
    
    return data;
  };

  // Priority distribution
  const getPriorityData = () => {
    const priorities = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach(task => {
      priorities[task.priority]++;
    });
    
    return [
      { name: 'Low', value: priorities.low, color: '#22c55e' },
      { name: 'Medium', value: priorities.medium, color: '#eab308' },
      { name: 'High', value: priorities.high, color: '#f97316' },
      { name: 'Urgent', value: priorities.urgent, color: '#ef4444' }
    ];
  };

  // Status distribution
  const getStatusData = () => {
    const statuses = { todo: 0, in_progress: 0, completed: 0, cancelled: 0 };
    tasks.forEach(task => {
      statuses[task.status]++;
    });
    
    return [
      { name: 'To Do', value: statuses.todo, color: '#6b7280' },
      { name: 'In Progress', value: statuses.in_progress, color: '#3b82f6' },
      { name: 'Completed', value: statuses.completed, color: '#22c55e' },
      { name: 'Cancelled', value: statuses.cancelled, color: '#ef4444' }
    ];
  };

  // Completion rate over time
  const getCompletionTrendData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      
      const monthTasks = tasks.filter(t => t.created_at.startsWith(monthStr));
      const completed = monthTasks.filter(t => t.status === 'completed').length;
      const rate = monthTasks.length > 0 ? (completed / monthTasks.length * 100).toFixed(1) : 0;
      
      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        rate: parseFloat(rate as string),
        total: monthTasks.length
      });
    }
    
    return data;
  };

  // Task completion by day of week
  const getDayOfWeekData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = days.map(() => 0);
    
    tasks.filter(t => t.status === 'completed' && t.completed_at).forEach(task => {
      const day = new Date(task.completed_at!).getDay();
      dayData[day]++;
    });
    
    return days.map((day, index) => ({
      day,
      completed: dayData[index]
    }));
  };

  // Average completion time
  const getAverageCompletionTime = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_at).getTime();
      const completed = new Date(task.completed_at!).getTime();
      return sum + (completed - created);
    }, 0);
    
    const avgMs = totalTime / completedTasks.length;
    return Math.round(avgMs / (1000 * 60 * 60 * 24)); // Convert to days
  };

  const productivityData = getProductivityData();
  const priorityData = getPriorityData();
  const statusData = getStatusData();
  const completionTrendData = getCompletionTrendData();
  const dayOfWeekData = getDayOfWeekData();
  const avgCompletionTime = getAverageCompletionTime();

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.is_overdue && t.status !== 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex">
      <Sidebar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-gray-400">Insights into your task management productivity</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="w-12 h-12 border-4 border-[#6b668c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  icon={CheckCircle2}
                  title="Completion Rate"
                  value={`${completionRate}%`}
                  trend={parseFloat(completionRate as string) >= 70 ? 'up' : 'down'}
                  trendValue={`${completedTasks}/${tasks.length}`}
                  color="green"
                />
                <MetricCard
                  icon={Clock}
                  title="In Progress"
                  value={inProgressTasks.toString()}
                  subtitle="Active tasks"
                  color="blue"
                />
                <MetricCard
                  icon={AlertCircle}
                  title="Overdue"
                  value={overdueTasks.toString()}
                  trend={overdueTasks > 0 ? 'down' : 'up'}
                  trendValue={overdueTasks > 0 ? 'Needs attention' : 'All clear!'}
                  color="red"
                />
                <MetricCard
                  icon={Target}
                  title="Avg. Completion"
                  value={`${avgCompletionTime}d`}
                  subtitle="Average time to complete"
                  color="purple"
                />
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Productivity Over Time */}
                <ChartCard title="30-Day Productivity Trend" icon={Activity}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={productivityData}>
                      <defs>
                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6b668c" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6b668c" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2A2A2A',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stroke="#6b668c"
                        fillOpacity={1}
                        fill="url(#colorCreated)"
                        name="Created"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                        name="Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Completion Rate Trend */}
                <ChartCard title="Completion Rate Trend" icon={TrendingUp}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={completionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2A2A2A',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#928dab"
                        strokeWidth={3}
                        dot={{ fill: '#928dab', r: 6 }}
                        name="Completion Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Status Distribution */}
                <ChartCard title="Status Distribution" icon={PieChart}>
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsPieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2A2A2A',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Priority Distribution */}
                <ChartCard title="Priority Distribution" icon={AlertCircle}>
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsPieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2A2A2A',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Day of Week Performance */}
                <ChartCard title="Completions by Day" icon={Calendar}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dayOfWeekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis 
                        dataKey="day" 
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2A2A2A',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="completed" 
                        fill="#6b668c"
                        radius={[8, 8, 0, 0]}
                        name="Completed Tasks"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Insights Panel */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="text-[#928dab]" />
                  Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InsightCard
                    title="Most Productive Day"
                    value={dayOfWeekData.reduce((max, day) => day.completed > max.completed ? day : max).day}
                    description={`${dayOfWeekData.reduce((max, day) => day.completed > max.completed ? day : max).completed} tasks completed`}
                  />
                  <InsightCard
                    title="Task Velocity"
                    value={`${(completedTasks / 30).toFixed(1)}/day`}
                    description="Average tasks completed daily"
                  />
                  <InsightCard
                    title="Focus Area"
                    value={priorityData.reduce((max, p) => p.value > max.value ? p : max).name}
                    description="Most common priority level"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  trend,
  trendValue,
  subtitle,
  color
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  subtitle?: string;
  color: 'green' | 'blue' | 'red' | 'purple';
}) {
  const colors = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
    purple: 'text-[#928dab]'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl hover:bg-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {(trendValue || subtitle) && (
        <p className="text-sm text-gray-500">{trendValue || subtitle}</p>
      )}
    </motion.div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-[#928dab]" />
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InsightCard({
  title,
  value,
  description
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}
