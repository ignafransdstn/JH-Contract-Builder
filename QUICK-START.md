# Service Management - Quick Guide

## 🚀 Script Yang Tersedia

### 1. Cek Status Service
```powershell
.\status-services.ps1
```
Menampilkan:
- Status backend (port 5000)
- Status frontend (port 3000)
- Status PostgreSQL database
- Memory usage dan uptime
- Health check status
- Informasi login admin

### 2. Start Service
```powershell
.\start-services.ps1
```
- Membuka 2 terminal baru untuk backend dan frontend
- Verifikasi kedua service berhasil start
- Menampilkan URL akses dan kredensial admin

### 3. Stop Service
```powershell
.\stop-services.ps1
```
- Menghentikan backend (port 5000)
- Menghentikan frontend (port 3000)
- Cleanup orphaned processes
- Verifikasi service berhasil dihentikan

### 4. Restart Service
```powershell
.\restart-services.ps1
```
- Stop semua service
- Wait 3 detik untuk release port
- Start semua service kembali
- Verifikasi restart berhasil

---

## ⚡ Quick Start

```powershell
# Pertama kali
.\start-services.ps1

# Cek apakah running
.\status-services.ps1

# Jika perlu restart
.\restart-services.ps1

# Jika mau stop
.\stop-services.ps1
```

---

## 📌 Informasi Service

### Backend
- **Port**: 5001
- **URL**: http://localhost:5001
- **Health Check**: http://localhost:5001/health
- **Process**: node src/server.js

### Frontend
- **Port**: 3002
- **URL**: http://localhost:3002
- **Process**: node server.js
- **Build**: Production build served

### Database
- **Service**: postgresql-x64-16
- **Port**: 5432
- **Database**: jh_contract_builder

### Admin Account
- **Email**: adminjimbaranhijau@jhilltown.com
- **Password**: Jimbaranadmin@2026
- **Role**: admin

---

## 🔧 Troubleshooting

### Execution Policy Error
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Port Already in Use
```powershell
.\stop-services.ps1
# Jika masih digunakan, tunggu 5-10 detik dan coba lagi
```

### Service Tidak Start
1. Check status: `.\status-services.ps1`
2. Lihat terminal window yang terbuka untuk error message
3. Pastikan PostgreSQL running
4. Check file `.env` di folder backend

---

## 📝 File Locations

- `backend/src/server.js` - Backend entry point
- `frontend/server.js` - Frontend server (custom Express)
- `frontend/build/` - Production build React app
- `.env` - Backend configuration (database, JWT secret)

---

## 💡 Tips

1. **Jangan tutup terminal windows** yang dibuka oleh `start-services.ps1` - terminal akan otomatis close saat service dihentikan

2. **Untuk development**, bisa juga manual:
   ```powershell
   # Backend (dengan nodemon)
   cd backend
   npm run dev
   
   # Frontend (development mode - jika react-scripts work)
   cd frontend
   npm start
   ```

3. **Check logs** di terminal window yang terbuka untuk debugging

4. **Database connection** otomatis saat backend start - lihat log untuk konfirmasi

---

## 🎯 Next Steps

Setelah service berjalan:
1. Buka http://localhost:3002 di browser
2. Login dengan admin credentials
3. Explore aplikasi!

Untuk dokumentasi lengkap, lihat `README-SCRIPTS.md`
