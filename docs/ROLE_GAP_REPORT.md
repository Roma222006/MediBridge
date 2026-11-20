# MediBridge — Role Completion & Verification Gap Audit Report

**Date:** 20 November 2026  
**Audience:** System Architect & Reviewer Panel  
**Phase:** Phase 1 — Comprehensive Gap Audit (No Feature Code Modified)  
**Status:** Awaiting Review & Approval to Begin Phase 2  

---

## 1. Executive Summary & Existing Test Baseline

A full execution and verification of the existing MediBridge test suite was conducted against the local database environment (`mongodb://127.0.0.1:27017/medibridge_test`).

### 1.1 Test Suite Results
- **Test Suites:** 9 passed out of 9 total (100% pass rate)
- **Tests:** 47 passed out of 47 total
- **Execution Time:** ~25.05s
- **Suites Verified:**
  1. `tests/module1_foundation.test.js`: Auth, password hashing, lockout, token rotation, family profiles isolation
  2. `tests/module2_search.test.js`: 2dsphere spatial search, bed freshness timestamps, stale data flags
  3. `tests/module3_booking.test.js`: Atomic slot hold, concurrency 409 conflict, Idempotency-Key caching, schedule overlap, atomic reschedule
  4. `tests/module4_reassignment.test.js`: Doctor leave overlap detection, 2-choice reassignment workflow, ALREADY_HANDLED resolution
  5. `tests/module5_referral.test.js`: 7-stage referral lifecycle, dedupeKey prevention, journey metrics
  6. `tests/module6_vault.test.js`: Magic bytes validation, 10MB cap, ephemeral consent, 60s signed URLs, instant revocation, tenant boundary (admins blocked)
  7. `tests/module7_emergency.test.js`: Zero-auth public access, offline data bundle, 108 emergency dial
  8. `tests/module8_portal_teleconsult.test.js`: Doctor agenda, participant-bound teleconsult session tokens, waiting room
  9. `tests/performance.test.js`:
     - 1,000 Hospital Spatial Search: **39 ms** (Target: < 2,000 ms)
     - 100 Parallel Spatial Searches: **2,135 ms** (100/100 HTTP 200)
     - 50 Parallel Booking Race: Exactly **1 Success (200 OK)**, **49 Conflicts (409 SLOT_TAKEN)**, **0 Orphan Holds**

---

## 2. Live Permission Matrix Probe Results

A live probe script (`scripts/probe-permissions-live.js`) was executed against the running backend server (`http://127.0.0.1:5000/api/v1`) using authentic seeded JWT tokens for each role:
- **Guest** (No Token)
- **Patient** (`roma.patient@medibridge.org`)
- **Doctor** (`dr.sundaram@medibridge.org`, KMCH)
- **Hospital Admin A** (`admin.kmch@medibridge.org`, KMCH)
- **Hospital Admin B** (`admin.psg@medibridge.org`, PSG Institute)
- **Super-Admin** (`superadmin@medibridge.org`)

### 2.1 Live Route Probing Findings

| Endpoint | Guest | Patient | Doctor | Hosp Admin | Super-Admin | Evaluation / Security Finding |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `GET /emergency/nearest` | 200 | 200 | 200 | 200 | 200 | **Correct.** Zero-auth public emergency endpoint. |
| `GET /emergency/offline-bundle` | 200 | 200 | 200 | 200 | 200 | **Correct.** Public service worker cache bundle. |
| `GET /search` | 200 | 200 | 200 | 200 | 200 | **Correct.** Public hospital availability discovery. |
| `GET /search/slots` | 400 | 400 | 400 | 400 | 400 | **Correct.** Public slots query (400 on missing params). |
| `PATCH /search/hospitals/:id/bed-capacity` | 401 | 403 | 403 | 404* / 200 | 400 | **Correct & Enforced.** Patient & Doctor denied (403); Admin B denied Admin A (404 via tenantGuard). |
| `GET /patient-profiles` | 401 | 200 | 403 | 403 | 200 | **Partially Insecure.** Super-admin should not query patient family profiles directly. |
| `GET /bookings/my-bookings` | 401 | 200 | 200 | 200 | 200 | **SECURITY DEFECT:** Route lacks `rbacMiddleware('patient')`. Doctor/Admins get 200 with empty list instead of 403. |
| `POST /bookings/hold` | 401 | 400 | 400 | 400 | 400 | **SECURITY DEFECT:** Route lacks role restriction; any authenticated role can initiate booking holds. |
| `POST /bookings/confirm` | 401 | 400 | 400 | 400 | 400 | **SECURITY DEFECT:** Route lacks role restriction; any authenticated role can confirm bookings. |
| `GET /reassignments/pending` | 401 | 200 | 200 | 200 | 200 | **SECURITY DEFECT:** Missing patient RBAC restriction. |
| `POST /reassignments/leave` | 401 | 403 | 403 | 400 | 400 | **Defect:** Super-admin allowed in RBAC but lacks hospitalId context. |
| `GET /doctor/schedule` | 401 | 403 | 200 | 403 | 403 | **Correct.** Only doctor can access own schedule. |
| `GET /doctor/referrals` | 401 | 403 | 200 | 403 | 403 | **Correct.** Doctor specialty referrals isolated. |
| `GET /referrals` | 401 | 403 | 200 | 200 | 403 | **Correct.** Scoped to doctor and hospital admin. |
| `POST /referrals` | 401 | 403 | 400 | 400 | 403 | **DEFECT:** Hospital admin is permitted to create referrals. Section 3 Matrix: Doctor ONLY. |
| `PATCH /referrals/:id/accept` | 401 | 403 | 400 | 400 | 403 | **DEFECT:** Doctor is permitted to accept referrals. Section 3 Matrix: Hospital Admin (receiving) ONLY. |
| `GET /admin/overview` | 401 | 403 | 403 | 200 | 500 | **DEFECT:** Super-admin hits 500 unhandled error due to null `hospitalId`. |
| `GET /admin/slots` | 401 | 403 | 403 | 200 | 200 | **Correct tenant isolation:** Admin B cannot view Admin A slots. |
| `GET /vault/records` | 401 | 400 | 400 | 403 | 403 | **Correct & Enforced.** Admin and Super-Admin strictly blocked (403 `VAULT_ACCESS_PROHIBITED`). |
| `GET /vault/access-logs` | 401 | 400 | 400 | 403 | 403 | **Correct.** Patient ownership enforced; admins blocked. |

---

## 3. Table 1: DONE Features (Works, Verified, Tested)

| Feature / Requirement | Role Scope | Evidence (File, Endpoint, Test) | Verification Notes |
| :--- | :--- | :--- | :--- |
| **Emergency Mode (Zero-Auth)** | Guest / All | `emergencyController.js`, `GET /api/v1/emergency/nearest`, `tests/module7_emergency.test.js` | Works without login; includes GPS / Haversine fallback, reported bed figures, and age disclaimer. |
| **Emergency Offline Data Bundle** | Guest / All | `emergencyController.js`, `GET /api/v1/emergency/offline-bundle`, `tests/module7_emergency.test.js` | Service-worker ready JSON bundle of emergency trauma centers with 108 dial. |
| **Public Hospital Discovery Search** | Guest / All | `searchController.js`, `GET /api/v1/search`, `tests/module2_search.test.js` | 2dsphere spatial search with filtering by specialty, service, schemes, distance, price ceiling. |
| **Public Slot Availability Query** | Guest / All | `searchController.js`, `GET /api/v1/search/slots`, `tests/module2_search.test.js` | Real-time slot availability for verified hospitals. |
| **Authentication & Password Lockout** | All Roles | `authController.js`, `POST /api/v1/auth/login`, `tests/module1_foundation.test.js` | Bcrypt hashing, 5-attempt lockout (429), tokenVersion instant invalidation. |
| **Refresh Token Rotation & Replay Detection** | All Roles | `authController.js`, `POST /api/v1/auth/refresh-token`, `tests/module1_foundation.test.js` | UUID token family tracking; replay triggers global tokenVersion increment. |
| **Session Invalidation (One-Click)** | All Roles | `authController.js`, `POST /api/v1/auth/revoke-all-sessions`, `tests/module1_foundation.test.js` | Increments `tokenVersion`; immediately invalidates all active JWT tokens. |
| **Family Patient Profiles & Isolation** | Patient | `patientProfileController.js`, `/api/v1/patient-profiles`, `tests/module1_foundation.test.js` | Multi-profile management (`self`, `parent`, `child`, `spouse`); Patient A cannot view Patient B (404). |
| **Two-Phase Atomic Slot Reservation** | Patient | `bookingService.js`, `POST /api/v1/bookings/hold`, `tests/module3_booking.test.js` | Atomic 10-minute hold; prevents double booking under 50-client concurrency race. |
| **Idempotency-Key Header Caching** | Patient | `idempotencyMiddleware.js`, `POST /api/v1/bookings/confirm`, `tests/module3_booking.test.js` | Returns identical cached response with `X-Cache-Lookup: HIT`; duplicate concurrent requests return 409. |
| **Patient Schedule Overlap Check** | Patient | `bookingService.js`, `POST /api/v1/bookings/confirm`, `tests/module3_booking.test.js` | Blocks same profile from booking conflicting appointments on identical date/time intervals. |
| **Atomic Reschedule** | Patient | `bookingService.js`, `POST /api/v1/bookings/:id/reschedule`, `tests/module3_booking.test.js` | Holds new slot first; if unavailable, rolls back cleanly preserving existing booking. |
| **Doctor Leave & Overlap Detection** | Hospital Admin | `reassignmentService.js`, `POST /api/v1/reassignments/leave`, `tests/module4_reassignment.test.js` | Flags affected appointments as `REASSIGNMENT_PENDING`; blocks doctor slots. |
| **Two-Choice Reassignment Workflow** | Patient | `reassignmentService.js`, `POST /api/v1/reassignments/resolve/:id`, `tests/module4_reassignment.test.js` | Option A (peer specialist), Option B (same doctor new date), or Emergency 108 redirect. |
| **Rural-to-City Referral Lifecycle** | Doctor / Hosp Admin | `referralService.js`, `/api/v1/referrals`, `tests/module5_referral.test.js` | Complete 7-state progression from `SENT` to `COMPLETED`; tracks journey minutes. |
| **Referral dedupeKey Prevention** | Doctor | `referralService.js`, `POST /api/v1/referrals`, `tests/module5_referral.test.js` | Unique compound deduplication key prevents duplicate referral dispatches. |
| **Health Vault Document Upload & Magic Bytes** | Patient | `vaultController.js`, `POST /api/v1/vault/upload`, `tests/module6_vault.test.js` | Magic byte buffer verification (PDF, JPG, PNG), 10MB limit, SHA-256 deduplication. |
| **Ephemeral Consent Engine & Instant Revocation** | Patient / Doctor | `vaultService.js`, `/api/v1/vault/consent`, `tests/module6_vault.test.js` | Enforced duration (<24h); instant 403 on revocation; 60s signed download URLs. |
| **Append-Only Patient Access Log** | Patient | `vaultService.js`, `GET /api/v1/vault/access-logs`, `tests/module6_vault.test.js` | Immutable audit log of all clinical document views, downloads, and rejections. |
| **Vault Boundary Enforcement** | Hosp Admin / Super Admin | `tenantGuard.js`, `/api/v1/vault/*`, `tests/module6_vault.test.js` | Hospital Admin and Super Admin receive 403 `VAULT_ACCESS_PROHIBITED` on all vault routes. |
| **Doctor Portal Agenda & Referrals** | Doctor | `doctorPortalController.js`, `/api/v1/doctor/*`, `tests/module8_portal_teleconsult.test.js` | Today's schedule with patient demographics; target specialty referral inbox. |
| **Teleconsult Session Token & Waiting Room** | Patient / Doctor | `teleconsultController.js`, `/api/v1/teleconsult/session/:id/join`, `tests/module8_portal_teleconsult.test.js` | Participant-bound JWT session token; waiting room state until doctor joins. |
| **Hospital Admin Operations Console** | Hospital Admin | `adminController.js`, `/api/v1/admin/*`, `tests/module8_portal_teleconsult.test.js` | Overview counters, slot creation, service catalog, audit logs. |

---

## 4. Table 2: PARTIAL Features (Incomplete, Insecure, or Untested)

| Feature | Role Scope | Current State | Defect / What is Incomplete or Insecure | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Booking RBAC Permissions** | Patient | `bookingRoutes.js` uses only `authMiddleware`. | Non-patient roles (Doctor, Admin, Super-Admin) can call `/bookings/hold`, `/confirm`, `/my-bookings`. Violates Section 3 Matrix ("Book: Patient Own, Others No"). | Restrict all booking modification routes to `rbacMiddleware('patient')`. |
| **Referral Role Boundaries** | Doctor / Hosp Admin | `referralRoutes.js` permits both roles on almost all actions. | `POST /referrals` allows hospital admin (Matrix says Doctor ONLY). `PATCH /accept` allows doctor (Matrix says Hosp Admin receiving ONLY). | Enforce role separation: Doctor creates referrals; Hospital Admin receives/accepts/transfers. |
| **Central Permission Map** | Cross-Cutting | Dispersed role strings across route files. | No single central permission declaration file. Inconsistent error codes when roles mismatch. | Create `backend/src/config/permissions.js` and bind through unified middleware. |
| **Patient Family Profile Consents** | Patient | `PatientProfile.js` has emergency contact. | Missing explicit `consentToFamilyAlerts` boolean flag required by Section 2.1. | Add `consentToFamilyAlerts: { type: Boolean, default: false }` to `PatientProfile`. |
| **Booking Reference Lookup Route** | Patient | Accessible at `GET /api/v1/bookings/reference/:ref`. | Spec Section 2.1 requires route alias `GET /api/v1/appointments/by-ref/:ref` with patient profile name and age. | Add route alias and ensure response formats profile name and computed age. |
| **Referral Rejection with Alternatives** | Doctor / Hosp Admin | `referralService.js` has `rejectReferral`. | Does not automatically compute or return up to 3 alternative nearby hospitals matching specialty. | Enhance `rejectReferral` to query and attach up to 3 alternative hospital suggestions. |
| **Teleconsult Clinical Notes & Local Draft** | Doctor | Basic join session exists. | Spec requires: Doctor clinical notes saving before session completion; retry handling; no video recording disclaimer. | Add `POST /teleconsult/session/:appointmentId/notes` and session end validation guard. |
| **Bed Capacity Conflict Handling** | Hospital Admin | `searchService.updateBedCapacity` updates counts. | Missing optimistic concurrency version check (409 conflict when updatedBy version mismatches). Needs rejection of non-integers and `occupied + reserved > total`. | Implement version field check and 409 conflict response returning current values. |
| **Hospital Admin Overview for Super-Admin** | Super-Admin | `GET /admin/overview` throws 500 when called by super-admin. | Super-admin lacks `hospitalId`. Route should either require query `hospitalId` or redirect to platform overview. | Fix `adminController.getOverview` to support platform aggregation or require target hospitalId. |
| **Referral Response Deadline & Escalation** | Hosp Admin | `responseDeadlineAt` stored on Referral. | No automated background worker or query endpoint to flag expired referrals or trigger escalation. | Add referral escalation scanner and status update to `EXPIRED`. |

---

## 5. Table 3: MISSING Features (Not Yet Built)

| Feature / Requirement | Role Scope | Detailed Description of Missing Capability | Target Endpoint / Component |
| :--- | :--- | :--- | :--- |
| **Patient Check-In** | Patient | Self-service appointment check-in when arriving at clinic. | `PATCH /api/v1/bookings/:id/check-in` |
| **Hospital Desk Check-In & No-Show** | Hospital Admin | Admin desk check-in for walk-in arrivals and marking patient no-show. | `PATCH /api/v1/admin/appointments/:id/check-in`<br>`PATCH /api/v1/admin/appointments/:id/no-show` |
| **Doctor Leave Request Submission** | Doctor | Doctor initiates leave request to hospital admin (admin approves/records). | `POST /api/v1/doctor/leave-request`<br>`GET /api/v1/doctor/leave-requests` |
| **Patient Referral Withdrawal** | Patient | Patient voluntarily withdraws a pending referral. | `PATCH /api/v1/referrals/:id/withdraw` |
| **Referral Chained Transfer** | Hospital Admin | Receiving hospital transfers referral to tertiary hospital if specialized care unavailable. | `PATCH /api/v1/referrals/:id/transfer` |
| **Super-Admin Hospital Verification Queue** | Super-Admin | Review unverified hospital registrations; approve or reject with reason. | `GET /api/v1/super-admin/hospitals/pending`<br>`PATCH /api/v1/super-admin/hospitals/:id/verify` |
| **Super-Admin Doctor Verification Queue** | Super-Admin | Verify doctor medical council registration credentials. | `GET /api/v1/super-admin/doctors/pending`<br>`PATCH /api/v1/super-admin/doctors/:id/verify` |
| **Super-Admin Account Suspension & Reactivation** | Super-Admin | Suspend accounts; increment `tokenVersion` to immediately revoke active sessions; hide suspended hospitals from search. | `PATCH /api/v1/super-admin/users/:id/suspend`<br>`PATCH /api/v1/super-admin/users/:id/reactivate` |
| **Super-Admin Platform Monitoring** | Super-Admin | Real-time platform health, security auth failures, queue depth, booking conflict rate. | `GET /api/v1/super-admin/monitoring/metrics` |
| **Super-Admin Platform Audit View** | Super-Admin | Platform-wide audit log query with zero access to clinical vault records. | `GET /api/v1/super-admin/audit-logs` |
| **Procedure-Level Scheme Coverage Manager** | Hospital Admin | Admin enters date-stamped procedure-level coverage (`Verified`, `Unverified`, `Not Covered`) with `lastVerifiedAt`. | `POST /api/v1/admin/schemes/coverage`<br>`GET /api/v1/admin/schemes/coverage` |
| **Patient Data Rights (DPDP 2023)** | Patient | Data export (`JSON`), correction request, grievance filing with tracking, privacy notice. | `GET /api/v1/patient/data-export`<br>`POST /api/v1/patient/grievance` |
| **Automated Master Permission Matrix Test** | All Roles | Automated test asserting Section 3 Matrix for all identities and routes. | `backend/tests/permission_matrix.test.js` |
| **Tier 2: Chronic Reminders** | Patient | Medicine/test reminders (Taken, Snooze, Missed) with family escalation. | Marked **Future / Tier 2** |
| **Tier 2: Patient Visit Reviews & Moderation** | Patient / Super-Admin | Reviews submitted after completed visits only; super-admin moderation queue. | Marked **Future / Tier 2** |

---

## 6. Proposed Build Order (Strict Increment Strategy)

Following Section 5 of the specification, the implementation will proceed strictly role by role after reviewer approval:

```
[Phase 1: Gap Audit Approved]
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Cross-Cutting & Security Hardening                       │
│    - Central permission map (permissions.js)                │
│    - Tenant guard & ownership middleware consistency        │
│    - Automated master permission matrix test suite          │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Patient Role Completion                                  │
│    - consentToFamilyAlerts in family profiles               │
│    - Self check-in & by-ref appointment lookup alias        │
│    - Referral withdrawal & data rights (export/grievance)   │
│    - UI alignment on PatientDashboardPage                   │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Hospital Admin Role Completion                           │
│    - Desk check-in & no-show handling                       │
│    - Referral transfer (chained) & allocation through slots │
│    - Capacity version conflict check & scheme coverage      │
│    - Operations UI tabs in AdminConsolePage                 │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Doctor Role Completion                                   │
│    - Leave request submission to admin                      │
│    - Clinical consultation notes with local draft & save    │
│    - Referral rejection with up to 3 alternatives           │
│    - DoctorPortalPage navigation & UI completion            │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Super-Admin Role Completion                              │
│    - Hospital & doctor verification queues                  │
│    - Account suspension with instant tokenVersion kickoff   │
│    - System monitoring & platform audit views               │
│    - Dedicated SuperAdmin UI console                        │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Guest Experience & Emergency Mode Verification           │
│    - Offline service worker caching verification            │
│    - Stale age banners, 108 emergency telephony             │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. End-to-End Cross-Role Flow Verification & Status Ledger  │
│    - Multi-role journey: SuperAdmin -> Admin -> Patient ->  │
│      Doctor -> Receiving Admin -> Completion                │
│    - Update docs/STATUS.md                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Risk Analysis & Mitigation Plan

1. **Multi-Tenant Leakage Risk:**
   - *Risk:* Hospital Admin of Hospital A might query or manipulate records of Hospital B if query params are manipulated.
   - *Mitigation:* Centralize all tenant verification in `tenantGuard` and Mongoose tenant plugin; query conditions always use `req.tenantHospitalId`.
2. **Vault Administrative Isolation:**
   - *Risk:* Super-Admin or Hospital Admin could attempt to read patient health files.
   - *Mitigation:* Enforce `tenantGuard({ isVaultRoute: true })` returning 403 `VAULT_ACCESS_PROHIBITED` before any controller logic executes.
3. **Session Revocation Evasion:**
   - *Risk:* Suspended users accessing endpoints with valid non-expired JWT.
   - *Mitigation:* `authMiddleware` checks `user.tokenVersion === decoded.tokenVersion` and `user.isActive` on every request.
4. **Concurrent Double-Booking:**
   - *Risk:* Two patients race to claim the same appointment slot.
   - *Mitigation:* Two-phase atomic findAndModify with 10-minute hold timestamp, verified under 50-client benchmark.

---

**Report Status:** Generated and verified against live code and running server.  
**Next Action:** Awaiting user approval to proceed to Phase 2 (Cross-cutting security & master permission map).
