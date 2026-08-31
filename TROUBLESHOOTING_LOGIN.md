# Troubleshooting Login Issue

## Masalah
User mencoba login dengan akun admin tetapi tidak muncul halaman awal system.

## Pemeriksaan yang Dilakukan

### 1. Backend Response Structure
Backend mengirim response dengan struktur yang benar:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "...",
      "department": "...",
      "position": "..."
    },
    "token": "..."
  }
}
```

### 2. Frontend AuthContext
AuthContext mengharapkan response dalam format `response.data.data`:
```javascript
const { user, token } = response.data.data;
```

Ini sudah benar sesuai dengan struktur response backend.

### 3. Login Flow
1. User submit form login
2. `authService.login()` dipanggil
3. API call ke `/auth/login`
4. Response disimpan ke `localStorage`:
   - `token` → localStorage.setItem('token', token)
   - `user` → localStorage.setItem('user', JSON.stringify(user))
5. `setUser(user)` dipanggil untuk update state
6. Navigate ke `/` (dashboard)

## Kemungkinan Penyebab

### 1. Backend Tidak Berjalan
**Solusi**: Restart backend server
```bash
cd backend
npm run dev
```

### 2. Frontend Tidak Berjalan
**Solusi**: Restart frontend server
```bash
cd frontend
npm start
```

### 3. Browser Console Error
**Cara Cek**:
1. Buka Developer Tools (F12)
2. Pilih tab Console
3. Coba login
4. Lihat error message yang muncul

**Kemungkinan Error**:
- CORS error → Backend CORS configuration issue
- Network error → Backend tidak respond
- 401 Unauthorized → Kredensial salah atau token invalid
- Response format error → Backend response structure berbeda

### 4. LocalStorage Issue
**Cara Cek**:
1. Buka Developer Tools (F12)
2. Pilih tab Application
3. Expand Local Storage
4. Cek apakah `token` dan `user` tersimpan setelah login

**Solusi**: Clear browser cache dan localStorage
```javascript
// Di console browser
localStorage.clear();
```

### 5. React Router Issue
**Cara Cek**:
- Pastikan `BrowserRouter` wrapping aplikasi di `index.js` atau `App.js`
- Cek apakah route `/` terdefinisi di `App.js`

### 6. Protected Route Issue
**Cara Cek**:
- Cek `ProtectedRoute` component
- Pastikan `isAuthenticated` check benar
- Lihat apakah ada redirect loop

## Langkah Troubleshooting

### Step 1: Cek Status Service
```powershell
Test-NetConnection localhost -Port 5000  # Backend
Test-NetConnection localhost -Port 3000  # Frontend
```

### Step 2: Test Backend Endpoint
```powershell
$body = '{"email":"adminjimbaranhijau@jhilltown.com","password":"Jimbaranadmin@2026"}';
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body;
```

### Step 3: Cek Browser Console
1. Buka http://localhost:3000/login
2. Buka Developer Tools (F12)
3. Pilih tab Console
4. Attempt login
5. Lihat error messages

### Step 4: Cek Network Tab
1. Developer Tools → Network tab
2. Attempt login
3. Lihat request ke `/api/auth/login`
4. Cek status code dan response

### Step 5: Cek localStorage
1. Developer Tools → Application → Local Storage
2. Setelah login, cek:
   - Apakah `token` ada?
   - Apakah `user` ada dan valid JSON?

## Fix yang Sudah Dilakukan

1. ✅ Tambah field `status` di User model
2. ✅ Update `authController.login` untuk cek status user
3. ✅ Validasi user dengan status 'deactivate' tidak bisa login
4. ✅ Backend response structure sudah benar
5. ✅ Frontend AuthContext parsing response sudah benar

## Catatan Penting

- Admin credentials:
  - Email: `adminjimbaranhijau@jhilltown.com`
  - Password: `Jimbaranadmin@2026`

- Backend URL: `http://localhost:5000`
- Frontend URL: `http://localhost:3000`
- API Base URL: `http://localhost:5000/api`

## Solusi Sementara

Jika masalah persists:

1. **Clear All Data**:
```javascript
localStorage.clear();
sessionStorage.clear();
```

2. **Hard Refresh**: Ctrl + Shift + R

3. **Restart Services**:
```powershell
# Stop all node processes
Get-Process node | Stop-Process -Force

# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm start
```

4. **Check Database**: Pastikan user admin ada dan status = 'active'
```sql
SELECT * FROM "Users" WHERE email = 'adminjimbaranhijau@jhilltown.com';
```

## Next Steps

Jika setelah restart masih ada masalah:
1. Share screenshot browser console error
2. Share network tab response dari login request
3. Check backend terminal untuk error messages
