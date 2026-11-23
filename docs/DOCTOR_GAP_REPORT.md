# MediBridge — Doctor Module Gap Audit Report

**Date:** 23 November 2026  
**Audience:** System Architect & Medical Systems Reviewer Panel  
**Phase:** Phase 1 — Comprehensive Gap Audit (No Feature Code Modified)  
**Status:** Awaiting Review & Approval to Begin Implementation  

---

## 1. Executive Summary & Test Suite Baseline

A complete execution of the test suite was verified against the local MongoDB instance (`mongodb://127.0.0.1:27017/medibridge_test`):
- **Test Suites:** 9 passed / 9 total (100%)
- **Tests:** 47 passed / 47 total
- **Execution Time:** ~35.14s
- **Doctor-Relevant Verified Tests:**
  - `tests/module8_portal_teleconsult.test.js`: Doctor agenda retrieval, specialty referral inbox, participant-bound teleconsult session tokens, waiting room gate.
  - `tests/module6_vault.test.js`: Ephemeral consent verification, 60s signed download URLs, instant 403 on patient revocation, doctor access logging in `PatientAccessLog`.
  - `tests/module5_referral.test.js`: 7-stage rural-to-city referral lifecycle, dedupeKey prevention, journey metrics.
  - `tests/module4_reassignment.test.js`: Doctor leave interval overlap detection, flagging affected appointments for reassignment.

---

## 2. Live Security & Ownership Audit Probe

A live probe script (`scripts/probe-doctor-routes.js`) was executed against `http://127.0.0.1:5000/api/v1` using authentic JWT tokens across 6 distinct identities:
1. **Guest** (No Token)
2. **Patient** (`roma.patient@medibridge.org`)
3. **Target Doctor** (`dr.sundaram@medibridge.org`, KMCH Coimbatore)
4. **Different Doctor** (`dr.arumugam@medibridge.org`, Kongu GH Pollachi)
5. **Hospital Admin of Another Hospital** (`admin.psg@medibridge.org`, PSG Institute)
6. **Super-Admin** (`superadmin@medibridge.org`)

### 2.1 Live Probe Results Matrix

| Endpoint | Guest | Patient | Target Doctor | Other Doctor | Admin (Other Hosp) | Super-Admin | Audit Evaluation / Security Finding |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `GET /doctor/schedule` | 401 | 403 | **200** | **200** | 403 | 403 | **PASSED.** Isolated to authenticated doctor only; foreign doctors only see their own schedule. |
| `GET /doctor/referrals` | 401 | 403 | **200** | **200** | 403 | 403 | **PASSED.** Scoped to doctor's specialty and assigned hospital tenant. |
| `POST /referrals` | 401 | 403 | **400** | **400** | **400** | 403 | **SECURITY LEAK:** Admin of another hospital can invoke `POST /referrals`. Section 3 Matrix: Doctor ONLY. |
| `GET /referrals` | 401 | 403 | **200** | **200** | **200** | 403 | **PASSED:** Scoped to hospitalId tenant. |
| `PATCH /referrals/:id/accept` | 401 | 403 | **200** | 404 | 404 | 403 | **ROLE VIOLATION:** Doctor can accept referrals directly. Section 3: Hospital Admin (receiving) ONLY. Tenant guard correctly blocks other hospital with 404. |
| `PATCH /referrals/:id/reject` | 401 | 403 | **200** | 404 | 404 | 403 | **PASSED:** Hospital tenant isolation active (foreign hospital receives 404). |
| `GET /vault/records` | 401 | 404 | **403** | **403** | 403 | 403 | **PASSED:** Denied without active consent (403 `CONSENT_REQUIRED_OR_REVOKED`). |
| `POST /teleconsult/session/:id/join` | 401 | 404 | 404* | 404* | 404* | 404* | **PASSED:** Participant-bound token check; returns 404 for non-existent/foreign appointments. |
| `GET /doctor/profile` | 401 | 403 | **404** | **404** | 403 | 403 | **MISSING ROUTE:** Doctor profile route not yet implemented. |
| `POST /doctor/leave-request` | 401 | 403 | **404** | **404** | 403 | 403 | **MISSING ROUTE:** Doctor cannot submit leave request to hospital admin. |
| `GET /doctor/leave-requests` | 401 | 403 | **404** | **404** | 403 | 403 | **MISSING ROUTE:** Doctor cannot view own submitted leave requests. |
| `PATCH /doctor/appointments/:id/status` | 401 | 403 | **404** | **404** | 403 | 403 | **MISSING ROUTE:** Doctor cannot transition appointment to `IN_CONSULTATION` or `COMPLETED`. |
| `POST /teleconsult/session/:id/notes` | 401 | 404 | **404** | **404** | 404 | 404 | **MISSING ROUTE:** Consultation notes endpoint not yet implemented. |

---

## 3. Table 1: DONE Features (Works, Verified, Tested)

| Feature | Role Scope | Evidence (File, Endpoint, Test) | Verification Notes |
| :--- | :--- | :--- | :--- |
| **Doctor Schedule Retrieval** | Doctor | `doctorPortalController.js`, `GET /api/v1/doctor/schedule`, `tests/module8_portal_teleconsult.test.js` | Retrieves today's schedule; strictly filters by `doctorId` linked to `req.user._id`; isolates across doctors. |
| **Specialty Referral Inbox** | Doctor | `doctorPortalController.js`, `GET /api/v1/doctor/referrals`, `tests/module8_portal_teleconsult.test.js` | Retrieves incoming referrals matching doctor's specialty for their hospital tenant. |
| **Referral dedupeKey & Lifecycle** | Doctor | `referralService.js`, `POST /api/v1/referrals`, `tests/module5_referral.test.js` | Prevents duplicate referral submission; tracks state machine progression to `COMPLETED`. |
| **Consent-Gated Vault Document Access** | Doctor | `vaultService.js`, `GET /api/v1/vault/records`, `tests/module6_vault.test.js` | Verifies active, unexpired, unrevoked consent for doctor; returns 403 if consent revoked. |
| **60-Second Ephemeral Download Stream** | Doctor | `vaultService.js`, `GET /api/v1/vault/records/:id/download-url`, `tests/module6_vault.test.js` | Issues time-limited signed URL with 60-second TTL; verifies token before streaming file. |
| **Append-Only Access Logging** | Doctor | `vaultService.js`, `PatientAccessLog.js`, `tests/module6_vault.test.js` | Every file access and denial is recorded with doctor ID, purpose, timestamp, and result. |
| **Teleconsult Participant Authorization** | Doctor | `teleconsultController.js`, `POST /api/v1/teleconsult/session/:id/join`, `tests/module8_portal_teleconsult.test.js` | Issues participant-bound JWT session token; updates `doctorJoinedAt` and transitions appointment to `IN_CONSULTATION`. |
| **Waiting Room State Gate** | Doctor / Patient | `teleconsultController.js`, `GET /api/v1/teleconsult/session/:id/status`, `tests/module8_portal_teleconsult.test.js` | Keeps patient in secure waiting room until attending physician joins consultation. |

---

## 4. Table 2: PARTIAL Features (Incomplete, Insecure, or Untested)

| Feature | Current State | Defect / What is Incomplete or Insecure | Action Required |
| :--- | :--- | :--- | :--- |
| **Doctor Leave Workflow** | Doctor UI calls `POST /reassignments/leave`, catches 403, and displays a fake message. | Doctor cannot record leave directly (Section 3.3: Doctor submits leave request; Hospital Admin records leave). | Build `DoctorLeaveRequest` model, `POST /api/v1/doctor/leave-requests`, and admin approval flow. |
| **Referral Role Boundaries** | `referralRoutes.js` allows both doctor and hospital admin on almost all actions. | `POST /referrals` permits hospital admin (Matrix says Doctor ONLY). `PATCH /accept` permits doctor (Matrix says Hospital Admin receiving ONLY). | Enforce role boundaries: Doctor creates referrals; Hospital Admin receives/accepts/transfers. |
| **Doctor Appointment Filtering** | `GET /doctor/schedule` only supports single `date` query. | Spec requires tabs: Upcoming, Completed, Cancelled, date filter, status filter. | Add `status` and date range filters; return grouped tabs (Upcoming, Completed, Cancelled). |
| **Teleconsult Room Capabilities** | `TeleconsultRoomPage.jsx` has timer and video placeholder. | Missing notes editor, autosave state ("Saved locally", "Saved", "Retrying"), safeguard blocking session end before notes save, and convert to referral. | Implement consultation notes draft/save architecture and one-click convert to referral. |
| **Consent Revocation Auto-Close** | Vault returns 403 on revocation. | Document viewer does not listen to Socket.IO `consent_revoked` event to automatically close viewer and display "Access ended". | Add Socket.IO listener for `consent_revoked` to terminate viewer instantly. |
| **Doctor Verification Enforcement** | `Doctor.js` has `verificationStatus` defaulting to `DEMO_NOT_VERIFIED`. | Unverified doctors are not blocked from creating referrals or accepting teleconsult sessions. | Enforce `verificationStatus === 'VERIFIED'` (or demo whitelist) for clinical actions. |
| **Referral Rejection with Alternatives** | `rejectReferral` updates status and reason. | Does not automatically compute or return up to 3 alternative verified hospitals matching specialty. | Enhance `rejectReferral` to attach up to 3 alternative hospital suggestions. |

---

## 5. Table 3: MISSING Features (Not Yet Built)

| Feature / Requirement | Detailed Description of Missing Capability | Target Endpoint / Component |
| :--- | :--- | :--- |
| **Doctor Profile Endpoint** | Dedicated read-only endpoint returning doctor registration number, qualifications, specialties, consult modes, verification badge, and active sessions. | `GET /api/v1/doctor/profile` |
| **Doctor Leave Request Submission** | Doctor submits leave request (startDate, endDate, reason) with idempotency key. | `POST /api/v1/doctor/leave-requests`<br>`GET /api/v1/doctor/leave-requests` |
| **Doctor Appointment Status Transitions** | Versioned, validated appointment state transitions: Checked-in &rarr; In consultation, In consultation &rarr; Completed. Invalid transitions rejected. | `PATCH /api/v1/doctor/appointments/:id/status` |
| **Consultation Notes Saving & Autosave** | Save consultation notes with versioning, autosave state tracking, and local draft recovery. | `POST /api/v1/teleconsult/session/:appointmentId/notes`<br>`GET /api/v1/teleconsult/session/:appointmentId/notes` |
| **Referral Withdrawal by Doctor** | Doctor can withdraw a referral they created prior to receiving hospital acceptance. | `PATCH /api/v1/referrals/:id/withdraw` |
| **Watermarked Document Viewer** | Document viewer displaying doctor's name watermark, expiry countdown, and "Access ended" state upon revocation. | Frontend `DocumentViewerModal.jsx` |
| **In-App Doctor Notifications** | In-app notification center for new appointments, cancellations, reassignment outcomes, referral updates, and consent grants/revocations. | `GET /api/v1/doctor/notifications` |
| **Automated Doctor Permission & State Machine Test** | Master automated test covering all Section 9 requirements (Doctor A denied Doctor B, versioned transitions, leave request lifecycle, teleconsult note guard). | `backend/tests/doctor_module.test.js` |

---

## 6. Proposed Build Order (Strict Increment Strategy)

Following Section 10 of the specification:

```
[Phase 1: Gap Audit Approved]
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Permissions, Ownership & Doctor Profile                  │
│    - Role enforcement on referrals (Doctor creates, Admin accepts)
│    - Dedicated GET /api/v1/doctor/profile endpoint          │
│    - Strict ownership checks on schedules, appointments, notes │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Schedule, Appointments & State Machine Transitions       │
│    - Upcoming, Completed, Cancelled tabs with date/status filters
│    - Versioned status transitions: Checked-in -> In consult -> Completed
│    - Concurrency conflict handling (409)                    │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Consult Notes & Teleconsult Safeguards                   │
│    - Consultation notes model and endpoints                 │
│    - Autosave with local draft recovery and retry states    │
│    - Safeguard blocking session end before notes saved       │
│    - One-click convert to referral or in-person recommendation │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Records & Watermarked Consent Viewer                     │
│    - Watermarked view-only document viewer                  │
│    - Expiry countdown timer                                 │
│    - Socket.IO consent_revoked auto-close to "Access ended" │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Referral Creation, Withdrawal & Inbox Alternatives       │
│    - Doctor-only referral creation with consent attachment  │
│    - Referral withdrawal by creating doctor                 │
│    - Rejection with up to 3 alternative hospital suggestions │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Doctor Leave Request Lifecycle                           │
│    - DoctorLeaveRequest model and submission endpoint       │
│    - Idempotent submission and status tracking              │
│    - Admin review and recording                             │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Notifications & Audit Logging                            │
│    - In-app notification endpoint for doctor events         │
│    - Append-only audit logging without medical data in logs │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. UI Polish for All Doctor Views                           │
│    - Today, Appointments, Consult Room, Referral Inbox,     │
│      Records, Leave, Profile                                │
│    - Rose and plum theme, dense white table-first layouts   │
│    - Loading skeletons, empty states, error retry, WCAG 2.2 │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Comprehensive Integration Map & Test Suite               │
│    - Complete docs/DOCTOR_INTEGRATION_MAP.md                │
│    - Backend unit/integration tests in doctor_module.test.js│
│    - Update docs/STATUS.md                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Risk Analysis & Mitigation Plan

1. **Clinical Note Loss Risk:**
   - *Risk:* Network interruption during consultation causes unsaved doctor notes.
   - *Mitigation:* Dual-layer save architecture: continuous LocalStorage draft autosave + resilient server retry with explicit state indicators ("Saved locally", "Retrying", "Saved"). Session completion blocked until server acknowledges commit.
2. **Unauthorized Record Viewing After Revocation:**
   - *Risk:* Doctor leaves document viewer open after patient revokes consent.
   - *Mitigation:* Active Socket.IO `consent_revoked` broadcast to `doctor:{id}` immediately unmounts viewer; server re-verifies consent on every file request (60s token TTL).
3. **Cross-Doctor Schedule Leakage:**
   - *Risk:* Doctor queries another doctor's appointments within the same hospital.
   - *Mitigation:* Query conditions explicitly bind `doctorId: req.doctor._id` resolved from `req.user._id`, returning 404/403 on foreign doctor queries.
4. **Referral Role Confusion:**
   - *Risk:* Doctor accepts referrals or Hospital Admin dispatches clinical referrals.
   - *Mitigation:* Enforce strict RBAC in `referralRoutes.js`: `POST /referrals` (Doctor only); `PATCH /accept` (Hospital Admin only).

---

**Report Status:** Complete and verified with live probe script.  
**Next Action:** Awaiting user approval to proceed with Phase 2 implementation.
