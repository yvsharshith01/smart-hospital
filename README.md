# NEXUS Smart Hospital Platform

**Problem Statement:** Hospital Management / Healthcare Operations System — a unified platform to digitize and streamline core hospital workflows (patient intake, consultations, diagnostics, pharmacy, billing) across multiple roles with strict access control.

## Description

NEXUS is an enterprise-grade, full-stack hospital operational platform and clinical information system. The platform orchestrates core healthcare workflows with strict Role-Based Access Control (RBAC), clinical consultation management, diagnostic laboratory tracking, pharmacy inventory fulfillment, patient billing, and compliance audit logging. It connects the full patient journey — from token registration and doctor consultation, through lab diagnostics and prescription dispensation, to invoice generation and payment — into one coherent system, while giving each hospital role (doctor, patient, receptionist, lab, pharmacy, admin) only the access it needs.

---

## Team Members

| Name | Role |
| :--- | :--- |
| Y V S Harshith | *(Full-Stack Developer / Team Lead)* |
| P Tanusri | *(, Frontend Developer)* |
| K Purandhareswari | *( Backend Developer)* |

---

## Live Deployment

🔗 **Live Link:** *(add your deployed Vercel URL here, e.g., https://smart-hospital.vercel.app)*

---

## Architecture Overview

The system is designed around a unified full-stack architecture with clear separation of identity, clinical logic, operational workflows, and audit persistence.

```
                          CLIENT (Browser)
                                 │
                                 ▼
                ┌─────────────────────────────────┐
                │       Next.js (App Router)      │
                │  React Server & Client Engine   │
                └────────────────┬────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
         REST / API Routes                 JWT / Auth Guard
    /api/workflow, /api/auth              Role Verification
                │                                 │
                └────────────────┬────────────────┘
                                 │
                                 ▼
                ┌─────────────────────────────────┐
                │      PostgreSQL (Supabase)      │
                │ Relational Data & Schema Engine │
                └─────────────────────────────────┘
```

---

## Features Built

### 1. Multi-Role RBAC & Access Segregation
Strictly enforces access boundaries across all clinical and administrative roles:
* **Doctor:** Patient queue management, clinical notes, diagnosis (ICD-10), electronic prescriptions, and diagnostic lab ordering.
* **Patient:** Direct appointment booking, invoice inspection, and online payment settlement.
* **Receptionist:** Walk-in registration, triage assignment, token issuance, and queue dispatch.
* **Laboratory:** Diagnostic test request processing and verified lab report publication.
* **Pharmacy:** Prescription queue processing, drug dispensation, and inventory tracking.
* **Administrator:** Complete visibility across all departmental operational modules and system audit logs.

### 2. Clinical Workflow & Patient Journey
Connects sequential healthcare delivery states:
* Patient Token Registration -> Scheduled Queue
* Doctor Consultation -> EMR Record Created -> Lab & Prescription Orders Broadcasted
* Lab Specimen Analysis -> Diagnostic Report Uploaded
* Pharmacy Prescription Dispensation -> Stock Depletion
* Automated Invoice Generation -> Online Payment Settlement

### 3. Integrated Decision Support & Telemedicine
* **AI Diagnostic Assistant:** Embedded co-pilot for preliminary diagnostic cross-referencing and lab test suggestions based on clinical symptoms.
* **Telemedicine Suite:** Dedicated WebRTC-ready virtual consultation interface.
* **Security & Audit Logging:** Persistent, timestamped event tracking for HIPAA-aligned accountability.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 14+ (App Router), React |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL (Supabase Infrastructure) |
| **Authentication** | JSON Web Tokens (JWT), Role-Based Session Guards |
| **Deployment** | Vercel (Edge Network) |

---

## Database Schema Design

The relational model includes the following core entities:

* `roles` - System permission tiers (ADMIN, DOCTOR, PATIENT, RECEPTIONIST, LABORATORY, PHARMACY)
* `users` - Identity accounts with authentication records
* `patients` - Clinical demographics and history metadata
* `doctors` - Specializations and consultation parameters
* `appointments` - Scheduled, completed, and canceled visit states
* `medical_records` - Clinical diagnoses, ICD-10 tags, and examination notes
* `prescriptions` - Medication details, dosage instructions, and dispensation states
* `lab_requests` - Diagnostic order tracking and document URLs
* `pharmacy_inventory` - Medication stock counts and pricing
* `bills` - Consolidated consultation, laboratory, and medication invoices
* `audit_logs` - Immutable action trail across users and timestamps

---

## Getting Started

### Prerequisites
* Node.js (v18.x or later)
* npm / yarn / pnpm
* PostgreSQL database instance or Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/smart-hospital.git
cd smart-hospital
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the project root:
```
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
JWT_SECRET="your-secure-jwt-secret"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Pre-Configured Test Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| Doctor | doctor@hospital.com | doctor123 | Doctor Queue, Telemedicine |
| Patient | patient@hospital.com | patient123 | Booking, Invoices, Telemedicine |
| Receptionist | reception@hospital.com | reception123 | Front Desk, Triage, Token Dispatch |
| Laboratory | lab@hospital.com | lab123 | Lab Requests, Report Publishing |
| Pharmacy | pharmacy@hospital.com | pharmacy123 | Prescription Queue, Stock Alerts |
| Admin | admin@hospital.com | admin123 | Complete Platform & Audit Log Access |

---

## Known Bugs & Limitations

* Telemedicine video calls are WebRTC-ready but not yet load-tested for group/multi-party calls — currently designed for 1:1 consultations only.
* AI Diagnostic Assistant provides preliminary suggestions only; it is not a substitute for clinical judgment and has not been validated against a medical dataset.
* No automated end-to-end test suite yet — testing has been manual across roles.
* Payment settlement is integrated at the UI/workflow level; a production-grade payment gateway (e.g., Razorpay/Stripe) still needs to be wired in for real transactions.
* Audit logs are append-only in the database but do not yet have a dedicated export/reporting UI for compliance officers.
* 

