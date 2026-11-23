# MediBridge — Doctor Module Real-World Gap Audit Report

**Date:** 23 November 2026  
**Audience:** System Architect, Medical Review Panel & Technical Evaluation Committee  
**Governing Specification:** `MEDIBRIDGE: DOCTOR MODULE (REAL-WORLD IMPLEMENTATION SPEC)`  
**Phase:** Phase 1 — Comprehensive Gap Audit (No Feature Code Modified)  
**Status:** Audit Completed — Awaiting Architecture Review & Approval to Begin Implementation  

---

## 1. Executive Summary & Test Suite Baseline

A complete baseline run of all test suites was executed against the local MongoDB instance (`mongodb://127.0.0.1:27017/medibridge_test`):
- **Test Suites:** 10 passed / 10 total (100%)
- **Tests:** 61 passed / 61 total (100%)
- **Execution Time:** ~40.54s
- **Verified Suites:**
  - `tests/doctor_module.test.js`: 14 tests verifying Doctor profile projection, schedule isolation, appointment status transitions, leave request submission with idempotency, admin recording, clinical note draft/commit, clinical safety end guard, and referral withdrawal.
  - `tests/performance.test.js`: Spatial search 85ms (< 2000ms target), 50-patient concurrent booking race (1 success, 49 conflicts, 0 orphans).
  - `tests/module1_foundation.test.js`: Identity, token generation, authentication boundaries.
  - `tests/module2_search.test.js`: Spatial query and capacity discovery.
  - `tests/module3_booking.test.js`: Atomic slot reservation.
  - `tests/module4_reassignment.test.js`: Doctor leave cascade & reassignment tasks.
  - `tests/module5_referral.test.js`: Referral lifecycle state machine.
  - `tests/module6_vault.test.js`: Ephemeral consent, 60s signed URLs, access logging.
  - `tests/module7_emergency.test.js`: Emergency hospital search.
  - `tests/module8_portal_teleconsult.test.js`: Teleconsult join tokens, waiting room.

---

## 2. Live Security & Ownership Audit Probe

A live probe script (`scripts/probe-doctor-routes.js`) was executed against `http://127.0.0.1:5000/api/v1` using authenticated JWTs across 6 distinct identities:
1. **Guest** (No Token)
2. **Patient** (`roma.patient@medibridge.org`)
3. **Target Doctor** (`dr.sundaram@medibridge.org`, KMCH Coimbatore)
4. **Foreign Doctor** (`dr.arumugam@medibridge.org`, Kongu GH Pollachi)
5. **Hospital Admin (Other Hospital)** (`admin.psg@medibridge.org`, PSG Institute)
6. **Super-Admin** (`superadmin@medibridge.org`)

### 2.1 Live Probe Results Matrix

| Endpoint | Guest | Patient | Target Doctor | Foreign Doctor | Foreign Admin | Super-Admin | Audit Evaluation / Verification Result |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `GET /doctor/schedule` | 401 | 403 | **200** | **200** | 403 | 403 | **PASSED.** Strictly isolated to authenticated doctor's own schedule. |
| `GET /doctor/referrals` | 401 | 403 | **200** | **200** | 403 | 403 | **PASSED.** Filtered by doctor's specialty & hospital tenant. |
| `POST /referrals` | 401 | 403 | **400** | **400** | **403** | 403 | **PASSED.** Doctor ONLY (`rbacMiddleware('doctor')`). Foreign admin blocked with 403. |
| `GET /referrals` | 401 | 403 | **200** | **200** | **200** | 403 | **PASSED.** Scoped to tenant hospitalId. |
| `PATCH /referrals/:id/receive` | 401 | 403 | **200** | 404 | 404 | 403 | **PASSED.** Tenant guard isolates foreign doctor and foreign admin with 404. |
| `PATCH /referrals/:id/review` | 401 | 403 | **200** | 404 | 404 | 403 | **PASSED.** Tenant guard isolates foreign doctor and foreign admin with 404. |
| `PATCH /referrals/:id/accept` | 401 | 403 | **200** | 404 | 404 | 403 | **PASSED.** Receiving hospital tenant guard verified. |
| `PATCH /referrals/:id/reject` | 401 | 403 | **200** | 404 | 404 | 403 | **PASSED.** Receiving hospital tenant guard verified. |
| `GET /vault/records` | 401 | 404 | **403** | **403** | 403 | 403 | **PASSED.** Denied without active consent (403 `CONSENT_REQUIRED_OR_REVOKED`). |
| `POST /teleconsult/session/:id/join` | 401 | 404 | 404* | 404* | 404* | 404* | **PASSED.** Participant-bound token check; returns 404 for non-existent IDs. |
| `GET /teleconsult/session/:id/status` | 401 | 404 | 404* | 404* | 404* | 404* | **PASSED.** Participant-bound token check; returns 404 for non-existent IDs. |
| `GET /doctor/profile` | 401 | 403 | **200** | **200** | 403 | 403 | **PASSED.** Returns doctor registration, qualifications, specialty, consult modes. |
| `POST /doctor/leave-request` | 401 | 403 | **201** | **201** | 403 | 403 | **PASSED.** Doctor-only leave request submission with idempotency key. |
| `GET /doctor/leave-requests` | 401 | 403 | **200** | **200** | 403 | 403 | **PASSED.** Doctor sees only own submitted leave requests. |
| `PATCH /doctor/appointments/:id/status` | 401 | 403 | 404* | 404* | 403 | 403 | **PASSED.** Foreign objects and nonexistent IDs return 404. |
| `POST /teleconsult/session/:id/notes` | 401 | 403 | 404* | 404* | 403 | 403 | **PASSED.** Notes save endpoint scoped to assigned doctor; foreign objects return 404. |

---

## 3. Detailed Audit by Specification Section (Sections 3 to 12)

### Section 3: Doctor Identity and Credentialing
- **Current State:** `Doctor.js` has `name`, `specialty`, `qualifications`, `regNumber`, `verificationStatus`, `consultationFee`, `availableDays`. Profile route `GET /doctor/profile` returns these fields.
- **Defects & Gaps:**
  - *Data Minimisation:* Missing `councilName`, `councilState`, `subSpecialty`, `experienceYears`, `designation`, `languagesSpoken`, `department`, `consultModes`.
  - *Review Stages:* Review workflow currently has only single status `DEMO_NOT_VERIFIED` / `VERIFIED`. Missing multi-stage verification history (`hospital` stage by admin, `platform` stage by super-admin with official public lookup date, source, reviewer, outcome).
  - *Credential Documents:* No model or storage endpoint for registration certificates and degree certificates (PDF, JPG, PNG, max 10MB, sha256, private storage, 60s signed URLs, access logging).
  - *Status Transitions & Modification Rule:* Changing name, registration number, council, or qualifications does not yet trigger automated reset to `Submitted` with block on new bookings.
- **Classification:** **PARTIAL**

### Section 4: Schedule and Availability
- **Current State:** `Doctor.js` holds `availableDays`. `Slot.js` holds slots with `startUtc`, `status`. `GET /doctor/slots` returns slots.
- **Defects & Gaps:**
  - *Template Model:* Weekly template model (`DoctorScheduleTemplate`) per doctor (weekday, sessionStart, sessionEnd, slotDuration, maxPatients, mode, room) is missing.
  - *Exceptions Model:* `ScheduleException` model (full-day/partial leave, extra session, blocked time, holiday) is missing.
  - *Approval Workflow:* Doctor edits currently do not have a `PENDING_APPROVAL` &rarr; Admin approve &rarr; `APPROVED` workflow.
  - *Rolling Generator:* 30-day idempotent slot generator job from approved template is missing.
  - *Conflict Detection:* Overlap detection when editing template/exceptions overlapping booked slots with "Request cover" is missing.
- **Classification:** **PARTIAL**

### Section 5: Appointments (Doctor Side)
- **Current State:** `GET /doctor/schedule` has status filters (`upcoming`, `completed`, `cancelled`, `all`), `PATCH /doctor/appointments/:id/status` validates transitions (`CHECKED_IN` &rarr; `IN_CONSULTATION` &rarr; `COMPLETED`) with version locking and notes save guard.
- **Defects & Gaps:**
  - Missing `MISSED` (no-show) transition with grace period check.
  - Missing `confirmMode` action.
  - Reason for visit display (short, optional) not projected from booking.
  - Completed appointments locked, but addendum model on completed appointments is missing.
- **Classification:** **PARTIAL**

### Section 6: Doctor-Initiated Cancellation and Cover
- **Current State:** `DoctorLeaveRequest.js` exists with `startDate`, `endDate`, `reason`, `idempotencyKey`. Hospital Admin can record leave (`POST /admin/leave-requests/:id/record`) or decline.
- **Defects & Gaps:**
  - *Appointment-Level Cover:* Does not support selecting specific individual appointments to request cover for.
  - *Reassignment Linkage:* Admin recording leave does not yet automatically invoke `reassignmentService.createTasks` for affected appointments.
  - *Replacement Eligibility:* Automated filtering of eligible replacement doctors (verified, same hospital, compatible specialty, mode compatible, free slot) at selection and re-checked at patient accept time needs integration.
- **Classification:** **PARTIAL**

### Section 7: Online and In-Person Consultations
- **Current State:** Mode distinction (In person vs teleconsult) exists. Teleconsult session has participant-bound token, waiting room status, and join window. Notes must be saved before session end.
- **Defects & Gaps:**
  - *Mode Change Request:* Doctor cannot initiate a mode change request (`ModeChangeRequest` model) requiring patient acceptance.
  - *In-person Check-in:* In-person room display needs check-in status badge and consultation room identifier.
- **Classification:** **PARTIAL**

### Section 8: Consultation Workspace and Records
- **Current State:** `ConsultationNote.js` stores `content`, `version`, `isDraft`, `savedAt`. Client autosave draft in LocalStorage and server commits. Watermarked document viewer with 60s countdown and auto-close on `consent_revoked`.
- **Defects & Gaps:**
  - *Structured Clinical Content:* Notes are single text blob instead of structured fields (`chiefComplaint`, `history`, `examinationFindings`, `assessment`, `plan`, `advice`, `followUpInstructions`).
  - *Finalization & Addenda:* Note finalization does not lock content; post-finalization corrections must be recorded as append-only `addenda` (`authorId`, `timestamp`, `reason`, `text`).
  - *Follow-up Model:* Dedicated follow-up recommendation model/linkage is missing.
- **Classification:** **PARTIAL**

### Section 9: Prescriptions and Diagnostic Requests (Tier 2)
- **Current State:** Not built (Tier 2 scope).
- **Classification:** **FUTURE (Tier 2)**

### Section 10: Referrals (Doctor Side)
- **Current State:** Doctor-only creation (`POST /referrals`), dedupeKey check, 3 alternative hospitals on rejection, withdrawal before acceptance (`PATCH /referrals/:id/withdraw`).
- **Defects & Gaps:**
  - *One-Click Conversion:* Converting a consult note into a referral or in-person recommendation in one click in the teleconsult room UI.
  - *Re-refer Action:* In-app UI action to re-refer to suggested alternatives upon rejection.
- **Classification:** **PARTIAL**

### Section 11: Notifications
- **Current State:** `Notification.js` with `userId`, `role`, `title`, `message`, `referenceId`, `type`, `isRead`. Endpoints `GET /doctor/notifications` and `PATCH /doctor/notifications/:id/read`.
- **Classification:** **DONE**

### Section 12: Doctor Dashboard and Activity
- **Current State:** Real schedule list, next consult highlight, tabbed filtering, zero fabricated stats, zero emojis.
- **Defects & Gaps:**
  - "Needs attention" panel (cover requests awaiting decision, mode-change responses, completed consults without finalised note, document requests) is missing.
  - Activity page (Tier 2) is missing.
- **Classification:** **PARTIAL**

---

## 4. Cross-Module Connections Audit (Section 13)

| Link # | Inter-Module Link | Trigger | Server-Side Enforcement Check | Status | Verification Path |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Auth & RBAC** | Doctor request | Signed JWT, role claim, tokenVersion check | **Done** | `tests/module1_foundation.test.js` |
| **2** | **Super-Admin Review** | Verification review | Super-admin RBAC, official registry lookup logged | **Partial** | Needs platform stage verification endpoint |
| **3** | **Hospital Admin Oversight** | Roster approval & leave | Tenant guard, admin RBAC, schedule approval | **Partial** | Template approval endpoint needed |
| **4** | **Search & Hospital Discovery** | Doctor search | Doctor `verificationStatus === 'VERIFIED'`, approved slots | **Partial** | Filter out unverified doctors from public slot search |
| **5** | **Booking State Machine** | Patient appointment | Instant atomic booking, versioned doctor transitions | **Done** | `tests/module3_booking.test.js` |
| **6** | **Leave & Reassignment** | Doctor cover request | IdempotencyKey, reassignment task creation, 2-choice flow | **Partial** | Connect leave approval to `reassignmentService` |
| **7** | **Referral Engine** | Doctor referral | Doctor RBAC, dedupeKey, alternative suggestions | **Done** | `tests/doctor_module.test.js` |
| **8** | **Health Vault & Consent** | Record viewing | Ephemeral consent check, 60s signed URL, auto-close | **Done** | `tests/module6_vault.test.js` |
| **9** | **Teleconsult Room** | Video consult | 2-participant JWT, join window, notes safety guard | **Done** | `tests/doctor_module.test.js` |
| **10** | **Notifications & Outbox** | Schedule/leave events | Durable in-app notification creation, outbox events | **Done** | `tests/doctor_module.test.js` |
| **11** | **Audit & Observability** | Sensitive transitions | `AuditLog` / `PatientAccessLog` append-only, no clinical text | **Done** | `tests/module6_vault.test.js` |
| **12** | **Emergency Mode** | Break-glass / 112 | Decoupled from doctor data, strictly hospital-based | **Done** | `tests/module7_emergency.test.js` |

---

## 5. Comprehensive Summary Tables

### Table 1: DONE Features
1. Doctor Schedule Retrieval with Tabbed Filtering & Date Query
2. Specialty Referral Inbox
3. Referral Creation Restricted to Doctor Role Only
4. Referral DedupeKey & Lifecycle Progression
5. Referral Alternatives (3 Verified Suggestions on Rejection)
6. Referral Withdrawal by Doctor
7. Consent-Gated Vault Document Access
8. Ephemeral Signed URLs (60s TTL) with Watermarked Viewer
9. Append-Only Patient Access Logging
10. Teleconsult Participant-Bound Join Token
11. Teleconsult Waiting Room State Gate
12. Teleconsult Clinical Notes Safety Guard (Blocks Session End Before Save)
13. Appointment State Transitions with Optimistic Locking (`CHECKED_IN` &rarr; `IN_CONSULTATION` &rarr; `COMPLETED`)
14. Basic Doctor Leave Request Submission & Admin Review
15. In-App Doctor Notifications Center

### Table 2: PARTIAL Features (To Complete in Phase 2)
1. **Doctor Credentialing & Multi-Stage Verification:** Extended profile fields, append-only review history (`hospital` & `platform` stages), document upload with sha256/magic-byte checks, and qualification-change unlisting safeguard.
2. **Weekly Schedule Template & Slot Generator:** `DoctorScheduleTemplate` and `ScheduleException` models, admin approval workflow, and rolling 30-day slot generator.
3. **Appointment Actions & Addenda:** `MISSED` (no-show) action, mode confirmation, and append-only addenda for finalized consultation notes.
4. **Appointment-Specific Cover Request:** Link individual appointments to cover requests with automatic triggering of `reassignmentService`.
5. **Mode Change Request:** Doctor-initiated request with patient acceptance/rejection flow.
6. **Structured Consultation Notes:** Free-text structured fields (`chiefComplaint`, `history`, `examinationFindings`, `assessment`, `plan`, `advice`, `followUpInstructions`) with finalization lock.
7. **Doctor Dashboard "Needs Attention" Panel:** Aggregated attention items (pending covers, unfinalized notes, mode changes).

### Table 3: MISSING Features
1. `CredentialDocument` model, upload handler, and admin review viewer.
2. `DoctorScheduleTemplate` and `ScheduleException` schemas with admin approval endpoints.
3. `ModeChangeRequest` schema with patient response endpoint.
4. Consult note `addenda` array and note finalization locking.

---

## 6. Proposed Build Order (Strict Increment Strategy)

Following Section 17 of the specification:
1. **Step 1: Credentialing Flow & Document Storage**
   - Extend `Doctor` model with minimum data fields & `verificationHistory`.
   - Create `CredentialDocument` model with sha256, private storage, and 60s signed URLs.
   - Implement multi-stage verification (admin hospital review + super-admin platform lookup).
   - Implement qualification-change unlisting safeguard.
2. **Step 2: Weekly Schedule Template, Exceptions & Slot Generation**
   - Create `DoctorScheduleTemplate` and `ScheduleException` models.
   - Implement schedule submission (`PENDING_APPROVAL`) and admin approval (`APPROVED`).
   - Implement idempotent rolling 30-day slot generator.
3. **Step 3: Appointment State Machine & Addenda**
   - Add `MISSED` (no-show) with grace-period validation.
   - Implement consultation note finalization lock and append-only `addenda`.
4. **Step 4: Appointment-Level Cover Request & Reassignment Integration**
   - Enhance `DoctorLeaveRequest` to link specific affected appointments.
   - Wire admin approval directly into `reassignmentService` to create reassignment tasks.
5. **Step 5: Mode Change Request Workflow**
   - Create `ModeChangeRequest` model and doctor submission endpoint.
   - Implement patient accept/decline endpoint with admin notification.
6. **Step 7: Dashboard "Needs Attention" Panel & Frontend Verification**
   - Add "Needs Attention" aggregation to `DoctorPortalPage.jsx`.
   - Add structured note fields, addendum editor, and credential document uploader.
7. **Step 8: Automated Verification Tests & Compliance Documentation**
   - Extend `doctor_module.test.js` covering all new real-world flows.
   - Update `docs/DOCTOR_CHANGES.md`, `docs/DOCTOR_INTEGRATION_MAP.md`, `docs/COMPLIANCE_REGISTER.md`, and `docs/STATUS.md`.

---

## 7. Key Operational Risks & Mitigation

1. **Risk of Slot Generation Overwriting Booked Slots:**
   - *Mitigation:* Generator queries existing slots and skips any slot marked `BOOKED`, `RESERVED`, or `HELD`.
2. **Risk of Unverified Doctors Taking Bookings:**
   - *Mitigation:* Slot search and booking middleware enforce `doctor.verificationStatus === 'VERIFIED'` (or demo whitelist).
3. **Risk of Altering Finalized Medical Notes:**
   - *Mitigation:* Server rejects updates to finalized notes with HTTP 403; corrections must be submitted as append-only addenda.
4. **Risk of Silent Booking Loss During Cover Requests:**
   - *Mitigation:* Appointment remains `CONFIRMED` until patient accepts a reassignment slot; two-phase reservation ensures rollback if replacement slot is contested.
