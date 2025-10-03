# Kechita Staff Portal — Monorepo (No Docker)

Tech stack: **Node.js (TypeScript), PostgreSQL, React + Tailwind, WebSockets (Socket.IO)**.

- `apps/api` — Express + Prisma + Zod. RBAC-ready auth, JWT cookies. WebSocket gateway.
- `apps/web` — Vite + React + Tailwind. Role dashboards + Recruitment screens.
- `apps/mobile` — React Native (Expo-ready skeleton) for executive snapshot.
- `packages/common` — SSOT: shared Zod schemas, RBAC roles, event names.
- `packages/db` — Prisma client + schema for PostgreSQL.
- `packages/config` — Shared tsconfig.

## Quick start (local, no Docker)
1. Install PostgreSQL 14+ and create DB/user:
   ```sql
   CREATE USER kechita WITH PASSWORD 'kechita';
   CREATE DATABASE kechita OWNER kechita;
   GRANT ALL PRIVILEGES ON DATABASE kechita TO kechita;
   ```
2. Configure API env:
   ```bash
   cd apps/api && cp .env.example .env
   # ensure: DATABASE_URL="postgresql://kechita:kechita@localhost:5432/kechita?schema=public"
   ```
3. Install and run:
   ```bash
   npm i -g pnpm
   pnpm i
   pnpm --filter @kechita/api prisma:push
   pnpm dev:api    # http://localhost:4000
   pnpm dev:web    # http://localhost:5173
   ```

## Security baselines
- Zod validation at API boundary, JWT httpOnly cookies, strict CORS.
- Repo governance: PR template, contributing guide, security policy, secret scanning.


## Recruitment extensions included
- **Interviews:** schedule (online/physical), panel, times, notes.
- **Offers & e-contracts:** create/send/accept/decline; string-based contract generator using templates.
- **Onboarding Wizard:** reusable task library + per-hire checklist with completion tracking.

### API highlights
- `POST /recruitment/interviews` + `GET /recruitment/interviews/:applicationId`
- `POST /recruitment/offers` + `/offers/:id/{send|accept|decline}`
- `POST /recruitment/contracts/generate` (template → final text)
- `POST /recruitment/onboarding/seed-tasks` → `POST /recruitment/onboarding/init` → `GET /recruitment/onboarding/:applicationId` → `POST /recruitment/onboarding/:itemId/complete`

> After pulling deps, run Prisma push again to apply the new tables.


## RBAC & guarded routes (NEW)
- API middleware: `authenticate` (JWT from cookie/Authorization) and `requireRoles('hr','manager','superadmin')`.
- Guarded endpoints for recruitment actions (create jobs, list applications, schedule interviews, offers, onboarding).
- Web app `Protected` component that checks role and protects HR/Manager sections.

### Quick test accounts
Seed dev users (password: `password`):
```bash
curl -X POST http://localhost:4000/auth/seed-dev
```
Then sign in via **/login** with:
- `hr@kechita.local` (HR)
- `manager@kechita.local` (Manager)
- `superadmin@kechita.local` (Superadmin)
- `staff@kechita.local` (Staff)


## Offer PDFs + e‑signature (NEW)
- `GET /recruitment/offers/:id/pdf` – generates a PDF (using pdf-lib) including optional saved signature.
- `POST /recruitment/offers/:id/contract-text` – persist generated/edited contract text.
- `POST /recruitment/offers/:id/sign` – store a simple e‑signature (Data URL) and mark offer accepted.

## Interview calendar (.ics) (NEW)
- `GET /recruitment/interviews/:id/ics` – downloads an RFC 5545 `.ics` file for the interview.

### Frontend
- **Offer page** now lets you generate contract text from a template, save it, download PDF, and capture an in-browser signature.
- **Interview page** includes an `.ics` downloader helper (enter interview ID).

> After pulling, run: `pnpm --filter @kechita/api prisma:push` to apply new Offer fields.


## Email delivery (NEW)
Set your SMTP credentials in `apps/api/.env`:
```
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Kechita HR <hr@kechita.local>"
```
Endpoints:
- `POST /recruitment/offers/:id/email` with `{ to }` — emails candidate **PDF offer**
- `POST /recruitment/interviews/:id/email` with `{ to }` — emails panel the **.ics invite**

## Themed Offer PDF (NEW)
- Header with **logo** (`apps/api/src/assets/logo.png`) and company name
- Footer with confidentiality note
Replace the placeholder logo with your real PNG to brand the generated PDFs.


## Job listing + per-job applications (NEW)
- Public **Job Details** page at `/job/:id` with an application form.
- Submits to `POST /recruitment/applications/apply` which auto-scores and sets an initial status, optionally sending regret email if `AUTO_REGRET=true` in API env.
- Jobs list now links to each **View & Apply** page.

## Logo branding
- Added `apps/web/src/assets/KechitaLogo.svg` and used it in the header across the web app.

## Per-Job Rule-Sets, Regret Templates & Batch Send (NEW)
- **Rule-Sets** per job: `GET/PUT /recruitment/jobs/:id/rules` + UI at `/job/:id/rules` (HR/Manager/Superadmin).
- **Regret Templates**: `GET/POST /recruitment/regret-templates`; batch regrets at `POST /recruitment/regrets/batch` + UI `/job/:id/regrets`.
- **Resume Text** field added to application form; scoring uses it immediately.

## Offer PDF Logo (PNG preferred)
- Place a high-res PNG export of your SVG at `apps/api/src/assets/KechitaLogo.png` for PDF header branding.
