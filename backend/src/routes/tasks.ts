import { Router } from "express";
import { store } from "../store";
import { Task, TaskStatus, AuditLog } from "../types";
import crypto from "crypto";

const router = Router();

// Helper to validate status transition
const isValidTransition = (current: TaskStatus, next: TaskStatus): boolean => {
  const transitions: Record<TaskStatus, TaskStatus[]> = {
    to_do: ["pending"],
    pending: ["in_progress"],
    in_progress: ["done"],
    done: [],
  };
  return transitions[current].includes(next);
};

// GET /tasks
router.get("/", (req, res) => {
  res.json(store.tasks);
});

// POST /tasks
router.post("/", (req, res) => {
  const { title, actor } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!actor) {
    return res.status(400).json({ error: "Actor is required" });
  }

  const newTask: Task = {
    id: crypto.randomUUID(),
    title,
    status: "to_do",
    createdAt: new Date().toISOString(),
  };

  store.tasks.push(newTask);

  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    taskId: newTask.id,
    actor,
    fromStatus: null,
    toStatus: "to_do",
    timestamp: new Date().toISOString(),
  };

  store.auditLogs.push(auditLog);

  res.status(201).json(newTask);
});

// PUT /tasks/:id/status
router.put("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, actor } = req.body;

  if (!status || !actor) {
    return res.status(400).json({ error: "Status and actor are required" });
  }

  const task = store.tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Idempotent Update
  if (task.status === status) {
    return res.json(task);
  }

  if (!isValidTransition(task.status, status as TaskStatus)) {
    return res.status(400).json({
      error: `Invalid status transition from ${task.status} to ${status}`,
    });
  }

  const oldStatus = task.status;
  task.status = status as TaskStatus;

  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    taskId: task.id,
    actor,
    fromStatus: oldStatus,
    toStatus: task.status,
    timestamp: new Date().toISOString(),
  };

  store.auditLogs.push(auditLog);

  res.json(task);
});

// DELETE /tasks/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const taskIndex = store.tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Optional: delete logs or keep them? We'll keep them as audit logs usually persist.
  store.tasks.splice(taskIndex, 1);

  res.status(204).send();
});

// GET /tasks/:id/audit-logs
router.get("/:id/audit-logs", (req, res) => {
  const { id } = req.params;
  const logs = store.auditLogs
    .filter((log) => log.taskId === id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // descending, or ascending as per requirements

  // Requirement: "Audit log ditampilkan urut secara kronologi" (chronological order)
  // Let's sort ascending (oldest first).
  logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json(logs);
});

export default router;
