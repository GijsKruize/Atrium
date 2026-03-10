"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceLifetime: number;
  maxProjects: number;
  maxStorageMb: number;
  maxMembers: number;
  maxClients: number;
  maxSeats: number;
  isRecurring: boolean;
  features: string[];
  description: string;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
}

interface Usage {
  projects: number;
  storageMb: number;
  members: number;
  clients: number;
}

function formatLimit(value: number): string {
  return value === -1 ? "Unlimited" : String(value);
}

function formatStorage(mb: number): string {
  if (mb === -1) return "Unlimited";
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  return `${mb} MB`;
}

function UsageMeter({
  label,
  current,
  max,
  format = "number",
}: {
  label: string;
  current: number;
  max: number;
  format?: "number" | "storage";
}) {
  const isUnlimited = max === -1;
  const pct = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const displayMax =
    format === "storage" ? formatStorage(max) : formatLimit(max);
  const displayCurrent =
    format === "storage" ? formatStorage(current) : String(current);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-[var(--muted-foreground)]">
          {displayCurrent} / {displayMax}
        </span>
      </div>
      <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: isUnlimited ? "0%" : `${pct}%`,
            backgroundColor:
              pct >= 90
                ? "var(--destructive, #ef4444)"
                : pct >= 70
                  ? "#f59e0b"
                  : "var(--primary)",
          }}
        />
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
  lifetimeSeatsRemaining,
  onSelect,
  loadingSlug,
}: {
  plan: Plan;
  isCurrentPlan: boolean;
  lifetimeSeatsRemaining: number | null;
  onSelect: (slug: string) => void;
  loadingSlug: string | null;
}) {
  const price = plan.isRecurring
    ? `$${(plan.priceMonthly / 100).toFixed(0)}/mo`
    : plan.priceLifetime > 0
      ? `$${(plan.priceLifetime / 100).toFixed(0)}`
      : "Free";

  const icon =
    plan.slug === "free" ? null : plan.slug === "pro" ? (
      <Zap size={20} />
    ) : (
      <Crown size={20} />
    );

  return (
    <div
      className={`rounded-xl border p-6 space-y-4 ${
        isCurrentPlan
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-20"
          : "border-[var(--border)]"
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          {isCurrentPlan && (
            <span className="text-xs bg-[var(--primary)] text-white px-2 py-0.5 rounded-full">
              Current
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          {plan.description}
        </p>
      </div>

      <div className="text-3xl font-bold">
        {price}
        {plan.isRecurring && (
          <span className="text-sm font-normal text-[var(--muted-foreground)]">
            {" "}
            /month
          </span>
        )}
        {!plan.isRecurring && plan.priceLifetime > 0 && (
          <span className="text-sm font-normal text-[var(--muted-foreground)]">
            {" "}
            one-time
          </span>
        )}
      </div>

      {plan.slug === "lifetime" && lifetimeSeatsRemaining !== null && (
        <div className="text-sm bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg">
          {lifetimeSeatsRemaining} of {plan.maxSeats} seats remaining
        </div>
      )}

      <ul className="space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check size={16} className="text-green-500 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {!isCurrentPlan && plan.slug !== "free" && (
        <button
          onClick={() => onSelect(plan.slug)}
          disabled={
            loadingSlug !== null ||
            (plan.slug === "lifetime" &&
              lifetimeSeatsRemaining !== null &&
              lifetimeSeatsRemaining <= 0)
          }
          className="w-full py-2 px-4 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loadingSlug === plan.slug ? (
            <Loader2 size={16} className="animate-spin mx-auto" />
          ) : plan.slug === "lifetime" &&
            lifetimeSeatsRemaining !== null &&
            lifetimeSeatsRemaining <= 0 ? (
            "Sold Out"
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </button>
      )}

      {isCurrentPlan && plan.slug !== "free" && (
        <div className="text-center text-sm text-[var(--muted-foreground)]">
          This is your current plan
        </div>
      )}
    </div>
  );
}

export function BillingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [lifetimeSeatsRemaining, setLifetimeSeatsRemaining] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoadingSlug, setCheckoutLoadingSlug] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const checkoutSuccess = searchParams?.get("success") === "true";

  useEffect(() => {
    if (checkoutSuccess) {
      success("Subscription activated! Thank you for upgrading.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch<{ plans: Plan[]; lifetimeSeatsRemaining: number | null }>(
        "/billing/plans",
      ),
      apiFetch<{ subscription: Subscription; usage: Usage }>(
        "/billing/subscription",
      ),
    ])
      .then(([plansData, subData]) => {
        setPlans(plansData.plans);
        setLifetimeSeatsRemaining(plansData.lifetimeSeatsRemaining);
        setSubscription(subData.subscription);
        setUsage(subData.usage);
        setLoading(false);
      })
      .catch((err) => {
        showError(
          err instanceof Error ? err.message : "Failed to load billing data",
        );
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async (planSlug: string) => {
    setCheckoutLoadingSlug(planSlug);
    try {
      const result = await apiFetch<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          planSlug,
          successUrl: `${window.location.origin}/dashboard/settings/account?tab=billing&success=true`,
          cancelUrl: `${window.location.origin}/dashboard/settings/account?tab=billing`,
        }),
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to create checkout session",
      );
      setCheckoutLoadingSlug(null);
    }
  };

  const handleManagePayment = async () => {
    try {
      const result = await apiFetch<{ url: string }>("/billing/portal", {
        method: "POST",
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/settings/account?tab=billing`,
        }),
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Failed to open payment portal",
      );
    }
  };

  if (loading) return <div>Loading...</div>;

  const currentPlan = subscription?.plan;

  return (
    <div className="space-y-8">
      {/* Current Plan & Status */}
      {subscription && currentPlan && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard size={20} />
            <h2 className="text-lg font-semibold">Current Plan</h2>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-lg">
                  {currentPlan.name}
                </span>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    subscription.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : subscription.status === "past_due"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
              {subscription.stripeSubscriptionId && (
                <button
                  onClick={handleManagePayment}
                  className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                >
                  Manage Payment <ExternalLink size={14} />
                </button>
              )}
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {subscription.cancelAtPeriodEnd
                  ? "Cancels"
                  : "Renews"}{" "}
                on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {!currentPlan.isRecurring && currentPlan.slug === "lifetime" && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Lifetime access — no renewal needed
              </p>
            )}
          </div>
        </section>
      )}

      {/* Usage Meters */}
      {usage && currentPlan && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Usage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <UsageMeter
              label="Projects"
              current={usage.projects}
              max={currentPlan.maxProjects}
            />
            <UsageMeter
              label="Storage"
              current={usage.storageMb}
              max={currentPlan.maxStorageMb}
              format="storage"
            />
            <UsageMeter
              label="Team Members"
              current={usage.members}
              max={currentPlan.maxMembers}
            />
            <UsageMeter
              label="Clients"
              current={usage.clients}
              max={currentPlan.maxClients}
            />
          </div>
        </section>
      )}

      {/* Plan Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan?.slug === plan.slug}
              lifetimeSeatsRemaining={lifetimeSeatsRemaining}
              onSelect={handleUpgrade}
              loadingSlug={checkoutLoadingSlug}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
