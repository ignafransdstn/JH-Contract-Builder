# WhatsApp Notification - Quick Start Guide

## ⚡ 5-Minute Setup (Testing)

### 1. Create Twilio Account (2 minutes)
1. Kunjungi: https://www.twilio.com/try-twilio
2. Sign up dengan email Anda
3. Verify email & phone number
4. Anda akan dapat **$15 free credit** untuk testing

### 2. Get Sandbox Credentials (1 minute)
1. Login ke Twilio Console: https://console.twilio.com
2. Klik **Messaging** → **Try it out** → **Try WhatsApp**
3. Copy 3 credentials ini:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: xxxxxxxxxxxxxxxxxxxxxxxx
   WhatsApp Sandbox Number: +14155238886
   ```

### 3. Activate Your WhatsApp (1 minute)
1. Buka WhatsApp di HP Anda
2. Kirim pesan ke: **+1 415 523 8886**
3. Isi pesan: **join <sandbox-name>** (contoh: `join brown-tiger`)
   - Sandbox name ada di halaman Twilio Sandbox
4. Tunggu balasan konfirmasi dari Twilio (1-2 detik)
5. ✅ WhatsApp Anda terhubung!

### 4. Configure Backend (1 minute)
Edit file `backend/.env`:
```env
# WhatsApp Notifications via Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
FRONTEND_URL=http://localhost:3000
```

### 5. Install & Test
```bash
# Install Twilio package
cd backend
npm install

# Test WhatsApp (edit TEST_PHONE_NUMBER first!)
# Edit backend/test-whatsapp.js line 12
node test-whatsapp.js
```

✅ **Done!** Anda akan menerima test message di WhatsApp.

---

## 📱 Add Phone Number to User Profile

Users yang ingin menerima notifikasi WhatsApp harus menambahkan nomor HP:

### Via Frontend (Profile Page)
1. Login ke sistem
2. Klik Profile (pojok kanan atas)
3. Edit Profile
4. Isi field **Phone Number**
   - Format: `081234567890` atau `+6281234567890`
5. Save

### Via Database (Direct)
```sql
UPDATE "Users" 
SET phone = '081234567890' 
WHERE email = 'user@example.com';
```

---

## 🧪 Testing Flow

### Test 1: Submit Contract → Reviewer Notification
1. Login sebagai **User** (user akun harus punya phone number)
2. Create & Submit kontrak baru
3. **Reviewer** akan terima 2 notifikasi:
   - ✉️ Email
   - 📱 WhatsApp (jika ada phone number)

### Test 2: Reviewer Approve → Approver 1 Notification
1. Login sebagai **Reviewer**
2. Approve kontrak
3. **Approver 1** akan terima 2 notifikasi:
   - ✉️ Email
   - 📱 WhatsApp (jika ada phone number)

### Test 3: Rejection → Submitter Notification
1. Login sebagai **Reviewer** atau **Approver**
2. Reject kontrak dengan reason
3. **Submitter** akan terima 2 notifikasi:
   - ✉️ Email (dengan reason)
   - 📱 WhatsApp (dengan reason)

---

## 🔍 Troubleshooting

### WhatsApp tidak terkirim?

**Check 1: Apakah Twilio configured?**
```bash
# Check logs
tail -f backend/logs/combined.log | grep WhatsApp
```
Expected: `✓ Twilio WhatsApp service initialized`
If not, check `.env` file.

**Check 2: Apakah user punya phone number?**
```sql
SELECT name, email, phone FROM "Users";
```
If phone is NULL, user won't receive WhatsApp.

**Check 3: Apakah recipient sudah join Twilio Sandbox?**
- Buka WhatsApp → Kirim `join <sandbox-name>` ke Twilio number
- Tunggu konfirmasi

**Check 4: Format nomor benar?**
- Valid: `081234567890`, `+6281234567890`
- Invalid: `81234567890` (missing 0)

---

## 💰 Cost Estimation

### Twilio Free Trial
- **Free Credit**: $15
- **Message Cost**: $0.005/message
- **Total Free Messages**: 3000 messages!
- Cukup untuk testing **months**

### After Free Trial
**Scenario: 100 contracts/month**
- 4 notifications per contract (submit, review, approve, complete)
- Total: 400 messages/month
- Cost: **$2/month** (~Rp 30,000)

**Scenario: 1000 contracts/month**
- 4000 messages/month
- Cost: **$20/month** (~Rp 300,000)

### Alternative: Fonnte (Indonesia)
- **Unlimited messages**: Rp 55,000/month
- Cost-effective untuk volume tinggi
- Setup guide: WHATSAPP_NOTIFICATION_SETUP.md

---

## 🚀 Production Deployment

### Option 1: Continue with Sandbox (Quick)
**Pros:**
- ✅ Already setup
- ✅ Free while in trial
- ✅ No additional steps

**Cons:**
- ❌ Recipients must join sandbox
- ❌ Less professional

### Option 2: Get Production Number (Recommended)
**Steps:**
1. Buy Twilio phone number (~$1/month)
2. Enable WhatsApp on number
3. Update `.env` with new number
4. Submit WhatsApp Business profile to Meta
5. Wait 1-3 days for approval
6. ✅ No more "join" requirement!

**Guide**: See WHATSAPP_NOTIFICATION_SETUP.md → Production Deployment

---

## 📚 Full Documentation

- **Complete Setup Guide**: `WHATSAPP_NOTIFICATION_SETUP.md`
  - Twilio setup
  - Fonnte alternative
  - Production deployment
  - Error handling
  - Cost estimation

- **Test Script**: `backend/test-whatsapp.js`
  - Test connection
  - Test notifications
  - Debug issues

---

## 🔗 Resources

- **Twilio Console**: https://console.twilio.com
- **Twilio WhatsApp Docs**: https://www.twilio.com/docs/whatsapp
- **Twilio Sandbox Guide**: https://www.twilio.com/docs/whatsapp/sandbox
- **Pricing**: https://www.twilio.com/whatsapp/pricing

---

## ✅ Checklist

Setup complete jika:
- [ ] Twilio account created
- [ ] Sandbox credentials copied to `.env`
- [ ] Your WhatsApp joined Twilio sandbox
- [ ] `npm install` done
- [ ] Test script runs successfully
- [ ] Users have phone numbers in profile
- [ ] Submit contract → Reviewer receives WhatsApp ✅
- [ ] Approve contract → Next layer receives WhatsApp ✅

**Setup time**: ~5 minutes
**Works**: Immediately!
**Cost**: Free for first 3000 messages

🎉 **Selamat! WhatsApp notification sudah berjalan!**
