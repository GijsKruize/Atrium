"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import { ProjectDetailSkeleton } from "@/components/skeletons";
import { Pagination } from "@/components/pagination";
import { Download, FileX, MessageSquare, CheckSquare, Square, ListTodo } from "lucide-react";
import { PortalInvoicesSection } from "./components/portal-invoices-section";

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
  files: FileRecord[];
}

interface ProjectUpdateRecord {
  id: string;
  content: string;
  imageUrl?: string;
  hasImage: boolean;
  author: { id: string; name: string };
  createdAt: string;
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

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function PortalProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdateRecord[]>([]);
  const [updatesPage, setUpdatesPage] = useState(1);
  const [updatesTotalPages, setUpdatesTotalPages] = useState(1);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);
  const [error, setError] = useState("");

  const loadProject = useCallback(() => {
    apiFetch<Project>(`/projects/mine/${id}`)
      .then(setProject)
      .catch((err) => setError(err.message || "Failed to load project"));
  }, [id]);

  const loadUpdates = useCallback(() => {
    apiFetch<PaginatedResponse<ProjectUpdateRecord>>(
      `/updates/mine/${id}?page=${updatesPage}&limit=10`,
    )
      .then((res) => {
        setUpdates(res.data);
        setUpdatesTotalPages(res.meta.totalPages);
      })
      .catch(console.error);
  }, [id, updatesPage]);

  const loadTasks = useCallback(() => {
    apiFetch<PaginatedResponse<TaskRecord>>(
      `/tasks/mine/${id}?page=${tasksPage}&limit=20`,
    )
      .then((res) => {
        setTasks(res.data);
        setTasksTotalPages(res.meta.totalPages);
      })
      .catch(console.error);
  }, [id, tasksPage]);

  useEffect(() => {
    loadProject();
    apiFetch<ProjectStatus[]>("/projects/statuses")
      .then(setStatuses)
      .catch(console.error);
  }, [loadProject]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  if (!project) return <ProjectDetailSkeleton />;

  const currentIndex = statuses.findIndex((s) => s.slug === project.status);

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-[var(--muted-foreground)] mt-1">
            {project.description}
          </p>
        )}
      </div>

      {/* Status Pipeline */}
      <div>
        <h2 className="text-sm font-medium mb-3">Progress</h2>
        <div className="flex gap-1">
          {statuses.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 text-center py-2 text-xs font-medium rounded"
              style={{
                backgroundColor:
                  i <= currentIndex ? s.color : "var(--muted)",
                color: i <= currentIndex ? "#fff" : "var(--muted-foreground)",
              }}
            >
              {s.name}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <h2 className="text-sm font-medium mb-3">Tasks</h2>
        <div className="space-y-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-lg"
            >
              <span className="shrink-0 text-[var(--primary)]">
                {task.completed ? <CheckSquare size={18} /> : <Square size={18} />}
              </span>
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
        <h2 className="text-sm font-medium mb-3">Updates</h2>
        <div className="space-y-3">
          {updates.map((update) => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            return (
              <div
                key={update.id}
                className="border border-[var(--border)] rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{update.author.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatRelativeTime(update.createdAt)}
                  </span>
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
                No updates shared yet.
              </p>
            </div>
          )}
        </div>
        <div className="mt-3">
          <Pagination page={updatesPage} totalPages={updatesTotalPages} onPageChange={setUpdatesPage} />
        </div>
      </div>

      {/* Files */}
      <div>
        <h2 className="text-sm font-medium mb-3">Files</h2>
        <div className="space-y-2">
          {project.files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg"
            >
              <div>
                <p className="text-sm font-medium">{file.filename}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatBytes(file.sizeBytes)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(file.id, file.filename)}
                className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          ))}
          {project.files.length === 0 && (
            <div className="text-center py-8">
              <FileX size={32} className="mx-auto text-[var(--muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">
                No files shared yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invoices */}
      <PortalInvoicesSection projectId={id} />
    </div>
  );
}
