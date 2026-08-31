# Users Management - Testing Guide

## 🎯 Overview

Halaman Users Management memungkinkan Admin untuk mengelola semua user dalam sistem dengan fitur lengkap:
- ✅ Add User dengan role apapun
- ✅ Edit User (termasuk role)
- ✅ Delete User
- ✅ Reset Password User

---

## 🔑 Access Requirements

**Role**: Admin only
- URL: http://localhost:3000/users
- Login: adminjimbaranhijau@jhilltown.com
- Password: Jimbaranadmin@2026

---

## 🎨 Features

### 1. View All Users
- **Table view** dengan kolom: Name, Email, Role, Department, Position, Status, Actions
- **Pagination**: 5, 10, 25, 50 items per page
- **Search**: Search by name or email
- **Filter**: Filter by role (Admin, Supervisor, Manager, C-Level, Staff, User)
- **Status indicator**: Active/Inactive badge

### 2. Add New User ➕
**Button**: "Add User" (top right)

**Fields**:
- Name* (required)
- Email* (required)
- Password* (required, min 6 characters)
- Role* (required) - Dropdown:
  - Admin
  - Supervisor
  - Manager
  - C-Level
  - Staff
  - User
- Department (optional)
- Position (optional)
- Phone (optional)

**Validation**:
- Email must be unique
- Password minimum 6 characters
- All required fields must be filled

**API**: `POST /api/users`

### 3. Edit User ✏️
**Button**: Edit icon (blue pencil) on each row

**Fields**: Same as Add User (except password not editable here)

**Features**:
- Can change name
- Can change email
- **Can change role** (Admin privilege)
- Can update department, position, phone

**API**: `PUT /api/users/:id`

### 4. Reset Password 🔑
**Button**: Key icon (orange) on each row

**Fields**:
- New Password* (required, min 6 characters)

**Process**:
1. Click reset password icon
2. Enter new password
3. Confirm reset
4. Password updated immediately

**API**: `PUT /api/users/:id/reset-password`

### 5. Delete User 🗑️
**Button**: Delete icon (red trash) on each row

**Features**:
- Confirmation dialog with warning
- Cannot delete own account (protection)
- Permanent deletion (cannot be undone)

**API**: `DELETE /api/users/:id`

---

## 📋 Role Colors

| Role | Badge Color | Description |
|------|-------------|-------------|
| Admin | Red | Full system access |
| Supervisor | Orange | Review contracts, manage templates |
| Manager | Blue | Approve contracts layer 1 |
| C-Level | Green | Approve contracts layer 2 |
| Staff | Grey | Create and manage own contracts |
| User | Grey | Basic user access |

---

## 🧪 Testing Scenarios

### Scenario 1: Add New User

**Steps**:
1. Login as Admin
2. Navigate to Users page
3. Click "Add User" button
4. Fill form:
   ```
   Name: Test User
   Email: testuser@example.com
   Password: Test123!
   Role: Staff
   Department: IT
   Position: Developer
   Phone: +6281234567890
   ```
5. Click "Add User"

**Expected Result**:
- ✅ Success alert shown
- ✅ User appears in table
- ✅ User can login with provided credentials

### Scenario 2: Edit User Role

**Steps**:
1. Find user in table
2. Click Edit icon (blue pencil)
3. Change role from "Staff" to "Manager"
4. Update other fields if needed
5. Click "Update User"

**Expected Result**:
- ✅ Success alert shown
- ✅ Role badge updated in table
- ✅ User has new role permissions

### Scenario 3: Reset User Password

**Steps**:
1. Find user in table
2. Click Reset Password icon (key)
3. Enter new password: "NewPass123!"
4. Click "Reset Password"

**Expected Result**:
- ✅ Success alert shown
- ✅ User can login with new password
- ✅ Old password no longer works

### Scenario 4: Delete User

**Steps**:
1. Find user in table
2. Click Delete icon (red trash)
3. Read warning dialog
4. Click "Delete" to confirm

**Expected Result**:
- ✅ Success alert shown
- ✅ User removed from table
- ✅ User cannot login anymore

### Scenario 5: Search Users

**Steps**:
1. Enter search term: "admin"
2. Results update automatically

**Expected Result**:
- ✅ Only matching users shown
- ✅ Search in name and email

### Scenario 6: Filter by Role

**Steps**:
1. Select "Manager" from role filter
2. Results update automatically

**Expected Result**:
- ✅ Only managers shown
- ✅ Clear filter to see all

---

## 🔒 Security & Permissions

### Admin Privileges
✅ Can create users with any role
✅ Can edit any user's role
✅ Can reset any user's password
✅ Can delete any user (except self)

### Protection
❌ Cannot delete own account
❌ Cannot access without admin role
✅ All actions logged to backend

---

## 🛠️ API Endpoints

### Get All Users
```http
GET /api/users?page=1&limit=10&search=john&role=staff
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "department": "IT",
      "position": "Developer",
      "phone": "+6281234567890",
      "isActive": true,
      "createdAt": "2026-02-03T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Create User
```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "staff",
  "department": "IT",
  "position": "Developer",
  "phone": "+6281234567890"
}
```

### Update User
```http
PUT /api/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "manager",
  "department": "IT",
  "position": "Senior Developer",
  "isActive": true
}
```

### Reset Password
```http
PUT /api/users/:id/reset-password
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "newPassword": "NewSecurePass123!"
}
```

### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin-token>
```

---

## 💻 PowerShell Testing Script

```powershell
# Set base URL
$baseUrl = "http://localhost:5000/api"

# 1. Login as Admin
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "adminjimbaranhijau@jhilltown.com"
    password = "Jimbaranadmin@2026"
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

# 2. Get all users
$users = Invoke-RestMethod -Uri "$baseUrl/users?page=1&limit=10" -Method GET -Headers $headers
Write-Host "Total users: $($users.pagination.total)"

# 3. Create new user
$newUser = @{
    name = "Test User"
    email = "testuser@example.com"
    password = "Test123!"
    role = "staff"
    department = "IT"
    position = "Tester"
} | ConvertTo-Json

$createResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Body $newUser -ContentType "application/json" -Headers $headers
Write-Host "User created: $($createResponse.data.name)"

# 4. Get user ID
$userId = $createResponse.data.id

# 5. Update user role
$updateData = @{
    name = "Test User"
    email = "testuser@example.com"
    role = "manager"
    department = "IT"
    position = "Senior Tester"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method PUT -Body $updateData -ContentType "application/json" -Headers $headers
Write-Host "User role updated to manager"

# 6. Reset password
$resetData = @{
    newPassword = "NewPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/users/$userId/reset-password" -Method PUT -Body $resetData -ContentType "application/json" -Headers $headers
Write-Host "Password reset successful"

# 7. Delete user
Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method DELETE -Headers $headers
Write-Host "User deleted"

# 8. Filter by role
$managers = Invoke-RestMethod -Uri "$baseUrl/users?role=manager" -Method GET -Headers $headers
Write-Host "Total managers: $($managers.pagination.total)"

# 9. Search users
$searchResults = Invoke-RestMethod -Uri "$baseUrl/users?search=admin" -Method GET -Headers $headers
Write-Host "Search results: $($searchResults.pagination.total) users found"
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch users"
**Solution**:
- Check backend is running: http://localhost:5000/health
- Check token is valid (not expired)
- Check user has admin role

### Issue: "Email already exists"
**Solution**:
- Use unique email address
- Check if user already exists in database

### Issue: "You cannot delete your own account"
**Solution**:
- This is a protection feature
- Create another admin to delete current account
- Or use database directly

### Issue: Password not accepted
**Solution**:
- Ensure password is at least 6 characters
- Use strong password with mix of characters

### Issue: Role changes not reflecting
**Solution**:
- User must logout and login again
- JWT token contains role information
- Refresh token to get new permissions

---

## ✅ Checklist

Before marking Users Management complete:

- [ ] Login as Admin
- [ ] View all users in table
- [ ] Test search functionality
- [ ] Test role filter
- [ ] Create new user with all roles (one by one)
- [ ] Edit user information
- [ ] Change user role from Staff → Manager → Supervisor
- [ ] Reset user password
- [ ] Login with user using new password
- [ ] Delete test user
- [ ] Verify pagination works
- [ ] Check all alerts show correctly
- [ ] Test validation (empty fields, short password)
- [ ] Try to delete own account (should fail)

---

## 📸 Screenshots Expected

1. **Users List**:
   - Table with all columns
   - Pagination at bottom
   - Search and filter at top
   - Add User button

2. **Add User Dialog**:
   - All form fields visible
   - Role dropdown showing all options
   - Validation messages

3. **Edit User Dialog**:
   - Pre-filled form data
   - Ability to change role

4. **Reset Password Dialog**:
   - Password field
   - Minimum length requirement

5. **Delete Confirmation**:
   - Warning message
   - User name displayed
   - Destructive action styling

---

## 🎯 Success Criteria

✅ **Functional Requirements**:
- Admin can add users with any role
- Admin can edit user roles
- Admin can reset passwords
- Admin can delete users
- Search and filter work correctly

✅ **UI/UX Requirements**:
- Clean, professional interface
- Clear action buttons with icons
- Confirmation dialogs for destructive actions
- Success/error feedback messages
- Responsive design

✅ **Security Requirements**:
- Only admin can access
- Cannot delete own account
- Password minimum length enforced
- All actions logged

✅ **Performance**:
- Fast table loading
- Smooth pagination
- Quick search updates

---

## 🚀 Next Steps

After completing Users Management:

1. Test all CRUD operations
2. Verify role-based access
3. Test with multiple users
4. Check logging in backend
5. Move to Document Templates
6. Then Contracts Management
7. Finally Approvals Workflow

**Current Status**: ✅ Ready for Testing

**Access**: http://localhost:3000/users
