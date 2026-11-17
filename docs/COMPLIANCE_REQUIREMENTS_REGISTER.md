# MediBridge — Compliance Requirements Register
**Visionet Techthon 2026 (Round 2: Solution Development Phase)**  
**Document Classification:** Regulatory & Technical Safeguards Register  
**Governing Standard:** Pre-Production Clinical Systems Baseline (DPDP 2023, Telemedicine 2020, ABDM HDMP, CERT-In 2022)  
**Strict Status Values Permitted:** `Implemented (technical safeguard)`, `Partial`, `Needs legal review`, `Depends on external approval or certification`, `Future`

---

## 1. Regulatory Context & Compliance Statement

> [!IMPORTANT]
> **Legal Notice:** MediBridge is demonstrated as an engineering prototype for the Visionet Techthon 2026 technical reviewer panel. The platform provides technical controls, tenant isolation, and cryptographic protections. MediBridge makes **no claim of statutory legal certification, governmental accreditation, or active ABDM live production certification**. The system is architected to undergo formal third-party cybersecurity auditing and legal counsel review prior to any live clinical deployment.

---

## 2. Compliance Requirements Register Table

| # | Requirement Summary | Applicable Regulation / Standard | Responsible System Component | Implementation Control | Verification Method & Technical Evidence | Current Status |
|---|---------------------|----------------------------------|------------------------------|------------------------|------------------------------------------|----------------|
| **1** | Notice & Purpose-Specific Consent at Registration | Digital Personal Data Protection Act (DPDP) 2023 § 6(1) & DPDP Rules 2025 | Auth Module & Registration Form | Explicit privacy notice shown prior to signup; purpose limitation clearly displayed on UI. | Unit & UI inspection of registration workflow. | **Implemented (technical safeguard)** |
| **2** | Ephemeral, Purpose-Limited Consent with Instant Revocation | DPDP Act 2023 § 6(4) & § 6(7) | `ConsentArtifact` & `vaultService` | Granular consent specifying doctor, purpose, duration (max 24h) and record IDs. Revocation takes effect instantly across all sessions. | Automated test `module6_vault.test.js`: immediate 403 upon revocation. | **Implemented (technical safeguard)** |
| **3** | Right to Grievance Redressal & Access History | DPDP Act 2023 § 11 & § 12 | `PatientAccessLog` & Audit Engine | Append-only patient-facing access history displaying *who accessed what, when, clinical purpose, and whether allowed or denied*. | Verified in `module6_vault.test.js`: logs contain all permitted/denied accesses. | **Implemented (technical safeguard)** |
| **4** | Right to Correction and Erasure (Data Minimization) | DPDP Act 2023 § 12(3) | `patientProfileService` & Vault | Soft-delete mechanism with active consent cascade revocation; profile edit endpoints. | Integration test verifying soft delete and linked consent revocation. | **Implemented (technical safeguard)** |
| **5** | Doctor Identity Verification & Qualification Display | Telemedicine Practice Guidelines (2020) § 1.3 & § 3.1 | Doctor Model & Public Search | Verified display of state medical council registration numbers (`regNumber`). Fictional numbers in demo explicitly labeled `"Demo, not verified"`. | Visual verification on doctor cards and API payload projection. | **Implemented (technical safeguard)** |
| **6** | Explicit Patient Consent Before Teleconsultation | Telemedicine Practice Guidelines (2020) § 3.4 | Teleconsult Entry Point & Waiting Room | Teleconsult join gate requires confirmed booking reference and captures participant token bound to patient ID. | Automated test `module8_portal_teleconsult.test.js` join gate authorization. | **Implemented (technical safeguard)** |
| **7** | CERT-In Synchronized UTC Time & Log Retention | CERT-In Directions 2022 (No. 20(3)/2022-CERT-In) § (v) & (vi) | `AuditLog`, Mongoose UTC Config | All database timestamps stored in UTC ISO 8601; structured request logs carry `X-Request-Id`; 180-day retention schema design. | UTC serialization assertions in automated tests and audit collections. | **Implemented (technical safeguard)** |
| **8** | Immediate Incident & Data Breach Reporting Path | CERT-In Directions § 5 & DPDP Act § 8(6) | Incident Response Runbook & Ops Console | Centralized anomaly metrics (elevated 401s, token reuse detection, storage threshold alerts) with escalation runbook. | Documented runbook in `FAILURE_MANAGEMENT_AND_DISASTER_RECOVERY.md`. | **Partial** (Monitoring implemented; legal notification requires human counsel) |
| **9** | ABDM Consent Manager / Gateway Interoperability | Ayushman Bharat Digital Mission (ABDM) HDMP | Health Vault & Modular Consent Adapter | Modular architecture decoupled from proprietary hospital schemas; consent artifacts modeled on ABDM HIU/HIP specifications. | Architectural review of domain module boundaries. | **Future** (ABDM production gateway requires official NHA onboarding & sandbox keys) |
| **10** | End-to-End Field-Level Encryption for Medical Reports | DPDP Act 2023 § 8(5) & ISO 27799 | Vault Storage Layer & Mongo Client-Side Field Encryption (CSFLE) | Server-side AES-256 at rest (MongoDB Atlas & object store); private randomized UUID file keys; 60s signed access tokens. | Storage inspection: raw filenames never stored; URLs expire in 60 seconds. | **Implemented (technical safeguard)** |
| **11** | Minor / Child Profile Parental Consent Verification | DPDP Act 2023 § 9 (Processing of Personal Data of Children) | `PatientProfile` Family Profiles | Profiles tagged with relationship (`child`, `parent`); minor records administered under primary guardian account. | Verification in `module1_foundation.test.js` family profile access tests. | **Needs legal review** (Verifiable parental consent mechanism per 2025 Rules) |
| **12** | Third-Party Vendor & Subprocessor Oversight | DPDP Act 2023 § 8(2) | Infrastructure & Cloud Providers | Strict contractual isolation; cloud services restricted to verified regions (AWS/GCP India); no third-party tracking or advertising SDKs. | Zero external trackers, analytics pixels, or advertising libraries in bundle. | **Implemented (technical safeguard)** |

---

## 3. Phased DPDP Rules 2025 Action Plan

1. **Phase 1 (Immediate - Solution Development)**: Full technical controls active: granular consent, instant revocation, zero-knowledge hospital admin boundaries, append-only access log.
2. **Phase 2 (Pre-Pilot Review)**: Independent legal audit to review grievance redressal officer appointment, retention policy schedules, and child consent mechanisms under forthcoming 2025 notifications.
3. **Phase 3 (Post-Techthon ABDM Integration)**: Enrolment into National Health Authority (NHA) Sandbox for ABHA creation and milestone 1-3 M1/M2/M3 compliance.
