# System Architecture - JH Contract Builder

## Current System Status: ✅ RUNNING

```
┌─────────────────────────────────────────────────────────────┐
│                    JH CONTRACT BUILDER                       │
│                 PostgreSQL Migration Complete                │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│    FRONTEND      │◄───────►│     BACKEND      │
│                  │  HTTP   │                  │
│  React 18.2.0    │  Proxy  │  Node.js/Express │
│  Material-UI     │         │  Port: 5000      │
│  Port: 3000      │         │                  │
│  Status: ✅ UP   │         │  Status: ✅ UP   │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            │
         │                            ▼
         │                   ┌─────────────────┐
         │                   │   PostgreSQL    │
         │                   │                 │
         │                   │  Port: 5432     │
         │                   │  DB: jh_contract│
         │                   │  Status: ✅ UP  │
         │                   └─────────────────┘
         │
         │
         ▼
    ┌───────────────────────┐
    │   User Browser        │
    │  http://localhost:3000│
    └───────────────────────┘
```

---

## Technology Stack

### Frontend Layer
```
React 18.2.0
├── Material-UI 5.14.18 (UI Components)
├── React Router v6 (Navigation)
├── React Query (Data fetching)
├── Formik + Yup (Form management)
├── Axios (HTTP client)
└── React Toastify (Notifications)
```

### Backend Layer
```
Node.js + Express.js
├── Sequelize 6.35.1 (ORM)
├── bcryptjs (Password hashing)
├── jsonwebtoken (JWT auth)
├── multer (File upload)
├── nodemailer (Email)
├── winston (Logging)
└── OpenAI API (AI scanning)
```

### Database Layer
```
PostgreSQL 16
├── UUID Primary Keys
├── JSONB for flexible fields
├── Foreign Key Constraints
├── FULLTEXT Indexes
└── Auto-sync with Sequelize
```

---

## Database Schema

### Tables & Relationships

```
┌─────────────────────┐
│       Users         │
├─────────────────────┤
│ id (UUID) PK        │
│ email (UNIQUE)      │
│ password (hashed)   │
│ firstName           │
│ lastName            │
│ role                │
│ isActive            │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────┐       ┌─────────────────────┐
│  DocumentTemplates  │ 1:N   │      Contracts      │
├─────────────────────┤◄──────┤─────────────────────┤
│ id (UUID) PK        │       │ id (UUID) PK        │
│ templateName        │       │ contractNumber      │
│ description         │       │ title               │
│ fields (JSONB)      │       │ contractData (JSONB)│
│ approvalMatrix      │       │ approvalHistory     │
│   (JSONB)           │       │   (JSONB)           │
│ createdBy (FK)      │       │ status              │
│ createdAt           │       │ templateId (FK)     │
│ updatedAt           │       │ createdBy (FK)      │
└─────────────────────┘       │ createdAt           │
         ▲                    │ updatedAt           │
         │                    └─────────────────────┘
         │ N:1
         │
    (createdBy)
```

### Field Types

| Field | MongoDB Type | PostgreSQL Type | Notes |
|-------|--------------|-----------------|-------|
| ID | ObjectId | UUID | Globally unique |
| Email | String | VARCHAR(255) | Unique constraint |
| Password | String | VARCHAR(255) | Bcrypt hashed |
| Role | String | VARCHAR(20) | Enum-like |
| Fields | Array | JSONB | Dynamic form fields |
| ApprovalMatrix | Object | JSONB | Approval config |
| ContractData | Object | JSONB | Dynamic contract data |
| Dates | Date | TIMESTAMP | Auto-managed |

---

## API Endpoints Structure

### Authentication (`/api/auth`)
```
POST   /register    - User registration
POST   /login       - User login
GET    /me          - Get current user
POST   /logout      - User logout
```

### Users (`/api/users`)
```
GET    /            - List users (Admin only)
POST   /            - Create user (Admin)
GET    /:id         - Get user by ID
PUT    /:id         - Update user
DELETE /:id         - Delete user (Admin)
```

### Document Templates (`/api/documents`)
```
GET    /            - List templates
POST   /            - Create template
POST   /scan        - Scan document with AI
GET    /:id         - Get template
PUT    /:id         - Update template
DELETE /:id         - Delete template
```

### Contracts (`/api/contracts`)
```
GET    /            - List contracts
POST   /            - Create contract
GET    /:id         - Get contract
PUT    /:id         - Update contract
DELETE /:id         - Delete contract
GET    /stats       - Get statistics
```

### Approvals (`/api/approvals`)
```
GET    /pending     - Pending approvals
POST   /:id/approve - Approve contract
POST   /:id/reject  - Reject contract
GET    /history/:id - Approval history
```

---

## Role-Based Access Control (RBAC)

### Permission Matrix

| Feature | Admin | C-Level | Manager | Supervisor | Staff | User |
|---------|-------|---------|---------|------------|-------|------|
| View Templates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Templates | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Edit Templates | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Delete Templates | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Submit Contract | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review Contract | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approve L1 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve L2 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Role Hierarchy
```
        ┌──────────┐
        │  Admin   │ (Full Access)
        └────┬─────┘
             │
        ┌────▼─────┐
        │ C-Level  │ (Approve L1 & L2)
        └────┬─────┘
             │
        ┌────▼─────┐
        │ Manager  │ (Approve L1)
        └────┬─────┘
             │
        ┌────▼─────┐
        │Supervisor│ (Review & Manage Templates)
        └────┬─────┘
             │
        ┌────▼─────┐
        │  Staff   │ (Submit & Edit)
        └────┬─────┘
             │
        ┌────▼─────┐
        │   User   │ (Submit & View)
        └──────────┘
```

---

## Workflow Diagram

### 2-Layer Approval Workflow
```
┌───────────────┐
│ Submit        │
│ Contract      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Review        │ (Supervisor)
│ [Mandatory]   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Approval L1   │ (Manager/C-Level)
│ [Mandatory]   │
└───────┬───────┘
        │
        ▼
   ┌─────────┐
   │ APPROVED│
   └─────────┘
```

### 3-Layer Approval Workflow
```
┌───────────────┐
│ Submit        │
│ Contract      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Review        │ (Supervisor)
│ [Mandatory]   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Approval L1   │ (Manager)
│ [Mandatory]   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Approval L2   │ (C-Level)
│ [Optional]    │
└───────┬───────┘
        │
        ▼
   ┌─────────┐
   │ APPROVED│
   └─────────┘
```

---

## File Upload Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Upload   │────►│   Multer   │────►│  AI Scan   │────►│   Store    │
│   File     │     │  Validate  │     │  Extract   │     │  Database  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                         │                   │
                         │                   │
                    File Type:           OpenAI GPT-4:
                    - Word (.docx)       - Extract fields
                    - PDF (.pdf)         - Analyze structure
                    - Excel (.xlsx)      - Generate form
                         │                   │
                         ▼                   ▼
                   Max 10MB          Generate JSON schema
```

---

## Migration Status

### ✅ Completed
- Database configuration (Sequelize)
- All 3 models converted (User, DocumentTemplate, Contract)
- Model relationships & associations
- Database auto-sync setup
- Server startup with PostgreSQL
- Frontend build & deployment

### ⚠️ Pending
- Controllers conversion (Mongoose → Sequelize)
  - authController.js
  - userController.js
  - documentController.js
  - contractController.js
  - approvalController.js
- Middleware auth.js update
- API endpoint testing
- Integration testing

### Progress
```
Models:      [████████████████████] 100%
Controllers: [░░░░░░░░░░░░░░░░░░░░]   0%
Overall:     [██████████░░░░░░░░░░]  50%
```

---

## Quick Start Commands

### Start System
```powershell
# Automated (recommended)
.\start-all.ps1

# Manual
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
serve -s build -l 3000
```

### Check Status
```powershell
# Check running processes
Get-NetTCPConnection -LocalPort 5000,3000

# Check PostgreSQL
Get-Service postgresql*

# Access database
psql -U postgres -d jh_contract_builder
```

### Development
```bash
# Backend logs (watch SQL queries)
cd backend
npm run dev

# Frontend rebuild
cd frontend
npm run build

# Database query
psql -U postgres -d jh_contract_builder
\dt                    # List tables
\d "Users"            # Describe table
SELECT * FROM "Users"; # Query data
```

---

## Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jh_contract_builder
DB_USER=postgres
DB_PASSWORD=admin

# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# OpenAI (Optional)
OPENAI_API_KEY=sk-your-key-here
```

---

**System Status**: ✅ OPERATIONAL  
**Backend**: ✅ Running (Port 5000)  
**Frontend**: ✅ Running (Port 3000)  
**Database**: ✅ Connected (PostgreSQL)  
**Migration**: 🟡 50% Complete (Controllers pending)
