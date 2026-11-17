# MediBridge — Technical Architecture & Data Governance Blueprint
**Visionet Techthon 2026 (Round 2: Solution Development Phase)**  
**Platform:** MediBridge Healthcare Coordination Platform  
**Authors:** Roma R, Ragavi R, Rithika KP (Sri Shakthi Institute of Engineering and Technology)

---

## 1. Architectural Philosophy: The Modular Monolith

MediBridge is deliberately built as a **modular monolith** rather than a premature microservices architecture. In clinical coordination, request latency, transaction atomicity, and data isolation are paramount.
- **Why Not Microservices:** Distributed transactions across multiple services introduce network latency, 2-phase commit failure modes, and eventual consistency delays. In healthcare slot booking, eventual consistency causes double-bookings.
- **Modularity:** High cohesion within domain modules (`auth`, `hospitals`, `search`, `booking`, `reassignment`, `referrals`, `vault`, `consent`, `audit`) and low coupling between modules via explicit service interfaces.
- **API Versioning:** All endpoints are versioned under `/api/v1` to allow smooth client upgrades without breaking mobile apps or PWA installations.
- **Standardized Contract:** Every response conforms to a predictable JSON schema:
  - Success: `{ "success": true, "data": ..., "meta": ... }`
  - Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] } }`

---

## 2. Multi-Tenant Isolation (Highest Architectural Priority)

In healthcare SaaS, cross-tenant data leakage is an existential failure. MediBridge enforces multi-tenant hospital isolation at two independent server layers:

```
[ Incoming Request with JWT ]
             │
             ▼
[ tenantGuard Middleware ]
  - Extracts verified hospitalId from JWT claims (never trusts body/query)
  - Checks if user is hospital_admin or doctor
  - If target hospitalId does not match user.hospitalId &rarr; throws 404 RESOURCE_NOT_FOUND
  - If route is Vault route & user is hospital_admin &rarr; throws 403 VAULT_ACCESS_PROHIBITED
             │
             ▼
[ Mongoose Tenant Plugin ]
  - Injects { hospitalId: req.tenantHospitalId } into pre-find and pre-aggregate hooks
  - Guarantees developers cannot accidentally write a query that queries across tenants
             │
             ▼
[ MongoDB Database Execution ]
```

### Key Isolation Rules Enforced on Server:
1. **Hospital Admins Can NEVER Read Health Vault Records:** Hospital admins manage operational beds, schedules, and leaves. They are strictly prohibited from viewing patient diagnostic documents (HTTP 403).
2. **Super-Admin Cannot Read Vault File Contents:** Super-admins oversee platform metrics and hospital onboarding, with zero access to clinical scans.
3. **Doctors See ONLY Their Own Patients & Consented Records:** A doctor can query patient files *only* when an active, unexpired, unrevoked `ConsentArtifact` exists naming that specific doctor.
4. **Patients See ONLY Their Own & Authorized Family Profiles:** Foreign profile requests return HTTP 404 to avoid leaking patient existence.

---

## 3. Data Governance & Patient Privacy Controls (DPDP 2023)

1. **Purpose Limitation & Ephemeral Consent:**
   - Consents are granted for a specific clinical purpose (e.g. *"Cardiology Pre-Referral Evaluation"*) with an enforced time ceiling (maximum 24 hours).
   - Dynamic validation on every request: 60-second time-limited signed tokens are issued only when consent is active.
   - Immediate Revocation: Patients can revoke consent at any moment. Subsequent doctor requests are immediately blocked with HTTP 403.
2. **Append-Only Patient Access Log:**
   - Every file download, metadata view, consent grant, and access denial is written to an immutable `PatientAccessLog` collection.
   - Patients can inspect their complete access history directly on their dashboard: *who viewed what, exact timestamp, clinical purpose, and whether it was permitted or denied*.
3. **Data Minimization in Communications:**
   - Diagnostic codes and sensitive clinical findings are stripped from SMS notifications, transactional emails, and family alert payloads.
   - Insurance policy numbers and national identifiers are masked in all UI responses (`XXXX-XXXX-4921`).

---

## 4. Application Security & Defense-in-Depth

1. **Authentication Security:**
   - Dual-token architecture: 15-minute short-lived JWT access tokens + rotating UUID refresh tokens.
   - **Refresh Token Family Tracking & Reuse Detection:** If a previously rotated refresh token is submitted (e.g. by an attacker who intercepted an old token), the entire token family is immediately revoked, and `user.tokenVersion` is incremented—instantly kicking all active sessions offline.
   - **Account Lockout:** 5 consecutive failed login attempts triggers an automated 15-minute account freeze (HTTP 429).
2. **Input Sanitization & Injection Prevention:**
   - `express-mongo-sanitize` strips any `$` or `.` operators from incoming request bodies, query parameters, and headers, blocking NoSQL injection vectors.
   - Helmet sets strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
3. **File Validation Architecture:**
   - 10 MB strict size ceiling.
   - Magic-byte verification inspecting raw buffer headers (`%PDF`, `\x89PNG`, `\xFF\xD8\xFF`), preventing executable renaming attacks (`exploit.exe` renamed to `scan.pdf`).
   - SHA-256 deduplication hash prevents duplicate uploads.
   - Physical files stored in a private directory with random UUID storage keys (raw client filenames never touch the disk path).

---

## 5. Clinical Safety & Legal Scope Boundaries

MediBridge is strictly a **healthcare coordination and availability verification engine**. The platform intentionally incorporates hard clinical safety guardrails:
- **Zero Automated Diagnosis:** The system never predicts diseases, scores symptoms, or dispenses clinical triage algorithms.
- **Zero Electronic Prescribing:** The system coordinates availability, appointments, referrals, and document transfers without issuing prescription orders.
- **Verification Disclaimers:** All synthetic demo credentials explicitly carry `"Demo, not verified"`.
- **Emergency Priority:** In acute or life-threatening situations, MediBridge immediately directs users to 108 emergency telephony and physical trauma centers.
