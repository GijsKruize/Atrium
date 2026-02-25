# Security

Atrium ships with production-grade security defaults:

- Helmet CSP restricting scripts, styles, images, and connections to `'self'`
- CORS locked to a single origin (`WEB_URL`) with credentials
- Global rate limiting (100 requests/min) via `@nestjs/throttler`
- `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` on all endpoints
- Auth guard + roles guard on all non-public routes
- Global exception filter that hides stack traces from clients
- File upload sanitization with blocked dangerous extensions
- Non-root Docker containers
- Required env var validation at startup
