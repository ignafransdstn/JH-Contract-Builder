# Quick Reference: Testing Contract & Approval System

## Test Endpoints

### 1. Create Contract
```bash
POST http://localhost:5000/api/contracts
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": "<uuid>",
  "title": "Test Contract",
  "contractData": {
    "field1": "value1"
  },
  "reviewer": "<user-uuid>",
  "approver1": "<user-uuid>",
  "approver2": "<user-uuid>"
}
```

### 2. Get All Contracts
```bash
GET http://localhost:5000/api/contracts?page=1&limit=10
Authorization: Bearer <token>
```

### 3. Get Contract by ID
```bash
GET http://localhost:5000/api/contracts/<contract-id>
Authorization: Bearer <token>
```

### 4. Update Contract
```bash
PUT http://localhost:5000/api/contracts/<contract-id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description"
}
```

### 5. Delete Contract
```bash
DELETE http://localhost:5000/api/contracts/<contract-id>
Authorization: Bearer <token>
```

### 6. Get My Pending Contracts
```bash
GET http://localhost:5000/api/contracts/pending/me
Authorization: Bearer <token>
```

### 7. Review Contract (Supervisor)
```bash
POST http://localhost:5000/api/approvals/<contract-id>/review
Authorization: Bearer <supervisor-token>
Content-Type: application/json

{
  "action": "reviewed",
  "comments": "Looks good"
}
```

### 8. Approve Contract Layer 1 (Manager)
```bash
POST http://localhost:5000/api/approvals/<contract-id>/approve1
Authorization: Bearer <manager-token>
Content-Type: application/json

{
  "action": "approved",
  "comments": "Approved",
  "signature": "data:image/png;base64,..."
}
```

### 9. Approve Contract Layer 2 (C-Level)
```bash
POST http://localhost:5000/api/approvals/<contract-id>/approve2
Authorization: Bearer <c-level-token>
Content-Type: application/json

{
  "action": "approved",
  "comments": "Final approval",
  "signature": "data:image/png;base64,..."
}
```

### 10. Get Approval Statistics
```bash
GET http://localhost:5000/api/approvals/statistics
Authorization: Bearer <token>
```

---

## Login First

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "adminjimbaranhijau@jhilltown.com",
  "password": "Jimbaranadmin@2026"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "099c9c88-2eda-47f6-884f-324c23e3bad9",
    "name": "Admin Jimbaran Hijau",
    "email": "adminjimbaranhijau@jhilltown.com",
    "role": "admin"
  }
}
```

---

## Contract Status Flow

```
draft
  ↓
pending_review (Supervisor reviews)
  ↓
reviewed → pending_approval1 (Manager/C-Level approves Layer 1)
  ↓
approved1 → pending_approval2 (C-Level approves Layer 2)
  ↓
completed

OR at any stage:
  → rejected
```

---

## Role-Based Access

### Staff
- Can create contracts
- Can view their own contracts
- Can update their own contracts (draft/pending_review only)

### Supervisor
- Can review contracts assigned to them
- Can approve/reject at review stage

### Manager
- Can approve/reject at approval layer 1
- Can view contracts they need to approve

### C-Level
- Can approve/reject at approval layer 1 or 2
- Can view contracts they need to approve

### Admin
- Full access to all contracts
- Can view all contracts
- Can delete contracts

---

## Testing Scenarios

### Scenario 1: Full Approval Flow
1. Staff creates contract → status: `pending_review`
2. Supervisor reviews → status: `pending_approval1`
3. Manager approves Layer 1 → status: `pending_approval2`
4. C-Level approves Layer 2 → status: `completed`

### Scenario 2: Rejection at Review
1. Staff creates contract → status: `pending_review`
2. Supervisor rejects → status: `rejected`

### Scenario 3: Rejection at Layer 1
1. Staff creates contract → status: `pending_review`
2. Supervisor reviews → status: `pending_approval1`
3. Manager rejects → status: `rejected`

### Scenario 4: No Layer 2 Required
1. Staff creates contract (no approver2) → status: `pending_review`
2. Supervisor reviews → status: `pending_approval1`
3. Manager approves → status: `completed`

### Scenario 5: No Approval Layers
1. Staff creates contract (no approver1, no approver2) → status: `pending_review`
2. Supervisor reviews → status: `completed`

---

## Database Queries for Testing

### Check Contract Status
```sql
SELECT 
  "contractNumber",
  "title",
  "status",
  "currentApprovalLayer",
  "submittedById",
  "reviewerId",
  "approver1Id",
  "approver2Id"
FROM "Contracts"
ORDER BY "createdAt" DESC;
```

### Check Approval History
```sql
SELECT 
  "contractNumber",
  "approvalHistory"
FROM "Contracts"
WHERE "contractNumber" = 'JH-202501-0001';
```

### Get Statistics
```sql
SELECT 
  "status",
  COUNT(*) as count
FROM "Contracts"
GROUP BY "status";
```

---

## Expected Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Contract created successfully",
  "data": {
    "id": "uuid",
    "contractNumber": "JH-202501-0001",
    "title": "Test Contract",
    "status": "pending_review",
    ...
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Contract not found"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "You do not have permission to access this contract"
}
```

---

## PowerShell Testing Script

```powershell
# Set base URL
$baseUrl = "http://localhost:5000/api"

# 1. Login
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "adminjimbaranhijau@jhilltown.com"
    password = "Jimbaranadmin@2026"
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

# 2. Get all contracts
$contracts = Invoke-RestMethod -Uri "$baseUrl/contracts" -Method GET -Headers $headers
Write-Host "Total contracts: $($contracts.pagination.total)"

# 3. Get pending contracts
$pending = Invoke-RestMethod -Uri "$baseUrl/contracts/pending/me" -Method GET -Headers $headers
Write-Host "Pending contracts: $($pending.data.Count)"

# 4. Get statistics
$stats = Invoke-RestMethod -Uri "$baseUrl/approvals/statistics" -Method GET -Headers $headers
Write-Host "Statistics:" ($stats.data | ConvertTo-Json)
```

---

## Frontend Access

1. Open browser: http://localhost:3000
2. Login with admin credentials
3. Navigate to Contracts section
4. Test contract creation and approval workflow

---

## Service Management Commands

```powershell
# Check status
.\status-services.ps1

# Restart services
.\restart-services.ps1

# Stop services
.\stop-services.ps1

# Start services
.\start-services.ps1
```

---

## Troubleshooting

### Backend not responding
1. Check if PostgreSQL is running
2. Check backend logs in terminal
3. Verify .env file has correct database credentials
4. Restart backend: `.\restart-services.ps1`

### Database connection error
1. Verify PostgreSQL service is running
2. Check database exists: `psql -U postgres -l`
3. Check connection string in .env
4. Test connection: `psql -U postgres -d jh_contract_builder`

### Routes not found (404)
1. Verify routes are enabled in server.js
2. Check controller files have no syntax errors
3. Restart backend to reload changes

### Authorization errors
1. Verify token is included in Authorization header
2. Check token is not expired
3. Verify user has correct role permissions
4. Re-login to get fresh token
