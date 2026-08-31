# 📬 Notification System Setup Guide

## Overview

JH Contract Builder has a sophisticated **multi-channel notification system** that automatically:
- Detects email provider and uses appropriate SMTP
- Sends Teams channel notifications for team visibility
- Sends personal Teams messages to M365 users
- Falls back gracefully if any channel fails

## 🎯 Notification Channels

### 1. **Teams Channel Webhook** ✅ (Active)
**Status**: Currently Configured  
**Visibility**: Team-wide  
**Purpose**: All team members see contract approvals in Teams channel

**What you get:**
- Real-time MessageCard notifications in Teams channel
- @mentions for approvers
- Action buttons to review contracts
- Contract details and status updates

### 2. **Teams Personal Messages** 🔐 (M365 Users Only)
**Status**: Requires Azure AD setup  
**Visibility**: Personal/Direct message  
**Purpose**: Personal notification for M365 email users

**What you get:**
- Direct personal chat in Teams
- Only the approver sees the message
- Same rich MessageCard format
- Automatic detection for M365 domains

### 3. **Email Notifications** 📧 (Universal)
**Status**: Requires SMTP configuration  
**Visibility**: Personal email inbox  
**Purpose**: Universal fallback for all users

**What you get:**
- HTML email notifications
- Automatic provider detection (Gmail, M365, Yahoo, etc.)
- Works with any email provider
- Personal inbox notifications

---

## ⚙️ Configuration Guide

### A. Gmail SMTP Setup

**1. Enable 2-Step Verification**
- Go to [Google Account Security](https://myaccount.google.com/security)
- Enable "2-Step Verification" if not already enabled

**2. Generate App Password**
- Go to [App Passwords](https://myaccount.google.com/apppasswords)
- Select app: "Mail"
- Select device: "Other" → Enter "JH Contract Builder"
- Click Generate
- Copy the 16-character password

**3. Update .env**
```env
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**Test:**
```bash
node test-notifications.js
```

---

### B. Microsoft 365 SMTP Setup

**For M365 Business Accounts:**

**1. Get SMTP Credentials**
- Use your M365 email and password
- If you have MFA enabled, you may need an app password

**2. Update .env**
```env
M365_USER=your_email@yourdomain.com
M365_PASSWORD=your_m365_password
M365_DOMAINS=yourdomain.com,subsidiary.com
```

**3. Configure Business Domains**
Add your company domains to `M365_DOMAINS` (comma-separated).  
Users with these domains will be detected as M365 users and receive personal Teams notifications.

**Example:**
```env
M365_DOMAINS=jimbaranhijau.com,jhgroup.co.id
```

---

### C. Teams Personal Messaging Setup (Optional but Recommended)

**⚠️ Requires Azure AD Admin Access**

This enables **direct personal chat messages** in Teams for M365 users.

#### Step 1: Create Azure AD App Registration

1. **Go to Azure Portal**
   - Navigate to [portal.azure.com](https://portal.azure.com)
   - Sign in with admin account

2. **Register New Application**
   - Azure Active Directory → App registrations
   - Click "New registration"
   - **Name**: `JH Contract Builder`
   - **Supported account types**: Single tenant
   - **Redirect URI**: Leave empty
   - Click "Register"

3. **Copy IDs**
   - **Overview page**, copy:
     - Directory (tenant) ID → Save as `M365_TENANT_ID`
     - Application (client) ID → Save as `M365_CLIENT_ID`

#### Step 2: Create Client Secret

1. **Certificates & secrets**
   - Click "New client secret"
   - Description: `JH Contract Builder Secret`
   - Expires: 24 months (or as per policy)
   - Click "Add"
   - **⚠️ Copy the secret VALUE immediately** → Save as `M365_CLIENT_SECRET`
   - ❗ You can't view it again after leaving the page

#### Step 3: Configure API Permissions

1. **API permissions**
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Select "Application permissions"
   
2. **Add these permissions:**
   - `Chat.ReadWrite` - To send chat messages
   - `User.Read.All` - To lookup users by email

3. **Grant Admin Consent**
   - Click "Grant admin consent for [Your Org]"
   - ✅ Confirm
   - Ensure status shows "Granted"

#### Step 4: Update Environment Configuration

Add to your `.env` file:
```env
M365_GRAPH_ENABLED=true
M365_TENANT_ID=12345678-1234-1234-1234-123456789abc
M365_CLIENT_ID=87654321-4321-4321-4321-987654321xyz
M365_CLIENT_SECRET=your_secret_value_here~1234567890
```

#### Step 5: Test

```bash
node test-notifications.js
```

Check **Test 3** results - You should receive a personal Teams chat message!

---

### D. Teams Channel Webhook (Already Configured ✅)

**Current Setup:**
- Channel: "Contract Builder Development"
- Workflow: Active
- Webhook URL: Configured in `.env`

**No action needed** - already working! 🎉

---

## 🧪 Testing Your Configuration

Run the comprehensive test script:

```bash
cd backend
node test-notifications.js
```

### What the Test Does:

1. **SMTP Detection Test**
   - Shows which provider will be used for each email
   - Example: `user@gmail.com` → Gmail SMTP
   - Example: `user@yourdomain.com` → M365 SMTP

2. **Teams Channel Test**
   - Sends test card to Teams channel
   - Check your Teams channel for notification

3. **Teams Personal Test** (if configured)
   - Sends test message to your personal Teams chat
   - Check Teams for direct message

4. **Email Test**
   - Sends test email to your inbox
   - Check email for notification

5. **Full Approval Notification Test**
   - Tests all 3 channels together
   - Shows which channels succeeded/failed

### Setting Test Email:

Add to `.env`:
```env
TEST_EMAIL=your_email@company.com
TEST_M365_EMAIL=your_m365@yourdomain.com
```

---

## 📊 How Notifications Work

### When a Contract is Submitted for Approval:

```
Contract Submitted
    ↓
╔═══════════════════════════════════════╗
║  Notification System Activated        ║
╚═══════════════════════════════════════╝
         ↓                  ↓                    ↓
   ┌─────────┐      ┌──────────────┐      ┌──────────┐
   │ Teams   │      │ Teams        │      │ Email    │
   │ Channel │      │ Personal     │      │ SMTP     │
   └─────────┘      └──────────────┘      └──────────┘
        │                   │                    │
        ↓                   ↓                    ↓
   Everyone in         M365 Users            All Users
   channel sees        get DM in             get email
   notification        Teams chat            to inbox
```

### Multi-Channel Strategy:

| Channel | Visibility | Requirement | M365 Only? |
|---------|-----------|-------------|------------|
| **Teams Channel** | Team | Webhook URL | No |
| **Teams Personal** | Private | Graph API + M365 domain | Yes |
| **Email** | Private | SMTP Config | No |

**All channels are non-blocking:**
- If email fails, Teams still works
- If Teams Personal unavailable, email still goes out
- System tries all channels and reports success/failure

---

## 🔍 Email Provider Detection

The system **automatically detects** email provider:

| Email Pattern | SMTP Used | Configuration |
|--------------|-----------|---------------|
| `*@gmail.com` | Gmail SMTP | `GMAIL_USER`, `GMAIL_APP_PASSWORD` |
| `*@outlook.com` | Outlook SMTP | `M365_USER`, `M365_PASSWORD` |
| `*@hotmail.com` | Outlook SMTP | `M365_USER`, `M365_PASSWORD` |
| `*@yourdomain.com` | M365 SMTP | If in `M365_DOMAINS` |
| `*@yahoo.com` | Yahoo SMTP | `YAHOO_USER`, `YAHOO_APP_PASSWORD` |
| Others | Custom SMTP | `CUSTOM_SMTP_*` settings |

**Example:**
```javascript
// User with email: john@jimbaranhijau.com
// .env has: M365_DOMAINS=jimbaranhijau.com
// System will:
✓ Use M365 SMTP for email
✓ Send Teams personal message (M365 user)
✓ Send Teams channel notification
```

---

## 🛠️ Troubleshooting

### Email Not Sending

**Check:**
1. ✅ Correct SMTP credentials in `.env`
   ```bash
   # For Gmail users
   GMAIL_USER=correct@gmail.com
   GMAIL_APP_PASSWORD=correct-app-password
   ```

2. ✅ Use App Passwords, not regular passwords
   - Gmail: Generate from Google Account
   - Yahoo: Generate from Yahoo Account Security

3. ✅ Test with script:
   ```bash
   node test-notifications.js
   ```

4. ✅ Check backend logs:
   ```bash
   tail -f backend/logs/combined.log
   ```

### Teams Personal Not Working

**Check:**
1. ✅ Azure AD app configured correctly
2. ✅ Admin consent granted for permissions
3. ✅ `M365_GRAPH_ENABLED=true` in `.env`
4. ✅ User email is in M365 directory
5. ✅ Domain is listed in `M365_DOMAINS`

**Test specific user:**
```bash
# In test-notifications.js, set:
TEST_M365_EMAIL=john@yourdomain.com
```

### Teams Channel Not Working

**Check:**
1. ✅ Webhook URL is correct in `.env`
2. ✅ `TEAMS_NOTIFICATION_ENABLED=true`
3. ✅ Workflow is still active in Teams
4. ✅ Test with:
   ```bash
   node test-teams.js
   ```

---

## 📚 Best Practices

### 1. **Use All Three Channels**
- **Teams Channel**: Team visibility
- **Teams Personal**: M365 user attention
- **Email**: Universal fallback

### 2. **Configure Multiple SMTP Providers**
- Different users may have different email providers
- System automatically routes to correct SMTP

### 3. **Set M365 Domains Correctly**
```env
# Include all company domains
M365_DOMAINS=company.com,subsidiary.com,branch.co.id
```

### 4. **Monitor Logs**
```bash
# Check notification success/failure
grep "notification" backend/logs/combined.log
```

### 5. **Non-Blocking Design**
- System tries all channels
- One failure doesn't block others
- Check logs for which channels succeeded

---

## 🎓 Example Scenarios

### Scenario 1: Mixed Email Providers

**Team has:**
- Manager: `manager@gmail.com`
- Approver: `approver@jimbaranhijau.com` (M365)
- Staff: `staff@yahoo.com`

**What happens:**
```
Manager submits contract
    ↓
Approver (M365 user) gets:
    ✓ Teams channel notification
    ✓ Teams personal chat message
    ✓ Email to @jimbaranhijau.com via M365 SMTP
    
Manager (Gmail user) on status update gets:
    ✓ Teams channel notification
    ✓ Email to @gmail.com via Gmail SMTP
```

### Scenario 2: M365-Only Organization

**Setup:**
```env
M365_DOMAINS=company.com
M365_GRAPH_ENABLED=true
```

**Result:**
- All employees get Teams personal messages
- All emails sent via M365 SMTP
- Unified Microsoft 365 experience

---

## 📞 Support

**Need help?**
1. Run test script: `node test-notifications.js`
2. Check logs: `backend/logs/combined.log`
3. Verify `.env` configuration matches `.env.example`

**Common Issues:**
- ❌ "Email failed" → Check SMTP credentials
- ❌ "Teams personal failed: user_not_found" → User not in M365 directory
- ❌ "Teams personal failed: not_configured" → Complete Azure AD setup

---

## ✅ Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Configure at least one SMTP provider (Gmail/M365/Yahoo)
- [ ] Set `M365_DOMAINS` for your organization
- [ ] (Optional) Setup Azure AD for Teams personal messaging
- [ ] Run `node test-notifications.js`
- [ ] Verify all channels in test results
- [ ] Restart backend: `npm start`
- [ ] Submit test contract and check notifications

**Congratulations!** 🎉 Your notification system is ready!
