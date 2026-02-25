"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<PaginatedResponse<Project>>("/projects?limit=100")
      .then((res) => setProjects(res.data))
      .catch(console.error);
  }, []);

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch("/invoices", {
        method: "POST",
        body: JSON.stringify({
          projectId: projectId || undefined,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          lineItems: lineItems.filter((li) => li.description.trim()),
        }),
      });
      router.push("/dashboard/invoices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <Link
          href="/dashboard/invoices"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selector */}
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">
            Project (optional)
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
          />
        </div>

        {/* Line Items */}
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-2 block">
            Line Items
          </label>
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 border border-[var(--border)] rounded-lg"
              >
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, "description", e.target.value)}
                  placeholder="Description"
                  className="flex-1 px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 0)}
                  placeholder="Qty"
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
                      updateLineItem(
                        index,
                        "unitPrice",
                        Math.round(parseFloat(e.target.value || "0") * 100),
                      )
                    }
                    placeholder="0.00"
                    step="0.01"
                    min={0}
                    className="w-28 pl-7 pr-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                  />
                </div>
                <span className="text-sm font-medium w-24 text-right">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
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
            onClick={addLineItem}
            className="mt-2 flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
          >
            <Plus size={14} />
            Add Line Item
          </button>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="text-right">
            <span className="text-sm text-[var(--muted-foreground)]">Total</span>
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes..."
            className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || lineItems.every((li) => !li.description.trim())}
          className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </div>
  );
}
