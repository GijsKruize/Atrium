"use client";

import { useEffect } from "react";

export default function BillingPage() {
  useEffect(() => {
    window.location.replace("/dashboard/settings/account?tab=billing");
  }, []);
  return <div>Redirecting...</div>;
}
