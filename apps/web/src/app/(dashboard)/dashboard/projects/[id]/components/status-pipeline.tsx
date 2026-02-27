"use client";

interface ProjectStatus {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
}

export function StatusPipeline({
  statuses,
  currentStatus,
  onStatusChange,
  disabled,
}: {
  statuses: ProjectStatus[];
  currentStatus: string;
  onStatusChange: (slug: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <h2 className="text-sm font-medium mb-3">Status</h2>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => onStatusChange(s.slug)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                currentStatus === s.slug ? s.color : "var(--muted)",
              color:
                currentStatus === s.slug ? "#fff" : "var(--foreground)",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
