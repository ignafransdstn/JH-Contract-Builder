# 🚀 QUICK START - Notification Setup

## ✨ What Was Implemented

### 1. **Multi-Provider Email Support** 📧
- ✅ Gmail SMTP
- ✅ Microsoft 365 SMTP  
- ✅ Yahoo SMTP
- ✅ Custom SMTP servers
- ✅ **Automatic provider detection** based on email address

### 2. **Microsoft Teams Integration** 💬
- ✅ **Channel Webhook** - Team notifications (Already Working!)
- ✅ **Personal Messaging** - Direct chat for M365 users (New!)

### 3. **Smart Notification Flow** 🎯
```
Contract Submitted
       ↓
  ┌────────────────────┐
  │ Multi-Channel Send │
  └────────────────────┘
         ↓    ↓    ↓
    Teams  Teams  Email
   Channel Personal (Auto-detect provider)
```

---

## ⚡ Configuration Required (Priority Order)

### **STEP 1: Email (SMTP) - REQUIRED for basic notifications**

Pick your provider and add to `.env`:

#### Option A: Gmail (Most Common)
```env
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```
[Get App Password →](https://myaccount.google.com/apppasswords)

#### Option B: Microsoft 365
```env
M365_USER=your_email@yourdomain.com
M365_PASSWORD=your_m365_password
M365_DOMAINS=yourdomain.com
```

#### Option C: Yahoo
```env
YAHOO_USER=your_yahoo@yahoo.com
YAHOO_APP_PASSWORD=your_yahoo_app_password
```

---

### **STEP 2: Teams Personal (OPTIONAL - M365 Only)**

**Only if you want personal Teams chat notifications for M365 users**

#### Quick Setup:
1. Go to [Azure Portal](https://portal.azure.com)
2. Azure AD → App registrations → New
3. Copy: Tenant ID, Client ID
4. Create secret → Copy value
5. API Permissions: `Chat.ReadWrite`, `User.Read.All`
6. Grant admin consent

Add to `.env`:
```env
M365_GRAPH_ENABLED=true
M365_TENANT_ID=your_tenant_id
M365_CLIENT_ID=your_client_id
M365_CLIENT_SECRET=your_secret
```

📖 [Detailed Guide →](NOTIFICATION_SETUP_GUIDE.md#c-teams-personal-messaging-setup-optional-but-recommended)

---

## 🧪 Testing

### Quick Test:
```bash
cd backend
node test-notifications.js
```

### What to Check:
- ✅ Teams channel message appears
- ✅ Email arrives in inbox
- ✅ Teams personal chat (if M365 configured)

### Configure Test Email:
Add to `.env`:
```env
TEST_EMAIL=your_email@example.com
```

---

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Teams Channel** | ✅ Active | Already working! |
| **Email SMTP** | ⏳ Configure | Add credentials to `.env` |
| **Teams Personal** | ⏳ Optional | M365 users only |

---

## 🎯 Notification Behavior

### When Contract Needs Approval:

**Approver with Gmail** (`approver@gmail.com`):
- ✅ Teams channel notification
- ✅ Email via Gmail SMTP
- ❌ No Teams personal (not M365)

**Approver with M365** (`approver@yourdomain.com`):
- ✅ Teams channel notification
- ✅ Email via M365 SMTP
- ✅ Teams personal chat (if Graph configured)

**All failures are non-blocking** - if email fails, Teams still works!

---

## 🔧 Files Modified/Created

### New Services:
- `backend/src/utils/smtpConfigService.js` - Auto-detect email provider
- `backend/src/utils/teamsPersonalService.js` - M365 Graph API for Teams DM

### Updated Services:
- `backend/src/utils/emailService.js` - Multi-channel, dynamic SMTP

### Configuration:
- `backend/.env` - Updated with all providers
- `backend/.env.example` - Template with instructions

### Testing & Docs:
- `backend/test-notifications.js` - Comprehensive test suite
- `NOTIFICATION_SETUP_GUIDE.md` - Full documentation

---

## ✅ Next Steps

1. **Configure Email SMTP** (Choose one: Gmail/M365/Yahoo)
   ```bash
   # Edit .env file
   nano backend/.env
   # or
   code backend/.env
   ```

2. **Add Your Test Email**
   ```env
   TEST_EMAIL=your_email@company.com
   ```

3. **Run Tests**
   ```bash
   cd backend
   node test-notifications.js
   ```

4. **Submit Test Contract**
   - Login to frontend (http://localhost:3000)
   - Create new contract
   - Submit for approval
   - Check all notification channels!

5. **(Optional) Setup Teams Personal**
   - Follow [Azure AD setup guide](NOTIFICATION_SETUP_GUIDE.md#c-teams-personal-messaging-setup-optional-but-recommended)
   - Configure M365 Graph API
   - Test with M365 email users

---

## 📞 Need Help?

**Test Failed?**
```bash
# Check logs
tail -f backend/logs/combined.log

# Verify backend running
curl http://localhost:5000
```

**Email Not Working?**
- ✅ Use App Password (not regular password)
- ✅ Check provider in test output
- ✅ Verify credentials in `.env`

**Teams Personal Not Working?**
- ✅ Check Azure AD permissions granted
- ✅ Verify user exists in M365 directory
- ✅ Ensure domain in `M365_DOMAINS`

---

## 🎉 Summary

**What You Get:**

✨ **Automatic Email Routing**
- System detects Gmail/M365/Yahoo and uses correct SMTP
- No need to configure per-user

✨ **Multi-Channel Reliability**
- If one channel fails, others still work
- Notifications always reach approvers

✨ **M365 Integration**
- Teams channel for team visibility
- Personal chat for individual attention
- Email for universal access

**All configured with minimal setup!**

---

📖 **Full Documentation**: [NOTIFICATION_SETUP_GUIDE.md](NOTIFICATION_SETUP_GUIDE.md)

🧪 **Test Script**: `backend/test-notifications.js`

⚙️ **Configuration**: `backend/.env`
