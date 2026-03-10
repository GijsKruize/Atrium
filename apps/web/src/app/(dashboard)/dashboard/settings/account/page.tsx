"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/toast";
import { BillingSection } from "../billing/billing-section";

const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

type Tab = "profile" | "billing";

export default function AccountSettingsPage() {
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const initialTab = searchParams.get("tab") === "billing" && billingEnabled ? "billing" : "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    apiFetch<{ user: { name: string } }>("/auth/get-session")
      .then((session) => {
        setName(session.user.name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sync tab with URL param changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing" && billingEnabled) {
      setActiveTab("billing");
    }
  }, [searchParams]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    const url = tab === "billing" ? "?tab=billing" : window.location.pathname;
    window.history.replaceState({}, "", url);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/auth/update-user", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      success("Profile updated");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    }
  };

  if (loading) return <div>Loading...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    ...(billingEnabled ? [{ key: "billing" as Tab, label: "Billing" }] : []),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          {/* Profile Section */}
          <div className="max-w-md">
            <h2 className="text-sm font-medium mb-3">Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium"
              >
                Save
              </button>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="max-w-md">
            <h2 className="text-sm font-medium mb-3">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "billing" && billingEnabled && <BillingSection />}
    </div>
  );
}
