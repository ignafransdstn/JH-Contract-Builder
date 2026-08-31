# Microsoft Teams Notification - Implementation Plan

## 📋 Overview

Mengubah sistem notifikasi dari **WhatsApp (Twilio)** ke **Microsoft Teams** untuk approval workflow JH Contract Builder.

---

## 🎯 Implementation Strategy

### **Method 1: Incoming Webhooks (DEFAULT)** ⭐ Recommended untuk Start

**Keunggulan:**
- ✅ Setup 5 menit tanpa Azure AD
- ✅ Post ke Teams channel tertentu
- ✅ Rich message cards dengan buttons
- ✅ FREE - tidak ada biaya
- ✅ Tidak perlu IT admin approval

**Cara Kerja:**
```
Contract Action (Submit/Approve/Reject)
    ↓
emailService → teamsService
    ↓
POST ke Teams Webhook URL
    ↓
Message muncul di Teams Channel (#contract-approvals)
    ↓
@mention user untuk notifikasi
```

### **Method 2: Graph API** 🔐 Advanced (Optional Upgrade)

**Keunggulan:**
- ✅ Chat pribadi ke user (seperti WhatsApp)
- ✅ Adaptive Cards interaktif
- ✅ Action buttons (Approve/Reject langsung dari Teams)

**Requirements:**
- ⚠️ Perlu Azure AD App Registration
- ⚠️ Perlu IT admin approval untuk permissions
- ⚠️ Setup lebih kompleks (30-60 menit)

**Rekomendasi:** Start dengan **Webhook**, upgrade ke Graph API nanti kalau diperlukan.

---

## 📝 Step-by-Step Implementation

### **PHASE 1: Setup Teams Webhook** (5 menit)

#### Step 1.1: Buat Teams Channel untuk Notifikasi
1. Buka **Microsoft Teams**
2. Pilih team Anda (atau buat team baru)
3. Klik **"..."** → **"Add channel"**
4. Nama channel: **"Contract Approvals"** atau **"JH Contract Notifications"**
5. Klik **"Add"**

#### Step 1.2: Setup Incoming Webhook
1. Di channel baru, klik **"..."** (More options)
2. Pilih **"Connectors"** atau **"Workflows"**
3. Cari **"Incoming Webhook"**
4. Klik **"Configure"** atau **"Add"**
5. Beri nama: **"JH Contract Builder"**
6. Optional: Upload logo (gunakan logo perusahaan)
7. Klik **"Create"**
8. **COPY Webhook URL** yang muncul
   - Format: `https://yourcompany.webhook.office.com/webhookb2/...`
   - **SIMPAN URL ini!** Anda akan butuh untuk backend

#### Step 1.3: Test Webhook (Manual)
Buka PowerShell dan test webhook:
```powershell
$webhookUrl = "PASTE_YOUR_WEBHOOK_URL_HERE"
$body = @{
    text = "✅ Test notification dari JH Contract Builder"
} | ConvertTo-Json

Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType 'application/json'
```

✅ Cek Teams channel → Harus ada pesan masuk!

---

### **PHASE 2: Backend Implementation** (15 menit)

#### Step 2.1: Install Dependencies
```bash
cd backend
npm install axios
```

**Note:** Axios sudah terinstall di banyak project, tapi pastikan ada di package.json.

#### Step 2.2: Buat Teams Service
**File:** `backend/src/utils/teamsService.js`

Buat service baru untuk Microsoft Teams dengan fitur:
- ✅ Send message via Incoming Webhook
- ✅ Rich message cards (Adaptive Cards)
- ✅ @mention approvers
- ✅ Action buttons untuk quick action
- ✅ Error handling & logging
- ✅ Non-blocking (tidak ganggu email flow)
- ✅ Support untuk Graph API (future upgrade)

**Implementation highlights:**
```javascript
// Rich message card dengan buttons
const card = {
    "@type": "MessageCard",
    "themeColor": "CC6F57",
    "summary": "Contract Approval Required",
    "sections": [{
        "activityTitle": "🔔 Contract Approval Required",
        "activitySubtitle": `${approver.name}`,
        "facts": [
            { "name": "Contract Number:", "value": contract.contractNumber },
            { "name": "Title:", "value": contract.title },
            { "name": "Submitted By:", "value": contract.submittedBy.name },
            { "name": "Date:", "value": new Date(contract.submittedAt).toLocaleDateString('id-ID') }
        ]
    }],
    "potentialAction": [{
        "@type": "OpenUri",
        "name": "Review Contract",
        "targets": [{
            "os": "default",
            "uri": `${process.env.FRONTEND_URL}/contracts/${contract.id}`
        }]
    }]
};
```

#### Step 2.3: Update Email Service
**File:** `backend/src/utils/emailService.js`

Ganti:
```javascript
const whatsappService = require('./whatsappService');
```

Menjadi:
```javascript
const teamsService = require('./teamsService');
```

Ganti semua pemanggilan WhatsApp:
```javascript
// BEFORE
await whatsappService.sendApprovalNotificationWA(contract, approver, layer);

// AFTER
await teamsService.sendApprovalNotification(contract, approver, layer);
```

#### Step 2.4: Update .env Configuration
**File:** `backend/.env`

**HAPUS konfigurasi Twilio:**
```env
# HAPUS BARIS INI:
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_WHATSAPP_NUMBER=...
```

**TAMBAH konfigurasi Teams:**
```env
# Microsoft Teams Notifications
TEAMS_WEBHOOK_URL=https://yourcompany.webhook.office.com/webhookb2/xxxxx
TEAMS_NOTIFICATION_ENABLED=true

# Optional: Microsoft Graph API (for future upgrade)
# MICROSOFT_TENANT_ID=your-tenant-id
# MICROSOFT_CLIENT_ID=your-client-id
# MICROSOFT_CLIENT_SECRET=your-client-secret
```

#### Step 2.5: Buat Test Script
**File:** `backend/test-teams.js`

Script untuk test Teams notification dengan berbagai scenario:
- ✅ Test webhook connection
- ✅ Test approval notification
- ✅ Test status update notification
- ✅ Test error handling

Run test:
```bash
cd backend
node test-teams.js
```

---

### **PHASE 3: Cleanup WhatsApp** (10 menit)

#### Step 3.1: Backup WhatsApp Files (Optional)
Kalau suatu saat perlu rollback:
```bash
cd backend/src/utils
mkdir ../../_archived
cp whatsappService.js ../../_archived/
cd ../../
cp test-whatsapp.js _archived/
```

#### Step 3.2: Hapus WhatsApp Dependencies
**File:** `backend/package.json`

Uninstall Twilio (optional, tidak wajib):
```bash
cd backend
npm uninstall twilio
```

#### Step 3.3: Hapus/Rename WhatsApp Files
```bash
cd backend
rm test-whatsapp.js
rm src/utils/whatsappService.js
```

Atau rename saja:
```bash
mv test-whatsapp.js _archived-test-whatsapp.js
mv src/utils/whatsappService.js src/utils/_archived-whatsappService.js
```

#### Step 3.4: Update Profile Page (Optional)
**File:** `frontend/src/pages/Profile/Profile.js`

Kalau tidak perlu phone number lagi, bisa hapus field "WhatsApp Number" dari profile form.

Atau rename jadi "Phone Number" untuk keperluan lain (kontak saja).

---

### **PHASE 4: Testing** (15 menit)

#### Step 4.1: Test Backend Service
```bash
cd backend
node test-teams.js
```

Expected output:
```
✓ Teams notification service initialized
✓ Webhook URL configured
✓ Test message sent successfully
✓ Check Teams channel for the message!
```

#### Step 4.2: Test Full Flow
1. **Restart Backend**
   ```bash
   # Stop backend (Ctrl+C)
   npm start
   ```

2. **Login ke Frontend** (http://localhost:3000)
   - Login sebagai User/Staff

3. **Submit Kontrak Baru**
   - Buat kontrak dummy
   - Submit untuk approval

4. **✅ Check Teams Channel**
   - Buka Teams channel (#contract-approvals)
   - Harus ada notifikasi baru!
   - Klik button "Review Contract" → redirect ke sistem

5. **Test Approval Flow**
   - Login sebagai Reviewer → Approve
   - ✅ Check Teams → Notifikasi ke Approver 1
   - Login sebagai Approver 1 → Approve
   - ✅ Check Teams → Notifikasi ke Approver 2 (jika ada)
   - Continue sampai completed
   - ✅ Check Teams → Notifikasi completion ke submitter

#### Step 4.3: Test Rejection
1. Submit kontrak baru
2. Login sebagai Reviewer
3. **Reject** kontrak dengan alasan
4. ✅ Check Teams → Notifikasi rejection ke submitter

---

### **PHASE 5: Documentation** (10 menit)

#### Step 5.1: Update README
Update [README.md](README.md) dengan info Teams notification.

#### Step 5.2: Buat Teams Setup Guide
**File:** `TEAMS_NOTIFICATION_SETUP.md`

Dokumentasi lengkap untuk:
- Setup Teams Incoming Webhook
- Konfigurasi backend
- Troubleshooting
- Upgrade to Graph API (future)

#### Step 5.3: Archive/Update WhatsApp Docs
Rename atau archive:
```bash
mv WHATSAPP_NOTIFICATION_SETUP.md _archived/WHATSAPP_NOTIFICATION_SETUP.md
mv WHATSAPP_QUICKSTART.md _archived/WHATSAPP_QUICKSTART.md
```

---

## 📊 Comparison: WhatsApp vs Teams

| Feature | WhatsApp (Twilio) | Teams (Webhook) | Teams (Graph API) |
|---------|-------------------|-----------------|-------------------|
| **Setup Time** | 10 menit | 5 menit | 30-60 menit |
| **Cost** | ~$0.005/msg | FREE | FREE |
| **Approval Required** | No | No | Yes (Azure AD Admin) |
| **Message Type** | Personal chat | Channel post | Personal chat |
| **Interactive** | No | Buttons only | Full Adaptive Cards |
| **@Mentions** | No | Yes | Yes |
| **Integration** | External API | Native M365 | Native M365 |
| **Best For** | External users | Team collaboration | Personal notifications |

---

## 🎨 Message Format Comparison

### WhatsApp (Old):
```
🔔 JH Contract Builder - Approval Required

Halo *Nama Reviewer*,

Kontrak baru membutuhkan Review Anda:
📄 [Title]
📋 Nomor: JH-202602-0001
...
```

### Teams Channel (New):
```
┌─────────────────────────────────────────┐
│ 🔔 Contract Approval Required           │
│ @John Doe                                │
├─────────────────────────────────────────┤
│ Contract Number:  JH-202602-0001        │
│ Title:            Kontrak Vendor ABC     │
│ Submitted By:     Jane Smith             │
│ Date:             18 Feb 2026            │
│ Layer:            Review                 │
├─────────────────────────────────────────┤
│ [Review Contract] [View Details]        │
└─────────────────────────────────────────┘
```

---

## 🚀 Timeline Estimasi

| Phase | Task | Estimated Time | Status |
|-------|------|----------------|--------|
| 1 | Setup Teams Webhook | 5 min | ⏳ Pending |
| 2 | Backend Implementation | 15 min | ⏳ Pending |
| 3 | Cleanup WhatsApp | 10 min | ⏳ Pending |
| 4 | Testing | 15 min | ⏳ Pending |
| 5 | Documentation | 10 min | ⏳ Pending |
| **TOTAL** | | **55 min** | |

---

## ✅ Checklist

### Pre-Implementation
- [ ] Backup current system
- [ ] Create Teams channel
- [ ] Setup Incoming Webhook
- [ ] Get Webhook URL
- [ ] Test webhook manually

### Implementation
- [ ] Install axios dependency
- [ ] Create teamsService.js
- [ ] Update emailService.js
- [ ] Update .env configuration
- [ ] Create test-teams.js
- [ ] Remove/archive WhatsApp files
- [ ] Update Profile page (optional)

### Testing
- [ ] Run test-teams.js
- [ ] Test contract submission
- [ ] Test approval flow
- [ ] Test rejection flow
- [ ] Verify Teams notifications working
- [ ] Verify email still working
- [ ] Check logs for errors

### Documentation
- [ ] Update README.md
- [ ] Create TEAMS_NOTIFICATION_SETUP.md
- [ ] Archive WhatsApp documentation
- [ ] Update system architecture docs

### Production Ready
- [ ] All tests passing
- [ ] No console errors
- [ ] Teams notifications working
- [ ] Email notifications working
- [ ] Documentation complete
- [ ] Code reviewed

---

## 🔧 Troubleshooting

### Issue: Webhook returns 400 Bad Request
**Solution:**
- Check webhook URL masih valid
- Verify JSON payload format
- Check Teams connector masih aktif

### Issue: Message tidak muncul di Teams
**Solution:**
- Verify TEAMS_WEBHOOK_URL di .env benar
- Check TEAMS_NOTIFICATION_ENABLED=true
- Check backend logs: `backend/logs/combined.log`
- Test webhook manual via PowerShell

### Issue: @Mention tidak berfungsi
**Solution:**
- Adaptive Cards v1.2+ required
- Check user email match dengan M365 account
- Graph API perlu untuk reliable @mentions

---

## 🎯 Future Enhancements

### Phase 2: Upgrade to Graph API
1. Create Azure AD App Registration
2. Get admin consent untuk permissions:
   - `Chat.ReadWrite`
   - `User.Read.All`
3. Update teamsService.js dengan Graph API support
4. Enable personal chat notifications
5. Implement Adaptive Cards dengan action buttons

### Phase 3: Interactive Approvals
1. Implement action buttons di Teams card
2. **Approve** button → langsung approve dari Teams
3. **Reject** button → form input reason
4. Webhook callback untuk actions
5. Real-time status update

---

## 📚 Resources

**Microsoft Teams Connectors:**
- Incoming Webhooks: https://docs.microsoft.com/connectors/teams/
- Adaptive Cards: https://adaptivecards.io/designer/
- Message Card Playground: https://messagecardplayground.azurewebsites.net/

**Microsoft Graph API:**
- Docs: https://docs.microsoft.com/graph/
- Chat API: https://docs.microsoft.com/graph/api/chat-post-messages
- Authentication: https://docs.microsoft.com/graph/auth/

**JH Contract Builder:**
- Backend API: http://localhost:5000/api
- Frontend: http://localhost:3000
- Logs: `backend/logs/combined.log`

---

## 🎉 Next Steps

Setelah membaca plan ini, silakan konfirmasi:

1. ✅ **Apakah setup Teams channel sudah dilakukan?**
   - Sudah buat channel?
   - Sudah dapat Webhook URL?

2. ✅ **Siap untuk implementasi backend?**
   - Saya akan create semua files
   - Update configurations
   - Setup test scripts

3. ✅ **Timing implementation?**
   - Sekarang juga? (55 menit)
   - Nanti? (saya prepare files dulu)

**Konfirmasi untuk lanjut implementasi!** 🚀
