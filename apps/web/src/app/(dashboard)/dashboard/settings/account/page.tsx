"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/toast";

export default function AccountSettingsPage() {
  const { success, error: showError } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Account Settings</h1>

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
  );
}
