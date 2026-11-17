# MediBridge — Team Contribution & Engineering Ownership Split
**Visionet Techthon 2026 (Round 2: Solution Development Phase)**  
**Institution:** Sri Shakthi Institute of Engineering and Technology (B.Tech Information Technology)

---

## 1. Architectural Understanding Principle
While specific technical modules were owned and implemented by designated team members, **every team member understands, can explain, and can defend every layer of the system** before the technical reviewer panel—from database transaction mechanics to frontend PWA service workers.

---

## 2. Detailed Ownership Matrix

### Roma R — Team Lead & Full-Stack Architect
- **Domain Modules Owned:**
  - `Module 1: Foundation (Auth, RBAC, Dual-Token Architecture, tokenVersion)`
  - `Module 2: Availability Engine & Geospatial (2dsphere) Search`
  - `Module 7: Emergency Mode & Progressive Web App (PWA) Offline Engine`
- **Key Engineering Deliverables:**
  - Designed the modular monolith architecture under `/backend` and `/frontend`.
  - Implemented Argon2/Bcrypt password security and the 5-failed-attempt account lockout mechanism.
  - Implemented the central `tenantGuard` Express middleware and the Mongoose tenant isolation plugin.
  - Built the 2dsphere spherical geospatial search with Haversine fallback and batch query optimization that eliminated N+1 database bottlenecks (achieving 105 ms search latency across 1,000 facilities).
  - Authored the PWA Service Worker caching strategy for zero-auth emergency access and offline direct dialer (`tel:108`).
- **Live Demo Segment:** Phase 1 (Search That Matters) & Phase 4 (Rural-to-City Referral Flow).

---

### Ragavi R — Senior Backend & Concurrency Systems Engineer
- **Domain Modules Owned:**
  - `Module 3: Atomic Booking, Concurrency Control & State Machine`
  - `Module 8: Admin Dashboard Operations Console & Slot Scheduler`
  - `Performance Benchmarking & Concurrency Stress Test Suites`
- **Key Engineering Deliverables:**
  - Implemented the `Idempotency-Key` header caching middleware using MongoDB TTL collections and `X-Cache-Lookup: HIT`.
  - Engineered the two-phase atomic slot reservation system (`HOLD_EXPIRES_AT` with 10-minute hold window) and partial unique indexes.
  - Built the patient schedule overlap detection algorithm preventing conflicting bookings on the same date/time interval.
  - Engineered the Transactional Outbox pattern (`OutboxEvent`) and the automated 60-second Reconciler background worker.
  - Implemented the Atomic Reschedule mechanism (*reserve new before releasing old, with instant rollback if replacement is taken*).
  - Executed the 50-request parallel booking race benchmark, verifying 1 exact success and 0 orphan reservations.
- **Live Demo Segment:** Phase 2 (High-Concurrency Race Condition) & Phase 5 (Health Vault Ephemeral Consent).

---

### Rithika KP — Clinical Workflows & Data Governance Engineer
- **Domain Modules Owned:**
  - `Module 4: Doctor Leave & Two-Choice Reassignment Engine`
  - `Module 5: Rural-to-City Referral Lifecycle & Journey Metrics`
  - `Module 6: Health Vault & Ephemeral Consent Engine`
- **Key Engineering Deliverables:**
  - Built the doctor leave interval-overlap algorithm, querying affected appointments upon admin leave recording.
  - Implemented the clinical Two-Choice Reassignment workflow (Suggested Peer Specialist vs Same Doctor Reschedule vs Emergency Redirect).
  - Modeled the rural-to-city referral state machine (`Sent` &rarr; `Received` &rarr; `Under Review` &rarr; `Accepted` &rarr; `Patient Notified` &rarr; `Arrived` &rarr; `Completed`) with unique `dedupeKey` protection.
  - Formulated the journey metrics tracker capturing Sent-to-Received and Arrival-to-Completion clinical durations.
  - Engineered the Health Vault upload pipeline with magic-byte file validation (`%PDF`, `\x89PNG`, `\xFF\xD8\xFF`), 10MB ceiling, and SHA-256 deduplication.
  - Implemented the Ephemeral Consent engine (max 24h) with 60-second signed download URLs, instant server-wide revocation, and the append-only `PatientAccessLog`.
- **Live Demo Segment:** Phase 3 (Doctor Leave & Reassignment) & Phase 6 (Emergency Mode & Wrap-up).

---

## 3. Joint Responsibilities
- Automated test suite construction (all 47 Jest & Supertest tests passing).
- Clinical compliance requirements register (mapping DPDP Act 2023, Telemedicine Guidelines 2020, and CERT-In).
- UI/UX implementation following clinical design tokens (Navy `#102D3A`, Teal `#147D78`, Sage `#D9EAE6`, Off-white `#F5F7F6`, Gold `#D5A45B`).
- Preparation and verification of the 8-minute demonstration script and presentation deck.
