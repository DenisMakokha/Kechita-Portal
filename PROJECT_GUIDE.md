
# Kechita Staff Portal — Comprehensive Guide

_Last updated: 2025-10-02_

This guide describes the architecture, modules, security model, and operating procedures for the **Kechita Staff Portal**. The system is designed as a **Single Source of Truth (SSOT)** for staff operations and communications across Kechita Capital, with first-class support for **Recruitment** (including automated application filtering for internal/external candidates and regret notifications), **Approvals**, **Dashboards**, and **Compliance**.

---

## 1) Objectives

- Centralize all staff operations in one secure platform (**SSOT**).
- Digitize and automate HR processes (recruitment, interviews, offers, onboarding, leave, claims, loans).
- Enable **role-based** insights and approvals across HQ, regional, and branch levels.
- Provide **real-time** updates via WebSockets and **multi-channel** comms (in-app, email, SMS in future).
- Maintain **auditability** and **compliance** with clear approval chains and versioned policies.

---

## 2) Tech Stack

- **Backend:** Node.js (TypeScript), Express, Prisma (PostgreSQL)
- **Frontend:** React (Vite) + Tailwind
- **Mobile:** React Native (Expo-ready skeleton) for Executive dashboards
- **Real-time:** Socket.IO (in-process; pluggable stores for scale-out)
- **Email:** Nodemailer (SMTP)
- **PDFs:** pdf-lib (Offer letters)
- **Schema & SSOT:** Shared contracts (Zod), roles, events in `packages/common`
- **Repository:** pnpm workspaces monorepo

---

## 3) Repository Layout

```
apps/
  api/                    # Express API + WebSocket gateway
    src/modules/
      auth/
      recruitment/        # Jobs, Applications, Interviews, Offers, Contracts, Onboarding
      ...                 # future: leave, claims, loans, reports
    src/middleware/       # auth (JWT), role guards
    src/utils/            # email helper
    src/assets/           # logo for PDF header
  web/                    # React + Tailwind
    src/pages/            # Jobs, PostJob, Applications, Interview, Offer, Onboarding, Login
    src/stores/           # Auth store (Zustand)
    src/components/       # Protected (RBAC guard)
  mobile/                 # RN skeleton (executive KPIs)
packages/
  common/                 # SSOT: zod schemas, roles, event names
  db/                     # Prisma schema & client
  config/                 # tsconfig baseline
```

---

## 4) SSOT Architecture

**SSOT Root:** `packages/common`  
- Roles: `superadmin`, `hr`, `manager`, `staff`, `finance`, `exec`
- Event names: announcements, claims, leave, recruitment events
- Data contracts (Zod): `JobPostingSchema`, `ApplicationSchema` (extendable)

**Principles:**
- All modules reference the same shared types/enums/taxonomies.
- API validates inputs against Zod schemas from SSOT.
- DB schema is defined in Prisma and kept in sync with code via migrations.
- Frontend components rely on SSOT types to render and validate forms.

---

## 5) Security Model

- Authentication: JWT (httpOnly cookie by default; Bearer supported).
- Authorization (RBAC): API routes guarded by `requireRoles(...roles)` middleware and UI routes protected by `<Protected roles=[...]>`.
- Data Validation: Zod at API edges; Prisma constraints at DB.
- Transport: Enforce HTTPS in production; strict CORS allowlist via `CORS_ORIGINS`.
- Secret Management: `.env` (local), external secret store for prod.
- Auditability: Offers, Interviews, Onboarding, and future modules maintain status history and timestamps. Extend with audit tables if needed.
- Email security: SMTP creds stored in env; DKIM/SPF recommended at domain level.

---

## 6) Recruitment Module (Full)

### 6.1 Entities (Prisma)
- `JobPosting` — position metadata (title, description, branch, region, deadline, type).
- `Application` — internal/external candidate profile + status (`RECEIVED -> SHORTLISTED -> INTERVIEW -> OFFER -> HIRED/REJECTED`).
- `Interview` — schedule (panel, mode, location, start/end).
- `Offer` — details (title, salary, currency), `contractText`, `signatureDataUrl`, status.
- `ContractTemplate` — versionable body with placeholders (`{firstName}`, `{jobTitle}`, etc.).
- `OnboardingTask` — reusable tasks library.
- `OnboardingItem` — per-candidate checklist.

### 6.2 API Highlights
- Jobs: `GET /recruitment/jobs` (public), `POST /recruitment/jobs` (HR/Manager).
- Applications: `POST /recruitment/applications` (public), `GET /recruitment/applications/:jobId` (HR/Manager).
- Interviews: create/list + `.ics` download + email to panel.
- Offers: create/send/accept/decline; generate PDF (with logo + footer); email offer PDF; simple e-signature.
- Onboarding: seed tasks -> init checklist -> mark complete per item.

> See `apps/api/src/modules/recruitment/routes.ts` for endpoints.

### 6.3 Automated Application Ingestion & Filtering (Internal & External)

**Goals:**
- Automatically triage large volumes of applications, reduce time-to-first-screen.
- Apply consistent, auditable filtering rules.
- Preserve human-in-the-loop control for overrides by HR/Manager roles.
- Send regret emails to unsuccessful candidates at the right stage.

**Workflow:**

1. Capture  
   - External candidates: public form -> `POST /recruitment/applications`.
   - Internal candidates: authenticated staff UI or SSO link -> same endpoint with `applicantType='INTERNAL'`.
   - Attachments (CVs/letters) supported via `resumeUrl` (file-service can be integrated later).

2. Enrich  
   - Normalize fields (phone, email), derive features (years of experience, keyword matches).
   - Optional: parse résumé content (future) via a parsing service.

3. Score  
   - Rule-based scorecard (extendable):
     - Must-have keywords by job (title/description). If missing -> auto-regret (optional).
     - Preferred skills/keywords -> +weights.
     - Education level/Certifications -> +weights (job-specific).
     - Experience years thresholds -> +weights or reject below minimum.
     - Internal applicants -> bonus weight.
     - Branch/Region proximity -> bonus weight.
   - Produce `score`, `reasons[]`, `decision` in `{AUTO-REJECT, REVIEW, SHORTLIST}` with thresholds configured per job.

4. Route  
   - If `SHORTLIST` -> HR/Manager queue.
   - If `AUTO-REJECT` and auto-regret is enabled for the job -> queue for regret notification.
   - If `REVIEW` -> HR triage list (with reasons).

5. Notify  
   - Batch regret emails (templated) for candidates marked `AUTO-REJECT` (or `REJECTED` later by HR/Manager).  
   - Personalize with tags: candidate name, job title, branch, and optional encouragement.

6. Audit & Override  
   - All automated decisions logged with score & reasons. HR/Manager can override any decision, re-invite to interview or revert to inbox.

**Implementation Notes:**

- SSOT Rules: Put job-specific rules in a `RecruitmentRuleSet` (future Prisma table) referenced by job, or static config file read by API.  
- Scoring Service: Implement as a pure TS module under `apps/api/src/modules/recruitment/scoring.ts` (deterministic + unit tests).  
- Regrets Service: `apps/api/src/modules/recruitment/regrets.ts` with batched `sendMail()` calls and throttle; HR-initiated or scheduled.
- Flags: Per-job flags: `{ autoRegret: boolean, shortlistThreshold: number, rejectThreshold: number }`.
- Status Changes: When final status is set to `REJECTED`, enqueue a regret email if not already sent.

**Minimal Table Additions (future):**
- `RecruitmentRuleSet` (json: keywords, mustHave, minExperience, education, boosts, thresholds)
- `RegretTemplate` (subject, body HTML/text, locale, context)
- `DecisionLog` (applicationId, score, decision, reasons, actor: 'system'|'user', timestamp, overrides)

### 6.4 Regret Messaging

- Endpoint (future): `POST /recruitment/regrets/batch` with `{ jobId, statusFilter, templateId }` to send regrets for all matching applications.
- Individual: `POST /recruitment/applications/:id/regret` for a single candidate.
- Email content templated with placeholders: `{firstName}`, `{jobTitle}`, `{branch}`, `{region}`, `{company}`.
- Safety: rate-limit, opt-out link (future), log `messageId` and delivery status.

---

## 7) RBAC & Dashboards

- Admin (Superadmin): Manage roles, branches, regions, templates, rule-sets, user lifecycle.
- HR: Full Recruitment, Onboarding, policy acknowledgements, leave/claims queue.
- Manager (Regional/Branch): Targets vs actuals, approvals, local announcements.
- Finance: Staff loans, salary advances, repayments; exports.
- Staff: My tasks, my applications, payslips, leave/claims status.
- Exec (Mobile): KPIs snapshot: production, collections, arrears, PAR, approvals.

---

## 8) Emails, PDFs & Calendar

- SMTP: configure in `apps/api/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
- Offer PDFs: `GET /recruitment/offers/:id/pdf` includes header logo and footer; content from `Offer.contractText`.
- E-Signature: stored as `signatureDataUrl` on `Offer` (PNG base64).
- Calendar: `.ics` via `GET /recruitment/interviews/:id/ics`; email to panel with `POST /recruitment/interviews/:id/email`.

---

## 9) Local Setup (No Docker)

1. Install PostgreSQL 14+ and create DB:
   ```sql
   CREATE USER kechita WITH PASSWORD 'kechita';
   CREATE DATABASE kechita OWNER kechita;
   GRANT ALL PRIVILEGES ON DATABASE kechita TO kechita;
   ```
2. Configure API env:
   ```bash
   cd apps/api && cp .env.example .env
   # update DATABASE_URL / JWT_SECRET / SMTP_*
   ```
3. Install and push schema:
   ```bash
   npm i -g pnpm
   pnpm i
   pnpm --filter @kechita/api prisma:push
   ```
4. Run:
   ```bash
   pnpm dev:api   # http://localhost:4000
   pnpm dev:web   # http://localhost:5173
   ```

---

## 10) Testing Strategy

- Unit tests (priority): scoring rules, regret templating, contract text placeholder replacement.
- Integration: API endpoints for recruitment flows (jobs, applications, interviews, offers, onboarding).
- Security: authz middleware path tests (role matrices), input validation (Zod) tests.
- PDF/ICS snapshot: semantic checks (presence of fields) instead of byte-for-byte image diffs.

---

## 11) Observability & Ops (Roadmap)

- Correlation IDs in logs; structured JSON logs.
- Metrics endpoints (Prometheus) for queue lengths, email sends, errors.
- Alerting: SMTP failures, PDF generation failures, scoring anomalies (too many auto-rejects).
- Optional job queue (e.g., BullMQ/Redis) when scale requires it.

---

## 12) Extending to Leave, Claims & Loans (Workflow Engine)

- Extract a generic workflow engine: Request -> State -> Transition -> Approval -> Notify.
- Reuse for Leave, Claims, and Staff Loans with role-specific policies and SLAs.
- Shared Approvals UI with timeline, comments, attachments, and audit trail.

---

## 13) Governance & Security Files (Already Included)

- `PULL_REQUEST_TEMPLATE.md` – PR checklist with security and QA gates.
- `CONTRIBUTING.md` – contribution rules, reviews, coverage.
- `SECURITY.md` – security practices, reporting.
- `.gitleaks.toml` – secret scanning baseline.

---

## 14) Roadmap Summary

- [x] Recruitment basics (Jobs, Applications)
- [x] Interviews (.ics)
- [x] Offers (PDF + e-sign)
- [x] Onboarding checklist
- [x] RBAC + guarded screens
- [x] Email delivery (PDF, ICS)
- [ ] Automated application scoring & regret sender (Service + UI + audit log)
- [ ] Workflow engine for Leave/Claims/Loans
- [ ] Mobile exec KPIs (live Socket.IO)
- [ ] Exports & analytics (PDF/Excel)
- [ ] SMS integration for urgent alerts

---

## 15) FAQ

**Q:** Can we disable auto-regrets?  
**A:** Yes—keep auto-regret off at the job level, or set thresholds such that candidates land in REVIEW instead of AUTO-REJECT.

**Q:** How do we brand Offer PDFs?  
**A:** Replace `apps/api/src/assets/logo.png` and adjust fonts/spacing in the PDF generation block.

**Q:** How to add new fields to Applications?  
**A:** Update `schema.prisma`, regenerate/push with Prisma, add fields to `ApplicationSchema` in SSOT, then extend UI/API.

---

**Maintainers:** HR Tech Team @ Kechita  
**Contact:** hr-tech@kechita.local
