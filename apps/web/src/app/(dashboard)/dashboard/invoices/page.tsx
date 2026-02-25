"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Pagination } from "@/components/pagination";
import { InvoiceCardSkeleton } from "@/components/skeletons";
import { Plus, Receipt, FileX } from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: string;
  dueDate?: string | null;
  project?: { id: string; name: string } | null;
  lineItems: LineItem[];
  createdAt: string;
}

interface InvoiceStats {
  outstandingAmount: number;
  totalInvoices: number;
  paidAmount: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface Project {
  id: string;
  name: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#e5e7eb", text: "#374151" },
  sent: { bg: "#dbeafe", text: "#1d4ed8" },
  paid: { bg: "#dcfce7", text: "#15803d" },
  overdue: { bg: "#fee2e2", text: "#b91c1c" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    apiFetch<PaginatedResponse<Project>>("/projects?limit=100")
      .then((res) => setProjects(res.data))
      .catch(console.error);
    apiFetch<InvoiceStats>("/invoices/stats")
      .then(setStats)
      .catch(console.error);
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (projectFilter) params.set("projectId", projectFilter);
      const res = await apiFetch<PaginatedResponse<InvoiceListItem>>(
        `/invoices?${params.toString()}`,
      );
      setInvoices(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, projectFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, projectFilter]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} />
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="p-4 border border-[var(--border)] rounded-lg">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Receipt size={16} />
            Outstanding
          </div>
          <p className="text-3xl font-bold mt-1">
            {formatCurrency(stats.outstandingAmount)}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="space-y-2">
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
        </div>
      ) : invoices.length > 0 ? (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const colors = statusColors[inv.status] || statusColors.draft;
            return (
              <Link
                key={inv.id}
                href={`/dashboard/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                  {inv.project && (
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {inv.project.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {formatCurrency(inv.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0))}
                  </span>
                  {inv.dueDate && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Due {new Date(inv.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {inv.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileX size={32} className="mx-auto text-[var(--muted-foreground)] mb-2" />
          <p className="text-sm text-[var(--muted-foreground)]">
            No invoices found.
          </p>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
