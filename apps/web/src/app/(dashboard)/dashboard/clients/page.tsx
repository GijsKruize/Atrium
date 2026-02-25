"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/confirm-modal";
import { useToast } from "@/components/toast";
import { Pagination } from "@/components/pagination";
import { ClientItemSkeleton } from "@/components/skeletons";
import { UserPlus, Copy, Check, Trash2 } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  inviteLink: string;
}

interface ClientMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function ClientsPage() {
  const confirm = useConfirm();
  const { success, error: showError } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<ClientMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get current user to know their role
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState("");

  useEffect(() => {
    apiFetch<{ user: { id: string } }>("/auth/get-session")
      .then((session) => setCurrentUserId(session.user.id))
      .catch(console.error);
    apiFetch<{ role: string }>("/auth/organization/get-active-member")
      .then((member) => setCurrentRole(member.role))
      .catch(console.error);
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResponse<ClientMember>>(
        `/clients?page=${page}&limit=20`,
      );
      setMembers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadInvitations = useCallback(() => {
    apiFetch<Invitation[]>("/clients/invitations")
      .then(setInvitations)
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, [loadMembers, loadInvitations]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInviteLink("");
    try {
      await apiFetch("/auth/organization/invite-member", {
        method: "POST",
        body: JSON.stringify({ email, role: "member" }),
      });
      const submittedEmail = email;
      setEmail("");
      loadInvitations();
      success("Invitation sent");

      const updated = await apiFetch<Invitation[]>("/clients/invitations");
      setInvitations(updated);
      const newest = updated.find(
        (inv) => inv.email === submittedEmail.toLowerCase() || inv.email === submittedEmail,
      );
      if (newest) {
        setInviteLink(newest.inviteLink);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(link);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const ok = await confirm({
      title: "Remove Member",
      message: `Remove ${memberName} from this organization? They will lose access to all projects.`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/clients/${memberId}`, { method: "DELETE" });
      success(`${memberName} removed`);
      loadMembers();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await apiFetch(`/clients/${memberId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      success("Role updated");
      loadMembers();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to change role");
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-[var(--muted)] text-[var(--foreground)]";
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Members</h1>

      {/* Invite Form */}
      <div className="max-w-lg">
        <h2 className="text-sm font-medium mb-3">Invite a Client</h2>
        <form onSubmit={handleInvite} className="space-y-3">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
              className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium whitespace-nowrap"
            >
              <UserPlus size={16} />
              Invite
            </button>
          </div>
        </form>

        {inviteLink && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium mb-2">
              Invitation created! Share this link with your client:
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 px-2 py-1 text-sm bg-white border border-green-300 rounded font-mono"
              />
              <button
                onClick={() => copyLink(inviteLink)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                {copied === inviteLink ? <Check size={14} /> : <Copy size={14} />}
                {copied === inviteLink ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members List */}
      <div>
        <h2 className="text-sm font-medium mb-3">Team Members</h2>
        {loading ? (
          <div className="space-y-2">
            <ClientItemSkeleton />
            <ClientItemSkeleton />
            <ClientItemSkeleton />
          </div>
        ) : members.length > 0 ? (
          <>
            <div className="space-y-2">
              {members.map((member) => {
                const isSelf = member.userId === currentUserId;
                const canChangeRole = currentRole === "owner" && !isSelf;
                const canRemove = (currentRole === "owner" || currentRole === "admin") && !isSelf;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{member.user.name}</p>
                        {isSelf && (
                          <span className="text-xs text-[var(--muted-foreground)]">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {member.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canChangeRole ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${roleColor(member.role)}`}
                        >
                          <option value="owner">owner</option>
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${roleColor(member.role)}`}>
                          {member.role}
                        </span>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user.name)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            No members yet.
          </p>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3">Pending Invitations</h2>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(inv.inviteLink)}
                  className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                >
                  {copied === inv.inviteLink ? <Check size={14} /> : <Copy size={14} />}
                  {copied === inv.inviteLink ? "Copied!" : "Copy Link"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
