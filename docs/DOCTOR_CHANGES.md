# MediBridge — Doctor Module Schema and API Changes Register

**Specification:** `MEDIBRIDGE: DOCTOR MODULE (REAL-WORLD IMPLEMENTATION SPEC)`  
**Scope:** Record of all new models, schema extensions, endpoints, and behavioral safeguards introduced for the Doctor Module.

---

## 1. Schema & Model Additions

### 1.1 `ConsultationNote.js`
- **Path:** `backend/src/models/ConsultationNote.js`
- **Fields:**
  - `appointmentId`: ObjectId (ref: `Appointment`, unique index)
  - `doctorId`: ObjectId (ref: `Doctor`, indexed)
  - `patientProfileId`: ObjectId (ref: `PatientProfile`)
  - `hospitalId`: ObjectId (ref: `Hospital`, indexed)
  - `content`: String (Legacy unstructured notes)
  - `structuredContent`:
    - `chiefComplaint`: String
    - `history`: String
    - `examinationFindings`: String
    - `assessment`: String
    - `plan`: String
    - `advice`: String
    - `followUpInstructions`: String
  - `isDraft`: Boolean (default: true)
  - `isFinalized`: Boolean (default: false)
  - `finalizedAt`: Date
  - `addenda`: Array of `{ authorId, authorRole, reason, text, timestamp }` (Append-only)
  - `version`: Number (default: 1, optimistic locking)
  - `savedAt`: Date

### 1.2 `DoctorLeaveRequest.js`
- **Path:** `backend/src/models/DoctorLeaveRequest.js`
- **Fields:**
  - `doctorId`: ObjectId (ref: `Doctor`, indexed)
  - `hospitalId`: ObjectId (ref: `Hospital`, indexed)
  - `startDate`: String (YYYY-MM-DD)
  - `endDate`: String (YYYY-MM-DD)
  - `reason`: String (Enum: `emergency_leave`, `medical_leave`, `personal_emergency`, `duty_change`, `schedule_conflict`, `unexpected_unavailability`, `other`)
  - `affectedAppointmentIds`: [ObjectId] (ref: `Appointment`)
  - `recommendedReplacementDoctorId`: ObjectId (ref: `Doctor`, optional)
  - `remarks`: String
  - `status`: String (Enum: `submitted`, `accepted`, `declined`, `completed`, default: `submitted`)
  - `idempotencyKey`: String (unique index)
  - `adminNotes`: String
  - `recordedEventId`: String (UUID linking to `DoctorLeave` and reassignment tasks)

### 1.3 `Notification.js`
- **Path:** `backend/src/models/Notification.js`
- **Fields:**
  - `userId`: ObjectId (ref: `User`, indexed)
  - `role`: String (Enum: `patient`, `doctor`, `hospital_admin`, `super_admin`)
  - `title`: String
  - `message`: String
  - `referenceId`: String
  - `type`: String (Enum: `booking_created`, `booking_cancelled`, `leave_decision`, `reassignment_outcome`, `mode_change`, `referral_update`, `consent_revoked`, `general`)
  - `isRead`: Boolean (default: false)
  - `createdAt`: Date

### 1.4 Planned Additions for Phase 2:
- `CredentialDocument.js`: Registration & degree certificates with sha256 and private storage keys.
- `DoctorScheduleTemplate.js`: Weekly session template with operating hours, slot duration, and room location.
- `ScheduleException.js`: Planned leaves, blocked hours, and extra sessions.
- `ModeChangeRequest.js`: Doctor-initiated consult mode switch requiring patient confirmation.

---

## 2. API Endpoints Register

| Method | Endpoint | RBAC Role | Purpose | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/doctor/profile` | `doctor` | Fetch own credentials, registration, qualifications, specialty | Done |
| `GET` | `/api/v1/doctor/schedule` | `doctor` | Filtered schedule (tabs: upcoming, completed, cancelled, all) | Done |
| `GET` | `/api/v1/doctor/slots` | `doctor` | Retrieve doctor's generated slots | Done |
| `PATCH` | `/api/v1/doctor/appointments/:id/status` | `doctor` | Transition status (`IN_CONSULTATION`, `COMPLETED`, `MISSED`) | Done |
| `POST` | `/api/v1/doctor/leave-request` | `doctor` | Submit cover/leave request with idempotencyKey | Done |
| `GET` | `/api/v1/doctor/leave-requests` | `doctor` | List own submitted leave requests | Done |
| `GET` | `/api/v1/doctor/notifications` | `doctor` | Retrieve unread and recent in-app notifications | Done |
| `PATCH` | `/api/v1/doctor/notifications/:id/read` | `doctor` | Mark single notification as read | Done |
| `POST` | `/api/v1/teleconsult/session/:id/notes` | `doctor` | Autosave draft or commit consultation notes | Done |
| `GET` | `/api/v1/teleconsult/session/:id/notes` | `doctor` | Retrieve consultation notes for active session | Done |
| `POST` | `/api/v1/teleconsult/session/:id/end` | `doctor` | End teleconsult session (Clinical safety note-save guard) | Done |
| `POST` | `/api/v1/referrals` | `doctor` | Dispatch clinical referral (Doctor role restricted) | Done |
| `PATCH` | `/api/v1/referrals/:id/withdraw` | `doctor`, `patient` | Withdraw referral prior to receiving hospital acceptance | Done |
| `POST` | `/api/v1/admin/leave-requests/:id/record` | `hospital_admin` | Approve leave request, record `DoctorLeave`, trigger reassignments | Done |
| `POST` | `/api/v1/admin/leave-requests/:id/decline` | `hospital_admin` | Decline leave request with remarks | Done |
