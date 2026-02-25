"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm text-[var(--muted-foreground)]">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
