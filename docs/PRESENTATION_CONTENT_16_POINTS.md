# MediBridge — Complete 16-Point Techthon Presentation Deck
**Visionet Techthon 2026 (Round 2: Solution Development Phase)**  
**Project Title:** MediBridge — Healthcare Coordination Platform  
**Team Name:** MediBridge Engineering Team  
**Institution:** Sri Shakthi Institute of Engineering and Technology (B.Tech Information Technology)  
**Team Members:** Roma R (Lead), Ragavi R, Rithika KP

---

### Slide 1: Team Details & Project Title
- **Platform Name:** MediBridge — Healthcare Coordination Platform
- **One-Line Definition:** One platform to Discover (availability-first search), Book (atomic booking), Consult (teleconsult), Refer (rural to city, tracked to completion) and Follow up (health vault and reminders), from villages to city hospitals.
- **Team Lead & Representative:** Roma R (B.Tech IT, Year IV, Sri Shakthi Institute of Engineering and Technology) &bull; Email: `roma.rengadurai06@gmail.com` &bull; Mobile: `+91 7904468928`
- **Team Members:** Ragavi R, Rithika KP

---

### Slide 2: Problem Statement & Why It Matters
- **The Core Clinical Gap:** In medical emergencies and specialist care, people open a map, travel to the nearest hospital, and only then discover:
  - The specialist doctor is on leave or unavailable today.
  - The required diagnostic scan (e.g. 3T MRI, Cath Lab) only runs 2 days a week or is under maintenance.
  - ICU and general beds are 100% occupied.
  - Out-of-pocket costs are unaffordable and government scheme acceptance is unknown.
- **The Ground Truth:** Maps show *where a hospital is*, not *whether it can treat you today*.
- **The Human Cost:** Wasted travel time in acute golden hours, delayed surgical intervention, duplicated diagnostic scans, and rural patients forced into debt.

---

### Slide 3: Target Users & Beneficiaries
1. **Rural & Semi-Urban Patients:** Can access tertiary city specialists via PHC teleconsultations without undertaking expensive 80-km physical journeys.
2. **Chronic & Elderly Patients (Family Profiles):** Managed under primary family accounts with structured follow-ups, test tracking, and privacy-protected records.
3. **Emergency Care Seekers:** Zero-barrier access to nearest trauma centers with live reported bed counts and 1-tap 108 direct dialing.
4. **Physicians & Specialists:** Guaranteed consultation schedules, instant access to consent-authorized patient reports, and clear referral histories.
5. **Hospital Administrators:** Real-time operational control of slots, bed capacities, emergency doctor leaves, and inter-hospital referral tracking.

---

### Slide 4: Existing Solutions & Critical Gaps
| Dimension | Google Maps / Apple Maps | Generic Appointment Apps (Practo, Apollo 24/7) | MediBridge Healthcare Platform |
| :--- | :--- | :--- | :--- |
| **Availability Reality** | Shows static physical location & business hours only. | Doctor slot availability only; zero physical resource awareness. | **Tri-Resource Availability:** Doctor + Diagnostic Scan + Bed/ICU Capacity. |
| **Data Freshness** | Stale, unverified crowd data. | Vendor-curated without timestamps. | **Timestamped Freshness:** Explicit warning badge if data > 2 hours old. |
| **Doctor Leave Handling** | Not tracked. | Silent cancellations or arbitrary refunds. | **Two-Choice Workflow:** Suggested specialist match or atomic reschedule. |
| **Inter-Facility Referrals** | Completely absent. | Intra-network referral only; untracked paper slips. | **Tracked Rural-to-City Lifecycle:** From rural PHC to city tertiary intake. |
| **Data Privacy & Consent** | High tracking; advertising ad-network IDs. | Permanent hospital database retention. | **Ephemeral 24h Consent:** Instant revocation & append-only patient access log. |

---

### Slide 5: Proposed Solution & How It Works
MediBridge unites five pillars into a cohesive clinical coordination architecture:
1. **Discover:** Availability-first search combining geospatial proximity (2dsphere) with real-time bed capacity, doctor schedules, and scheme acceptance (PM-JAY, CMCHIS).
2. **Book:** Atomic booking engine with client `Idempotency-Key` headers, two-phase slot reservation (10-minute hold), and patient schedule overlap guards.
3. **Consult:** Secure teleconsultation bridge with participant-bound session tokens, join authorization, and structured waiting room states.
4. **Refer:** End-to-end tracked rural-to-city referral lifecycle with deduplication keys, response deadlines, and journey milestone metrics.
5. **Follow Up:** Private Health Vault with magic-byte file validation, 24-hour ephemeral consent sharing, 60-second signed download URLs, and immutable patient access history logs.

---

### Slide 6: Key Features & Technical Highlights
- **Geospatial 2dsphere Search:** Sub-second distance queries across 1,000+ facilities with Haversine fallback.
- **Concurrency Protection:** Partial unique indexes and atomic updates ensuring zero double-booking under race conditions.
- **Automated Reassignment Engine:** Detects doctor leave interval overlaps and coordinates peer specialist alternatives.
- **Transactional Outbox & Reconciler:** At-least-once notification guarantees and automated release of expired holds.
- **Zero-Auth Emergency PWA:** Operates with zero login, zero credentials, cached offline trauma centers, and native 108 dialing.

---

### Slide 7: Innovation & Uniqueness
1. **New Approach (Availability-First):** Evaluates diagnostic machine operating days and live ICU beds before recommending a hospital.
2. **Better Process (Atomic Reassignment):** Rather than abandoning patients when doctors fall ill, automatically pairs them with qualified peer specialists while preserving the original appointment until confirmed.
3. **Underserved Need (The Rural-to-City Bridge):** Connects primary health center doctors directly to tertiary city hospital intake desks with tracked clinical outcomes.
4. **Patient-Centric Data Governance:** Patients grant ephemeral, time-bounded consent that they can revoke with immediate server-wide effect.

---

### Slide 8: Technical Architecture Diagram

```
[ Patient Mobile / Browser (PWA) ]    [ Hospital Admin / Doctor Portal ]
             │                                     │
             ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS API GATEWAY (/api/v1)                        │
│  Helmet Security • Strict CORS • Rate Limiting • mongoSanitize        │
│  Correlation Logger (X-Request-Id) • Idempotency-Key Caching           │
├────────────────────────────────────────────────────────────────────────┤
│                     DOMAIN SERVICE MODULES                             │
│  ┌───────────────┐ ┌────────────────┐ ┌─────────────────────────────┐  │
│  │ Auth & RBAC   │ │ Search Engine  │ │ Atomic Booking & Outbox     │  │
│  │ Dual JWT      │ │ 2dsphere Geo   │ │ Two-Phase Slot Lock         │  │
│  └───────────────┘ └────────────────┘ └─────────────────────────────┘  │
│  ┌───────────────┐ ┌────────────────┐ ┌─────────────────────────────┐  │
│  │ Reassignment  │ │ Referrals Core │ │ Health Vault & Consent      │  │
│  │ Leave Engine  │ │ State Machine  │ │ Ephemeral 60s Signed URLs   │  │
│  └───────────────┘ └────────────────┘ └─────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Central Tenant Guard Middleware & Isolation Plugin                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
             │                                     │
             ▼                                     ▼
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│     MONGODB ATLAS CLUSTER     │     │     PRIVATE OBJECT STORAGE       │
│  Replica Set • 2dsphere Index │     │  Random UUID Keys • SHA-256 Hash │
│  ACID Multi-Doc Transactions  │     │  Encrypted at Rest (AES-256)     │
└───────────────────────────────┘     └──────────────────────────────────┘
```

---

### Slide 9: Tech Stack & Tools (With One-Line Justifications)
- **Node.js (v24 LTS) & Express:** High-concurrency asynchronous I/O event loop ideal for booking requests and real-time socket events.
- **MongoDB Atlas (Replica Set) & Mongoose:** Native GeoJSON indexing for spatial hospital searches and multi-document ACID transactions for slot reservations.
- **Socket.IO:** Push-based real-time broadcasting of slot reservations and bed count changes to connected clients without client-side polling.
- **React 18 & Vite:** Sub-second route-level code splitting and lean bundle size (< 100 KB gzipped) for instant reloading on mobile networks.
- **Progressive Web App (PWA Service Worker):** Caches emergency trauma centers and enables offline 108 dialing with zero network reliance.
- **Hand-Written CSS Design Tokens:** Strict clinical palette (Navy `#102D3A`, Teal `#147D78`, Sage `#D9EAE6`, Off-white `#F5F7F6`, Gold `#D5A45B`), WCAG 2.2 AA compliant with zero emojis or decorative AI filler.
- **Jest & Supertest:** Automated database-level validation of tenant isolation, idempotency, race conditions, and rollback recovery.

---

### Slide 10: Prototype & Progress
- **Status:** **100% of Tier 1 P0 Modules Built, Verified, and Tested.**
- **Automated Tests:** 8 test suites, **47 tests passed (0 failures)**.
- **Demonstration Dataset:** Pre-seeded realistic network across Tamil Nadu (Coimbatore, Pollachi, Tiruppur, Salem, Chennai) with 8 dedicated 1-click demo accounts.
- **Production Build:** Successfully compiled frontend production bundle in 1.39s (total gzipped JS: 95.31 kB).

---

### Slide 11: Feasibility & Implementation Plan
- **Low Cost & High Feasibility:** Utilizes open-source MERN stack with MongoDB Atlas free/flex tier and serverless frontend hosting (Vercel/Render).
- **Zero Hospital Integration Barrier:** Operates via hospital admin self-service console and doctor portal without requiring invasive hospital mainframe integrations.
- **Implementation Roadmap:**
  - *Phase 1 (Done):* Core Tier 1 platform, multi-tenant isolation, atomic booking, referral lifecycle, health vault consent.
  - *Phase 2 (Next 6 Months):* District hospital pilot across Coimbatore and Pollachi health blocks.
  - *Phase 3 (Next 12 Months):* NHA ABDM Gateway integration and state-wide rollout.

---

### Slide 12: Testing, Validation & Performance Results
- **1,000 Hospital Spatial Search:** **105 ms** (Target: < 2,000 ms; achieved 19x performance improvement).
- **100 Concurrent Searches:** **2,993 ms** total with **100% HTTP 200 OK** success rate.
- **50 Concurrent Booking Race:** Exactly **1 confirmed booking (HTTP 200 OK)**, **49 rejected (HTTP 409 Conflict)**, and **0 orphan reservations** in 849 ms.
- **Disaster Recovery Restore Drill:** Point-in-time database snapshot restored in **3 minutes 10 seconds** (RTO: < 30 mins, RPO: < 15 mins).

---

### Slide 13: Scalability, Sustainability & Next Steps
- **Horizontal Scalability:** Stateless backend architecture ready for container autoscaling behind an Application Load Balancer with Redis adapter for Socket.IO.
- **Sustainability:** Reduces wasteful vehicular ambulance travel and emergency room triage crowding through verified availability.
- **Next Steps:**
  - Native mobile application using React Native wrapper.
  - Integration with Tamil Nadu CMCHIS digital claims portal.
  - Multilingual voice navigation in Tamil and Hindi.

---

### Slide 14: Challenges, Risks, Security & Privacy
- **Risk 1 (Stale Facility Data):** Mitigated by automated freshness calculation; UI displays prominent warning badge if updates exceed 120 minutes.
- **Risk 2 (Cross-Tenant Data Leakage):** Mitigated by server-enforced `tenantGuard` and Mongoose tenant plugins returning HTTP 404 for foreign tenant requests.
- **Risk 3 (Credential Theft & Token Reuse):** Mitigated by dual-token architecture with rotating refresh token families; any token reuse immediately invalidates all active sessions.
- **Risk 4 (Malicious File Uploads):** Mitigated by magic-byte inspection, 10MB size ceiling, SHA-256 deduplication, and random storage keys.

---

### Slide 15: Expected Outcomes & Social Impact
- **Golden Hour Survival:** Prevents patients in traumatic distress from arriving at unequipped or full hospitals.
- **Bridging the Rural-City Divide:** Enables rural PHC doctors to teleconsult with tertiary centers and refer critical patients with verified intake slots.
- **Financial Protection:** Eliminates duplicated scans and connects patients directly to hospitals accepting their government health schemes.

---

### Slide 16: Team Contributions & Ownership Split
- **Roma R (Team Lead & Representative):** Full-stack architecture, Authentication, Refresh Token Rotation, Tenant Isolation Guard, Geospatial Search Engine, and Emergency PWA Mode.
- **Ragavi R:** Atomic Booking Engine, Idempotency-Key caching, Concurrency Race Protection, Transactional Outbox Pattern, and Automated Reconciler.
- **Rithika KP:** Doctor Leave & Two-Choice Reassignment Engine, Rural-to-City Referral Lifecycle, Health Vault Ephemeral Consent, and Patient Access History Log.
- *Every team member understands and can explain the entire end-to-end architecture.*
