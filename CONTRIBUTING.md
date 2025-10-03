
# Contributing Guidelines

Welcome! This repo uses **strict working rules** for both humans and coding agents.

## 🔑 Core Principles
1. No shortcuts: implement required work end-to-end (create/update/delete/fix).
2. Security first: never expose vulnerabilities; default-deny across the stack.
3. Single Source of Truth: define once, reuse everywhere (types, env, configs, tokens, styles).
4. Orderly codebase: clean, modular folders; remove dead code.
5. Document without leaking: great docs, zero secrets.
6. Fail fast, fail loud: actionable error messages; no silent failures.

## 🛠 Development Workflow
- **Plan → Propose → Apply**. Agents must output a plan/diff preview before changes.
- All changes go through **Pull Requests** to `main`. No direct pushes.
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.
- **Atomic PRs**: one logical change per PR. Big-bang PRs need prior approval.
- **Issue linking**: every PR must link a tracked issue.
- **Review buddy rule**: at least one human review, even for AI-generated code.
- **Commit signing**: sign commits/tags (GPG/Sigstore). Unsigned commits are rejected.

## 📂 Project Standards
- Typed code (TS `strict` or language equivalent). No `any` by default.
- Lint/format enforced in CI; zero warnings policy.
- Folder conventions for monorepos: `apps/`, `libs/`, `infra/`, `packages/`.
- Config via env only (12-factor). Validate at boot against a schema (Zod/Joi).
- No `latest` tags (Docker, deps). Pin versions and use lockfiles.

## 🔐 Security & Supply Chain
- **Least privilege** for tokens, DB users, IAM; rotate secrets.
- **Zero trust inputs**: validate, sanitize, escape, encode.
- **CORS**: explicit origins; never `*` for credentialed requests.
- **HTTPS**, HSTS, CSP, security headers; cookies `Secure` + `HttpOnly` + `SameSite`.
- **Secrets scanning**: gitleaks/secret scanning must pass.
- **Dependency Review**: justify new libraries; avoid typosquats; license compatibility.
- **CodeQL + npm audit** must pass; block on high/critical findings.
- Webhooks: signature verification, nonce/replay protection, idempotency keys.

## 🧪 Testing & Quality
- Testing pyramid: unit > integration > e2e.
- Deterministic tests only (no flaky time/network). Use fakes.
- **Coverage gates**: changed files must keep or raise coverage (thresholds in CI).
- Contract tests for inter-service APIs & webhooks.
- Every bug fix ships with a regression test.
- Fuzz tests for parsers/endpoints that handle untrusted input.

## 📊 Observability & Ops
- Structured logs (JSON). No secrets. Triageable levels.
- Metrics (SLIs/SLOs): latency, error rate, saturation, cost.
- Tracing with correlation IDs; propagate across services.
- Runbooks for every new feature: how to monitor, troubleshoot, rollback.
- Chaos testing for high-critical paths; graceful degradation and timeouts.

## 🤖 AI/Agent Guardrails
- Output **reasoning/justification** for changes (why + alternatives).
- **Dry-run** mode by default; show diffs before applying writes.
- Tag AI-authored commits with `[ai]` or bot signature.
- No exfiltration of code/data to external tools without permission.
- Redact secrets/PII in prompts, logs, artifacts.

## 🚫 Prohibited
- Direct pushes to protected branches.
- Large binaries (>5MB) without Git LFS.
- Untracked DB migrations.
- TODOs without linked tickets and due dates.
- Debug flags left enabled in production builds.

## ✅ Acceptance Checklist (Merge Gate)
- [ ] Design reviewed; ADR filed if needed
- [ ] Lint/type/tests/security checks pass
- [ ] Coverage on changed files ≥ threshold
- [ ] Docs & runbooks updated
- [ ] Observability (logs/metrics/traces) added
- [ ] Rollback plan verified
- [ ] Owner assigned; issue linked
