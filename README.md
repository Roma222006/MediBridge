# MediBridge — Healthcare Coordination Platform
**Visionet Techthon 2026 (Round 2: Solution Development Phase)**  
**Team:** Roma R (Lead), Ragavi R, Rithika KP  
**Institution:** Sri Shakthi Institute of Engineering and Technology (B.Tech Information Technology)  
**One-Line Product Definition:** *One platform to Discover (availability-first search), Book (atomic booking), Consult (teleconsult), Refer (rural to city, tracked to completion) and Follow up (health vault and reminders), from villages to city hospitals.*

---

## 1. The Core Problem MediBridge Solves
In a medical emergency or specialized consultation, patients open Google Maps or generic apps, travel to the nearest hospital, and only then discover that:
- The specialist doctor is on leave or unavailable today.
- The required diagnostic machine (e.g. 3T MRI, Cath Lab) is offline or only runs certain days of the week.
- ICU or general beds are completely full.
- Out-of-pocket costs are unaffordable and government scheme acceptance is unknown.

**Maps show where a hospital is, not whether it can treat you today.** MediBridge bridges this critical availability and coordination gap.

---

## 2. Technical Architecture Diagram

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

## 3. Technology Stack & One-Line Engineering Justifications

| Component | Technology | One-Line Engineering Justification |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (v24 LTS) & Express | High-concurrency I/O event loop ideal for asynchronous booking, socket broadcasts, and fast REST APIs. |
| **API Architecture** | Modular Monolith (`/api/v1`) | Clean domain separation with zero distributed system network overhead, ensuring sub-second transactions. |
| **Database** | MongoDB Atlas (Replica Set) + Mongoose | Native GeoJSON (2dsphere) indexing for spatial hospital searches and multi-document ACID transactions for slot reservations. |
| **In-Memory / Queue** | MongoDB Atomic-Claim Engine + Outbox | Guarantees at-least-once job execution and reservation timeouts with zero external runtime dependency failures. |
| **Realtime Engine** | Socket.IO | Push-based slot and bed availability updates to connected clients without client-side polling overhead. |
| **Frontend Framework** | React 18 + Vite | Lightning-fast initial load (< 96 KB gzipped) and sub-second route-level code splitting without bloated UI libraries. |
| **State & Networking** | React Router v6 + Axios | Predictable role-based route guards and centralized Axios interceptors for automatic JWT refresh rotation. |
| **Emergency Mode** | Progressive Web App (PWA Service Worker) | Enables zero-login offline caching of nearest hospitals and direct tel:108 dialing with zero network reliance. |
| **Design System** | Hand-crafted CSS Design Tokens | Strict clinical-professional palette (Navy `#102D3A`, Teal `#147D78`, Sage `#D9EAE6`, Off-white `#F5F7F6`, Gold `#D5A45B`), WCAG 2.2 AA compliant, zero emojis or decorative AI filler. |
| **Test & Reliability** | Jest, Supertest, Concurrency Runners | Automated database-level validation of tenant isolation, idempotency, race conditions, and rollback recovery. |

---

## 4. Pre-Seeded Live Demonstration Accounts

| Role | Name | Email | Password | Primary Demo Capability |
| :--- | :--- | :--- | :--- | :--- |
| **Patient (Lead)** | Roma R | `roma.patient@medibridge.org` | `PatientPass123!` | Family profiles, MRI search, booking review, vault upload, 24h consent. |
| **Patient (Peer)** | Ragavi R | `ragavi.patient@medibridge.org` | `PatientPass123!` | Last-slot concurrency race competitor. |
| **Patient (Peer)** | Rithika KP | `rithika.patient@medibridge.org` | `PatientPass123!` | Doctor leave reassignment resolution (Choice 2: Reschedule). |
| **Doctor (City)** | Dr. M. Revathi | `dr.revathi@medibridge.org` | `DoctorPass123!` | Cardiology specialist, receives referrals, verifies vault consent, teleconsult. |
| **Doctor (Rural)** | Dr. P. Arumugam | `dr.arumugam@medibridge.org` | `DoctorPass123!` | Pollachi PHC doctor, dispatches rural-to-city referrals with `dedupeKey`. |
| **Hospital Admin** | KMCH Admin | `admin.kmch@medibridge.org` | `AdminPass123!` | Live bed capacity updater, announces doctor leave, manages slots. |
| **Super Admin** | Platform Admin | `superadmin@medibridge.org` | `SuperAdmin123!` | System health, facility verification status. |
| **Guest / Emergency** | Anyone | *No login needed* | *None* | Direct trauma discovery, reported bed counts, 1-tap 108 direct dialer. |

---

## 5. Quick Start & Setup Guide

### Prerequisites
- Node.js (v18+ or v24 LTS)
- npm (v9+)
- Local MongoDB or MongoDB Atlas URI

### Step 1: Install Backend & Frontend Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### Step 2: Seed Demonstration Scenarios
```bash
cd backend
npm run seed
```
*Seeds the entire Tamil Nadu network (Coimbatore, Pollachi, Tiruppur, Salem, Chennai), 3 hospitals, doctors, diagnostic services, MRI slots, leave events, active referrals, and sample vault scans.*

### Step 3: Run the Automated Test Suite (47 Passing Tests)
```bash
cd backend
npm test
```
*Executes all 8 domain module test suites and performance benchmarks.*

### Step 4: Start the Applications
```bash
# Terminal 1 - Start Backend (Port 5000)
cd backend
npm start

# Terminal 2 - Start Frontend (Port 3000)
cd frontend
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 6. How to Reset Demo Data
To cleanly restore the demonstration database to its initial pristine demonstration state at any time during a live presentation:
```bash
cd backend
npm run seed
```

---

## 7. Performance & Concurrency Benchmarks (Measured Actuals)

```
Test Suites: 8 passed, 8 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        58.50 s
```
- **Spatial Search Across 1,000 Hospitals:** **105 ms** (Target: < 2,000 ms).
- **100 Concurrent Searches:** **2,993 ms** (100/100 HTTP 200 OK, zero request drops).
- **50 Concurrent Booking Race:** Exactly **1 confirmed booking**, **49 conflicts (409 SLOT_TAKEN)**, **0 orphan reservations** in 849 ms.
- **Frontend Initial Bundle Size:** **95.31 kB gzipped** (Target: < 150 kB).

---

## 8. Documentation Suite Index
- [Architecture & Data Governance](docs/ARCHITECTURE_AND_SECURITY.md)
- [Compliance Requirements Register (DPDP 2023, Telemedicine 2020, CERT-In)](docs/COMPLIANCE_REQUIREMENTS_REGISTER.md)
- [Reliability, Failure Matrix & Disaster Recovery](docs/FAILURE_MANAGEMENT_AND_DISASTER_RECOVERY.md)
- [Implementation Status Report (Done vs Partial vs Future)](docs/IMPLEMENTATION_STATUS_REPORT.md)
- [Measured Test & Performance Results](docs/TEST_AND_PERFORMANCE_RESULTS.md)
- [8-Minute Live Demo Script & Blueprint Q&A](docs/EIGHT_MINUTE_DEMO_SCRIPT.md)
- [16-Point Techthon Presentation Deck](docs/PRESENTATION_CONTENT_16_POINTS.md)
- [Team Ownership & Contribution Split](docs/TEAM_CONTRIBUTION_AND_OWNERSHIP.md)

---

## 9. Credits & References
- **National Health Authority (NHA) & Ayushman Bharat Digital Mission (ABDM):** Health Data Management Policy (HDMP) & Consent Manager Architecture specifications.
- **Ministry of Health and Family Welfare (MoHFW), Government of India:** Telemedicine Practice Guidelines (2020).
- **Indian Computer Emergency Response Team (CERT-In):** Directions on Information Security Practices (2022).
- **Government of Tamil Nadu, Department of Health and Family Welfare:** Chief Minister’s Comprehensive Health Insurance Scheme (CMCHIS) guidelines.
- **Visionet Techthon 2026 Organizing Committee:** Problem statement and Round 2 technical challenge briefing.
