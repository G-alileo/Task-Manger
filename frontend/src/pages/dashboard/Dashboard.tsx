import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Hourglass,
  CheckCircle2,
  Plus,
  Search,
  Bell,
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  Target,
  Zap,
  X,
  Circle,
  Trash2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Sidebar } from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import type { Task, TaskCreateData } from "../../types/task";
import {
  getTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
} from "../../services/tasksService";

interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  high_priority: number;
  urgent: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">(
    "week"
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        getTasks({ page_size: 10, ordering: "-created_at" }),
        getTaskStats(),
      ]);

      // getTasks returns paginated response directly
      setTasks(tasksRes.results || []);

      // getTaskStats returns wrapped response with status
      if (statsRes.status === "success") {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock weekly data (
  const weeklyData = [
    { day: "Mon", completed: 3, created: 5 },
    { day: "Tue", completed: 5, created: 4 },
    { day: "Wed", completed: 2, created: 6 },
    { day: "Thu", completed: 8, created: 3 },
    { day: "Fri", completed: 6, created: 7 },
    { day: "Sat", completed: 4, created: 2 },
    { day: "Sun", completed: 3, created: 1 },
  ];

  const monthlyData = [
    { week: "Week 1", completed: 12, created: 15 },
    { week: "Week 2", completed: 18, created: 14 },
    { week: "Week 3", completed: 15, created: 20 },
    { week: "Week 4", completed: 21, created: 18 },
  ];

  const priorityDistribution = [
    {
      name: "Low",
      value: stats ? stats.total - stats.high_priority - stats.urgent : 0,
      color: "#64748b",
    },
    {
      name: "Medium",
      value: stats ? stats.total - stats.high_priority - stats.urgent : 0,
      color: "#fbbf24",
    },
    { name: "High", value: stats?.high_priority || 0, color: "#fb923c" },
    { name: "Urgent", value: stats?.urgent || 0, color: "#ef4444" },
  ];

  const statusDistribution = [
    { name: "To Do", value: stats?.todo || 0, color: "#64748b" },
    { name: "In Progress", value: stats?.in_progress || 0, color: "#3b82f6" },
    { name: "Completed", value: stats?.completed || 0, color: "#10b981" },
    { name: "Cancelled", value: stats?.cancelled || 0, color: "#ef4444" },
  ];

  const handleQuickStatusUpdate = async (taskId: number, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus as any });
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] text-white items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#928dab] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({
    title,
    action,
    children,
    className = "",
  }: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`
      relative overflow-hidden rounded-2xl
      bg-[#2A2A2A]/50 backdrop-blur-2xl
      border border-white/[0.05]
      shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      p-6
      ${className}
    `}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-medium text-lg tracking-wide">
          {title}
        </h3>
        {action}
      </div>

      {children}
    </div>
  );

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    trend,
    color,
  }: {
    icon: React.ElementType;
    label: string;
    value: number;
    trend?: number;
    color: string;
  }) => (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon size={20} className={`text-${color}-400`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp size={14} className={trend < 0 ? "rotate-180" : ""} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );

  const TaskItem = ({ task }: { task: Task }) => {
    const [showActions, setShowActions] = useState(false);

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "urgent":
          return "border-red-500/30 bg-red-500/5";
        case "high":
          return "border-orange-500/30 bg-orange-500/5";
        case "medium":
          return "border-yellow-500/30 bg-yellow-500/5";
        default:
          return "border-gray-500/30 bg-gray-500/5";
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "completed":
          return <CheckCircle2 size={16} className="text-green-400" />;
        case "in_progress":
          return <Hourglass size={16} className="text-blue-400" />;
        case "cancelled":
          return <X size={16} className="text-red-400" />;
        default:
          return <Circle size={16} className="text-gray-400" />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border transition-all group cursor-pointer ${getPriorityColor(
          task.priority
        )}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() =>
                handleQuickStatusUpdate(
                  task.id,
                  task.status === "completed" ? "todo" : "completed"
                )
              }
              className="mt-1"
            >
              {getStatusIcon(task.status)}
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className={`font-medium ${
                    task.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-white"
                  }`}
                >
                  {task.title}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    task.priority === "urgent"
                      ? "bg-red-500/20 text-red-400"
                      : task.priority === "high"
                      ? "bg-orange-500/20 text-orange-400"
                      : task.priority === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {task.priority}
                </span>
              </div>

              {task.description && (
                <p className="text-sm text-gray-400 mb-2 line-clamp-1">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500">
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                {task.is_overdue && (
                  <span className="text-red-400 font-medium">Overdue</span>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const completionRate =
    stats && stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] text-white overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen relative">
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        {/* Glassmorphic Body Container */}
        <div className="relative z-10 m-6 h-[calc(100vh-48px)] rounded-[32px] bg-[#2A2A2A]/30 backdrop-blur-2xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-y-auto">
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="relative p-8 max-w-[1800px] mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-[#928dab] to-[#6b668c] bg-clip-text text-transparent"
                >
                  Welcome back, {user?.username}!
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400 flex items-center gap-2"
                >
                  <Clock size={16} />
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </motion.p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="w-11 h-11 rounded-xl bg-[#2A2A2A]/50 backdrop-blur-sm border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-11 h-11 rounded-xl bg-[#2A2A2A]/50 backdrop-blur-sm border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all relative"
                >
                  <Bell size={20} />
                  {stats && stats.overdue > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#2A2A2A]" />
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#6b668c]/90 hover:bg-[#6b668c] text-white font-semibold rounded-xl transition-all"
                >
                  <Plus size={18} />
                  <span>Create Task</span>
                </button>
              </div>
            </header>

            {/* Quick Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={Target}
                label="Total Tasks"
                value={stats?.total || 0}
                trend={12}
                color="blue"
              />
              <MetricCard
                icon={Zap}
                label="In Progress"
                value={stats?.in_progress || 0}
                trend={8}
                color="yellow"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Completed"
                value={stats?.completed || 0}
                trend={15}
                color="green"
              />
              <MetricCard
                icon={AlertCircle}
                label="Overdue"
                value={stats?.overdue || 0}
                trend={-5}
                color="red"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Activity Chart */}
              <StatCard
                title={`${
                  selectedPeriod === "week" ? "Weekly" : "Monthly"
                } Activity`}
                action={
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPeriod("week")}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        selectedPeriod === "week"
                          ? "bg-[#6b668c] text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setSelectedPeriod("month")}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        selectedPeriod === "month"
                          ? "bg-[#6b668c] text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      Month
                    </button>
                  </div>
                }
                className="lg:col-span-2"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={selectedPeriod === "week" ? weeklyData : monthlyData}
                  >
                    <defs>
                      <linearGradient
                        id="colorCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorCreated"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6b668c"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6b668c"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis
                      dataKey={selectedPeriod === "week" ? "day" : "week"}
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#2A2A2A",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#6b668c"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCreated)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </StatCard>

              {/* Task Distribution */}
              <StatCard title="Status Distribution">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#2A2A2A",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {statusDistribution.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-400">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </StatCard>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <StatCard title="Completion Rate" className="lg:col-span-1">
                <div className="flex items-center justify-center h-40">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#2A2A2A"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10b981"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray="351.86"
                        strokeDashoffset={
                          351.86 - (351.86 * completionRate) / 100
                        }
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold text-white">
                        {completionRate}%
                      </span>
                      <span className="text-xs text-gray-400">Complete</span>
                    </div>
                  </div>
                </div>
              </StatCard>

              <StatCard title="Priority Breakdown" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#2A2A2A",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </StatCard>
            </div>

            {/* Recent Tasks */}
            <StatCard
              title="Recent Tasks"
              action={
                <button
                  onClick={() => navigate("/tasks")}
                  className="text-xs text-[#928dab] hover:text-white transition-colors"
                >
                  View All
                </button>
              }
            >
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No tasks yet. Create your first task to get started!</p>
                  </div>
                ) : (
                  tasks
                    .slice(0, 6)
                    .map((task) => <TaskItem key={task.id} task={task} />)
                )}
              </div>
            </StatCard>
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadDashboardData();
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        tasks={tasks}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        stats={stats}
        tasks={tasks}
      />
    </div>
  );
}

// Search Modal Component
function SearchModal({
  isOpen,
  onClose,
  tasks,
}: {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks([]);
    }
  }, [searchQuery, tasks]);

  const handleTaskClick = () => {
    navigate("/tasks");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          className="bg-[#2A2A2A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <Search size={20} className="text-gray-400" aria-hidden="true" />
            <input
              type="text"
              id="task-search"
              name="task-search"
              autoFocus
              autoComplete="off"
              aria-label="Search tasks by title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or description..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close search"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="border-t border-white/10 pt-4 max-h-96 overflow-y-auto">
            {searchQuery.trim() === "" ? (
              <div className="text-center py-8 text-gray-500">
                <Search size={48} className="mx-auto mb-3 opacity-30" />
                <p>Start typing to search tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p>No tasks found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={handleTaskClick}
                    className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1 group-hover:text-[#928dab] transition-colors">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${
                          task.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : task.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Notifications Panel Component
function NotificationsPanel({
  isOpen,
  onClose,
  stats,
  tasks,
}: {
  isOpen: boolean;
  onClose: () => void;
  stats: TaskStats | null;
  tasks: Task[];
}) {
  const navigate = useNavigate();

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date || task.status === "completed") return false;
    return new Date(task.due_date) < new Date();
  });

  const upcomingTasks = tasks.filter((task) => {
    if (!task.due_date || task.status === "completed") return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return dueDate >= today && dueDate <= threeDaysFromNow;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-end pt-20 pr-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="bg-[#2A2A2A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[calc(100vh-120px)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-[#928dab]" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-400 uppercase mb-3 flex items-center gap-2">
                <AlertCircle size={16} />
                Overdue Tasks ({overdueTasks.length})
              </h3>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      navigate("/tasks");
                      onClose();
                    }}
                    className="w-full text-left p-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    <p className="text-white font-medium text-sm mb-1">
                      {task.title}
                    </p>
                    <p className="text-xs text-red-400">
                      Due {new Date(task.due_date!).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-yellow-400 uppercase mb-3 flex items-center gap-2">
                <Clock size={16} />
                Due Soon ({upcomingTasks.length})
              </h3>
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      navigate("/tasks");
                      onClose();
                    }}
                    className="w-full text-left p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition-all"
                  >
                    <p className="text-white font-medium text-sm mb-1">
                      {task.title}
                    </p>
                    <p className="text-xs text-yellow-400">
                      Due {new Date(task.due_date!).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {stats && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.in_progress}
                  </p>
                  <p className="text-xs text-gray-400">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.completed}
                  </p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.overdue}
                  </p>
                  <p className="text-xs text-gray-400">Overdue</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {stats.urgent}
                  </p>
                  <p className="text-xs text-gray-400">Urgent</p>
                </div>
              </div>
            </div>
          )}

          {overdueTasks.length === 0 && upcomingTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 size={48} className="mx-auto mb-3 opacity-30" />
              <p>All caught up! No urgent notifications.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Create Task Modal Component
function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<TaskCreateData>({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createTask(formData);
      onSuccess();
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#2A2A2A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Task</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="task-title"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Title{" "}
                <span className="text-red-400" aria-label="required">
                  *
                </span>
              </label>
              <input
                type="text"
                id="task-title"
                name="title"
                autoComplete="off"
                required
                aria-required="true"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6b668c] transition-colors"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label
                htmlFor="task-description"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="task-description"
                name="description"
                autoComplete="off"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6b668c] transition-colors resize-none"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="task-priority"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Priority
                </label>
                <div className="relative">
                  <select
                    id="task-priority"
                    name="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6b668c] focus:border-[#928dab] transition-all appearance-none cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23928dab'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="low" className="bg-[#2A2A2A] text-white">
                      Low
                    </option>
                    <option value="medium" className="bg-[#2A2A2A] text-white">
                      Medium
                    </option>
                    <option value="high" className="bg-[#2A2A2A] text-white">
                      High
                    </option>
                    <option value="urgent" className="bg-[#2A2A2A] text-white">
                      Urgent
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="task-due-date"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  id="task-due-date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#6b668c] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[#6b668c] hover:bg-[#928dab] text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


