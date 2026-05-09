# New Site — Platform Documentation

> Based on the Ace-Site architecture, **without** Fortune Panda game integration.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Features to Keep](#features-to-keep)
5. [What to Remove (Fortune Panda)](#what-to-remove-fortune-panda)
6. [Database Models](#database-models)
7. [Backend Routes](#backend-routes)
8. [Frontend Pages](#frontend-pages)
9. [Services](#services)
10. [Middleware](#middleware)
11. [Third-Party Integrations](#third-party-integrations)
12. [Environment Variables](#environment-variables)
13. [Removal Checklist — Fortune Panda](#removal-checklist--fortune-panda)
14. [Setup Guide](#setup-guide)

---

## Overview

A full-stack web platform with:

- User registration, login, email verification, password recovery
- Admin panel (super-admin) and Agent panel (support agents)
- Live chat (user ↔ agent) with real-time messaging via Socket.io
- Support ticket system with email notifications
- Loan management system (request, approve, repay, ledger)
- Referral program
- Crypto wallet (top-up via NOWPayments)
- Wheel of Fortune (spin-to-win campaigns)
- Bonus/promotions system
- Customer behavior analytics dashboard
- Push notifications (OneSignal)
- Email promotions (Brevo/Sendinblue)
- User notes, labels, banning/unbanning (CRM features)
- PWA support

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, TypeScript, Tailwind CSS, React Router 7 |
| **State Management** | Zustand |
| **Forms** | react-hook-form + zod |
| **Charts** | Recharts |
| **Backend** | Express 4, TypeScript, Node.js |
| **Database** | MongoDB (Mongoose 8) |
| **Sessions** | express-session + connect-mongo |
| **Auth** | JWT (jsonwebtoken) + bcryptjs, optional 2FA (otplib + qrcode) |
| **Real-Time** | Socket.io |
| **Email** | Brevo (sib-api-v3-sdk) |
| **Crypto Payments** | NOWPayments REST API + IPN webhooks |
| **Push Notifications** | OneSignal |
| **File Uploads** | Multer (local) + optional Cloudinary |
| **Rate Limiting** | express-rate-limit + express-slow-down |
| **Security** | Helmet, CORS, request-id, connect-timeout |

---

## Project Structure

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── pages/              # Route-level page components
│   │   ├── components/         # Reusable UI components
│   │   │   ├── admin/          # Admin panel components (analytics, chat, loans)
│   │   │   ├── chat/           # Chat widget components
│   │   │   ├── wheel/          # Wheel of Fortune components
│   │   │   ├── support/        # Support ticket components
│   │   │   └── layout/         # Layout/navigation components
│   │   ├── services/           # API helpers (wallet, loan, analytics, OneSignal)
│   │   ├── stores/             # Zustand stores (auth)
│   │   ├── utils/              # Shared utilities (api base URLs)
│   │   └── App.tsx             # Router + global providers
│   ├── public/                 # Static assets
│   ├── env.example             # Frontend env template
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/             # Express route modules
│   │   ├── models/             # Mongoose schemas
│   │   ├── services/           # Business logic services
│   │   ├── middleware/         # Auth, rate limiting, error handling
│   │   ├── config/             # DB, session, Cloudinary, uploads
│   │   ├── utils/              # JWT, logger, socket manager, response helpers
│   │   └── index.ts            # Server entry point
│   └── package.json
│
└── NEW-SITE-DOCUMENTATION.md
```

---

## Features to Keep

### 1. User Authentication & Accounts
- Registration with email verification (6-digit code)
- Login / Logout with JWT + session cookies
- Forgot password / Reset password flow
- Profile management (name, avatar, settings)
- Optional Two-Factor Authentication (2FA) via TOTP
- Session listing and revocation
- Login streaks and achievements

### 2. Admin Panel (AceAdmin)
- Super-admin login (subdomain: `aceadmin.*`)
- Manage agents (create, edit permissions, deactivate)
- View all users with search/filter
- User actions: verify email, reset password, ban/unban, delete account
- Analytics dashboard (overview, traffic, pages, features, clicks, funnel, drop-off, devices)
- Email promotions (compose, preview, send via Brevo)

### 3. Agent Panel (AceAgent)
- Agent login (subdomain: `aceagent.*`)
- User list with balance display
- Deposit / Redeem operations
- User management (verify, ban, reset password)
- Live chat with users (Socket.io real-time)
- Support ticket management (view, reply, status updates, create on behalf)
- Loan management (approve/reject requests, manual issue, repayment, limits, ledger, stats, CSV export)
- Wheel of Fortune campaign management
- Referral verification
- User notes and labels (CRM)

### 4. Live Chat
- User-facing chat widget (floating, expandable)
- Agent-facing chat panel with conversation list
- Real-time messaging via Socket.io (typing indicators, presence)
- File/image attachments
- Message reactions
- Notification sounds (Web Audio API)

### 5. Support Tickets
- Users can submit tickets (with attachments)
- Agents can view queue, reply, update status, create tickets for users
- Email notifications on ticket updates (Brevo)
- User search for creating tickets on behalf

### 6. Loan System
- User loan account with credit limit
- Loan request flow (user requests → agent approves/rejects)
- Manual loan issuance by agents
- Repayment tracking
- Loan ledger with full history
- Limit adjustment with history
- Agent action logs
- Overdue detection and reminder cron jobs
- Statistics and CSV export

### 7. Referral Program
- Each user gets a unique referral code
- Track referred users
- Agent verification of referrals
- Display referred users with names on user dashboard

### 8. Crypto Wallet
- User wallet balance
- Create crypto payment invoices (NOWPayments)
- IPN webhook for payment confirmation
- Transaction history

### 9. Wheel of Fortune
- Configurable spin campaigns (slices, prizes, probabilities)
- Budget management and fairness rules
- User spin with cooldown
- Bonus spins (admin-granted)
- Spin history and statistics
- Prize redemption tracking

### 10. Bonuses / Promotions
- Create bonuses with images (Cloudinary upload)
- User claim flow
- List active/all bonuses

### 11. Analytics
- Automatic client-side tracking (page views, clicks, errors, rage clicks, sessions)
- Feature usage tracking (`feature_opened`, `feature_used`, `feature_failed`)
- Onboarding funnel tracking (`onboarding_started`, `onboarding_completed`, `onboarding_abandoned`)
- Admin dashboard with charts (Recharts):
  - Overview metrics (users, sessions, page views)
  - Traffic sources
  - Top pages
  - Feature usage breakdown
  - Click behavior heatmaps
  - Conversion funnel
  - Drop-off detection
  - Device/browser stats

### 12. Notifications
- In-app notification system
- Unread count badge
- Mark read / delete
- Push notifications via OneSignal

### 13. Content Management
- FAQs (CRUD by admin)
- Notices (active/all, CRUD)
- Platforms listing

### 14. CRM Features
- User labels (create, assign, filter users by label)
- User notes (per-user notes by agents/admins)
- IP banning (ban user + associated IPs)

---

## What to Remove (Fortune Panda)

Everything related to the Fortune Panda casino/games API must be removed:

### Backend Files to Remove
| File | Purpose |
|---|---|
| `backend/src/services/fortunePandaService.ts` | FP API integration (login, sign, register, query, enter game, deposit, redeem, trade records) |
| `backend/src/services/agentLoginService.ts` | FP agent session management |
| `backend/src/routes/fortunePanda.ts` | Admin-level FP routes (games, create user, balance, enter game) |
| `backend/src/routes/fortunePandaUser.ts` | User-level FP routes (games list, account, balance, enter game) |
| `backend/src/routes/proxy.ts` | CORS proxy forwarding `?action=` to FP API |
| `backend/src/routes/games.ts` | Game list from FP, agent status, relogin |

### Backend Code to Clean Up
| File | What to Remove |
|---|---|
| `backend/src/routes/admin.ts` | FP-related routes: `sync-fortune-panda`, `sync-balance`, `deposit`, `redeem`, `fix-fortune-panda`, `fix-fortune-panda-usernames`, `fortune-panda-info`, trade records, jackpot records, game records, FP password reset. Also FP-related user fields in responses. |
| `backend/src/index.ts` | Remove route mounts for `fortunePanda`, `fortunePandaUser`, `proxy`, `games`. Remove `fortunePandaService.initialize()` call. |
| `backend/src/models/User.ts` | Remove fields: `fortunePandaUsername`, `fortunePandaPassword`, `fortunePandaBalance`, `fortunePandaLastSync` |

### Frontend Files to Remove
| File | Purpose |
|---|---|
| `frontend/src/pages/Games.tsx` | Game catalog page |
| `frontend/src/pages/GameLaunch.tsx` | Game launch page |
| `frontend/src/pages/UserFortunePandaDashboard.tsx` | FP user dashboard |
| `frontend/src/services/fortunePandaApi.ts` | FP API wrapper |

### Frontend Code to Clean Up
| File | What to Remove |
|---|---|
| `frontend/src/App.tsx` | Routes for `/games`, `/game/:id`, `/fortune-panda` |
| `frontend/src/pages/Home.tsx` | Game cards, `handlePlayGame`, game-related sections |
| `frontend/src/pages/Dashboard.tsx` | Game cards, `handlePlay`, game launch logic |
| `frontend/src/pages/aceagent/AceagentDashboard.tsx` | FP balance display, refresh balance, sync from FP, deposit/redeem, fix FP account, FP username display, agent balance, trade/jackpot/game record tabs |
| `frontend/src/pages/aceadmin/AceadminDashboard.tsx` | Fix FP Account button, FP-related user columns |
| `frontend/src/components/` | Any game-related components |

### Environment Variables to Remove
| Variable | Purpose |
|---|---|
| `FORTUNE_PANDA_API_URL` | FP API endpoint |
| `FORTUNE_PANDA_AGENT_NAME` | FP agent username |
| `FORTUNE_PANDA_AGENT_PASSWORD` | FP agent password |
| `VITE_GAMES_API_URL` | Frontend games API URL |

---

## Database Models

### Models to Keep

| Model | File | Purpose |
|---|---|---|
| `User` | `User.ts` | Core user (remove FP fields) |
| `Agent` | `Agent.ts` | Agent accounts (super_admin / admin / agent) with permissions |
| `Wallet` | `Wallet.ts` | User crypto wallet balance |
| `CryptoTransaction` | `CryptoTransaction.ts` | Crypto payment records |
| `Loan` | `Loan.ts` | Active loans |
| `LoanRequest` | `LoanRequest.ts` | Loan applications |
| `LoanAccount` | `LoanAccount.ts` | User loan accounts with limits |
| `LoanLedger` | `LoanLedger.ts` | Loan transaction history |
| `LoanLimitHistory` | `LoanLimitHistory.ts` | Limit change records |
| `LoanAgentLog` | `LoanAgentLog.ts` | Agent action audit trail |
| `ChatMessage` | `ChatMessage.ts` | Chat messages + attachments |
| `SupportTicket` | `SupportTicket.ts` | Support tickets + replies |
| `Referral` | `Referral.ts` | Referral relationships |
| `Bonus` | `Bonus.ts` | Promotional bonuses + claims |
| `Notification` | `Notification.ts` | In-app notifications |
| `WheelConfig` | `WheelConfig.ts` | Wheel configuration |
| `WheelCampaign` | `WheelCampaign.ts` | Wheel campaigns |
| `WheelSlice` | `WheelSlice.ts` | Wheel prize slices |
| `WheelSpin` | `WheelSpin.ts` | Spin records |
| `WheelBudget` | `WheelBudget.ts` | Campaign budget tracking |
| `WheelFairnessRules` | `WheelFairnessRules.ts` | Fairness/probability rules |
| `Label` | `Label.ts` | User labels for CRM |
| `UserNote` | `UserNote.ts` | Agent notes on users |
| `FAQ` | `FAQ.ts` | FAQ entries |
| `Notice` | `Notice.ts` | Platform notices |
| `Platform` | `Platform.ts` | Platform listings |
| `AnalyticsEvent` | `AnalyticsEvent.ts` | User behavior events |
| `BannedIP` | `BannedIP.ts` | IP ban records |

### User Model — Fields to Remove

```
fortunePandaUsername    → REMOVE
fortunePandaPassword   → REMOVE
fortunePandaBalance    → REMOVE
fortunePandaLastSync   → REMOVE
```

All other User fields (username, email, password, firstName, lastName, avatar, role, isActive, isEmailVerified, referralCode, referredBy, labels, 2FA fields, streak fields, achievement fields, ban fields) remain.

---

## Backend Routes

### Routes to Keep

| Mount Path | File | Purpose |
|---|---|---|
| `/api/auth` | `auth.ts` | Register, login, logout, refresh, /me, password reset, email verification |
| `/api/user` | `user.ts` | Profile, avatar, password, 2FA, sessions, streaks, achievements, referrals |
| `/api/admin` | `admin.ts` | User management, agent balance *(clean out FP-specific routes)* |
| `/api/agent-auth` | `agentAuth.ts` | Agent login, verify, CRUD agents |
| `/api/chat` | `chat.ts` | User chat messages |
| `/api/admin/messages` | `adminChat.ts` | Agent chat conversations |
| `/api/support-tickets` | `supportTicket.ts` | Ticket creation, replies, status |
| `/api/loan` | `loan.ts` | User loan account, requests, history |
| `/api/agent/loan` | `agentLoan.ts` | Agent loan management |
| `/api/wallet` | `wallet.ts` | Crypto wallet balance, transactions, payments |
| `/api/webhooks` | `webhooks.ts` | NOWPayments IPN webhook |
| `/api/wheel` | `wheel.ts` | User wheel spin |
| `/api/admin/wheel` | `adminWheel.ts` | Admin wheel config |
| `/api/agent/wheel` | `agentWheel.ts` | Agent wheel campaigns |
| `/api/agent/referrals` | `agentReferrals.ts` | Referral management |
| `/api/bonuses` | `bonus.ts` | Bonus CRUD + claims |
| `/api/notifications` | `notification.ts` | In-app notifications |
| `/api/email-promotions` | `emailPromotions.ts` | Email campaigns |
| `/api/faqs` | `faq.ts` | FAQ CRUD |
| `/api/notices` | `notice.ts` | Notice CRUD |
| `/api/platforms` | `platform.ts` | Platform CRUD |
| `/api/contacts` | `contacts.ts` | Contact list |
| `/api/admin/labels` | `labels.ts` | User labels |
| `/api/admin/notes` | `userNotes.ts` | User notes |
| `/api/analytics` | `analytics.ts` | Event ingestion + dashboard data |

### Routes to Remove

| Mount Path | File | Reason |
|---|---|---|
| `/api/fortune-panda` | `fortunePanda.ts` | FP admin routes |
| `/api/fortune-panda-user` | `fortunePandaUser.ts` | FP user routes |
| `/api` (proxy) | `proxy.ts` | FP CORS proxy |
| `/api/games` | `games.ts` | FP game list |

---

## Frontend Pages

### Pages to Keep

| Page | Route | Purpose |
|---|---|---|
| `Home.tsx` | `/` | Landing page *(remove game cards)* |
| `Login.tsx` | `/login` | Login |
| `Register.tsx` | `/register` | Registration |
| `ForgotPassword.tsx` | `/forgot-password` | Password recovery |
| `ResetPassword.tsx` | `/reset-password` | Password reset |
| `VerifyEmail.tsx` | `/verify-email` | Email verification |
| `VerifyCode.tsx` | `/verify-code` | Code verification |
| `Dashboard.tsx` | `/dashboard` | User dashboard *(remove game cards)* |
| `Bonuses.tsx` | `/bonuses` | Promotions |
| `Platforms.tsx` | `/platforms` | Platform list |
| `AboutUs.tsx` | `/about` | About page |
| `Wallet.tsx` | `/wallet` | Crypto wallet |
| `Profile.tsx` | `/profile` | User profile |
| `Settings.tsx` | `/settings` | User settings |
| `Referrals.tsx` | `/referrals` | Referral program |
| `Loans.tsx` | `/loans` | Loan UI |
| `Support.tsx` | `/support` | Support tickets |
| `Chat.tsx` | `/chat` | Full-page chat |
| `AceagentLogin.tsx` | `/aceagent/login` | Agent login |
| `AceagentDashboard.tsx` | `/aceagent/dashboard` | Agent panel *(clean out FP features)* |
| `AceadminLogin.tsx` | `/aceadmin/login` | Admin login |
| `AceadminDashboard.tsx` | `/aceadmin/dashboard` | Admin panel *(clean out FP features)* |
| `Terms.tsx` | `/terms` | Terms of service |
| `Privacy.tsx` | `/privacy` | Privacy policy |
| `Cookies.tsx` | `/cookies` | Cookie policy |
| `NotFound.tsx` | `*` | 404 page |

### Pages to Remove

| Page | Route | Reason |
|---|---|---|
| `Games.tsx` | `/games` | FP game catalog |
| `GameLaunch.tsx` | `/game/:id` | FP game launch |
| `UserFortunePandaDashboard.tsx` | `/fortune-panda` | FP user dashboard |

---

## Services

### Backend Services to Keep

| Service | Purpose |
|---|---|
| `loanService.ts` | Loan business rules (issue, repay, limits) |
| `loanCronService.ts` | Scheduled jobs for overdue loans and reminders |
| `wheelSpinService.ts` | Wheel spin logic and prize determination |
| `emailService.ts` | Transactional email via Brevo (verification, password reset) |
| `supportEmailService.ts` | Support ticket email notifications |
| `nowPaymentsService.ts` | Crypto invoice creation + IPN verification |
| `oneSignalService.ts` | Push notification delivery |
| `adminSessionService.ts` | Admin/agent session token management |

### Backend Services to Remove

| Service | Reason |
|---|---|
| `fortunePandaService.ts` | FP API integration |
| `agentLoginService.ts` | FP agent login/session |

### Frontend Services to Keep

| Service | Purpose |
|---|---|
| `analyticsTracker.ts` | Client-side event batching |
| `loanApi.ts` | Loan API wrapper |
| `walletApi.ts` | Wallet API wrapper |
| `oneSignal.ts` | OneSignal browser SDK |

### Frontend Services to Remove

| Service | Reason |
|---|---|
| `fortunePandaApi.ts` | FP API wrapper |

---

## Middleware

| Middleware | File | Purpose |
|---|---|---|
| `authenticate` | `auth.ts` | Session cookie → Bearer JWT fallback; loads user |
| `requireAgentAuth` | `agentAuth.ts` | Agent JWT verification |
| `requireAdminAuth` | `adminAuth.ts` | Admin/agent dashboard authentication |
| `requireAdminOrAgentAuth` | `anyAdminAuth.ts` | Flexible admin or agent access |
| Rate limiters | `rateLimiter.ts` | `generalLimiter`, `authLimiter`, `adminAuthLimiter`, `registerLimiter`, `passwordResetLimiter`, `paymentCreateLimiter`, `loanRequestLimiter`, `wheelSpinLimiter`, `speedLimiter` |
| `errorHandler` | `errorHandler.ts` | Centralized error response |
| `notFound` | `notFound.ts` | 404 handler |
| `requestId` | `requestId.ts` | Request ID for tracing |
| `helmet` | (express) | Security headers |
| `cors` | (express) | Origin validation with subdomain support |
| `connect-timeout` | (express) | Request timeout |

---

## Third-Party Integrations

### Keep

| Integration | Purpose | Env Vars |
|---|---|---|
| **MongoDB** | Primary database + sessions | `MONGODB_URI` |
| **Brevo (Sendinblue)** | Transactional + promotional email | `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_REPLY_TO` |
| **NOWPayments** | Crypto payment processing | `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` |
| **OneSignal** | Push notifications | `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY` |
| **Cloudinary** | Image uploads (bonuses, attachments) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

### Remove

| Integration | Reason |
|---|---|
| **Fortune Panda API** | Casino game provider — not needed |

---

## Environment Variables

### Backend `.env`

```env
# Core
NODE_ENV=development
PORT=5000
REQUEST_TIMEOUT=30000
MONGODB_URI=mongodb://localhost:27017/newsite

# URLs
FRONTEND_URL=http://localhost:5173
PRODUCTION_FRONTEND_URL=https://yourdomain.com
BACKEND_URL=http://localhost:5000
ALLOW_LOCALHOST_IN_PROD=false
ALLOW_NO_ORIGIN=false
ALLOW_VERCEL_PREVIEWS=false

# Authentication
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
AGENT_JWT_SECRET=your-agent-jwt-secret-here

# Default Super Admin (created on first startup)
AGENT_USERNAME=admin
AGENT_PASSWORD=your-admin-password

# Brevo (Email)
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=YourSiteName
BREVO_REPLY_TO=support@yourdomain.com

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# NOWPayments (Crypto)
NOWPAYMENTS_API_KEY=your-nowpayments-api-key
NOWPAYMENTS_IPN_SECRET=your-ipn-secret

# OneSignal (Push Notifications)
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_REST_API_KEY=your-rest-api-key
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

---

## Removal Checklist — Fortune Panda

Use this step-by-step checklist when setting up the new site:

### Backend

- [ ] Delete `backend/src/services/fortunePandaService.ts`
- [ ] Delete `backend/src/services/agentLoginService.ts`
- [ ] Delete `backend/src/routes/fortunePanda.ts`
- [ ] Delete `backend/src/routes/fortunePandaUser.ts`
- [ ] Delete `backend/src/routes/proxy.ts`
- [ ] Delete `backend/src/routes/games.ts`
- [ ] In `backend/src/index.ts`:
  - [ ] Remove imports for `fortunePanda`, `fortunePandaUser`, `proxy`, `games` routes
  - [ ] Remove `app.use()` mounts for those routes
  - [ ] Remove `fortunePandaService.initialize()` call
  - [ ] Remove `fortunePandaService.cleanup()` from shutdown handler
- [ ] In `backend/src/routes/admin.ts`:
  - [ ] Remove `fortunePandaService` import
  - [ ] Remove routes: `sync-fortune-panda`, `sync-balance`, `deposit`, `redeem`, `fix-fortune-panda`, `fix-fortune-panda-usernames`, `fortune-panda-info`, trade/jackpot/game record routes, FP password reset route
  - [ ] Remove FP fields from user query responses
- [ ] In `backend/src/models/User.ts`:
  - [ ] Remove `fortunePandaUsername`, `fortunePandaPassword`, `fortunePandaBalance`, `fortunePandaLastSync` fields
- [ ] Remove `FORTUNE_PANDA_*` env vars from `.env`

### Frontend

- [ ] Delete `frontend/src/pages/Games.tsx`
- [ ] Delete `frontend/src/pages/GameLaunch.tsx`
- [ ] Delete `frontend/src/pages/UserFortunePandaDashboard.tsx`
- [ ] Delete `frontend/src/services/fortunePandaApi.ts`
- [ ] In `frontend/src/App.tsx`:
  - [ ] Remove routes for `/games`, `/game/:id`, `/fortune-panda`
  - [ ] Remove lazy imports for those pages
- [ ] In `frontend/src/pages/Home.tsx`:
  - [ ] Remove game card sections and `handlePlayGame`
- [ ] In `frontend/src/pages/Dashboard.tsx`:
  - [ ] Remove game card sections and game launch logic
- [ ] In `frontend/src/pages/aceagent/AceagentDashboard.tsx`:
  - [ ] Remove FP balance display, refresh balance, sync from FP button
  - [ ] Remove deposit/redeem functionality
  - [ ] Remove fix FP account button
  - [ ] Remove FP username column from user table
  - [ ] Remove agent balance display
  - [ ] Remove trade/jackpot/game record tabs
  - [ ] Remove `autoSyncBalancesFromFP` function
- [ ] In `frontend/src/pages/aceadmin/AceadminDashboard.tsx`:
  - [ ] Remove Fix FP Account button
  - [ ] Remove FP-related user table columns
- [ ] Remove `VITE_GAMES_API_URL` from frontend env
- [ ] Remove any `trackFeature('game_launch', ...)` calls

---

## Setup Guide

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Brevo account (for email)
- NOWPayments account (for crypto, optional)
- OneSignal account (for push, optional)
- Cloudinary account (for images, optional)

### 1. Clone and Install

```bash
git clone <repo-url> new-site
cd new-site

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Copy and fill in the env files:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/env.example frontend/.env
# Edit frontend/.env with your API URL
```

### 3. Remove Fortune Panda Code

Follow the [Removal Checklist](#removal-checklist--fortune-panda) above.

### 4. Start Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The backend starts on `http://localhost:5000` and the frontend on `http://localhost:5173`.

On first startup, a super-admin agent is automatically created using `AGENT_USERNAME` and `AGENT_PASSWORD` from the backend env.

### 5. Access Panels

| Panel | URL | Login |
|---|---|---|
| Main site | `http://localhost:5173` | User registration |
| Agent panel | `http://aceagent.localhost:5173` | Agent credentials |
| Admin panel | `http://aceadmin.localhost:5173` | Super-admin credentials |

> Note: Subdomain routing uses `RoleSubdomainGuard`. In development you may need to configure local DNS or adjust the guard for `localhost`.

### 6. Build for Production

```bash
# Frontend
cd frontend
npm run build
# Output in frontend/dist/

# Backend
cd backend
npm run build
# Output in backend/dist/
```

### 7. Deployment Notes

- Frontend is a static SPA — deploy to any CDN/static host (Vercel, Netlify, Cloudflare Pages)
- Backend is a Node.js server — deploy to VPS, Railway, Render, etc.
- Configure CORS origins in backend env to match your production domains
- Set up MongoDB Atlas or self-hosted MongoDB
- Configure webhook URLs for NOWPayments IPN
- Set up subdomain DNS for agent/admin panels
