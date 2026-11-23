# MediBridge — Regulatory & Technical Compliance Register

**Document Classification:** Engineering Safeguards & Pre-Production Compliance Register  
**Governing Regulations:** Telemedicine Practice Guidelines (2020), Digital Personal Data Protection Act (DPDP) 2023 & Rules 2025, National Medical Commission Act, CERT-In Directions 2022.  
**Permitted Statuses:** `Implemented`, `Partial`, `Needs legal review`, `Depends on external approval`, `Future`  
**Notice:** MediBridge makes no claim of statutory legal certification, governmental accreditation, or active ABDM live production certification.

---

## Doctor Module Compliance Entries (Section 16)

| # | Requirement / Domain | Applicable Standard | Responsible Subsystem | Technical Implementation Safeguard | Status |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Doctor Registration Display and Verification Process** | Telemedicine Practice Guidelines (2020) § 1.3 & § 3.1 | `Doctor.js`, Search Module, Profile API | Medical registration number and State Medical Council displayed on all public and consultation views. Seeded demo doctors explicitly tagged "Demo, not verified". Unverified doctors blocked from taking bookings. Verified badge displays "Registration checked on [date]" with council details; never claims "officially verified". | **Implemented** |
| **2** | **Telemedicine Consent and Consultation Record** | Telemedicine Practice Guidelines (2020) § 3.4 & § 3.5 | `teleconsultController.js`, `ConsultationNote.js` | Patient consent recorded prior to entering waiting room. Attending physician credentials presented to patient. Software records what the doctor writes without AI diagnosis or prescribing. Clinical safety guard enforces note persistence before session can be terminated. | **Implemented** |
| **3** | **Prescribing Responsibility & Drug Categories for Teleconsults** | Telemedicine Guidelines (2020) § 5 (List O, A, B, Prohibited) | Teleconsult Workspace, `docs/PROJECT_RULES.md` | The platform does not prescribe, suggest medicines, or auto-complete clinical content. Doctor bears sole clinical and statutory responsibility for adherence to restricted drug schedules. Digital signature on prescriptions marked Tier 3. | **Needs legal review** |
| **4** | **Record Retention and Addenda** | NMC Regulations & DPDP Act 2023 § 12(3) | `ConsultationNote.js`, Audit Engine | Finalized clinical consultation records are locked against deletion or in-place modification. Corrections must be submitted as append-only addenda with author ID, timestamp, and clinical justification. Record retention schedule listed for legal counsel determination. | **Implemented** |
| **5** | **Data Minimisation for Doctor Identity** | DPDP Act 2023 § 6(1) (Purpose Limitation) | `Doctor.js`, Onboarding Forms | Platform collects only professional credentials (full name, mobile, email, council, qualifications, specialty, experience, designation, department, consult modes). Residential address, personal emergency contacts, date of birth, gender, and national ID numbers are deliberately excluded. | **Implemented** |
| **6** | **Access Logging of Credential Documents** | CERT-In Directions 2022 & DPDP Act 2023 § 8(5) | `CredentialDocument.js`, `PatientAccessLog.js` | Professional certificates stored in private object storage with randomized UUID storage keys and sha256 checksums. Access strictly restricted to owning doctor, assigned hospital admin, and super-admin; every read logged with user ID, role, timestamp, and purpose. | **Implemented** |

---

## General Platform Compliance Matrix (Baseline)

| # | Requirement Summary | Applicable Regulation | Implementation Safeguard | Verification Evidence | Status |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **7** | **Notice & Purpose-Specific Consent** | DPDP Act 2023 § 6(1) | Auth & Registration UI | Privacy notice and purpose limitation shown at registration. | Tested in `module1_foundation.test.js` | **Implemented** |
| **8** | **Ephemeral Consent with Instant Revocation** | DPDP Act 2023 § 6(4) | `ConsentArtifact`, `vaultService` | Ephemeral consent tokens (max 24h). Immediate 403 on revocation with Socket.IO auto-close. | Tested in `module6_vault.test.js` | **Implemented** |
| **9** | **Append-Only Access History** | DPDP Act 2023 § 11 & § 12 | `PatientAccessLog` | Log records all accesses/denials (who, what, when, purpose). | Tested in `module6_vault.test.js` | **Implemented** |
| **10** | **CERT-In Synchronized UTC Timestamps** | CERT-In Directions 2022 § (v) | Mongoose UTC Serializer | All database records in ISO 8601 UTC. Structured request logging with `X-Request-Id`. | Tested across test suites | **Implemented** |
| **11** | **ABDM Gateway Interoperability** | Ayushman Bharat Digital Mission HDMP | Modular Consent Adapter | HIU/HIP decoupled consent artifacts; ready for NHA sandbox keys. | Architectural review | **Future** |
