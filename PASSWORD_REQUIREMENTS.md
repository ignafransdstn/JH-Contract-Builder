# Password Requirements - JH Contract Builder

## Ketentuan Password Baru

Efektif tanggal **3 Februari 2026**, semua password harus memenuhi kriteria berikut:

### Persyaratan Wajib

1. **Minimal 8 Karakter**
   - Password harus memiliki panjang minimal 8 karakter
   - Tidak ada batas maksimal

2. **Minimal 1 Huruf Kapital (Uppercase)**
   - Harus mengandung setidaknya 1 huruf besar (A-Z)
   - Contoh: **P**assword, Pa**S**sword, passworD

3. **Minimal 1 Angka**
   - Harus mengandung setidaknya 1 digit angka (0-9)
   - Contoh: Pass**1**23, Password**9**

4. **Minimal 1 Karakter Spesial**
   - Harus mengandung setidaknya 1 karakter spesial
   - Karakter spesial yang diperbolehkan:
     ```
     ! @ # $ % ^ & * ( ) - + = [ ] { } ; : " \ | , . < > / ?
     ```

5. **TIDAK BOLEH Mengandung**
   - ❌ **Spasi** (space)
   - ❌ **Underscore** (_)

---

## Contoh Password

### ✅ Password VALID

| Password | Alasan Valid |
|----------|--------------|
| `Pass123!` | 8 karakter, 1 kapital (P), angka (123), spesial (!) |
| `Admin@2026` | 10 karakter, 1 kapital (A), angka (2026), spesial (@) |
| `Secure#Pass99` | 13 karakter, 2 kapital (S,P), angka (99), spesial (#) |
| `MyP@ssw0rd` | 10 karakter, 2 kapital (M,P), angka (0), spesial (@) |
| `Test1234$` | 9 karakter, 1 kapital (T), angka (1234), spesial ($) |

### ❌ Password TIDAK VALID

| Password | Alasan Tidak Valid |
|----------|-------------------|
| `password` | Tidak ada huruf kapital, angka, dan spesial karakter |
| `Pass123` | Tidak ada karakter spesial |
| `PASSWORD123!` | Tidak ada huruf kecil (tapi tetap tidak valid karena hanya huruf besar) |
| `Pass 123!` | Mengandung spasi |
| `Pass_123!` | Mengandung underscore (_) |
| `Pass12!` | Kurang dari 8 karakter (hanya 7) |
| `pass123!` | Tidak ada huruf kapital |

---

## Implementasi Teknis

### Backend Validation

Password divalidasi di 4 controller:

1. **authController.js**
   - `register()` - Registrasi user baru
   - `changePassword()` - Ganti password

2. **userController.js**
   - `createUser()` - Admin membuat user baru
   - `resetUserPassword()` - Admin reset password user

**Fungsi Validasi:**
```javascript
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password harus minimal 8 karakter' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 huruf kapital' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 angka' };
  }
  
  if (!/[!@#$%^&*()\\-+=\\[\\]{};':"\\|,.<>\\/?]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 karakter spesial (kecuali spasi dan underscore)' };
  }
  
  if (/[ _]/.test(password)) {
    return { valid: false, message: 'Password tidak boleh mengandung spasi atau underscore (_)' };
  }
  
  return { valid: true };
};
```

### Frontend Validation

**File:** `frontend/src/pages/Users/Users.js`

Validasi dilakukan pada:
- Dialog "Add User" → sebelum submit
- Dialog "Reset Password" → sebelum submit
- Button disabled jika password tidak memenuhi syarat

**Helper Text:**
```
Min 8 karakter, 1 huruf kapital, angka, dan karakter spesial (tanpa spasi/_)
```

---

## Testing Password Requirements

### Test Case 1: Add New User dengan Password Valid

**Steps:**
1. Login sebagai Admin
2. Buka halaman Users
3. Klik "Add User"
4. Isi form:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `Test123!`
   - Role: `Staff`
5. Klik "Add User"

**Expected:** ✅ User berhasil dibuat

---

### Test Case 2: Add New User dengan Password Terlalu Pendek

**Steps:**
1. Buka dialog "Add User"
2. Isi Password: `Pass1!` (hanya 6 karakter)
3. Perhatikan button "Add User"

**Expected:** ❌ Button disabled, tidak bisa submit

---

### Test Case 3: Add User Tanpa Huruf Kapital

**Steps:**
1. Buka dialog "Add User"
2. Isi Password: `password123!`
3. Klik "Add User"

**Expected:** ❌ Muncul error alert: "Password harus mengandung minimal 1 huruf kapital"

---

### Test Case 4: Add User Dengan Spasi

**Steps:**
1. Buka dialog "Add User"
2. Isi Password: `Pass 123!`
3. Klik "Add User"

**Expected:** ❌ Muncul error alert: "Password tidak boleh mengandung spasi atau underscore (_)"

---

### Test Case 5: Reset Password dengan Password Valid

**Steps:**
1. Pilih user di tabel
2. Klik icon key (Reset Password)
3. Isi New Password: `NewPass2026!`
4. Klik "Reset Password"

**Expected:** ✅ Password berhasil direset

---

### Test Case 6: Reset Password Tanpa Karakter Spesial

**Steps:**
1. Klik icon Reset Password
2. Isi New Password: `Password123`
3. Klik "Reset Password"

**Expected:** ❌ Muncul error alert: "Password harus mengandung minimal 1 karakter spesial (kecuali spasi dan underscore)"

---

## API Error Responses

### 400 Bad Request - Password Validation Failed

**Response Format:**
```json
{
  "success": false,
  "message": "Password harus minimal 8 karakter"
}
```

**Possible Messages:**
- `"Password harus minimal 8 karakter"`
- `"Password harus mengandung minimal 1 huruf kapital"`
- `"Password harus mengandung minimal 1 angka"`
- `"Password harus mengandung minimal 1 karakter spesial (kecuali spasi dan underscore)"`
- `"Password tidak boleh mengandung spasi atau underscore (_)"`

---

## Security Best Practices

### ✅ DO

- Gunakan kombinasi huruf besar, kecil, angka, dan spesial karakter
- Gunakan password yang berbeda untuk setiap akun
- Simpan password di password manager yang aman
- Ganti password secara berkala (setiap 3-6 bulan)
- Contoh password kuat: `MySecure#Pass2026`

### ❌ DON'T

- Jangan gunakan password yang mudah ditebak (nama, tanggal lahir)
- Jangan gunakan password yang sama dengan username/email
- Jangan share password ke orang lain
- Jangan simpan password di plain text
- Jangan gunakan spasi atau underscore

---

## FAQ

### Q: Apakah password lama masih bisa digunakan?

**A:** Ya, password yang sudah ada tetap bisa digunakan untuk login. Namun, saat user ingin mengganti password atau admin membuat user baru, password baru harus memenuhi ketentuan ini.

---

### Q: Berapa panjang maksimal password?

**A:** Tidak ada batas maksimal, tapi disarankan 12-16 karakter untuk keamanan optimal.

---

### Q: Apakah emoji bisa digunakan sebagai karakter spesial?

**A:** Tidak, hanya karakter spesial ASCII standar yang diperbolehkan: `!@#$%^&*()-+=[]{};"|\,.<>/?`

---

### Q: Kenapa underscore tidak diperbolehkan?

**A:** Untuk membedakan dengan konvensi teknis dan menghindari kebingungan dengan spasi. Gunakan dash (-) sebagai alternatif.

---

### Q: Apakah harus ada minimal satu huruf kecil?

**A:** Tidak wajib secara eksplisit, tapi dalam praktik, kombinasi huruf besar dan kecil membuat password lebih kuat.

---

## Testing dengan PowerShell

### Test Login dengan Password Baru

```powershell
# Set variables
$email = "testuser@example.com"
$password = "Test123!"

# Test login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{email=$email; password=$password} | ConvertTo-Json)

Write-Host "Login Success!" -ForegroundColor Green
Write-Host "Token: $($response.data.token)"
```

### Test Create User dengan Password Validation

```powershell
# Get admin token
$adminToken = "YOUR_ADMIN_TOKEN_HERE"

# Test dengan password INVALID (tanpa huruf kapital)
$invalidUser = @{
  name = "Test User"
  email = "test@example.com"
  password = "password123!"  # ❌ Tidak ada huruf kapital
  role = "staff"
}

try {
  Invoke-RestMethod -Uri "http://localhost:5000/api/users" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{Authorization = "Bearer $adminToken"} `
    -Body ($invalidUser | ConvertTo-Json)
} catch {
  Write-Host "Expected Error: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

# Test dengan password VALID
$validUser = @{
  name = "Test User"
  email = "test@example.com"
  password = "Password123!"  # ✅ Memenuhi semua syarat
  role = "staff"
}

$result = Invoke-RestMethod -Uri "http://localhost:5000/api/users" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization = "Bearer $adminToken"} `
  -Body ($validUser | ConvertTo-Json)

Write-Host "User Created: $($result.data.name)" -ForegroundColor Green
```

---

## Change Log

### Version 1.1 - 3 Februari 2026

**Changes:**
- ✅ Updated password minimum length from 6 to 8 characters
- ✅ Added requirement for at least 1 uppercase letter
- ✅ Added requirement for at least 1 number
- ✅ Added requirement for at least 1 special character
- ✅ Prohibited spaces and underscores in passwords
- ✅ Updated validation in backend (authController, userController)
- ✅ Updated validation in frontend (Users.js)
- ✅ Updated helper texts in UI

**Files Modified:**
- `backend/src/controllers/authController.js`
- `backend/src/controllers/userController.js`
- `frontend/src/pages/Users/Users.js`

---

## Contact

Untuk pertanyaan atau masalah terkait password requirements, hubungi:

**Admin Jimbaran Hijau**  
Email: adminjimbaranhijau@jhilltown.com

---

*Last Updated: 3 Februari 2026*
