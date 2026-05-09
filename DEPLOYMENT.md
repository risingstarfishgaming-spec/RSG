# Deploying RSG (frontend + backend)

## Prerequisites

- Node.js matching project engines (run builds locally before shipping).
- MongoDB (Atlas or self-hosted).
- Production secrets: `JWT_SECRET`, `AGENT_JWT_SECRET` (strong random values, not the dev defaults).

## Backend

1. Set environment variables (see [backend/.env.example](backend/.env.example)).
2. **`FRONTEND_URL`**: comma-separated list of every browser origin that will call the API (marketing site, staff subdomain, preview URLs if any).
3. **`BACKEND_URL`**: public URL of this API (e.g. `https://api.example.com`).
4. **`NODE_ENV=production`**
5. Start the process (e.g. `node dist/index.js` or your process manager) on the configured `PORT`.
6. Ensure `/api` health checks succeed; if you use chat, confirm WebSocket upgrades work through your load balancer.

### Render.com (Web Service)

- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build` (default install is fine)
- **Start Command:** `npm start`

Render sets `NODE_ENV=production` during install, which normally **omits `devDependencies`**. This repo keeps **`typescript` and `@types/*` in `dependencies`** so `tsc` still sees Express/Multer/etc. types. If you ever move them back to `devDependencies`, use **`npm install --include=dev && npm run build`** instead.

## Frontend

1. Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env.production` (or set vars in CI).
2. **`VITE_API_BASE_URL`**: full REST base including `/api` (e.g. `https://api.example.com/api`). Omit for local dev to use the Vite proxy.
3. **`VITE_WS_URL`**: Socket.io HTTP origin only, e.g. `https://api.example.com` (no `/api` path).
4. Staff-only hosts: set `VITE_MAIN_SITE_URL` and optionally `VITE_FORCE_STAFF_PORTAL` as documented in the example file.
5. Build: `npm run build` in `frontend/`.
6. Serve the `frontend/dist` static files (S3+CloudFront, nginx, Vercel static, etc.). Configure SPA fallback to `index.html` for client-side routes.

## Smoke test (production)

- Open the deployed site, register or log in, confirm API calls return 200 and CORS errors are absent.
- Staff: log in on the staff host, open a few sections, open live chat if enabled.
- Chat: send a message and confirm real-time delivery (validates `VITE_WS_URL` and proxy).

---

## Future: cookie + session auth (Ace-Site parity)

RSG today uses **JWT in `Authorization` headers** with tokens stored in **localStorage** (members and staff). [Ace-Site](Ace-Site) uses **MongoDB-backed `express-session`**, an **httpOnly** session cookie, and `credentials: 'include'` on fetches so the browser sends the cookie on API and Socket.io handshakes.

**Why consider cookies later**

- httpOnly cookies are not readable from JavaScript, which reduces impact of some XSS scenarios compared to tokens in localStorage.
- One server-side session can align HTTP and WebSocket authentication without duplicating token plumbing.

**High-level migration steps (not implemented here)**

1. Add `express-session` + Mongo store (or Redis), cookie name, `secure` / `sameSite` tuned for your frontend/API origins (cross-origin production often needs `SameSite=None; Secure`).
2. On login, set `req.session.user` (or staff equivalent) and `req.session.save()` before responding; expose `Set-Cookie`.
3. Enable CORS **`credentials: true`** and avoid `*` origin; list exact `FRONTEND_URL` origins.
4. Update all browser `fetch` calls that need auth to `credentials: 'include'`.
5. Update Socket.io client/server handshake to read the session cookie (or issue a short-lived post-handshake token).
6. Decide whether to **stop** persisting JWT in localStorage or keep a hybrid during rollout.

Use this section as a design reference only; the current codebase intentionally stays on JWT + Bearer for simpler deployment.
