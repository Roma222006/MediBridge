# MediBridge — 8-Minute Live Demonstration Script
**Visionet Techthon 2026 (Round 2: Technical Reviewer Panel Presentation)**  
**Presenting Team:** Roma R (Lead), Ragavi R, Rithika KP  
**Total Allocated Duration:** 8 minutes (Strictly timed)

---

## Demonstration Cue Card & Timestamp Roadmap

```
[00:00 - 01:30] Phase 1: Search That Matters (Availability-First vs Map Pins)
[01:30 - 03:00] Phase 2: High-Concurrency Race Condition (The Last Slot)
[03:00 - 05:00] Phase 3: Doctor Leave & Two-Choice Resolution
[05:00 - 06:30] Phase 4: Rural-to-City Referral Lifecycle
[06:30 - 07:30] Phase 5: Health Vault Ephemeral Consent & Instant Revocation
[07:30 - 08:00] Phase 6: Zero-Auth Emergency PWA Mode & 108 Direct Dial
```

---

### [00:00 - 01:30] Phase 1: Search That Matters
* **Speaker:** Roma R
* **Action on Screen:** Open MediBridge homepage (`/`). Show Search Bar and live hospital cards.
* **What to say:**
  > "Respected judges, Google Maps shows patients where a hospital is, but it cannot tell them if that hospital can treat them *today*. A patient in an emergency drives 20 kilometers to discover the MRI scanner is down, the cardiologist is away, the ICU is full, or their Ayushman Bharat scheme is not accepted.
  > 
  > Notice MediBridge's availability-first search: we see Kovai Medical Center (KMCH) with 48 open general beds and 7 open ICU beds, updated 8 minutes ago. Next to it is Pollachi District GH with a prominent warning badge: *'Availability update exceeds 2 hours'*. MediBridge never gives patients false confidence. We can filter instantly by specialty, procedure, and government insurance like CMCHIS and PM-JAY."

---

### [01:30 - 03:00] Phase 2: High-Concurrency Race Condition (The Last Slot)
* **Speaker:** Ragavi R
* **Action on Screen:** Open two split browser windows side-by-side. 
  - Left window: Roma R (`roma.patient@medibridge.org`)
  - Right window: Ragavi R (`ragavi.patient@medibridge.org`)
* **What to say:**
  > "Now, what happens when two patients attempt to book the final remaining slot at the exact same millisecond? In generic applications, this causes double-booking nightmares.
  > 
  > In MediBridge, we have Dr. M. Revathi with exactly one remaining slot tomorrow at 11:30 AM. Both patients open the slot and click 'Confirm Booking' concurrently.
  > 
  > *[Click Confirm simultaneously in both windows]*
  > 
  > Look at the screen: Roma's request secures the slot with a confirmed booking reference code: `MB-20261118-XXXX`. Ragavi's request receives an immediate, clean HTTP 409 Conflict: *'Race condition detected: This slot was claimed by another patient just a moment ago'*. 
  > 
  > We achieve this through conditional atomic updates and partial unique indexes in MongoDB, backed by strict client Idempotency-Key headers. Zero double-booking, guaranteed."

---

### [03:00 - 05:00] Phase 3: Doctor Leave & Two-Choice Reassignment Workflow
* **Speaker:** Rithika KP
* **Action on Screen:** 
  1. Switch to Hospital Admin (`admin.kmch@medibridge.org`). 
  2. Navigate to Operations Console &rarr; Doctor Leave.
  3. Announce emergency leave for Dr. K. Sundaram.
  4. Switch back to Patient Roma R (`/patient-dashboard`).
* **What to say:**
  > "In traditional hospitals, when a doctor calls in sick, patients arrive at the OPD only to be turned away at the triage desk.
  > 
  > Watch as KMCH Admin announces emergency medical leave for Dr. K. Sundaram. The moment the admin clicks 'Announce Leave', our interval-overlap engine queries all affected confirmed appointments and immediately blocks the doctor's schedule.
  > 
  > *[Switch to Patient Dashboard]*
  > 
  > Look at Roma's dashboard: a high-priority banner appears: *'Doctor Leave Announced & Reassignment Pending'*. MediBridge does not cancel the appointment arbitrarily. We provide the patient with two clinically verified options:
  > 1. **Option 1 (Suggested Specialist):** Peer cardiologist Dr. M. Revathi has an open slot at 10:30 AM.
  > 2. **Option 2 (Same Doctor Next Date):** Reschedule with Dr. Sundaram on his next available OPD day.
  > 3. **Emergency Redirect:** Direct 108 triage for acute symptoms.
  > 
  > Roma clicks 'Accept Specialist'. The replacement slot is atomically held, the old appointment is updated to Confirmed with Dr. Revathi, and the old slot is safely released. Seamless continuity of care without wasted travel."

---

### [05:00 - 06:30] Phase 4: Rural-to-City Referral Lifecycle
* **Speaker:** Roma R
* **Action on Screen:**
  1. Login as Rural Doctor Dr. P. Arumugam (`dr.arumugam@medibridge.org` at Pollachi PHC).
  2. Open Referrals, show dispatch to KMCH Coimbatore with `dedupeKey`.
  3. Switch to KMCH Doctor Portal (`dr.revathi@medibridge.org`). Show incoming queue, click 'Accept Intake'.
* **What to say:**
  > "A patient in rural Pollachi consults Dr. Arumugam with severe cardiac chest heaviness. A rural primary health center lacks a cath lab. Dr. Arumugam dispatches an urgent referral to KMCH Coimbatore.
  > 
  > Every referral carries a unique dedupeKey, preventing accidental duplicate transmissions. When KMCH opens their portal, the referral is sitting in their incoming queue with an SLA response countdown.
  > 
  > KMCH accepts the intake, the patient confirms their travel, and when the patient walks through the city triage doors, staff marks them 'Arrived'. MediBridge tracks complete journey metrics: Sent-to-Received time and Arrival-to-Completion time, bridging the rural-city care divide."

---

### [06:30 - 07:30] Phase 5: Health Vault Ephemeral Consent & Instant Revocation
* **Speaker:** Ragavi R
* **Action on Screen:**
  1. Patient Dashboard &rarr; Health Vault. Show MRI report.
  2. Show 24-hour consent granted to Dr. Revathi.
  3. Doctor Portal: Verify consent, view document metadata, generate 60s signed URL.
  4. Patient Dashboard: Click 'Revoke Now'.
  5. Doctor Portal: Re-request download. Immediate 403 Forbidden!
  6. Patient Dashboard: Show Append-Only Access Log.
* **What to say:**
  > "Patients own their medical data. In our Health Vault, reports are protected with SHA-256 deduplication and magic-byte validation to block disguised executables.
  > 
  > Roma grants Dr. Revathi a 24-hour consent for pre-referral evaluation. Dr. Revathi enters the portal, verifies consent, and generates a 60-second time-limited signed URL to download the report.
  > 
  > Now watch closely: the consultation concludes. Roma clicks **'Revoke Now'**.
  > 
  > *[Doctor refreshes and requests file]*
  > 
  > **HTTP 403 Forbidden: Access Denied.** Revocation takes effect instantly across all server sessions. And when Roma checks her **Patient Access Log**, every view, download, and denied attempt is permanently recorded in an append-only audit trail: who viewed it, when, why, and whether it was allowed or denied."

---

### [07:30 - 08:00] Phase 6: Zero-Auth Emergency PWA Mode & 108 Direct Dial
* **Speaker:** Rithika KP
* **Action on Screen:** Click 'Emergency (108)' in Navbar or disconnect Wi-Fi.
* **What to say:**
  > "Finally, Emergency Mode. If a road accident occurs, nobody has time to download an app, create an account, or remember a password.
  > 
  > Emergency Mode requires zero login. It instantly detects user location, lists closest trauma centers with reported bed capacities and freshness disclaimers, and features a prominent one-tap direct dial to **108**.
  > 
  > Even if cellular network drops completely, our PWA Service Worker serves a pre-cached offline bundle with emergency trauma facilities. Right care, at the right place, at the right time. Thank you."

---

## Answers to the Technical Reviewer Panel Blueprint Questions

#### Q1: "How do you prevent two patients from booking the same last slot simultaneously?"
> **Answer:** "We enforce a two-phase transactional reservation in MongoDB. When a patient selects a slot, we execute an atomic `findOneAndUpdate` matching `status: 'AVAILABLE'` (or an expired hold). This sets a 10-minute hold (`HOLD_EXPIRES_AT`) and increments the document `version`. If two requests arrive in the exact same millisecond, MongoDB's document-level lock ensures only one matches the condition; the second request immediately fails and receives an HTTP 409 Conflict (`SLOT_TAKEN`). We also enforce client `Idempotency-Key` headers so accidental double-taps return cached responses without duplicate database mutations."

#### Q2: "How do you guarantee that an admin from Hospital A cannot see or manipulate Hospital B's patients or bed counts?"
> **Answer:** "We enforce strict tenant isolation at two independent server layers: First, our `tenantGuard` Express middleware extracts the verified `hospitalId` directly from the signed JWT claim—never trusting request bodies or query parameters. If an admin requests a foreign hospital ID, the server returns an HTTP 404 to prevent resource existence enumeration. Second, a custom Mongoose plugin automatically injects the tenant filter into all database queries, making it programmatically impossible for a developer to forget the tenant boundary. Furthermore, hospital admins and super-admins are strictly forbidden from reading Health Vault clinical files."

#### Q3: "What happens if a doctor calls in sick or goes on emergency leave with 15 patients scheduled today?"
> **Answer:** "When the hospital admin records leave with a unique `eventId`, our interval-overlap algorithm queries all confirmed appointments for that doctor during the absence window. The system transitions each appointment to `REASSIGNMENT_PENDING` and executes an automated matching query: Option A finds peer specialists with identical qualifications and open slots today; Option B identifies the original doctor's earliest open OPD slot after their return. The patient receives an immediate alert and can choose either option with one tap. If they choose Option A, the new slot is atomically secured *before* the old appointment is updated, ensuring zero loss of scheduled care."

#### Q4: "How do you ensure medical reports stored in the vault are private, and what happens when a patient revokes access?"
> **Answer:** "Clinical documents are stored in private object storage using randomized UUID storage keys—raw filenames and direct static URLs are never exposed. On every file access request, our server dynamically validates the `ConsentArtifact` collection: the consent must be `ACTIVE`, unexpired (&le; 24h), and unrevoked. If valid, the backend generates an ephemeral signed token with a 60-second expiration. The moment a patient clicks 'Revoke', the consent status becomes `REVOKED` in the database. Any subsequent request—even 1 second later—is immediately denied with an HTTP 403 Forbidden. Every access attempt, permitted or denied, is written to an append-only patient access log."

#### Q5: "If a rural patient arrives in an emergency without internet or login, how does MediBridge help?"
> **Answer:** "Emergency mode is engineered with zero authentication barriers: no login, no profile creation, and no network dependencies for phone calls. The direct `tel:108` dialer invokes the operating system's native telephony dialer directly. Furthermore, MediBridge is a certified Progressive Web App (PWA): our service worker automatically caches an offline snapshot bundle of all district trauma centers, phone hotlines, and reported bed capacities. Even when airplane mode is enabled, the emergency page loads instantly from cache with an honest stale-data warning banner."
