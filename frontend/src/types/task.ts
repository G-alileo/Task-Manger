export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  is_overdue: boolean;
  is_completed: boolean;
  user: {
    id: number;
    email: string;
    username: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TaskCreateData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  high_priority: number;
  urgent: number;
}
