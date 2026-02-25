"use client";

import { ConfirmProvider } from "@/components/confirm-modal";
import { ToastProvider } from "@/components/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfirmProvider>
  );
}
