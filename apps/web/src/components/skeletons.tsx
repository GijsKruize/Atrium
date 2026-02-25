export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`animate-pulse bg-[var(--muted)] rounded ${className}`} />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="p-3 border border-[var(--border)] rounded-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div>
        <Skeleton className="h-4 w-16 mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FileItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
      <div>
        <Skeleton className="h-4 w-48 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function ClientItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
      <div>
        <Skeleton className="h-4 w-36 mb-1" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function UpdateItemSkeleton() {
  return (
    <div className="border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 border border-[var(--border)] rounded-lg">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-12" />
    </div>
  );
}

export function InvoiceCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}
