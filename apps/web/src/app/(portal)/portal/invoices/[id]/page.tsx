"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { ProjectDetailSkeleton } from "@/components/skeletons";
import { ArrowLeft } from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  dueDate?: string | null;
  notes?: string | null;
  lineItems: LineItem[];
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#e5e7eb", text: "#374151" },
  sent: { bg: "#dbeafe", text: "#1d4ed8" },
  paid: { bg: "#dcfce7", text: "#15803d" },
  overdue: { bg: "#fee2e2", text: "#b91c1c" },
};

export default function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");

  const loadInvoice = useCallback(() => {
    apiFetch<Invoice>(`/invoices/mine/${id}`)
      .then(setInvoice)
      .catch((err) => setError(err.message || "Failed to load invoice"));
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  if (error && !invoice) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }
  if (!invoice) return <ProjectDetailSkeleton />;

  const colors = statusColors[invoice.status] || statusColors.draft;

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href="/portal/invoices"
        className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={14} />
        Back to Invoices
      </Link>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {invoice.status}
        </span>
      </div>

      {invoice.dueDate && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Due: {new Date(invoice.dueDate).toLocaleDateString()}
        </p>
      )}

      {/* Line Items */}
      <div>
        <h2 className="text-sm font-medium mb-3">Line Items</h2>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="text-left px-4 py-2 font-medium">Description</th>
                <th className="text-right px-4 py-2 font-medium">Qty</th>
                <th className="text-right px-4 py-2 font-medium">Unit Price</th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2">{li.description}</td>
                  <td className="px-4 py-2 text-right">{li.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(li.unitPrice)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(li.quantity * li.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border)] bg-[var(--muted)]">
                <td colSpan={3} className="px-4 py-2 text-right font-medium">
                  Total
                </td>
                <td className="px-4 py-2 text-right font-bold">
                  {formatCurrency(invoice.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {invoice.notes && (
        <div>
          <h2 className="text-sm font-medium mb-1">Notes</h2>
          <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
}
