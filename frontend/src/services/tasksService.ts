import apiClient from "./apiClient";
import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
  TaskStats,
} from "../types/task";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface SingleResponse<T> {
  status: string;
  message?: string;
  data: T;
}

interface GetTasksParams {
  page?: number;
  page_size?: number;
  status?: string;
  priority?: string;
  search?: string;
  ordering?: string;
  overdue?: boolean;
}

/**
 * Get list of tasks with optional filtering
 */
export const getTasks = async (
  params?: GetTasksParams
): Promise<PaginatedResponse<Task>> => {
  const response = await apiClient.get<PaginatedResponse<Task>>("/tasks/", {
    params,
  });
  return response.data;
};

/**
 * Get a single task by ID
 */
export const getTask = async (id: number): Promise<SingleResponse<Task>> => {
  const response = await apiClient.get<SingleResponse<Task>>(`/tasks/${id}/`);
  return response.data;
};

/**
 * Create a new task
 */
export const createTask = async (
  data: TaskCreateData
): Promise<SingleResponse<Task>> => {
  const response = await apiClient.post<SingleResponse<Task>>("/tasks/", data);
  return response.data;
};

/**
 * Update an existing task
 */
export const updateTask = async (
  id: number,
  data: TaskUpdateData
): Promise<SingleResponse<Task>> => {
  const response = await apiClient.patch<SingleResponse<Task>>(
    `/tasks/${id}/`,
    data
  );
  return response.data;
};

/**
 * Delete a task
 */
export const deleteTask = async (id: number): Promise<void> => {
  await apiClient.delete(`/tasks/${id}/`);
};

/**
 * Get task statistics
 */
export const getTaskStats = async (): Promise<SingleResponse<TaskStats>> => {
  const response = await apiClient.get<SingleResponse<TaskStats>>(
    "/tasks/stats/"
  );
  return response.data;
};
