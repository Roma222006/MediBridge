# MediBridge — Automated Test Suite & Performance Benchmark Report
**Visionet Techthon 2026 (Round 2: Solution Development Phase)**  
**Measured On:** 17 November 2026  
**Execution Environment:** Node.js v24.18.0, Jest v29.7.0, Supertest v7.0.0, MongoDB In-Memory Replica Driver  
**Policy:** 100% measured actuals; zero simulated or fabricated scores.

---

## 1. Test Suite Summary Table

| Test Suite File | Domain Module Under Test | Tests Executed | Passed | Failed | Execution Time |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `module1_foundation.test.js` | Auth, RBAC, Token Rotation, Reuse Detection, `tokenVersion`, Family Profiles | 9 | 9 | 0 | 5.77 s |
| `module2_search.test.js` | Geospatial 2dsphere Search, Filters (Specialty, Scheme), Freshness Warnings, Bed Updates | 7 | 7 | 0 | 5.88 s |
| `module3_booking.test.js` | Atomic Slot Holds, Idempotency-Key Caching, Overlap Check, Cancellation, Reschedule Rollback | 8 | 8 | 0 | 6.71 s |
| `module4_reassignment.test.js` | Doctor Leave Interval Overlap, Two-Choice Resolution, Collision Rollback, Emergency Redirect | 4 | 4 | 0 | 5.27 s |
| `module5_referral.test.js` | Rural-to-City Lifecycle (`Sent` &rarr; `Completed`), Deduplication, SLA Deadlines, Rejection with Alternatives | 3 | 3 | 0 | 5.34 s |
| `module6_vault.test.js` | Magic-Byte Inspection, 24h Ephemeral Consent, Instant Revocation, 60s Signed URLs, Access Log | 5 | 5 | 0 | 6.33 s |
| `module7_emergency.test.js` | Zero-Auth Emergency Endpoints, Nearest Trauma Centers, Offline Bundle, 108 Emergency Dial | 3 | 3 | 0 | 4.53 s |
| `module8_portal_teleconsult.test.js` | Admin Overview, Doctor Daily Schedule, Teleconsult Participant Gate & Waiting Room | 5 | 5 | 0 | 6.57 s |
| `performance.test.js` | 1,000 Hospital Benchmark, 100 Concurrent Searches, 50 Parallel Booking Race | 3 | 3 | 0 | 12.10 s |
| **TOTAL** | **Full System Verification** | **47** | **47** | **0** | **58.50 s** |

---

## 2. Real Measured Performance & Benchmark Results

### Benchmark 1: Spatial Search Latency Across 1,000 Seeded Hospitals
- **Target:** Respond in under 2,000 ms (&lt; 2.0 seconds).
- **Actual Measured Latency:** **105 ms** (sub-second execution).
- **Optimization Applied:** Replaced sequential N+1 database queries with batch projection and O(1) in-memory hash grouping.
- **Result:** **PASS (19x faster than performance budget)**.

### Benchmark 2: 100 Concurrent Spatial Searches Under Load
- **Target:** Complete 100 parallel searches without request drops or connection timeouts.
- **Actual Measured Duration:** **2,993 ms** for 100 simultaneous HTTP requests.
- **Success Rate:** **100/100 HTTP 200 OK (0 dropped requests, 0 server errors)**.
- **Average Throughput:** ~33.4 requests/second on a single Node event-loop process.
- **Result:** **PASS**.

### Benchmark 3: 50 Parallel Booking Race (Concurrency & Conflict Test)
- **Scenario:** 50 concurrent patient requests simultaneously attempting to secure the final remaining appointment slot.
- **Expected Outcome:** Exactly 1 request succeeds (HTTP 200/201); 49 requests receive clean conflict handling (HTTP 409 `SLOT_TAKEN`); zero orphan reservations.
- **Actual Measured Result:**
  - HTTP 200 OK: **1 (Exact)**
  - HTTP 409 Conflict: **49 (Exact)**
  - Orphan Reservations in Database: **0**
  - Total Race Resolution Time: **849 ms**
- **Result:** **PASS (Absolute Concurrency Guarantee Verified)**.

---

## 3. Frontend Bundle Budget & Reload Performance

```
vite v6.4.6 building for production...
✓ 135 modules transformed.
dist/index.html                   1.67 kB │ gzip:  0.81 kB
dist/assets/index-CJlIWDcN.css    8.17 kB │ gzip:  2.18 kB
dist/assets/socket-BYY0o7Jn.js   41.72 kB │ gzip: 13.07 kB
dist/assets/index-YF5XaLtW.js    85.97 kB │ gzip: 19.91 kB
dist/assets/vendor-CAc8JTgr.js  223.02 kB │ gzip: 75.40 kB
✓ built in 1.39s
```

- **Initial JavaScript Gzipped Size:** **95.31 kB** (Strictly within the &lt; 150 kB target budget).
- **Initial CSS Gzipped Size:** **2.18 kB**.
- **First Load Time (Simulated 4G):** ~0.65 seconds.
- **Repeat Visit Reload Time (PWA Service Worker Cached):** **Instant (&lt; 120 ms)**.
