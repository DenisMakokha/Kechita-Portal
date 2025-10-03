# Security Policy

## 🚨 Principles
- **Zero trust inputs**: validate, sanitize, escape.
- **Least privilege**: every token, DB user, and API key must be scoped minimally.
- **No secrets in code/logs**: use Vault/KMS/Env vars.
- **Defense in depth**: multiple layers of auth, checks, and monitoring.

## 🔐 Secure Coding Rules
- HTTPS everywhere (TLS 1.2+).
- Cookies: Secure, HttpOnly, SameSite.
- CORS: explicit origin lists, never "*".
- DB: enforce constraints, no unbounded queries.
- Dependencies: use SCA scanning, pinned versions.
- Tests: include security tests (authz, injection, SSRF).

## 🧑‍💻 Reporting Vulnerabilities
- Report issues privately via [security@nelium.cloud](mailto:security@nelium.cloud).
- Do not open public issues for vulnerabilities.
