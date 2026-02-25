"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import { useConfirm } from "@/components/confirm-modal";
import { useToast } from "@/components/toast";
import { ProjectDetailSkeleton } from "@/components/skeletons";
import { Pagination } from "@/components/pagination";
import {
  Upload,
  Download,
  Trash2,
  Plus,
  FileX,
  MessageSquare,
  Archive,
  ArchiveRestore,
  CheckSquare,
  Square,
  ListTodo,
  EyeOff,
  Pencil,
} from "lucide-react";

interface FileRecord {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  archivedAt?: string | null;
  clients?: { userId: string }[];
  files: FileRecord[];
}

interface ProjectStatus {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
}

interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  completed: boolean;
  order: number;
}

interface NoteRecord {
  id: string;
  content: string;
  author: { id: string; name: string };
  createdAt: string;
}

interface ProjectUpdateRecord {
  id: string;
  content: string;
  imageUrl?: string;
  hasImage: boolean;
  author: { id: string; name: string };
  createdAt: string;
}

interface ClientMember {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function ClientAssignmentSection({
  clients,
  assignedIds,
  onToggle,
  onRemove,
  disabled,
}: {
  clients: ClientMember[];
  assignedIds: Set<string>;
  onToggle: (userId: string) => void;
  onRemove: (userId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = search.toLowerCase();
  const filtered = clients.filter(
    (c) =>
      c.user.name.toLowerCase().includes(query) ||
      c.user.email.toLowerCase().includes(query),
  );

  const assignedClients = clients.filter((c) => assignedIds.has(c.userId));

  return (
    <div>
      <h2 className="text-sm font-medium mb-3">
        Assigned Clients{assignedIds.size > 0 && ` (${assignedIds.size})`}
      </h2>

      {clients.length > 0 ? (
        <div ref={containerRef} className="relative max-w-md">
          <div
            className={`flex flex-wrap gap-1.5 min-h-[42px] px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] ${disabled ? "opacity-60" : "cursor-text"}`}
            onClick={() => {
              if (disabled) return;
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
            {assignedClients.map((c) => (
              <span
                key={c.userId}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--muted)] rounded text-xs font-medium"
              >
                {c.user.name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(c.userId);
                    }}
                    className="ml-0.5 hover:text-red-500"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
            {!disabled && (
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setOpen(true)}
                placeholder={assignedClients.length === 0 ? "Search clients..." : ""}
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
              />
            )}
          </div>

          {open && !disabled && (
            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto border border-[var(--border)] rounded-lg bg-[var(--background)] shadow-lg">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                  No clients found.
                </div>
              ) : (
                filtered.map((c) => {
                  const selected = assignedIds.has(c.userId);
                  return (
                    <button
                      key={c.userId}
                      type="button"
                      onClick={() => {
                        onToggle(c.userId);
                        setSearch("");
                        inputRef.current?.focus();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                    >
                      <span
                        className="flex items-center justify-center w-4 h-4 rounded border border-[var(--border)] text-xs shrink-0"
                        style={{
                          backgroundColor: selected ? "var(--primary)" : "transparent",
                          borderColor: selected ? "var(--primary)" : undefined,
                          color: selected ? "#fff" : "transparent",
                        }}
                      >
                        {selected ? "\u2713" : ""}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.user.name}</div>
                        <div className="text-[var(--muted-foreground)] truncate">
                          {c.user.email}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          No clients yet. Invite clients from the{" "}
          <a
            href="/dashboard/clients"
            className="text-[var(--primary)] hover:underline"
          >
            Clients page
          </a>
          .
        </p>
      )}

      {assignedIds.size > 0 && (
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          {assignedIds.size === 1
            ? "This client will"
            : "These clients will"}{" "}
          see this project in their portal.
        </p>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const confirm = useConfirm();
  const { success, error: showError } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [clients, setClients] = useState<ClientMember[]>([]);
  const [uploading, setUploading] = useState(false);
  const [updates, setUpdates] = useState<ProjectUpdateRecord[]>([]);
  const [updatesPage, setUpdatesPage] = useState(1);
  const [updatesTotalPages, setUpdatesTotalPages] = useState(1);
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [newUpdateImage, setNewUpdateImage] = useState<File | null>(null);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDueDate, setEditingTaskDueDate] = useState("");
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [notesPage, setNotesPage] = useState(1);
  const [notesTotalPages, setNotesTotalPages] = useState(1);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState("");

  const isArchived = !!project?.archivedAt;

  const loadProject = useCallback(() => {
    apiFetch<Project>(`/projects/${id}`)
      .then(setProject)
      .catch((err) => setError(err.message || "Failed to load project"));
  }, [id]);

  const loadUpdates = useCallback(() => {
    apiFetch<PaginatedResponse<ProjectUpdateRecord>>(
      `/updates/project/${id}?page=${updatesPage}&limit=10`,
    )
      .then((res) => {
        setUpdates(res.data);
        setUpdatesTotalPages(res.meta.totalPages);
      })
      .catch(console.error);
  }, [id, updatesPage]);

  const loadTasks = useCallback(() => {
    apiFetch<PaginatedResponse<TaskRecord>>(
      `/tasks/project/${id}?page=${tasksPage}&limit=20`,
    )
      .then((res) => {
        setTasks(res.data);
        setTasksTotalPages(res.meta.totalPages);
      })
      .catch(console.error);
  }, [id, tasksPage]);

  const loadNotes = useCallback(() => {
    apiFetch<PaginatedResponse<NoteRecord>>(
      `/notes/project/${id}?page=${notesPage}&limit=10`,
    )
      .then((res) => {
        setNotes(res.data);
        setNotesTotalPages(res.meta.totalPages);
      })
      .catch(console.error);
  }, [id, notesPage]);

  useEffect(() => {
    loadProject();
    apiFetch<ProjectStatus[]>("/projects/statuses")
      .then(setStatuses)
      .catch(console.error);
    apiFetch<ClientMember[]>("/clients")
      .then((res) => {
        // API now returns paginated, extract data
        const data = Array.isArray(res) ? res : (res as any).data;
        setClients(data.filter((m: any) => m.role === "member"));
      })
      .catch(console.error);
  }, [loadProject]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleStatusChange = async (status: string) => {
    if (isArchived) return;
    await apiFetch(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    loadProject();
  };

  const handleClientToggle = async (userId: string) => {
    if (!project || isArchived) return;
    const currentIds = (project.clients ?? []).map((c) => c.userId);
    const newIds = currentIds.includes(userId)
      ? currentIds.filter((cid) => cid !== userId)
      : [...currentIds, userId];
    await apiFetch(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ clientUserIds: newIds }),
    });
    loadProject();
  };

  const handleRemoveClient = async (userId: string) => {
    if (!project || isArchived) return;
    const newIds = (project.clients ?? [])
      .map((c) => c.userId)
      .filter((cid) => cid !== userId);
    await apiFetch(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ clientUserIds: newIds }),
    });
    loadProject();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/files/upload?projectId=${id}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      loadProject();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/files/${fileId}/download`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostUpdate = async () => {
    if (!newUpdateContent.trim()) return;
    setPostingUpdate(true);
    try {
      const formData = new FormData();
      formData.append("content", newUpdateContent);
      if (newUpdateImage) {
        formData.append("image", newUpdateImage);
      }
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/updates?projectId=${id}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      setNewUpdateContent("");
      setNewUpdateImage(null);
      setShowComposeModal(false);
      loadUpdates();
    } catch (err) {
      console.error(err);
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    const ok = await confirm({
      title: "Delete Update",
      message: "Delete this update? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/updates/${updateId}`, { method: "DELETE" });
      loadUpdates();
      success("Update deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete update");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const ok = await confirm({
      title: "Delete File",
      message: "Delete this file? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/files/${fileId}`, { method: "DELETE" });
      loadProject();
      success("File deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await apiFetch(`/tasks?projectId=${id}`, {
        method: "POST",
        body: JSON.stringify({
          title: newTaskTitle,
          dueDate: newTaskDueDate || undefined,
        }),
      });
      setNewTaskTitle("");
      setNewTaskDueDate("");
      loadTasks();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add task");
    }
  };

  const handleToggleTask = async (task: TaskRecord) => {
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !task.completed }),
      });
      loadTasks();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editingTaskTitle,
          dueDate: editingTaskDueDate || null,
        }),
      });
      setEditingTaskId(null);
      loadTasks();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const ok = await confirm({
      title: "Delete Task",
      message: "Delete this task? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      loadTasks();
      success("Task deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      await apiFetch(`/notes?projectId=${id}`, {
        method: "POST",
        body: JSON.stringify({ content: newNoteContent }),
      });
      setNewNoteContent("");
      loadNotes();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const ok = await confirm({
      title: "Delete Note",
      message: "Delete this note? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/notes/${noteId}`, { method: "DELETE" });
      loadNotes();
      success("Note deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const handleArchive = async () => {
    const ok = await confirm({
      title: "Archive Project",
      message: "Archive this project? It will be hidden from clients and editing will be disabled.",
      confirmLabel: "Archive",
    });
    if (!ok) return;
    try {
      await apiFetch(`/projects/${id}/archive`, { method: "POST" });
      loadProject();
      success("Project archived");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to archive project");
    }
  };

  const handleUnarchive = async () => {
    try {
      await apiFetch(`/projects/${id}/unarchive`, { method: "POST" });
      loadProject();
      success("Project unarchived");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to unarchive project");
    }
  };

  if (!project) return <ProjectDetailSkeleton />;

  const assignedIds = new Set((project.clients ?? []).map((c) => c.userId));

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      {isArchived && (
        <div className="p-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <Archive size={16} />
          This project is archived. Editing is disabled.
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-[var(--muted-foreground)] mt-1">
              {project.description}
            </p>
          )}
        </div>
        {isArchived ? (
          <button
            onClick={handleUnarchive}
            className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            <ArchiveRestore size={16} />
            Unarchive
          </button>
        ) : (
          <button
            onClick={handleArchive}
            className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <Archive size={16} />
            Archive
          </button>
        )}
      </div>

      {/* Status Pipeline */}
      <div>
        <h2 className="text-sm font-medium mb-3">Status</h2>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStatusChange(s.slug)}
              disabled={isArchived}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  project.status === s.slug ? s.color : "var(--muted)",
                color:
                  project.status === s.slug ? "#fff" : "var(--foreground)",
                opacity: isArchived ? 0.6 : 1,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Client Assignment */}
      <ClientAssignmentSection
        clients={clients}
        assignedIds={assignedIds}
        onToggle={handleClientToggle}
        onRemove={handleRemoveClient}
        disabled={isArchived}
      />

      {/* Tasks */}
      <div>
        <h2 className="text-sm font-medium mb-3">
          Tasks{tasks.length > 0 && ` (${tasks.length})`}
        </h2>

        {!isArchived && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a task..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
              }}
              className="flex-1 px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            />
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            />
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        <div className="space-y-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-lg"
            >
              <button
                onClick={() => handleToggleTask(task)}
                disabled={isArchived}
                className="shrink-0 text-[var(--primary)] disabled:opacity-50"
              >
                {task.completed ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>

              {editingTaskId === task.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTaskTitle}
                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateTask(task.id);
                      if (e.key === "Escape") setEditingTaskId(null);
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                  />
                  <input
                    type="date"
                    value={editingTaskDueDate}
                    onChange={(e) => setEditingTaskDueDate(e.target.value)}
                    className="px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                  />
                  <button
                    onClick={() => handleUpdateTask(task.id)}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTaskId(null)}
                    className="text-sm text-[var(--muted-foreground)] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-1 text-sm ${task.completed ? "line-through text-[var(--muted-foreground)]" : ""}`}
                  >
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded-full text-[var(--muted-foreground)]">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {!isArchived && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditingTaskTitle(task.title);
                          setEditingTaskDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
                        }}
                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-6">
              <ListTodo size={32} className="mx-auto text-[var(--muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">
                No tasks yet.
              </p>
            </div>
          )}
        </div>
        <div className="mt-3">
          <Pagination page={tasksPage} totalPages={tasksTotalPages} onPageChange={setTasksPage} />
        </div>
      </div>

      {/* Updates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">
            Updates{updates.length > 0 && ` (${updates.length})`}
          </h2>
          <button
            onClick={() => setShowUpdates(!showUpdates)}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            {showUpdates ? "Hide" : "Show Updates"}
          </button>
        </div>

        {showUpdates && (
          <>
            {!isArchived && (
              <button
                onClick={() => setShowComposeModal(true)}
                className="mb-4 flex items-center gap-2 px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90"
              >
                <Plus size={14} />
                Add Update
              </button>
            )}

            {/* Compose modal */}
            {showComposeModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowComposeModal(false);
                    setNewUpdateContent("");
                    setNewUpdateImage(null);
                  }
                }}
              >
                <div className="bg-[var(--background)] rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Post Update</h3>
                  <textarea
                    value={newUpdateContent}
                    onChange={(e) => setNewUpdateContent(e.target.value)}
                    placeholder="Write a status update..."
                    maxLength={5000}
                    rows={4}
                    autoFocus
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm resize-none outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm cursor-pointer hover:bg-[var(--muted)] transition-colors">
                      Attach Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => setNewUpdateImage(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {newUpdateImage && (
                      <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                        {newUpdateImage.name}
                        <button
                          type="button"
                          onClick={() => setNewUpdateImage(null)}
                          className="hover:text-red-500"
                        >
                          &times;
                        </button>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowComposeModal(false);
                        setNewUpdateContent("");
                        setNewUpdateImage(null);
                      }}
                      className="px-4 py-1.5 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostUpdate}
                      disabled={postingUpdate || !newUpdateContent.trim()}
                      className="px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      {postingUpdate ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Updates feed */}
            <div className="space-y-3">
              {updates.map((update) => {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                return (
                  <div
                    key={update.id}
                    className="border border-[var(--border)] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{update.author.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {formatRelativeTime(update.createdAt)}
                        </span>
                      </div>
                      {!isArchived && (
                        <button
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                    {update.hasImage && (
                      <img
                        src={update.imageUrl || `${API_URL}/api/updates/${update.id}/image`}
                        alt=""
                        className="mt-3 max-w-full max-h-80 rounded-lg border border-[var(--border)]"
                      />
                    )}
                  </div>
                );
              })}
              {updates.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto text-[var(--muted-foreground)] mb-2" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No updates posted yet.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <Pagination page={updatesPage} totalPages={updatesTotalPages} onPageChange={setUpdatesPage} />
            </div>
          </>
        )}
      </div>

      {/* Files */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Files</h2>
          {!isArchived && (
            <label className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm cursor-pointer hover:opacity-90">
              <Upload size={14} />
              {uploading ? "Uploading..." : "Upload File"}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          {project.files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">{file.filename}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatBytes(file.sizeBytes)} &middot; {file.mimeType}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(file.id, file.filename)}
                  className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
                >
                  <Download size={14} />
                  Download
                </button>
                {!isArchived && (
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:underline"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {project.files.length === 0 && (
            <div className="text-center py-8">
              <FileX size={32} className="mx-auto text-[var(--muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">
                No files uploaded yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Internal Notes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <EyeOff size={14} />
            Internal Notes (Team Only)
          </h2>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            {showNotes ? "Hide" : "Show Notes"}
          </button>
        </div>

        {showNotes && (
          <>
            {!isArchived && (
              <div className="mb-4 space-y-2">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write an internal note..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm resize-none outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>
            )}

            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border border-[var(--border)] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{note.author.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatRelativeTime(note.createdAt)}
                      </span>
                    </div>
                    {!isArchived && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-8">
                  <EyeOff size={32} className="mx-auto text-[var(--muted-foreground)] mb-2" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No internal notes yet.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <Pagination page={notesPage} totalPages={notesTotalPages} onPageChange={setNotesPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
