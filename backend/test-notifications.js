/**
 * Comprehensive Notification Test Script
 * Tests all notification channels:
 * 1. Email notifications (Gmail, M365, Yahoo, Custom SMTP)
 * 2. Teams Channel webhook
 * 3. Teams Personal messaging (M365 Graph API)
 * 
 * Usage: node test-notifications.js
 */

require('dotenv').config();
const emailService = require('./src/utils/emailService');
const teamsService = require('./src/utils/teamsService');
const teamsPersonalService = require('./src/utils/teamsPersonalService');
const smtpConfigService = require('./src/utils/smtpConfigService');
const logger = require('./src/utils/logger');

// Test data
const mockContract = {
  id: 'test-contract-123',
  contractNumber: 'JH-TEST-001',
  title: 'Test Contract - Notification System',
  submittedBy: {
    id: 'user-001',
    name: 'Test Submitter',
    email: 'submitter@test.com'
  },
  submittedAt: new Date(),
  status: 'pending_review'
};

const mockApprover = {
  id: 'approver-001',
  name: 'Test Approver',
  email: process.env.TEST_EMAIL || 'test@example.com' // Set your test email in .env
};

console.log('\n=============================================================');
console.log('🧪 JH CONTRACT BUILDER - NOTIFICATION SYSTEM TEST');
console.log('=============================================================\n');

/**
 * Test 1: SMTP Configuration Detection
 */
async function testSMTPDetection() {
  console.log('📧 TEST 1: SMTP Provider Detection');
  console.log('-----------------------------------');
  
  const testEmails = [
    'user@gmail.com',
    'user@outlook.com',
    'user@hotmail.com',
    'user@live.com',
    'user@yahoo.com',
    'user@jimbaranhijau.com', // M365 business domain
    'user@custom.com'
  ];
  
  testEmails.forEach(email => {
    const provider = smtpConfigService.detectEmailProvider(email);
    const isM365 = smtpConfigService.isM365Email(email);
    const config = smtpConfigService.getSMTPConfig(email);
    
    console.log(`  ${email}`);
    console.log(`    → Provider: ${provider}`);
    console.log(`    → M365 User: ${isM365 ? 'Yes ✓' : 'No'}`);
    console.log(`    → SMTP: ${config.host}:${config.port}`);
    console.log('');
  });
  
  console.log('✅ SMTP detection test completed\n');
}

/**
 * Test 2: Teams Channel Webhook
 */
async function testTeamsChannel() {
  console.log('📢 TEST 2: Teams Channel Webhook');
  console.log('----------------------------------');
  
  try {
    const result = await teamsService.testTeams();
    
    if (result.success) {
      console.log(`✅ Teams channel notification sent successfully`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Check your Teams channel: "Contract Builder Development"`);
    } else {
      console.log(`❌ Teams channel notification failed: ${result.reason || result.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test 3: Teams Personal Messaging (M365 Graph API)
 */
async function testTeamsPersonal() {
  console.log('💬 TEST 3: Teams Personal Messaging (Graph API)');
  console.log('------------------------------------------------');
  
  if (!teamsPersonalService.isGraphConfigured()) {
    console.log('⚠️  Teams Personal Messaging not configured');
    console.log('   To enable:');
    console.log('   1. Set up Azure AD App Registration');
    console.log('   2. Add M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET to .env');
    console.log('   3. Set M365_GRAPH_ENABLED=true');
    console.log('   See .env file for detailed instructions\n');
    return;
  }
  
  const testEmail = process.env.TEST_M365_EMAIL || mockApprover.email;
  
  console.log(`Testing with email: ${testEmail}`);
  console.log('');
  
  try {
    const result = await teamsPersonalService.testTeamsPersonal(testEmail);
    
    if (result.success) {
      console.log(`✅ Personal Teams message sent successfully`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your Teams personal chat!`);
    } else {
      console.log(`❌ Failed: ${result.reason || result.message || result.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test 4: Email Notification (Dynamic SMTP)
 */
async function testEmail() {
  console.log('📨 TEST 4: Email Notification (Dynamic SMTP)');
  console.log('--------------------------------------------');
  
  const testEmail = process.env.TEST_EMAIL || mockApprover.email;
  const provider = smtpConfigService.detectEmailProvider(testEmail);
  
  console.log(`Testing email to: ${testEmail}`);
  console.log(`Detected provider: ${provider}`);
  console.log('');
  
  try {
    const result = await emailService.sendEmail({
      to: testEmail,
      subject: 'Test Email - JH Contract Builder',
      html: `
        <h2>✅ Test Email Notification</h2>
        <p>This is a test email from JH Contract Builder notification system.</p>
        <p><strong>Provider:</strong> ${provider}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('id-ID')}</p>
        <p><em>If you received this email, the notification system is working correctly!</em></p>
      `
    });
    
    if (result.success) {
      console.log(`✅ Email sent successfully`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your inbox: ${testEmail}`);
    } else {
      console.log(`❌ Email send failed`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`   Please check your SMTP configuration in .env file`);
  }
  
  console.log('');
}

/**
 * Test 5: Full Approval Notification (All Channels)
 */
async function testFullApprovalNotification() {
  console.log('🎯 TEST 5: Full Approval Notification (All Channels)');
  console.log('-----------------------------------------------------');
  
  const testEmail = process.env.TEST_EMAIL || mockApprover.email;
  mockApprover.email = testEmail;
  
  console.log(`Sending approval notification to: ${testEmail}`);
  console.log(`Contract: ${mockContract.contractNumber} - ${mockContract.title}`);
  console.log('');
  console.log('Testing channels:');
  console.log('  1. Teams Channel (webhook)');
  console.log('  2. Teams Personal (Graph API) - if M365 user');
  console.log('  3. Email (dynamic SMTP)');
  console.log('');
  
  try {
    const result = await emailService.sendApprovalNotification(
      mockContract,
      mockApprover,
      'approval1'
    );
    
    console.log('Notification Results:');
    console.log(`  Teams Channel: ${result.channels.teamsChannel ? '✅ Success' : '❌ Failed'}`);
    console.log(`  Teams Personal: ${result.channels.teamsPersonal ? '✅ Success' : '⚠️  Skipped/Failed'}`);
    console.log(`  Email: ${result.channels.email ? '✅ Success' : '❌ Failed'}`);
    console.log('');
    console.log(`Overall: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Message: ${result.message}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

/**
 * Test 6: Configuration Summary
 */
function testConfigurationSummary() {
  console.log('⚙️  TEST 6: Configuration Summary');
  console.log('----------------------------------');
  
  console.log('Email Providers Configured:');
  console.log(`  Gmail: ${process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  M365: ${process.env.M365_USER && process.env.M365_PASSWORD ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Yahoo: ${process.env.YAHOO_USER && process.env.YAHOO_APP_PASSWORD ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Custom SMTP: ${process.env.CUSTOM_SMTP_HOST && process.env.CUSTOM_SMTP_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');
  
  console.log('Teams Integration:');
  console.log(`  Channel Webhook: ${process.env.TEAMS_WEBHOOK_URL && process.env.TEAMS_NOTIFICATION_ENABLED === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Personal Messaging: ${teamsPersonalService.isGraphConfigured() ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('');
  
  console.log('M365 Business Domains:');
  if (process.env.M365_DOMAINS) {
    const domains = process.env.M365_DOMAINS.split(',');
    domains.forEach(domain => {
      console.log(`  - ${domain.trim()}`);
    });
  } else {
    console.log('  ⚠️  No M365 business domains configured');
  }
  console.log('');
  
  console.log('Test Email:');
  console.log(`  ${process.env.TEST_EMAIL || 'Not set - using default test@example.com'}`);
  console.log('');
}

/**
 * Main test runner
 */
async function runAllTests() {
  try {
    // Show configuration first
    testConfigurationSummary();
    
    // Run tests sequentially
    await testSMTPDetection();
    await testTeamsChannel();
    await testTeamsPersonal();
    await testEmail();
    await testFullApprovalNotification();
    
    console.log('=============================================================');
    console.log('✅ All tests completed!');
    console.log('=============================================================\n');
    console.log('📌 IMPORTANT NOTES:');
    console.log('1. Check your Teams channel for webhook notifications');
    console.log('2. Check your Teams personal chat (if M365 user)');
    console.log('3. Check your email inbox');
    console.log('4. If any test failed, check .env configuration');
    console.log('5. Set TEST_EMAIL in .env to use your real email for testing');
    console.log('');
    console.log('📚 Configuration Guide:');
    console.log('- For Gmail: Use App Password (Google Account > Security)');
    console.log('- For M365 Teams Personal: Setup Azure AD App (see .env)');
    console.log('- For M365 Domains: Add your company domain to M365_DOMAINS');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
