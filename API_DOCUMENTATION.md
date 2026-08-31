# API Documentation - JH Contract Builder

## Base URL
```
Development: http://localhost:5001/api
Production: https://api.yourdomain.com/api
```

## Authentication

Semua endpoint (kecuali login) memerlukan JWT token di header:
```
Authorization: Bearer {your_jwt_token}
```

---

## Auth Endpoints

### POST /auth/login
Login user dan mendapatkan JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/register
Register user baru (untuk admin atau public registration).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "department": "Operations",
  "position": "Staff"
}
```

### GET /auth/me
Get current logged in user information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "department": "Operations",
    "position": "Staff"
  }
}
```

### PUT /auth/profile
Update user profile.

**Request:**
```json
{
  "name": "John Doe Updated",
  "department": "IT",
  "position": "Senior Staff",
  "phone": "+62123456789"
}
```

### PUT /auth/password
Change password.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## User Endpoints

### GET /users
Get all users (Admin, Supervisor only).

**Query Parameters:**
- `role`: Filter by role
- `department`: Filter by department
- `search`: Search by name or email
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### GET /users/:id
Get user by ID.

### POST /users
Create new user (Admin only).

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "staff",
  "department": "Finance"
}
```

### PUT /users/:id
Update user (Admin only).

### DELETE /users/:id
Delete user (Admin only).

### GET /users/role/:role
Get users by specific role.

---

## Document Template Endpoints

### GET /documents
Get all document templates.

**Query Parameters:**
- `category`: Filter by category
- `search`: Search in name/description
- `isActive`: Filter by active status
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "template_id",
      "templateName": "Perjanjian Kerja Sama",
      "description": "Template untuk perjanjian kerja sama",
      "category": "Partnership",
      "fileType": "docx",
      "fields": [...],
      "approvalMatrix": [...],
      "isActive": true,
      "usageCount": 5
    }
  ]
}
```

### GET /documents/:id
Get document template by ID with full details.

### POST /documents/upload
Upload and scan document (Supervisor, Admin only).

**Request (multipart/form-data):**
```
document: (file) - Word/PDF/Excel file
templateName: "Perjanjian Kerja Sama"
description: "Template untuk perjanjian"
category: "Partnership"
```

**Response (201):**
```json
{
  "success": true,
  "message": "Document scanned and template created successfully",
  "data": {
    "_id": "template_id",
    "templateName": "Perjanjian Kerja Sama",
    "fields": [
      {
        "fieldName": "pihak_pertama",
        "fieldLabel": "Pihak Pertama",
        "fieldType": "text",
        "required": true,
        "placeholder": "Masukkan pihak pertama",
        "order": 0
      },
      {
        "fieldName": "tanggal_kontrak",
        "fieldLabel": "Tanggal Kontrak",
        "fieldType": "date",
        "required": true,
        "order": 1
      }
    ]
  }
}
```

### PUT /documents/:id/fields
Update template fields (Supervisor, Staff, Admin).

**Request:**
```json
{
  "fields": [
    {
      "fieldName": "pihak_pertama",
      "fieldLabel": "Nama Pihak Pertama",
      "fieldType": "text",
      "required": true,
      "placeholder": "Masukkan nama pihak pertama",
      "validation": {
        "minLength": 3
      },
      "order": 0
    }
  ]
}
```

### PUT /documents/:id/approval-matrix
Set approval matrix (Supervisor, Admin only).

**Request:**
```json
{
  "approvalMatrix": [
    {
      "layer": "reviewer",
      "name": "Reviewer",
      "roles": ["supervisor"],
      "assignedUsers": ["user_id_1"],
      "required": true,
      "order": 1
    },
    {
      "layer": "approval1",
      "name": "Manager Approval",
      "roles": ["manager"],
      "assignedUsers": ["user_id_2"],
      "required": true,
      "order": 2
    },
    {
      "layer": "approval2",
      "name": "C-Level Approval",
      "roles": ["c-level"],
      "assignedUsers": ["user_id_3"],
      "required": false,
      "order": 3
    }
  ]
}
```

### PUT /documents/:id
Update document template metadata.

### DELETE /documents/:id
Delete document template (Supervisor, Admin only).

---

## Contract Endpoints

### GET /contracts
Get all contracts (filtered by user role).

**Query Parameters:**
- `status`: Filter by status
- `search`: Search contract number or title
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "contract_id",
      "contractNumber": "JH-202602-0001",
      "title": "Kontrak Pembangunan Gedung A",
      "status": "pending_approval1",
      "currentApprovalLayer": "approval1",
      "submittedBy": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "submittedAt": "2026-02-01T10:00:00.000Z"
    }
  ]
}
```

### GET /contracts/:id
Get contract details by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "contractNumber": "JH-202602-0001",
    "title": "Kontrak Pembangunan Gedung A",
    "description": "Kontrak untuk pembangunan gedung A",
    "status": "pending_approval1",
    "currentApprovalLayer": "approval1",
    "contractData": [
      {
        "fieldName": "pihak_pertama",
        "fieldLabel": "Pihak Pertama",
        "value": "PT. Jimbaran Hijau"
      }
    ],
    "approvalHistory": [
      {
        "layer": "reviewer",
        "approver": {
          "name": "Supervisor Name"
        },
        "action": "reviewed",
        "comments": "Approved for next stage",
        "actionDate": "2026-02-01T11:00:00.000Z"
      }
    ],
    "submittedBy": {...},
    "reviewer": {...},
    "approver1": {...},
    "approver2": {...}
  }
}
```

### POST /contracts
Create new contract (User, Staff, Admin).

**Request:**
```json
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
    {
      "fieldName": "pihak_kedua",
      "fieldLabel": "Pihak Kedua",
      "value": "PT. Kontraktor ABC"
    },
    {
      "fieldName": "nilai_kontrak",
      "fieldLabel": "Nilai Kontrak",
      "value": "1000000000"
    }
  ],
  "notes": "Catatan tambahan untuk kontrak ini"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Contract submitted successfully",
  "data": {
    "contractNumber": "JH-202602-0001",
    "status": "pending_review",
    ...
  }
}
```

### PUT /contracts/:id
Update contract (Staff, Supervisor, Admin only).

### DELETE /contracts/:id
Delete contract (Supervisor, Admin only).

### GET /contracts/pending/me
Get contracts pending for current user's action.

---

## Approval Endpoints

### POST /approvals/:id/review
Review contract (Supervisor, Admin).

**Request:**
```json
{
  "action": "reviewed",
  "comments": "Dokumen sudah sesuai, lanjut ke approval"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contract reviewed and sent for approval",
  "data": {
    "status": "pending_approval1",
    "currentApprovalLayer": "approval1"
  }
}
```

**Reject:**
```json
{
  "action": "rejected",
  "comments": "Dokumen tidak lengkap, mohon dilengkapi"
}
```

### POST /approvals/:id/approve1
Approve contract layer 1 (Manager, C-Level, Admin).

**Request:**
```json
{
  "action": "approved",
  "comments": "Disetujui untuk lanjut",
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Reject:**
```json
{
  "action": "rejected",
  "comments": "Nilai kontrak terlalu tinggi, perlu review ulang"
}
```

### POST /approvals/:id/approve2
Approve contract layer 2 (C-Level, Admin).

**Request:**
```json
{
  "action": "approved",
  "comments": "Final approval",
  "signature": "data:image/png;base64,..."
}
```

### GET /approvals/statistics
Get approval statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "draft": 5,
    "pending_review": 10,
    "reviewed": 3,
    "pending_approval1": 8,
    "approved1": 2,
    "pending_approval2": 5,
    "approved2": 1,
    "completed": 60,
    "rejected": 6
  }
}
```

---

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (in development only)"
}
```

---

## Contract Status Flow

```
draft → pending_review → reviewed → pending_approval1 → approved1 → 
[pending_approval2] → [approved2] → completed

Any stage can go to → rejected
```

## Roles & Permissions Summary

| Endpoint | Admin | C-Level | Manager | Supervisor | Staff | User |
|----------|-------|---------|---------|------------|-------|------|
| POST /documents/upload | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| PUT /documents/:id/approval-matrix | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| POST /contracts | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| POST /approvals/:id/review | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| POST /approvals/:id/approve1 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| POST /approvals/:id/approve2 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

---

**For more information, see README.md**
