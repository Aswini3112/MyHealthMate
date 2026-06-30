# MyHealthMate

**Digital Health Records Management Platform for Indian Patients**  
Built for **HACKHAZARDS '26** — HealthTech & Bio Platforms track.

MyHealthMate is a patient-centric platform where users store medical records securely, view health analytics, chat with an AI companion, link ABHA ID via ABDM, and share records with doctors through OTP or QR consent tokens.

---

## Features

| Module | Description |
|--------|-------------|
| **ABHA Authentication** | OTP-based ABHA login via ABDM sandbox mock; regular signup with optional ABHA creation |
| **Patient Dashboard** | Profile, health score (0–100), vitals cards, chronic condition flags, health timeline |
| **Medical Records + OCR** | Upload PDF/JPG/PNG; Amazon Textract + Comprehend Medical simulation; document inspector |
| **Health Analytics** | Recharts for glucose, BP, weight, cholesterol, adherence; goal tracking; PDF export |
| **AI Chatbot** | Context-aware Bedrock mock; English/Hindi/Tamil (Sarvam AI mock) |
| **Doctor Sharing** | OTP (10 min) / QR (1h–7d); consent record selection; audit logs; revoke access |
| **Doctor Portal** | Separate view for doctors to verify OTP/QR and read shared records |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, JWT, Multer
- **Database:** MongoDB (optional) with JSON file fallback — no Mongo required for demo
- **AWS (mocked for hackathon):** Textract, Comprehend Medical, Bedrock, S3, Cognito-ready architecture
- **ABDM:** Sandbox gateway mock with FHIR-style patient history import

---

## Quick Start

### Prerequisites
- Node.js 18+

### 1. Install dependencies

```bash
cd D:\Hack2
npm install
cd server && npm install
cd ../client && npm install
```

Or from root after `npm install` at root (installs concurrently):

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Run development servers

```bash
npm run dev
```

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:5000  
- **Health check:** http://localhost:5000/health  

### 3. Demo login (ABHA)

1. Go to **Get Started** → ABHA ID Login  
2. ABHA ID: `91-9283-1283-9128`  
3. OTP: `123456`  

This loads pre-seeded patient **Rajesh Kumar** with prescriptions, lab reports, vitals, and health score data.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login-abha` | Request ABHA OTP |
| POST | `/api/auth/verify-abha-otp` | Verify OTP & link profile |
| POST | `/api/auth/register-regular` | Email signup (+ optional ABHA) |
| POST | `/api/auth/login-regular` | Email/password login |

### Patient
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/:id` | Get patient profile |
| PUT | `/api/patients/:id/update` | Update profile |
| GET | `/api/patients/:id/summary` | Medical summary aggregate |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload + OCR extraction |
| GET | `/api/documents/patient/:patientId` | List/filter/search records |
| POST | `/api/documents/:id/share` | Toggle sharing consent |

### Health Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/metrics/add` | Log a vital |
| GET | `/api/metrics/patient/:patientId` | Get all metrics |
| GET | `/api/metrics/patient/:patientId/health-score` | Calculate health score |

### Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chatbot/chat` | Send message (context-aware) |
| GET | `/api/chatbot/history/:patientId` | Conversation history |

### Doctor Access
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctor/generate-otp` | Patient generates OTP |
| POST | `/api/doctor/generate-qr` | Patient generates QR hash |
| POST | `/api/doctor/verify-otp` | Doctor verifies OTP |
| GET | `/api/doctor/access-qr/:hash` | Doctor accesses via QR |
| GET | `/api/doctor/patient/:patientId/access-logs` | Audit trail |
| POST | `/api/doctor/revoke/:accessId` | Revoke consent |

---

## Project Structure

```
Hack2/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Home, Auth, Dashboard, Records, Analytics, Chatbot, Share, DoctorPortal
│       ├── components/     # Navbar, MobileNav, ProtectedRoute
│       └── context/        # AuthContext
├── server/                 # Express API
│   └── src/
│       ├── routes/api.ts   # All REST endpoints
│       ├── services/mocks.ts  # Textract, Bedrock, ABDM mocks
│       ├── models/         # Mongoose schemas
│       └── dbStore.ts      # Mongo + JSON fallback
├── database/schema.sql     # PostgreSQL schema (production reference)
└── package.json            # Root scripts (concurrent dev)
```

---

## Hackathon Demo Flow

1. **Landing** → Explore features  
2. **ABHA Login** → Demo credentials above  
3. **Dashboard** → Health score, vitals, timeline from imported ABDM records  
4. **Records** → Upload a file named `lab_report.pdf` or `prescription.pdf` for smart OCR  
5. **Analytics** → View charts, log new vitals, export PDF report  
6. **AI Chat** → Ask about glucose, BP, medications (context-aware)  
7. **Doctor Share** → Generate OTP/QR → open **Doctor Portal** to verify  
8. **Revoke** → Revoke active consent from audit log  

---

## Production Architecture (AWS)

See `.env.example` for configuration. Production deployment targets:

- **Frontend:** AWS Amplify / S3 + CloudFront  
- **API:** API Gateway + Lambda (Express via serverless-http)  
- **Auth:** AWS Cognito + ABDM OAuth2  
- **Storage:** S3 for documents, RDS PostgreSQL + DocumentDB  
- **AI/ML:** Textract, Comprehend Medical, Bedrock, SageMaker classification  
- **Multilingual:** Sarvam AI API  

---

## Security & Compliance

- JWT authentication for patient sessions  
- Time-limited OTP/QR doctor access with audit logging  
- Consent-based record sharing (patient selects documents)  
- HIPAA/ABDM-aligned architecture (encryption at rest/transit in production)  
- AI disclaimer on all chatbot responses  

---

## License

MIT — Built for HACKHAZARDS '26 hackathon demonstration.
