# Stripe Setup Guide

Atrium uses a `STRIPE_MODE` toggle to switch between test and live keys. Both sets of keys live in your `.env` — change one variable to switch environments.

```
STRIPE_MODE="test"   →  reads STRIPE_TEST_* variables
STRIPE_MODE="live"   →  reads STRIPE_LIVE_* variables
```

---

## Local Webhook Forwarding

For local development, run the Stripe CLI listener in a separate terminal:

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

Keep this running while developing. The webhook secret it printed on first run is already in your `.env` as `STRIPE_TEST_WEBHOOK_SECRET`.

If you ever need to re-login:

```bash
stripe login
```

---

## Seed the Database

After setting your price IDs in `.env`, push the schema and seed:

```bash
bun run db:push && bun run db:seed
```

The seed script reads `STRIPE_MODE` to pick the correct `STRIPE_TEST_*` or `STRIPE_LIVE_*` price IDs automatically.

---

## Test a Payment

Use Stripe's test card numbers:

| Card Number          | Scenario            |
|----------------------|---------------------|
| `4242 4242 4242 4242` | Successful payment  |
| `4000 0000 0000 3220` | 3D Secure required  |
| `4000 0000 0000 9995` | Payment declined    |

Use any future expiry date, any 3-digit CVC, and any billing ZIP.

1. Start dev: `bun run dev`
2. In a separate terminal: `stripe listen --forward-to localhost:3001/api/billing/webhook`
3. Sign up and go to `/dashboard/settings/billing`
4. Click **Upgrade to Pro**
5. Enter test card `4242 4242 4242 4242`
6. Complete checkout
7. Verify the webhook fires in the `stripe listen` terminal
8. Verify your plan updates on the billing page

---

## Production Setup

### 1. Create a Webhook Endpoint

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) (live mode — toggle off "Test mode" in the top-right)
2. Click **+ Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/billing/webhook`
4. Click **Select events** and add:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`
5. Click **Add endpoint**
6. On the endpoint detail page, click **Reveal** under Signing secret
7. Copy the `whsec_...` value and set it as `STRIPE_LIVE_WEBHOOK_SECRET` in your `.env`

### 2. Set Up Customer Portal

1. Go to [dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal) (live mode)
2. Enable:
   - **Invoice history**
   - **Cancel subscriptions** (at end of period)
   - **Update payment methods**
3. Click **Save**

This powers the "Manage Payment" button on the billing page.

### 3. Switch to Live

Change one variable and re-seed:

```
STRIPE_MODE="live"
```

```bash
bun run db:seed
```

---

## Troubleshooting

**Webhook signature verification failed**
- Check that `STRIPE_MODE` matches the keys you're using
- For local dev, make sure `stripe listen` is running
- For production, verify the webhook secret matches the endpoint in the Stripe dashboard

**Checkout session returns error about missing price**
- Run `bun run db:seed` after setting price IDs in `.env`
- Check that `STRIPE_MODE` matches the environment your price IDs belong to

**Billing page doesn't show in sidebar**
- Set `NEXT_PUBLIC_BILLING_ENABLED="true"` and restart the Next.js dev server

**Plan limits not enforced**
- Set `BILLING_ENABLED="true"` on the API side
- The guard passes through when billing is disabled (self-hosted compatibility)

**"No Stripe customer found" error**
- The organization was created before billing was enabled
- Re-create the organization or manually create a subscription record

**Wrong Stripe environment**
- Test keys: `sk_test_` / `pk_test_`, Live keys: `sk_live_` / `pk_live_`
- Don't mix test price IDs with live keys or vice versa
