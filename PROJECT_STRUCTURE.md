# JH Contract Builder - Project Structure

Dokumen ini menjelaskan struktur lengkap project JH Contract Builder.

## 📁 Directory Structure

```
JH Contract Builder/
│
├── backend/                          # Backend Node.js application
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.js    # Authentication logic
│   │   │   ├── userController.js    # User management
│   │   │   ├── documentController.js # Document template management
│   │   │   ├── contractController.js # Contract operations
│   │   │   └── approvalController.js # Approval workflow logic
│   │   │
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.js             # User model with RBAC
│   │   │   ├── DocumentTemplate.js  # Template with fields & approval matrix
│   │   │   └── Contract.js         # Contract with approval history
│   │   │
│   │   ├── routes/                  # API routes
│   │   │   ├── authRoutes.js       # /api/auth/*
│   │   │   ├── userRoutes.js       # /api/users/*
│   │   │   ├── documentRoutes.js   # /api/documents/*
│   │   │   ├── contractRoutes.js   # /api/contracts/*
│   │   │   └── approvalRoutes.js   # /api/approvals/*
│   │   │
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.js             # JWT verification & RBAC
│   │   │   ├── errorHandler.js     # Global error handler
│   │   │   └── upload.js           # File upload with multer
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── logger.js           # Winston logger
│   │   │   ├── emailService.js     # Email notifications
│   │   │   └── documentScanner.js  # AI document scanning
│   │   │
│   │   └── server.js               # Express server entry point
│   │
│   ├── uploads/                     # Uploaded files (gitignored)
│   ├── logs/                        # Application logs (gitignored)
│   ├── package.json                 # Backend dependencies
│   ├── .env.example                 # Environment variables template
│   └── .gitignore                   # Backend gitignore
│
├── frontend/                        # React.js frontend application
│   ├── public/
│   │   ├── index.html              # HTML template
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   │   ├── Layout/
│   │   │   │   └── Layout.js       # Main layout with sidebar
│   │   │   └── ProtectedRoute.js   # Route protection component
│   │   │
│   │   ├── pages/                  # Page components
│   │   │   ├── Auth/
│   │   │   │   └── Login.js        # Login page
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.js    # Main dashboard
│   │   │   ├── Documents/
│   │   │   │   ├── DocumentTemplates.js
│   │   │   │   ├── CreateTemplate.js
│   │   │   │   └── EditTemplate.js
│   │   │   ├── Contracts/
│   │   │   │   ├── Contracts.js
│   │   │   │   ├── CreateContract.js
│   │   │   │   └── ContractDetail.js
│   │   │   ├── Approvals/
│   │   │   │   └── PendingApprovals.js
│   │   │   ├── Users/
│   │   │   │   └── Users.js
│   │   │   └── Profile/
│   │   │       └── Profile.js
│   │   │
│   │   ├── context/                # React Context
│   │   │   └── AuthContext.js      # Authentication state
│   │   │
│   │   ├── services/               # API services
│   │   │   ├── api.js              # Axios instance
│   │   │   └── index.js            # API service functions
│   │   │
│   │   ├── App.js                  # Main App component
│   │   ├── index.js                # React entry point
│   │   └── index.css               # Global styles
│   │
│   ├── package.json                # Frontend dependencies
│   ├── .env.example                # Frontend env template
│   └── .gitignore                  # Frontend gitignore
│
├── docs/                           # Documentation (optional)
│
├── README.md                       # Main documentation
├── QUICKSTART.md                   # Quick start guide
├── API_DOCUMENTATION.md            # API reference
├── DEPLOYMENT.md                   # Deployment guide
├── CHANGELOG.md                    # Version history
├── CONTRIBUTING.md                 # Contribution guidelines
├── SECURITY.md                     # Security policy
├── LICENSE                         # MIT License
├── .gitignore                      # Root gitignore
└── postman_collection.json         # Postman API collection

```

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js 4
- **Database**: PostgreSQL 13+ with Sequelize ORM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Document Processing**:
  - Mammoth.js (Word documents)
  - PDF-Parse (PDF files)
  - XLSX (Excel files)
  - OpenAI GPT-4 (AI extraction)
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS
- **Compression**: compression

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **State Management**: Context API + React Query
- **Form Management**: Formik + Yup
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **Date Handling**: date-fns
- **Charts**: Recharts (optional)

## 📊 Database Schema

### Collections

1. **users** - User accounts and authentication
2. **documenttemplates** - Contract templates with form fields
3. **contracts** - Contract submissions and approvals

### Relationships

```
User (1) ----< (N) Contract (submittedBy)
User (1) ----< (N) Contract (reviewer)
User (1) ----< (N) Contract (approver1)
User (1) ----< (N) Contract (approver2)
DocumentTemplate (1) ----< (N) Contract (template)
User (1) ----< (N) DocumentTemplate (createdBy)
```

## 🔐 Authentication Flow

```
1. User sends credentials → POST /api/auth/login
2. Server validates → Generates JWT token
3. Client stores token → localStorage
4. Client sends token in Authorization header for protected routes
5. Server verifies token → Allows/Denies access
```

## 📝 Contract Approval Workflow

```
┌─────────────────┐
│  User/Staff     │
│  Submit Contract│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pending Review │ ← Supervisor
│  (Mandatory)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Reviewed       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pending Approval│ ← Manager/C-Level
│   Layer 1       │
│  (Mandatory)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Approved L1    │
└────────┬────────┘
         │
         ▼
    ┌───┴───┐
    │       │
    ▼       ▼
┌────────┐ ┌─────────────────┐
│Complete│ │ Pending Approval│ ← C-Level
└────────┘ │   Layer 2       │
           │  (Optional)     │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Completed      │
           └─────────────────┘

Note: Any stage can be → Rejected
```

## 🎯 Role Permissions Matrix

| Feature | Admin | C-Level | Manager | Supervisor | Staff | User |
|---------|-------|---------|---------|------------|-------|------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Template | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Edit Template | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Delete Template | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Set Approval Matrix | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Submit Contract | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Edit Own Contract | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| View Own Contracts | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| View All Contracts | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Review Contract | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Approve Layer 1 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Approve Layer 2 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| User Management | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Email Notifications | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

## 🚀 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /login` - Login user
- `POST /register` - Register new user
- `GET /me` - Get current user
- `PUT /profile` - Update profile
- `PUT /password` - Change password

### Users (`/api/users`)
- `GET /` - Get all users (Admin, Supervisor)
- `GET /:id` - Get user by ID
- `POST /` - Create user (Admin)
- `PUT /:id` - Update user (Admin)
- `DELETE /:id` - Delete user (Admin)
- `GET /role/:role` - Get users by role

### Documents (`/api/documents`)
- `GET /` - Get all templates
- `GET /:id` - Get template by ID
- `POST /upload` - Upload & scan document (Supervisor)
- `PUT /:id/fields` - Update template fields
- `PUT /:id/approval-matrix` - Set approval matrix
- `PUT /:id` - Update template
- `DELETE /:id` - Delete template (Supervisor)

### Contracts (`/api/contracts`)
- `GET /` - Get all contracts (role-filtered)
- `GET /:id` - Get contract details
- `POST /` - Create contract
- `PUT /:id` - Update contract
- `DELETE /:id` - Delete contract (Supervisor)
- `GET /pending/me` - Get my pending contracts

### Approvals (`/api/approvals`)
- `POST /:id/review` - Review contract (Supervisor)
- `POST /:id/approve1` - Approve layer 1 (Manager)
- `POST /:id/approve2` - Approve layer 2 (C-Level)
- `GET /statistics` - Get approval statistics

## 🎨 UI Theme Colors

```css
Primary: #CC6F57 (RGB: 204, 111, 87)
Primary Dark: #A05643
Primary Light: #E5B8AB
Secondary: #8B7B6F
Background: #F9F5F3
Text Primary: #333333
Text Secondary: #666666
Success: #4CAF50
Error: #F44336
Warning: #FF9800
Info: #2196F3
```

## 📦 Key Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.35.1",
  "pg": "^8.11.3",
  "pg-hstore": "^2.3.4",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "multer": "^1.4.5-lts.1",
  "mammoth": "^1.6.0",
  "pdf-parse": "^1.1.1",
  "xlsx": "^0.18.5",
  "nodemailer": "^6.9.7",
  "openai": "^4.20.1",
  "winston": "^3.11.0",
  "helmet": "^7.1.0"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.18.0",
  "@mui/material": "^5.14.18",
  "axios": "^1.5.1",
  "react-query": "^3.39.3",
  "formik": "^2.4.5",
  "yup": "^1.3.3",
  "react-toastify": "^9.1.3"
}
```

## 🔄 Data Flow

### Document Scanning Flow
```
1. Supervisor uploads file → Multer saves to disk
2. documentScanner.extractText() → Extract text from file
3. documentScanner.analyzeDocumentWithAI() → Use OpenAI or pattern matching
4. Generate field objects → Save to DocumentTemplate
5. Supervisor reviews/edits fields → Update template
6. Set approval matrix → Template ready for use
```

### Contract Submission Flow
```
1. User selects template → Fetch template with fields
2. User fills form → Validate with Formik/Yup
3. Submit contract → POST /api/contracts
4. Backend creates contract → Set status to pending_review
5. Find reviewer from approval matrix → Send email notification
6. Contract awaits review
```

### Approval Flow
```
1. Reviewer opens contract → Review data
2. Approve/Reject → POST /api/approvals/:id/review
3. If approved → Move to pending_approval1
4. Send email to approver1 → Await approval
5. Approver1 approve → Move to pending_approval2 (if exists) or completed
6. Send email to approver2 (if exists) → Await approval
7. Final approval → Contract completed
8. Notify submitter → Send completion email
```

## 📧 Email Notifications

Email dikirim pada event berikut:
1. Contract submitted → Notify reviewer
2. Contract reviewed → Notify approver layer 1 + submitter
3. Contract approved layer 1 → Notify approver layer 2 (if exists) + submitter
4. Contract approved layer 2 → Notify submitter
5. Contract rejected → Notify submitter
6. Contract completed → Notify submitter

## 🔒 Security Features

1. **Authentication**
   - JWT tokens with expiration
   - Password hashing with bcrypt
   - Token refresh mechanism

2. **Authorization**
   - Role-based access control (RBAC)
   - Route-level permissions
   - Resource-level permissions

3. **Input Validation**
   - Express-validator untuk API
   - Formik + Yup untuk frontend
   - File type validation

4. **Security Headers**
   - Helmet.js middleware
   - CORS configuration
   - XSS protection

5. **File Upload Security**
   - File type whitelist
   - File size limits
   - Secure file storage

## 📈 Future Enhancements

### Phase 2
- [ ] Digital signature integration (DocuSign/Adobe Sign)
- [ ] PDF generation from contract data
- [ ] Advanced reporting & analytics dashboard
- [ ] Audit trail system
- [ ] File attachments for contracts
- [ ] Template versioning
- [ ] Bulk contract operations

### Phase 3
- [ ] Mobile application (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Multi-language support (i18n)
- [ ] Advanced AI features (contract analysis)
- [ ] Integration APIs for third-party systems
- [ ] Custom workflow builder

## 📞 Support & Contact

- **Email**: dev@jimbaranhijau.com
- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Security**: security@jimbaranhijau.com

---

**Last Updated**: 2026-02-02  
**Version**: 1.0.0  
**Maintained by**: Jimbaran Hijau Development Team
