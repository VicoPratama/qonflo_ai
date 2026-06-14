import axios from "axios";
import { Task, AuditLog, TaskStatus } from "./types";

const API_URL = "http://localhost:3001/api";

export const getTasks = async (): Promise<Task[]> => {
  const res = await axios.get(`${API_URL}/tasks`);
  return res.data;
};

export const createTask = async (title: string, actor: string): Promise<Task> => {
  const res = await axios.post(`${API_URL}/tasks`, { title, actor });
  return res.data;
};

export const updateTaskStatus = async (
  id: string,
  status: TaskStatus,
  actor: string
): Promise<Task> => {
  const res = await axios.put(`${API_URL}/tasks/${id}/status`, { status, actor });
  return res.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/tasks/${id}`);
};

export const getTaskAuditLogs = async (id: string): Promise<AuditLog[]> => {
  const res = await axios.get(`${API_URL}/tasks/${id}/audit-logs`);
  return res.data;
};
