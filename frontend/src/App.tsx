import React, { useState, useEffect } from "react";
import type { Task, TaskStatus, AuditLog } from "./types";
import { getTasks, createTask, updateTaskStatus, deleteTask, getTaskAuditLogs } from "./api";
import moment from "moment";

const predefinedActors = ["Alice", "Bob", "Charlie", "System"];

const isValidTransition = (current: TaskStatus, next: TaskStatus): boolean => {
  const transitions: Record<TaskStatus, TaskStatus[]> = {
    to_do: ["pending"],
    pending: ["in_progress"],
    in_progress: ["done"],
    done: [],
  };
  return transitions[current].includes(next);
};

const formatStatus = (status: TaskStatus) => {
  return status.replace("_", " ").toUpperCase();
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [globalActor, setGlobalActor] = useState(predefinedActors[0]);
  const [selectedTaskIdForLogs, setSelectedTaskIdForLogs] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createTask(newTaskTitle, globalActor);
      setNewTaskTitle("");
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create task");
    }
  };

  const handleStatusChange = async (taskId: string, currentStatus: TaskStatus, newStatus: TaskStatus) => {
    if (currentStatus === newStatus) return; // Idempotent check
    try {
      await updateTaskStatus(taskId, newStatus, globalActor);
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId);
      fetchTasks();
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
    }
  };

  const handleViewLogs = async (taskId: string) => {
    try {
      const logs = await getTaskAuditLogs(taskId);
      setAuditLogs(logs);
      setSelectedTaskIdForLogs(taskId);
    } catch (err: any) {
      alert("Failed to fetch logs");
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Mini Task Manager</h1>
      </header>

      {error && <div className="error-message" style={{ marginBottom: "1rem", textAlign: "center" }}>{error}</div>}

      <div style={{ marginBottom: "1rem", textAlign: "right" }}>
        <label style={{ marginRight: "0.5rem" }}>Acting as:</label>
        <select
          className="select-field"
          value={globalActor}
          onChange={(e) => setGlobalActor(e.target.value)}
        >
          {predefinedActors.map(actor => (
            <option key={actor} value={actor}>{actor}</option>
          ))}
        </select>
      </div>

      <form className="add-task-form" onSubmit={handleCreateTask}>
        <input
          type="text"
          className="input-field"
          placeholder="New Task Title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button type="submit" className="btn">Add Task</button>
      </form>

      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            <div className="task-header">
              <h3 className="task-title">{task.title}</h3>
              <span className={`task-status status-${task.status}`}>
                {formatStatus(task.status)}
              </span>
            </div>
            
            <div className="task-actions">
              <div className="action-group">
                <label>Change Status:</label>
                <select
                  className="select-field"
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, task.status, e.target.value as TaskStatus)}
                >
                  <option value="to_do" disabled={!isValidTransition(task.status, "to_do") && task.status !== "to_do"}>TO DO</option>
                  <option value="pending" disabled={!isValidTransition(task.status, "pending") && task.status !== "pending"}>PENDING</option>
                  <option value="in_progress" disabled={!isValidTransition(task.status, "in_progress") && task.status !== "in_progress"}>IN PROGRESS</option>
                  <option value="done" disabled={!isValidTransition(task.status, "done") && task.status !== "done"}>DONE</option>
                </select>
              </div>

              <div style={{ flex: 1 }}></div>

              <button className="btn btn-secondary" onClick={() => handleViewLogs(task.id)}>
                View Logs
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p style={{ textAlign: "center", color: "#7f8c8d" }}>No tasks found. Create one!</p>}
      </div>

      {/* Audit Log Modal */}
      {selectedTaskIdForLogs && (
        <div className="modal-overlay" onClick={() => setSelectedTaskIdForLogs(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Audit Logs</h2>
              <button className="close-btn" onClick={() => setSelectedTaskIdForLogs(null)}>&times;</button>
            </div>
            
            <div className="audit-log-list">
              {auditLogs.length === 0 && <p>No logs found.</p>}
              {auditLogs.map(log => (
                <div key={log.id} className="audit-log-item">
                  <div className="audit-log-time">{moment(log.timestamp).format("YYYY-MM-DD HH:mm:ss")}</div>
                  <div>
                    User <strong>{log.actor}</strong> changed status from <strong>{log.fromStatus ? formatStatus(log.fromStatus) : "None"}</strong> to <strong>{formatStatus(log.toStatus)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
