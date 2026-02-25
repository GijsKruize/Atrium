"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useConfirm } from "@/components/confirm-modal";
import { useToast } from "@/components/toast";
import { ProjectDetailSkeleton } from "@/components/skeletons";
import { Trash2, Plus, ArrowLeft } from "lucide-react";

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
  project?: { id: string; name: string } | null;
  lineItems: LineItem[];
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#e5e7eb", text: "#374151" },
  sent: { bg: "#dbeafe", text: "#1d4ed8" },
  paid: { bg: "#dcfce7", text: "#15803d" },
  overdue: { bg: "#fee2e2", text: "#b91c1c" },
};

interface EditableLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const { success, error: showError } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditableLineItem[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadInvoice = useCallback(() => {
    apiFetch<Invoice>(`/invoices/${id}`)
      .then((inv) => {
        setInvoice(inv);
        setEditItems(
          inv.lineItems.map((li) => ({
            id: li.id,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        );
        setEditNotes(inv.notes || "");
        setEditDueDate(inv.dueDate ? inv.dueDate.split("T")[0] : "");
      })
      .catch((err) => setError(err.message || "Failed to load invoice"));
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiFetch(`/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      loadInvoice();
      success(`Invoice marked as ${newStatus}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          dueDate: editDueDate || null,
          notes: editNotes,
          lineItems: editItems.filter((li) => li.description.trim()),
        }),
      });
      setEditing(false);
      loadInvoice();
      success("Invoice updated");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete Invoice",
      message: "Delete this invoice? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/invoices/${id}`, { method: "DELETE" });
      success("Invoice deleted");
      router.push("/dashboard/invoices");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete invoice");
    }
  };

  const updateEditItem = (index: number, field: keyof EditableLineItem, value: string | number) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addEditItem = () => {
    setEditItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 } as EditableLineItem]);
  };

  const removeEditItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (error && !invoice) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }
  if (!invoice) return <ProjectDetailSkeleton />;

  const colors = statusColors[invoice.status] || statusColors.draft;
  const isDraft = invoice.status === "draft";

  const editTotal = editItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href="/dashboard/invoices"
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
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          {invoice.project && (
            <p className="text-[var(--muted-foreground)] mt-1">
              {invoice.project.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {invoice.status}
          </span>
          {isDraft && (
            <button
              onClick={() => handleStatusChange("sent")}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:opacity-90"
            >
              Mark as Sent
            </button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <button
              onClick={() => handleStatusChange("paid")}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:opacity-90"
            >
              Mark as Paid
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
            title="Delete invoice"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Due Date */}
      {!editing && invoice.dueDate && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Due: {new Date(invoice.dueDate).toLocaleDateString()}
        </p>
      )}

      {/* Line Items */}
      {editing && isDraft ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Line Items</h2>
          </div>

          <div>
            <label className="text-sm text-[var(--muted-foreground)]">Due Date</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            />
          </div>

          <div className="space-y-2">
            {editItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 border border-[var(--border)] rounded-lg"
              >
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateEditItem(index, "description", e.target.value)}
                  placeholder="Description"
                  className="flex-1 px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateEditItem(index, "quantity", parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-20 px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">
                    $
                  </span>
                  <input
                    type="number"
                    value={item.unitPrice / 100 || ""}
                    onChange={(e) =>
                      updateEditItem(
                        index,
                        "unitPrice",
                        Math.round(parseFloat(e.target.value || "0") * 100),
                      )
                    }
                    step="0.01"
                    min={0}
                    className="w-28 pl-7 pr-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                  />
                </div>
                <span className="text-sm font-medium w-24 text-right">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
                {editItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEditItem(index)}
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addEditItem}
            className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
          >
            <Plus size={14} />
            Add Line Item
          </button>

          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-sm text-[var(--muted-foreground)]">Total</span>
              <p className="text-2xl font-bold">{formatCurrency(editTotal)}</p>
            </div>
          </div>

          <div>
            <label className="text-sm text-[var(--muted-foreground)]">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                if (invoice) {
                  setEditItems(
                    invoice.lineItems.map((li) => ({
                      id: li.id,
                      description: li.description,
                      quantity: li.quantity,
                      unitPrice: li.unitPrice,
                    })),
                  );
                  setEditNotes(invoice.notes || "");
                  setEditDueDate(invoice.dueDate ? invoice.dueDate.split("T")[0] : "");
                }
              }}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Line Items</h2>
            {isDraft && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Edit
              </button>
            )}
          </div>
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

          {invoice.notes && (
            <div className="mt-4">
              <h2 className="text-sm font-medium mb-1">Notes</h2>
              <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
