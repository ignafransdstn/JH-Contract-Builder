# JH Contract Builder - Script Management

Script PowerShell untuk management service aplikasi JH Contract Builder.

## 📋 Daftar Script

### 1. `start-services.ps1`
**Fungsi:** Menjalankan backend dan frontend service

**Cara Pakai:**
```powershell
.\start-services.ps1
```

**Yang Dilakukan:**
- Check apakah service sudah berjalan
- Start backend (port 5001) di terminal baru
- Start frontend (port 3002) di terminal baru
- Verifikasi kedua service berhasil start
- Menampilkan informasi akses dan login

**Output:**
- Status service (RUNNING/FAILED)
- URL akses aplikasi
- Kredensial admin

---

### 2. `stop-services.ps1`
**Fungsi:** Menghentikan backend dan frontend service

**Cara Pakai:**
```powershell
.\stop-services.ps1
```

**Yang Dilakukan:**
- Mencari process yang menggunakan port 5001 (backend)
- Mencari process yang menggunakan port 3002 (frontend)
- Kill process tersebut
- Cleanup orphaned node processes
- Verifikasi service berhasil dihentikan

**Output:**
- Konfirmasi service yang berhasil dihentikan
- Status final (STOPPED/STILL RUNNING)

---

### 3. `status-services.ps1`
**Fungsi:** Mengecek status detail service

**Cara Pakai:**
```powershell
.\status-services.ps1
```

**Yang Dilakukan:**
- Check status backend (port 5001)
- Check status frontend (port 3002)
- Check status PostgreSQL database
- Menampilkan informasi detail:
  - Process ID (PID)
  - Memory usage
  - Uptime
  - Health check status
- Summary dan rekomendasi aksi

**Output:**
- Detail lengkap setiap service
- Status RUNNING/STOPPED
- URL akses jika service running
- Kredensial admin jika semua running

---

### 4. `restart-services.ps1`
**Fungsi:** Restart (stop kemudian start) kedua service

**Cara Pakai:**
```powershell
.\restart-services.ps1
```

**Yang Dilakukan:**
- Jalankan `stop-services.ps1`
- Tunggu 3 detik untuk release port
- Jalankan `start-services.ps1`
- Verifikasi restart berhasil

**Output:**
- Progress restart (2 tahap)
- Status akhir (berhasil/gagal)

---

## 🚀 Quick Start

### Pertama Kali Start:
```powershell
.\start-services.ps1
```

### Check Status:
```powershell
.\status-services.ps1
```

### Stop Service:
```powershell
.\stop-services.ps1
```

### Restart Service:
```powershell
.\restart-services.ps1
```

---

## 💡 Tips

### 1. **Execution Policy**
Jika error "cannot be loaded because running scripts is disabled", jalankan:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 2. **Terminal Permission**
Jika diminta konfirmasi untuk buka terminal baru, klik "Yes" atau "Allow"

### 3. **Port Conflict**
Jika port sudah digunakan oleh aplikasi lain:
```powershell
# Check port usage
Get-NetTCPConnection -LocalPort 5000
Get-NetTCPConnection -LocalPort 3000

# Kill process by port
Stop-Process -Id <PID> -Force
```

### 4. **Database Issue**
Jika backend gagal connect ke database, pastikan PostgreSQL running:
```powershell
Get-Service -Name "postgresql*"
# Jika stopped:
Start-Service -Name "postgresql-x64-16"
```

---

## 🔧 Troubleshooting

### Service Tidak Start
1. Check dengan `status-services.ps1`
2. Lihat terminal window yang muncul untuk error message
3. Pastikan PostgreSQL running
4. Check file `.env` di folder backend

### Port Masih Terpakai
1. Jalankan `stop-services.ps1`
2. Jika masih terpakai, reboot komputer
3. Atau kill manual dengan Task Manager

### Frontend Tidak Load
1. Check apakah `build` folder ada di `frontend/`
2. Jika tidak ada, jalankan:
   ```powershell
   cd frontend
   npm run build
   ```

---

## 📦 Service Information

### Backend
- **Port:** 5000
- **File:** `backend/src/server.js`
- **Database:** PostgreSQL (localhost:5432)
- **Endpoints:**
  - Health: `http://localhost:5000/health`
  - API: `http://localhost:5000/api/*`

### Frontend
- **Port:** 3000
- **File:** `frontend/server.js`
- **Build Folder:** `frontend/build/`
- **URL:** `http://localhost:3000`

### Admin Account
- **Email:** adminjimbaranhijau@jhilltown.com
- **Password:** Jimbaranadmin@2026
- **Role:** admin

---

## 📝 Notes

- Script akan membuka terminal baru untuk setiap service
- Terminal bisa di-minimize tapi jangan ditutup
- Service akan tetap running sampai terminal ditutup atau script stop dijalankan
- Untuk production deployment, gunakan PM2 atau Windows Service
