"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [options, handleClose]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose(false);
          }}
        >
          <div className="bg-[var(--background)] rounded-xl shadow-lg w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">{options.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {options.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-1.5 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClose(true)}
                className={
                  options.variant === "danger"
                    ? "px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    : "px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90 transition-colors"
                }
              >
                {options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
