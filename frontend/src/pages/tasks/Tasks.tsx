import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Circle,
  Pause,
  X,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import type { Task, TaskStatus, TaskPriority } from '../../types/task';
import { getTasks, updateTask, deleteTask } from '../../services/tasksService';

type FilterType = 'all' | TaskStatus;
type SortType = 'due_date' | 'priority' | 'created_at' | 'title';

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<SortType>("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isFilterButton = target.closest('[data-dropdown="filter"]');
      const isSortButton = target.closest('[data-dropdown="sort"]');
      const isDropdownContent = target.closest(".dropdown-content");

      if (!isFilterButton && !isSortButton && !isDropdownContent) {
        setShowFilterMenu(false);
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks({});
      setTasks(response.results);
    } catch (error: any) {
      console.error("Failed to load tasks:", error);
      console.error("Error response:", error.response);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "due_date":
        comparison =
          new Date(a.due_date || "").getTime() -
          new Date(b.due_date || "").getTime();
        break;
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case "created_at":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-green-400" />;
      case "in_progress":
        return <Clock size={16} className="text-blue-400" />;
      case "cancelled":
        return <X size={16} className="text-red-400" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return <Zap size={14} />;
      case "high":
        return <AlertCircle size={14} />;
      case "medium":
        return <Target size={14} />;
      case "low":
        return <Circle size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1c2c] via-[#2d2840] to-[#928dab] flex">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Tasks</h1>
              <p className="text-gray-400">Manage and organize your tasks</p>
            </div>
            <button
              onClick={() => navigate("/tasks/new")}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#6b668c] to-[#928dab] hover:from-[#928dab] hover:to-[#6b668c] text-white font-semibold rounded-xl transition-all shadow-lg"
            >
              <Zap size={18} />
              <span>Create Task</span>
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6 shadow-xl">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    id="tasks-search"
                    name="search"
                    autoComplete="off"
                    aria-label="Search tasks"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b668c] transition-all"
                  />
                </div>
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  data-dropdown="filter"
                  onClick={() => {
                    setShowFilterMenu(!showFilterMenu);
                    setShowSortMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:border-[#6b668c] transition-all"
                >
                  <Filter size={20} />
                  <span className="font-medium">Filter</span>
                  <ChevronDown size={16} />
                </button>

                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="dropdown-content absolute top-full right-0 mt-2 w-64 bg-[#2A2A2A]/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-4 z-[100]"
                    >
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">
                          Status
                        </p>
                        <div className="flex flex-col gap-2">
                          {(
                            [
                              "all",
                              "todo",
                              "in_progress",
                              "completed",
                              "cancelled",
                            ] as const
                          ).map((status) => (
                            <button
                              key={status}
                              onClick={() => setFilterStatus(status)}
                              className={`px-3 py-2 rounded-lg text-left text-sm transition-all ${
                                filterStatus === status
                                  ? "bg-[#6b668c] text-white"
                                  : "text-gray-400 hover:bg-white/5"
                              }`}
                            >
                              {status === "all"
                                ? "All Tasks"
                                : status
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4">
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">
                          Priority
                        </p>
                        <div className="flex flex-col gap-2">
                          {(
                            ["all", "urgent", "high", "medium", "low"] as const
                          ).map((priority) => (
                            <button
                              key={priority}
                              onClick={() => setFilterPriority(priority)}
                              className={`px-3 py-2 rounded-lg text-left text-sm transition-all ${
                                filterPriority === priority
                                  ? "bg-[#6b668c] text-white"
                                  : "text-gray-400 hover:bg-white/5"
                              }`}
                            >
                              {priority === "all"
                                ? "All Priorities"
                                : priority.charAt(0).toUpperCase() +
                                  priority.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Button */}
              <div className="relative">
                <button
                  data-dropdown="sort"
                  onClick={() => {
                    setShowSortMenu(!showSortMenu);
                    setShowFilterMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:border-[#6b668c] transition-all"
                >
                  <ArrowUpDown size={20} />
                  <span className="font-medium">Sort</span>
                  <ChevronDown size={16} />
                </button>

                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="dropdown-content absolute top-full right-0 mt-2 w-64 bg-[#2A2A2A]/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-4 z-[100]"
                    >
                      <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">
                        Sort By
                      </p>
                      {(
                        [
                          { value: "due_date", label: "Due Date" },
                          { value: "priority", label: "Priority" },
                          { value: "created_at", label: "Created Date" },
                          { value: "title", label: "Title" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all mb-2 ${
                            sortBy === option.value
                              ? "bg-[#6b668c] text-white"
                              : "text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}

                      <div className="border-t border-white/10 pt-4 mt-2">
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">
                          Order
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSortOrder("asc")}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                              sortOrder === "asc"
                                ? "bg-[#6b668c] text-white"
                                : "text-gray-400 hover:bg-white/5"
                            }`}
                          >
                            Ascending
                          </button>
                          <button
                            onClick={() => setSortOrder("desc")}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                              sortOrder === "desc"
                                ? "bg-[#6b668c] text-white"
                                : "text-gray-400 hover:bg-white/5"
                            }`}
                          >
                            Descending
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterStatus !== "all" ||
              filterPriority !== "all" ||
              searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <span className="text-sm text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-[#6b668c]/20 border border-[#6b668c]/30 rounded-full text-sm text-gray-300">
                    Search: "{searchQuery}"
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="px-3 py-1 bg-[#6b668c]/20 border border-[#6b668c]/30 rounded-full text-sm text-gray-300">
                    Status: {filterStatus.replace("_", " ")}
                  </span>
                )}
                {filterPriority !== "all" && (
                  <span className="px-3 py-1 bg-[#6b668c]/20 border border-[#6b668c]/30 rounded-full text-sm text-gray-300">
                    Priority: {filterPriority}
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterPriority("all");
                    setSearchQuery("");
                  }}
                  className="text-sm text-gray-400 hover:text-white underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Tasks Count */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Showing {sortedTasks.length} of {tasks.length} tasks
            </p>
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-[#6b668c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No tasks found
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ||
                filterStatus !== "all" ||
                filterPriority !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first task"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#6b668c]/50 transition-all cursor-pointer group shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="mt-1">{getStatusIcon(task.status)}</div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#928dab] transition-colors">
                          {task.title}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        {task.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span
                              className={task.is_overdue ? "text-red-400" : ""}
                            >
                              {new Date(task.due_date).toLocaleDateString()}
                              {task.is_overdue && " (Overdue)"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>
                            Created{" "}
                            {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus: TaskStatus =
                            task.status === "todo"
                              ? "in_progress"
                              : task.status === "in_progress"
                              ? "completed"
                              : "todo";
                          handleStatusChange(task.id, nextStatus);
                        }}
                        className="p-2 bg-white/5 hover:bg-[#6b668c] rounded-lg transition-all"
                        title="Change status"
                      >
                        <Pause size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="p-2 bg-white/5 hover:bg-red-500 rounded-lg transition-all"
                        title="Delete task"
                      >
                        <Trash2 size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTask(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#2A2A2A] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(selectedTask.status)}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedTask.title}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        selectedTask.priority
                      )}`}
                    >
                      {getPriorityIcon(selectedTask.priority)}
                      {selectedTask.priority} priority
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                {selectedTask.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                      Description
                    </h3>
                    <p className="text-white leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                      Status
                    </h3>
                    <div className="relative">
                      <select
                        value={selectedTask.status}
                        onChange={(e) =>
                          handleStatusChange(
                            selectedTask.id,
                            e.target.value as TaskStatus
                          )
                        }
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6b668c] focus:border-[#928dab] transition-all appearance-none cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23928dab'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.75rem center",
                          backgroundSize: "1.25rem",
                        }}
                      >
                        <option
                          value="todo"
                          className="bg-[#2A2A2A] text-white"
                        >
                          To Do
                        </option>
                        <option
                          value="in_progress"
                          className="bg-[#2A2A2A] text-white"
                        >
                          In Progress
                        </option>
                        <option
                          value="completed"
                          className="bg-[#2A2A2A] text-white"
                        >
                          Completed
                        </option>
                        <option
                          value="cancelled"
                          className="bg-[#2A2A2A] text-white"
                        >
                          Cancelled
                        </option>
                      </select>
                    </div>
                  </div>

                  {selectedTask.due_date && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                        Due Date
                      </h3>
                      <div
                        className={`px-4 py-2 bg-white/5 border border-white/10 rounded-lg ${
                          selectedTask.is_overdue
                            ? "text-red-400"
                            : "text-white"
                        }`}
                      >
                        {new Date(selectedTask.due_date).toLocaleDateString()}
                        {selectedTask.is_overdue && " (Overdue)"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-1 uppercase">
                      Created
                    </h3>
                    <p className="text-white">
                      {new Date(selectedTask.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-1 uppercase">
                      Updated
                    </h3>
                    <p className="text-white">
                      {new Date(selectedTask.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-white/10">
                  <button
                    onClick={() => {
                      handleDeleteTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 rounded-xl text-red-400 hover:text-white transition-all font-medium"
                  >
                    <Trash2 size={18} />
                    Delete Task
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
