# Swagger API Documentation Guide

## Akses Swagger UI

Setelah backend berjalan, akses Swagger documentation di:

**URL**: http://localhost:5000/api-docs

## Cara Menggunakan Swagger UI

### 1. Login dan Mendapatkan Token

1. Buka Swagger UI di browser
2. Cari endpoint **POST /api/auth/login** di section **Authentication**
3. Click "Try it out"
4. Masukkan credentials:
   ```json
   {
     "email": "adminjimbaranhijau@jhilltown.com",
     "password": "Jimbaranadmin@2026"
   }
   ```
5. Click "Execute"
6. Copy **token** dari response

### 2. Authorize dengan Token

1. Click tombol **Authorize** (🔒 icon) di bagian atas Swagger UI
2. Paste token yang sudah dicopy: `Bearer <your-token>`
3. Click "Authorize"
4. Click "Close"

Sekarang semua endpoint yang memerlukan authentication sudah bisa diakses!

### 3. Test Endpoints

Setelah authorize, Anda bisa test semua endpoints:

#### Create Contract
1. Buka **POST /api/contracts**
2. Click "Try it out"
3. Masukkan request body:
   ```json
   {
     "templateId": "uuid-template-id",
     "title": "Test Contract from Swagger",
     "description": "Testing via Swagger UI",
     "contractData": {
       "field1": "value1",
       "field2": "value2"
     },
     "reviewer": "uuid-reviewer-id",
     "approver1": "uuid-approver1-id",
     "approver2": "uuid-approver2-id",
     "notes": "Test notes"
   }
   ```
4. Click "Execute"
5. Lihat response di bawah

#### Get All Contracts
1. Buka **GET /api/contracts**
2. Click "Try it out"
3. Set parameters (opsional):
   - page: 1
   - limit: 10
   - status: pending_review
   - search: "JH-2026"
4. Click "Execute"

#### Review Contract
1. Buka **POST /api/approvals/{id}/review**
2. Click "Try it out"
3. Masukkan contract ID
4. Masukkan request body:
   ```json
   {
     "action": "reviewed",
     "comments": "Approved by supervisor"
   }
   ```
5. Click "Execute"

---

## API Endpoints Overview

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login user | ❌ |
| GET | `/me` | Get current user | ✅ |
| PUT | `/profile` | Update profile | ✅ |
| PUT | `/password` | Change password | ✅ |

### 👥 Users (`/api/users`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | Get all users | ✅ | admin, supervisor |
| GET | `/:id` | Get user by ID | ✅ | admin, supervisor |
| POST | `/` | Create user | ✅ | admin |
| PUT | `/:id` | Update user | ✅ | admin |
| DELETE | `/:id` | Delete user | ✅ | admin |

### 📄 Document Templates (`/api/documents`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | Get all templates | ✅ | all |
| GET | `/:id` | Get template by ID | ✅ | all |
| POST | `/` | Create template | ✅ | admin, supervisor |
| PUT | `/:id` | Update template | ✅ | admin, supervisor |
| DELETE | `/:id` | Delete template | ✅ | admin |

### 📋 Contracts (`/api/contracts`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | Get all contracts | ✅ | all |
| GET | `/pending/me` | Get my pending contracts | ✅ | all |
| GET | `/:id` | Get contract by ID | ✅ | all (with access control) |
| POST | `/` | Create contract | ✅ | user, staff, supervisor, admin |
| PUT | `/:id` | Update contract | ✅ | staff, supervisor, admin |
| DELETE | `/:id` | Delete contract | ✅ | supervisor, admin |

### ✅ Approvals (`/api/approvals`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/statistics` | Get approval statistics | ✅ | all |
| POST | `/:id/review` | Review contract | ✅ | supervisor, admin |
| POST | `/:id/approve1` | Approve layer 1 | ✅ | manager, c-level, admin |
| POST | `/:id/approve2` | Approve layer 2 | ✅ | c-level, admin |

---

## Status Flow

```
draft
  ↓
pending_review (Supervisor reviews)
  ↓ (action: reviewed)
reviewed → pending_approval1 (Manager approves Layer 1)
  ↓ (action: approved)
approved1 → pending_approval2 (C-Level approves Layer 2)
  ↓ (action: approved)
completed

OR at any review/approval stage:
  ↓ (action: rejected)
rejected
```

---

## Role-Based Access

### Admin
- Full access to all endpoints
- Can perform all CRUD operations
- Can access all contracts regardless of assignment

### Supervisor
- Can manage document templates
- Can review contracts assigned to them
- Can view and manage users
- Can delete contracts

### Manager
- Can approve contracts at layer 1 if assigned as approver1
- Can create and manage their own contracts
- Can view contracts they need to approve

### C-Level
- Can approve contracts at layer 1 or 2 if assigned
- Can create and manage their own contracts
- Can view contracts they need to approve

### Staff/User
- Can create contracts
- Can view and update their own contracts (draft/pending_review only)
- Can view contracts assigned to them for approval

---

## Example Workflows

### Workflow 1: Create and Approve Contract

```bash
# 1. Login
POST /api/auth/login
{
  "email": "adminjimbaranhijau@jhilltown.com",
  "password": "Jimbaranadmin@2026"
}
# Copy token from response

# 2. Get document templates
GET /api/documents

# 3. Create contract
POST /api/contracts
{
  "templateId": "<template-uuid>",
  "title": "Perjanjian Vendor ABC",
  "contractData": {...},
  "reviewer": "<supervisor-uuid>",
  "approver1": "<manager-uuid>",
  "approver2": "<clevel-uuid>"
}
# Contract created with status: pending_review

# 4. Supervisor reviews (login as supervisor)
POST /api/approvals/<contract-id>/review
{
  "action": "reviewed",
  "comments": "Document reviewed and approved"
}
# Status changes to: pending_approval1

# 5. Manager approves Layer 1 (login as manager)
POST /api/approvals/<contract-id>/approve1
{
  "action": "approved",
  "comments": "Approved by manager",
  "signature": "data:image/png;base64,..."
}
# Status changes to: pending_approval2

# 6. C-Level approves Layer 2 (login as c-level)
POST /api/approvals/<contract-id>/approve2
{
  "action": "approved",
  "comments": "Final approval",
  "signature": "data:image/png;base64,..."
}
# Status changes to: completed
```

### Workflow 2: Rejection at Review Stage

```bash
# 1-3. Same as Workflow 1 (Login, Get templates, Create contract)

# 4. Supervisor rejects
POST /api/approvals/<contract-id>/review
{
  "action": "rejected",
  "comments": "Document tidak sesuai standar"
}
# Status changes to: rejected
# Contract workflow ends
```

---

## Query Parameters

### Pagination (GET /api/contracts)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page |

### Filtering (GET /api/contracts)

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by contract status |
| search | string | Search in contract number or title |

**Example**:
```
GET /api/contracts?page=1&limit=20&status=pending_review&search=JH-2026
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

---

## Authentication

All protected endpoints require JWT Bearer token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Token is returned from `/api/auth/login` or `/api/auth/register` endpoints.

Token expires in: **30 days** (configurable in .env)

---

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## Testing Tips

### 1. Use Swagger UI for Quick Testing
- Visual interface
- Auto-generated request examples
- Easy authorization management
- Response validation

### 2. Use Postman for Advanced Testing
- Import Swagger JSON: http://localhost:5000/api-docs.json
- Create collections for different workflows
- Save environment variables (tokens, IDs)

### 3. Use curl for Scripting

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"adminjimbaranhijau@jhilltown.com","password":"Jimbaranadmin@2026"}'

# Get contracts (with token)
curl -X GET http://localhost:5000/api/contracts \
  -H "Authorization: Bearer <your-token>"
```

### 4. Use PowerShell for Windows

```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"adminjimbaranhijau@jhilltown.com","password":"Jimbaranadmin@2026"}'

$token = $response.token

# Get contracts
$contracts = Invoke-RestMethod -Uri "http://localhost:5000/api/contracts" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## Swagger Configuration

Swagger configuration file: `backend/src/config/swagger.js`

### Customize Swagger

```javascript
// Change API info
info: {
  title: 'Your API Title',
  version: '2.0.0',
  description: 'Your description'
}

// Add servers
servers: [
  {
    url: 'https://your-production-url.com',
    description: 'Production server'
  }
]

// Add more schemas
components: {
  schemas: {
    YourModel: {
      type: 'object',
      properties: {...}
    }
  }
}
```

---

## Troubleshooting

### Swagger UI tidak muncul
1. Check backend running: http://localhost:5000/health
2. Check Swagger endpoint: http://localhost:5000/api-docs
3. Check console untuk errors
4. Restart backend: `.\restart-services.ps1`

### "Not authorized" error
1. Pastikan sudah click tombol "Authorize"
2. Token format: `Bearer <token>` (dengan spasi)
3. Token masih valid (belum expired)
4. Re-login jika token expired

### Endpoint tidak muncul di Swagger
1. Check JSDoc comments di route files
2. Check `apis` path di swagger.js config
3. Restart backend untuk reload swagger spec

### 500 Internal Server Error
1. Check backend terminal untuk error logs
2. Check database connection
3. Check request body format (harus valid JSON)
4. Check required fields

---

## Resources

- **Swagger UI**: http://localhost:5000/api-docs
- **Swagger JSON**: http://localhost:5000/api-docs.json
- **Health Check**: http://localhost:5000/health
- **Backend API**: http://localhost:5000
- **Frontend UI**: http://localhost:3000

---

## Next Steps

1. ✅ Access Swagger UI: http://localhost:5000/api-docs
2. ✅ Login dan get token
3. ✅ Authorize dengan token
4. ✅ Test semua endpoints
5. 📝 Export Swagger JSON untuk Postman
6. 🧪 Create test scenarios
7. 📚 Share documentation dengan team

**Happy Testing! 🚀**
