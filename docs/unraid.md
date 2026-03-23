# Unraid Installation

Atrium runs as a single Docker container on Unraid. One image, one port — includes the API, web app, reverse proxy, and a built-in PostgreSQL database.

## Prerequisites

- Unraid 6.x or 7.x
- Docker enabled in Unraid settings

## Installation

1. In the Unraid Docker UI, click **Add Container**
2. Set **Repository** to `vibralabs/atrium:latest`
3. Set **Network Type** to `Bridge`

### Port Mapping

Map your desired host port to container port `8080`:

| Host Port | Container Port |
|---|---|
| `4747` (or any available port) | `8080` |

### Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `BETTER_AUTH_SECRET` | *(random string, min 32 chars)* | Generate with `openssl rand -base64 32` in the Unraid terminal |
| `SECURE_COOKIES` | `false` | Required when accessing over plain HTTP. Remove this if you add an HTTPS reverse proxy later. |

### Volume Mappings

| Host Path | Container Path | Purpose |
|---|---|---|
| `/mnt/user/appdata/atrium/db` | `/var/lib/postgresql/data` | PostgreSQL data |
| `/mnt/user/appdata/atrium/uploads` | `/app/uploads` | Uploaded files |

### Apply

Click **Apply** and open `http://your-unraid-ip:PORT` to create your account.

## Why SECURE_COOKIES=false?

By default, Atrium sets cookies with the `Secure` flag, which tells browsers to only send them over HTTPS. If you're accessing Atrium over plain HTTP (common on local networks), the browser silently ignores these cookies and you'll get 403 "Invalid or missing CSRF token" errors.

Setting `SECURE_COOKIES=false` disables the `Secure` flag so cookies work over HTTP.

**If you add an HTTPS reverse proxy** (e.g., Nginx Proxy Manager, Caddy, Traefik), remove `SECURE_COOKIES=false` or set it to `true` for better security.

## Optional: External Database

If you prefer to use an existing PostgreSQL instance instead of the built-in one:

| Variable | Value |
|---|---|
| `USE_BUILT_IN_DB` | `false` |
| `DATABASE_URL` | `postgresql://user:password@your-db-host:5432/atrium` |

You can remove the `/var/lib/postgresql/data` volume mapping when using an external database.

## Optional: Email Notifications

To enable email notifications (invitations, password resets):

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | Your [Resend](https://resend.com) API key |
| `EMAIL_FROM` | `noreply@yourdomain.com` |

## Optional: S3 File Storage

To use S3-compatible storage instead of local disk:

| Variable | Value |
|---|---|
| `STORAGE_PROVIDER` | `s3`, `minio`, or `r2` |
| `S3_ENDPOINT` | Your S3-compatible endpoint URL |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY` | Access key |
| `S3_SECRET_KEY` | Secret key |

You can remove the `/app/uploads` volume mapping when using S3 storage.

## Updating

1. In the Unraid Docker UI, click **Check for Updates** or pull `vibralabs/atrium:latest`
2. Restart the container
3. Database migrations run automatically on startup

## Troubleshooting

### 403 "Invalid or missing CSRF token"
Make sure `SECURE_COOKIES` is set to `false` if you're accessing over plain HTTP.

### Container won't start
Check the container logs in the Unraid Docker UI. The most common issue is a missing or too-short `BETTER_AUTH_SECRET` (must be at least 32 characters).

### Data not persisting after restart
Verify your volume mappings point to `/mnt/user/appdata/atrium/db` and `/mnt/user/appdata/atrium/uploads`.
