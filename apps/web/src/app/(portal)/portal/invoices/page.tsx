"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Pagination } from "@/components/pagination";
import { InvoiceCardSkeleton } from "@/components/skeletons";
import { FileX } from "lucide-react";

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
  lineItems: LineItem[];
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#e5e7eb", text: "#374151" },
  sent: { bg: "#dbeafe", text: "#1d4ed8" },
  paid: { bg: "#dcfce7", text: "#15803d" },
  overdue: { bg: "#fee2e2", text: "#b91c1c" },
};

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResponse<InvoiceListItem>>(
        `/invoices/mine?page=${page}&limit=20`,
      );
      setInvoices(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Invoices</h1>

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
                href={`/portal/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <span className="text-sm font-medium">{inv.invoiceNumber}</span>
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
            No invoices yet.
          </p>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
