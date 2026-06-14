import { Task, AuditLog } from "./types";

// In-memory data store
export const store = {
  tasks: [] as Task[],
  auditLogs: [] as AuditLog[],
};
