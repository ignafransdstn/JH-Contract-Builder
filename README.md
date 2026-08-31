# JH Contract Builder

Sistem Manajemen Kontrak Digital dengan fitur approval workflow dan document scanning menggunakan AI.

![Color Palette](docs/color-palette.png)

## 🎨 Tema Warna

- **Primary**: #CC6F57 (RGB: 204, 111, 87)
- **Primary Dark**: #A05643
- **Primary Light**: #E5B8AB
- **Secondary**: #8B7B6F
- **Background**: #F9F5F3

## 🚀 Fitur Utama

### 1. **Manajemen Approval Matrix**
- Menentukan matrix approval untuk setiap dokumen kontrak
- Konfigurasi reviewer dan approver layers (1-2 layers)
- Email notification otomatis untuk approver

### 2. **Document Scanning dengan AI**
- Upload dokumen Word, PDF, atau Excel
- Sistem membaca dan menganalisis dokumen secara otomatis
- Generate form input fields dari dokumen
- Menggunakan OpenAI GPT-4 untuk ekstraksi field yang cerdas

### 3. **RBAC (Role-Based Access Control)**

#### **Admin** - Full Access
- Akses penuh ke seluruh sistem
- Manage users dan permissions

#### **User** - External Role
- Mengakses listing form dokumen kontrak
- Melakukan pengajuan kontrak
- Melihat progress pengajuan (Review → Approval 1 → Approval 2)

#### **Staff** - Internal Role
- Mengakses listing form dokumen kontrak
- Melakukan pengajuan kontrak
- Edit form dokumen kontrak
- Melihat progress pengajuan

#### **Supervisor**
- Create dokumen kontrak dan membentuk form
- Delete dan edit dokumen kontrak
- Melakukan review terhadap pengajuan kontrak
- Melihat progress pengajuan

#### **Manager**
- Approval kontrak layer 1
- Tanda tangan digital setelah approve
- Notifikasi email untuk dokumen yang perlu di-approve

#### **C-Level**
- Approval kontrak layer 1 atau 2
- Tanda tangan digital setelah approve
- Notifikasi email untuk dokumen yang perlu di-approve

## 📋 Business Process

### Proses Pengajuan 2 Layer:
1. Create Document → Dokumen menunggu review (Mandatory)
2. Dokumen sudah di-review → Menunggu approval layer 1 (Mandatory)
3. Approval Layer 1 approved → **Selesai**

### Proses Pengajuan 3 Layer:
1. Create Document → Dokumen menunggu review (Mandatory)
2. Dokumen sudah di-review → Menunggu approval layer 1 (Mandatory)
3. Approval Layer 1 approved → Menunggu approval layer 2 (Optional)
4. Approval Layer 2 approved → **Selesai**

## 🏗️ Arsitektur

### Backend
- **Framework**: Node.js + Express.js
- **Architecture**: MVC (Model-View-Controller)
- **Database**: PostgreSQL 16
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Token)
- **Document Processing**:
  - Mammoth.js (untuk Word documents)
  - PDF-Parse (untuk PDF files)
  - XLSX (untuk Excel files)
  - OpenAI GPT-4 (untuk AI-powered field extraction)

### Frontend
- **Framework**: React.js 18
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API + React Query
- **Form Management**: Formik + Yup
- **Routing**: React Router v6

## 📦 Instalasi

### Prerequisites
- Node.js v16+ dan npm/yarn
- PostgreSQL 16+
- OpenAI API Key (optional, untuk AI document scanning)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env file dengan konfigurasi Anda:
# - PostgreSQL connection (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
# - JWT secret
# - SMTP credentials untuk email
# - OpenAI API key (optional)

# Buat database PostgreSQL
# psql -U postgres
# CREATE DATABASE jh_contract_builder;
# \q

# Run backend server (akan auto-sync database tables)
npm run dev
```

Backend akan berjalan di `http://localhost:5001`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Build production version
npm run build

# Serve production build (recommended)
serve -s build -l 3002

# Or run development server (may have issues)
# npm start
```

Frontend akan berjalan di `http://localhost:3002`

### Quick Start (Windows)

Gunakan script otomatis untuk menjalankan backend dan frontend sekaligus:

```powershell
# Di root project folder
.\start-all.ps1
```

Script akan membuka 2 terminal windows:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## 🔧 Konfigurasi

### Backend Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jh_contract_builder
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@jimbaranhijau.com

# OpenAI (Optional - untuk AI document scanning)
OPENAI_API_KEY=sk-your-openai-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Email Configuration (Gmail)

Untuk menggunakan Gmail sebagai SMTP server:

1. Aktifkan 2-Factor Authentication di akun Google Anda
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Gunakan App Password tersebut sebagai `SMTP_PASSWORD`

### OpenAI Configuration

Untuk mengaktifkan AI document scanning:

1. Daftar di https://platform.openai.com/
2. Buat API key di dashboard
3. Masukkan API key ke `OPENAI_API_KEY` di .env

**Note**: Tanpa OpenAI API key, sistem akan menggunakan pattern matching sederhana untuk ekstraksi field.

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### Register User
```http
POST /api/auth/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "department": "Operations",
  "position": "Manager"
}
```

### Document Templates

#### Upload & Scan Document
```http
POST /api/documents/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "document": (file),
  "templateName": "Perjanjian Kerja Sama",
  "description": "Template untuk perjanjian kerja sama",
  "category": "Partnership"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "templateName": "Perjanjian Kerja Sama",
    "fields": [
      {
        "fieldName": "pihak_pertama",
        "fieldLabel": "Pihak Pertama",
        "fieldType": "text",
        "required": true
      },
      ...
    ]
  }
}
```

#### Set Approval Matrix
```http
PUT /api/documents/:id/approval-matrix
Authorization: Bearer {token}
Content-Type: application/json

{
  "approvalMatrix": [
    {
      "layer": "reviewer",
      "name": "Reviewer",
      "roles": ["supervisor"],
      "assignedUsers": ["user_id"],
      "required": true,
      "order": 1
    },
    {
      "layer": "approval1",
      "name": "Manager Approval",
      "roles": ["manager"],
      "assignedUsers": ["manager_id"],
      "required": true,
      "order": 2
    },
    {
      "layer": "approval2",
      "name": "C-Level Approval",
      "roles": ["c-level"],
      "assignedUsers": ["clevel_id"],
      "required": false,
      "order": 3
    }
  ]
}
```

### Contracts

#### Create Contract
```http
POST /api/contracts
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": "template_id",
  "title": "Kontrak Pembangunan Gedung A",
  "description": "Kontrak untuk pembangunan gedung A",
  "contractData": [
    {
      "fieldName": "pihak_pertama",
      "fieldLabel": "Pihak Pertama",
      "value": "PT. Jimbaran Hijau"
    },
    ...
  ],
  "notes": "Catatan tambahan"
}

Response:
{
  "success": true,
  "data": {
    "contractNumber": "JH-202602-0001",
    "status": "pending_review",
    ...
  }
}
```

#### Get Contract Details
```http
GET /api/contracts/:id
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "contractNumber": "JH-202602-0001",
    "title": "Kontrak Pembangunan Gedung A",
    "status": "pending_approval1",
    "currentApprovalLayer": "approval1",
    "approvalHistory": [ ... ],
    ...
  }
}
```

### Approvals

#### Review Contract
```http
POST /api/approvals/:id/review
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "reviewed",  // or "rejected"
  "comments": "Dokumen sudah diperiksa dan siap untuk approval"
}
```

#### Approve Contract - Layer 1
```http
POST /api/approvals/:id/approve1
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "approved",  // or "rejected"
  "comments": "Disetujui",
  "signature": "base64_encoded_signature_or_file_path"
}
```

#### Approve Contract - Layer 2
```http
POST /api/approvals/:id/approve2
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "approved",  // or "rejected"
  "comments": "Final approval",
  "signature": "base64_encoded_signature_or_file_path"
}
```

## 🗄️ Database Schema

### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['admin', 'user', 'staff', 'supervisor', 'manager', 'c-level'],
  department: String,
  position: String,
  phone: String,
  isActive: Boolean,
  lastLogin: Date
}
```

### Document Templates
```javascript
{
  templateName: String,
  description: String,
  category: String,
  originalFileName: String,
  originalFilePath: String,
  fileType: Enum ['docx', 'pdf', 'xlsx'],
  fields: [
    {
      fieldName: String,
      fieldLabel: String,
      fieldType: Enum,
      options: Array,
      required: Boolean,
      validation: Object
    }
  ],
  approvalMatrix: [
    {
      layer: Enum ['reviewer', 'approval1', 'approval2'],
      name: String,
      roles: Array,
      assignedUsers: [ObjectId],
      required: Boolean,
      order: Number
    }
  ],
  isActive: Boolean,
  createdBy: ObjectId,
  usageCount: Number
}
```

### Contracts
```javascript
{
  contractNumber: String (auto-generated),
  template: ObjectId,
  title: String,
  contractData: Array,
  status: Enum [
    'draft',
    'pending_review',
    'reviewed',
    'pending_approval1',
    'approved1',
    'pending_approval2',
    'approved2',
    'completed',
    'rejected'
  ],
  currentApprovalLayer: Enum,
  approvalHistory: [
    {
      layer: String,
      approver: ObjectId,
      action: String,
      comments: String,
      signature: String,
      actionDate: Date
    }
  ],
  reviewer: ObjectId,
  approver1: ObjectId,
  approver2: ObjectId,
  submittedBy: ObjectId,
  submittedAt: Date,
  completedAt: Date
}
```

## 🎯 Cara Penggunaan

### 1. Setup Initial Data

Pertama, buat user admin:

```bash
# Menggunakan MongoDB shell atau MongoDB Compass
# Atau bisa menggunakan endpoint register dengan role admin
```

### 2. Create Document Template (Supervisor)

1. Login sebagai Supervisor
2. Navigate ke "Document Templates" → "Create Template"
3. Upload dokumen kontrak (Word/PDF/Excel)
4. Sistem akan scan dan generate form fields
5. Review dan edit field names sesuai kebutuhan
6. Set approval matrix:
   - Pilih Reviewer (Supervisor/Manager/C-Level)
   - Pilih Approver Layer 1 (Manager/C-Level) - Mandatory
   - Pilih Approver Layer 2 (C-Level) - Optional
7. Save template

### 3. Submit Contract (User/Staff)

1. Login sebagai User atau Staff
2. Navigate ke "Contracts" → "Create Contract"
3. Pilih template yang sudah dibuat
4. Isi form sesuai dengan fields yang tersedia
5. Submit contract
6. Contract akan masuk ke status "Pending Review"

### 4. Review Contract (Supervisor)

1. Login sebagai Supervisor
2. Navigate ke "Pending Approvals"
3. Pilih contract yang perlu direview
4. Review data contract
5. Approve untuk lanjut ke approval layer 1, atau Reject untuk menolak

### 5. Approve Contract (Manager/C-Level)

1. Login sebagai Manager atau C-Level
2. Cek email notification atau navigate ke "Pending Approvals"
3. Pilih contract yang perlu di-approve
4. Review data contract
5. Add signature (optional)
6. Approve atau Reject
7. Jika ada approval layer 2, contract akan lanjut ke sana
8. Jika tidak ada, contract akan completed

## 🔐 Security Features

- **Password Hashing**: bcrypt dengan salt rounds
- **JWT Authentication**: Token-based authentication dengan expiry
- **Role-Based Access Control**: Granular permission per role
- **Input Validation**: Express-validator untuk semua input
- **File Upload Security**: Validasi file type dan size
- **XSS Protection**: Helmet.js untuk security headers
- **Rate Limiting**: Bisa ditambahkan dengan express-rate-limit

## 📧 Email Notifications

Sistem mengirim email notifikasi untuk:

1. **Approval Request**: Ketika contract masuk ke approval layer
2. **Status Update**: Ketika contract di-approve atau di-reject
3. **Contract Completion**: Ketika contract selesai semua approval

Template email menggunakan HTML dengan branding JH Contract Builder.

## 🚧 Development Roadmap

### Phase 1 (Current)
- ✅ Basic RBAC implementation
- ✅ Document scanning dengan AI
- ✅ Approval workflow (2-3 layers)
- ✅ Email notifications
- ✅ Basic UI dengan Material-UI

### Phase 2 (Future)
- [ ] Digital signature integration
- [ ] Document generation (PDF) dari form data
- [ ] Advanced reporting & analytics
- [ ] Audit trail & logging
- [ ] File attachment untuk contracts
- [ ] Contract templates versioning
- [ ] Bulk operations
- [ ] Mobile responsive improvements

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Integration dengan e-signature providers
- [ ] Advanced AI features (contract analysis)
- [ ] Multi-language support
- [ ] Real-time notifications (WebSocket)

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Pastikan MongoDB server running. Start dengan `mongod` atau gunakan MongoDB service.

### OpenAI API Error
```
Error: OpenAI API key is invalid
```
**Solution**: Periksa API key di .env file. Tanpa API key yang valid, sistem akan fallback ke pattern matching.

### Email Not Sending
```
Error: Invalid login credentials
```
**Solution**: 
- Pastikan SMTP credentials benar
- Untuk Gmail, gunakan App Password, bukan password biasa
- Aktifkan "Less secure app access" atau gunakan App Password

### Upload File Error
```
Error: File too large
```
**Solution**: Increase `MAX_FILE_SIZE` di .env (dalam bytes, default 10MB)

## 📝 License

Copyright © 2026 Jimbaran Hijau. All rights reserved.

## 👥 Team

- **Developer**: Development Team Jimbaran Hijau
- **Contact**: dev@jimbaranhijau.com

## 🙏 Acknowledgments

- OpenAI untuk GPT-4 API
- Material-UI untuk component library
- MongoDB untuk database
- Express.js community

---

**Built with ❤️ by Jimbaran Hijau Development Team**
