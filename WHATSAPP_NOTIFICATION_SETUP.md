# WhatsApp Notification Setup Guide

## Overview

Sistem JH Contract Builder sekarang mendukung notifikasi WhatsApp otomatis untuk approval workflow. Notifikasi WhatsApp akan dikirim bersamaan dengan email notification, dan bersifat **optional** - hanya akan terkirim jika user memiliki nomor telepon di akun mereka.

## Flow Notifikasi WhatsApp

```
User/Staff Submit Contract
    ↓
✉️ Email + 📱 WhatsApp → Reviewer
    ↓
Reviewer Approve
    ↓
✉️ Email + 📱 WhatsApp → Approver 1
    ↓
Approver 1 Approve
    ↓
✉️ Email + 📱 WhatsApp → Approver 2 (if configured)
    ↓
Approver 2 Approve / All Approvals Done
    ↓
✉️ Email + 📱 WhatsApp → Submitter (Completed)

[Rejection di level manapun]
    ↓
✉️ Email + 📱 WhatsApp → Submitter (Rejected + Reason)
```

## Setup Options

### Option 1: Twilio WhatsApp API (Recommended) ⭐

**Keunggulan:**
- ✅ Official WhatsApp Business partner
- ✅ Reliable & production-ready
- ✅ No Meta approval needed (setup < 5 minutes)
- ✅ Pay-per-message (~$0.005/message)
- ✅ Excellent documentation
- ✅ Phone number verification included

**Biaya:**
- ~$0.005 per message (Rp 75/pesan)
- No monthly fee
- Cocok untuk volume rendah-menengah

**Setup Steps:**

1. **Create Twilio Account**
   - Daftar di: https://www.twilio.com/try-twilio
   - Verify email & phone number
   - Free trial credit: $15 (cukup untuk testing)

2. **Get Free Twilio Sandbox WhatsApp Number**
   - Login → Console → Messaging → Try it out → Try WhatsApp
   - Copy **Sandbox Phone Number** (e.g., `+14155238886`)
   - Copy **Account SID** dari dashboard
   - Copy **Auth Token** dari dashboard

3. **Activate Your Personal WhatsApp**
   - Buka WhatsApp di HP Anda
   - Kirim pesan ke Twilio Sandbox number
   - Format: `join <your-sandbox-name>` (contoh: `join brown-tiger`)
   - Tunggu konfirmasi dari Twilio
   - ✅ WhatsApp Anda sekarang terhubung ke Twilio Sandbox

4. **Configure Backend**
   
   Edit `backend/.env`:
   ```env
   # WhatsApp Notifications via Twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=+14155238886
   
   # Frontend URL (for links in messages)
   FRONTEND_URL=http://localhost:3000
   ```

5. **Install Twilio Package**
   ```bash
   cd backend
   npm install twilio
   ```

6. **Restart Backend**
   ```bash
   npm start
   ```

7. **Test WhatsApp Notification**
   
   Buat test script `backend/test-whatsapp.js`:
   ```javascript
   require('dotenv').config();
   const whatsappService = require('./src/utils/whatsappService');

   async function test() {
     // Ganti dengan nomor HP Anda (format: 081234567890)
     const result = await whatsappService.testWhatsApp('081234567890');
     console.log('Test result:', result);
   }

   test();
   ```

   Run test:
   ```bash
   node backend/test-whatsapp.js
   ```

   ✅ Anda akan menerima test message di WhatsApp!

8. **Add Phone Number to User Accounts**
   
   Users harus menambahkan nomor telepon di profile mereka:
   - Format: `081234567890` atau `+6281234567890`
   - Sistem akan auto-format ke format internasional

---

### Option 2: Fonnte (Alternative - Indonesia) 🇮🇩

**Keunggulan:**
- ✅ Service lokal Indonesia
- ✅ Murah: Rp 55k/bulan unlimited
- ✅ Setup mudah
- ✅ Support bahasa Indonesia

**Biaya:**
- Paket Starter: Rp 55.000/bulan (unlimited messages)
- Paket Pro: Rp 155.000/bulan (multi-device)

**Setup Steps:**

1. **Register Fonnte**
   - Daftar di: https://fonnte.com
   - Pilih paket sesuai kebutuhan
   - Hubungkan WhatsApp number Anda

2. **Update WhatsApp Service**
   
   Edit `backend/src/utils/whatsappService.js`:
   ```javascript
   const axios = require('axios');
   
   exports.sendWhatsApp = async (options) => {
     try {
       const response = await axios.post('https://api.fonnte.com/send', {
         target: options.to,
         message: options.message,
         countryCode: '62'
       }, {
         headers: {
           'Authorization': process.env.FONNTE_API_KEY
         }
       });
       
       return { success: true, messageId: response.data.id };
     } catch (error) {
       return { success: false, error: error.message };
     }
   };
   ```

3. **Configure .env**
   ```env
   FONNTE_API_KEY=your_fonnte_api_key_here
   ```

---

### Option 3: WhatsApp Business API (Official)

**Untuk production scale besar:**
- Perlu approval Meta (2-4 minggu)
- Monthly fee + per message
- Template messages only
- Cocok untuk enterprise

Setup guide: https://developers.facebook.com/docs/whatsapp/cloud-api

---

## Implementation Details

### Phone Number Format

Sistem otomatis auto-format nomor telepon:
- Input: `081234567890` → Output: `+6281234567890`
- Input: `+6281234567890` → Output: `+6281234567890` (no change)
- Input: `0812 3456 7890` → Output: `+6281234567890` (cleaned)

### Notification Scenarios

1. **Contract Submission** (Submit → Reviewer)
   ```
   🔔 JH Contract Builder - Approval Required
   
   Halo *Nama Reviewer*,
   
   Kontrak baru membutuhkan Review Anda:
   📄 [Title]
   📋 Nomor: JH-202602-0001
   👤 Diajukan: User Name
   📅 Tanggal: 16 Feb 2026
   
   Link: [URL to contract]
   ```

2. **Approval Layer** (Reviewer → Approver 1/2)
   - Same format as above
   - Layer info updated

3. **Status Update - Approved/Completed** (To Submitter)
   ```
   🎉 JH Contract Builder - Status Update
   
   Halo *Nama Submitter*,
   
   Kontrak Anda telah selesai diproses dan disetujui:
   📄 [Title]
   📋 Nomor: JH-202602-0001
   
   Link: [URL to contract]
   ```

4. **Status Update - Rejected** (To Submitter)
   ```
   ❌ JH Contract Builder - Status Update
   
   Halo *Nama Submitter*,
   
   Kontrak Anda ditolak:
   📄 [Title]
   📋 Nomor: JH-202602-0001
   💬 Alasan: [Rejection reason]
   
   Link: [URL to contract]
   ```

### Error Handling

WhatsApp notification bersifat **non-blocking**:
- Jika WhatsApp gagal, email tetap terkirim
- Error di-log tapi tidak stop process
- User tetap bisa approve tanpa WhatsApp

Contoh error handling:
```javascript
try {
  await whatsappService.sendApprovalNotificationWA(contract, approver, layer);
} catch (waError) {
  logger.warn('WhatsApp notification failed (non-critical):', waError.message);
  // Process continues...
}
```

### Logs

WhatsApp activity ter-log di `backend/logs/combined.log`:
```
2026-02-16 10:30:15 info: WhatsApp sent: SM1234567890 to +6281234567890
2026-02-16 10:30:16 warn: WhatsApp skipped for user@email.com - No phone number
2026-02-16 10:30:17 error: WhatsApp send error: Invalid phone number
```

---

## Testing

### 1. Test WhatsApp Connection

```bash
cd backend
node test-whatsapp.js
```

Expected output:
```
✓ Twilio WhatsApp service initialized
Test result: {
  success: true,
  messageId: 'SM1234567890',
  to: '+6281234567890'
}
```

### 2. Test Full Flow

1. Login sebagai User
2. Submit kontrak baru
3. Check WhatsApp Reviewer → Harus terima notifikasi
4. Login sebagai Reviewer
5. Approve kontrak
6. Check WhatsApp Approver 1 → Harus terima notifikasi
7. Continue flow...

---

## Troubleshooting

### Issue: "WhatsApp notification skipped - Twilio not configured"

**Solution:**
- Check `.env` file ada `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- Restart backend server
- Check logs: `backend/logs/combined.log`

### Issue: "Invalid phone number"

**Solution:**
- Format nomor harus valid: `081234567890` atau `+6281234567890`
- User harus update phone number di profile
- Check database: `SELECT phone FROM "Users" WHERE id='...'`

### Issue: "Message not delivered to recipient"

**Solution Twilio Sandbox:**
- Recipient belum join Twilio Sandbox
- Buka WhatsApp → Kirim `join <sandbox-name>` ke Twilio number
- Tunggu konfirmasi dari Twilio

**Solution Production:**
- Upgrade dari Sandbox ke Production WhatsApp number
- Buy Twilio phone number: ~$1/month
- Complete WhatsApp sender registration

### Issue: "WhatsApp sent but recipient doesn't receive"

**Checklist:**
1. ✅ Recipient sudah join Twilio Sandbox?
2. ✅ Phone number format benar?
3. ✅ Recipient WhatsApp aktif?
4. ✅ Check Twilio logs: https://console.twilio.com/us1/monitor/logs/messages

---

## Production Deployment

### Move from Sandbox to Production Number

1. **Buy Twilio Phone Number**
   - Console → Phone Numbers → Buy a number
   - Select country (Indonesia recommended for .id numbers)
   - Enable WhatsApp capability
   - Cost: ~$1-2/month

2. **Enable WhatsApp on Number**
   - Phone Numbers → Manage → [Your Number]
   - Configure → Messaging → WhatsApp → Enable

3. **Update .env**
   ```env
   TWILIO_WHATSAPP_NUMBER=+6281234567890  # Your new number
   ```

4. **Submit WhatsApp Sender Profile** (Required by Meta)
   - Company information
   - Use case description
   - Sample messages
   - Approval time: 1-3 days

5. **Test with Real Users**
   - No more "join" requirement
   - Messages delivered instantly

---

## Security Best Practices

1. **Never commit credentials to git**
   ```bash
   # .gitignore already includes
   .env
   ```

2. **Use environment variables**
   - Production: Set env vars in hosting platform
   - Development: Use `.env` file

3. **Rotate credentials regularly**
   - Twilio: Regenerate Auth Token every 6 months
   - Update in production environment

4. **Monitor usage**
   - Check Twilio console untuk message volume
   - Set up billing alerts

---

## Cost Estimation

### Twilio (Pay-per-message)

**Scenario: 100 contracts/month**
- Each contract: 4 notifications average (submit, review, approve1, complete)
- Total: 400 messages/month
- Cost: 400 × $0.005 = **$2/month** (Rp 30.000)

**Scenario: 1000 contracts/month**
- 4000 messages/month
- Cost: **$20/month** (Rp 300.000)

### Fonnte (Unlimited)

- Rp 55.000/month unlimited
- Cost-effective untuk volume tinggi (>1100 messages/month)

---

## Support

**Twilio Support:**
- Docs: https://www.twilio.com/docs/whatsapp
- Support: support@twilio.com
- Community: https://www.twilio.com/community

**Fonnte Support:**
- Docs: https://docs.fonnte.com
- WhatsApp: +62 838-4090-9447
- Email: cs@fonnte.com

**JH Contract Builder:**
- Check logs: `backend/logs/combined.log`
- GitHub Issues: [Your repo]
- Email: [Your support email]

---

## Summary

✅ **WhatsApp notifications implemented**
✅ **Optional - won't break if user has no phone**
✅ **Non-blocking - email always sent**
✅ **Auto phone formatting**
✅ **Production-ready with Twilio**
✅ **Cost-effective (~$0.005/message)**

**Next Steps:**
1. Setup Twilio account (5 minutes)
2. Configure `.env` file
3. Add phone numbers to user profiles
4. Test with sandbox
5. Deploy to production! 🚀
