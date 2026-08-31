/**
 * Test WhatsApp Notification Service
 * 
 * This script tests the WhatsApp notification functionality
 * Make sure to:
 * 1. Configure TWILIO credentials in backend/.env
 * 2. Join Twilio Sandbox (send "join <sandbox-name>" to Twilio WhatsApp number)
 * 3. Update TEST_PHONE_NUMBER below with your WhatsApp number
 */

require('dotenv').config();
const whatsappService = require('./src/utils/whatsappService');

// ⚠️ UPDATE THIS: Your WhatsApp number
const TEST_PHONE_NUMBER = '+6281234567890'; // Change to your number

async function testWhatsAppConnection() {
  console.log('🧪 Testing WhatsApp Notification Service...\n');
  
  // Check Twilio configuration
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.error('❌ Twilio not configured!');
    console.log('Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
    process.exit(1);
  }
  
  console.log('✓ Twilio credentials found');
  console.log(`✓ Sending to: ${TEST_PHONE_NUMBER}\n`);
  
  try {
    // Send test message
    const result = await whatsappService.testWhatsApp(TEST_PHONE_NUMBER);
    
    console.log('📊 Test Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Check your WhatsApp for the test message.');
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.log('\n❌ FAILED!');
      if (result.reason === 'not_configured') {
        console.log('Twilio credentials not configured properly');
      } else if (result.reason === 'no_phone') {
        console.log('No phone number provided');
      } else if (result.reason === 'invalid_phone') {
        console.log('Invalid phone number format');
      } else if (result.error) {
        console.log('Error:', result.error);
        if (result.code === 21608) {
          console.log('\n⚠️ User not joined Twilio Sandbox!');
          console.log('Solution:');
          console.log('1. Open WhatsApp on your phone');
          console.log(`2. Send message to: ${process.env.TWILIO_WHATSAPP_NUMBER}`);
          console.log('3. Message content: join <your-sandbox-name>');
          console.log('4. Wait for confirmation from Twilio');
          console.log('5. Run this test again');
        }
      }
    }
  } catch (error) {
    console.error('\n❌ Exception:', error.message);
  }
}

// Test specific notification types
async function testApprovalNotification() {
  console.log('\n\n🧪 Testing Approval Notification...\n');
  
  const mockContract = {
    id: 'test-contract-id',
    contractNumber: 'JH-202602-0001',
    title: 'Test Contract - PKS Testing',
    submittedBy: {
      name: 'John Doe'
    },
    submittedAt: new Date()
  };
  
  const mockApprover = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: TEST_PHONE_NUMBER
  };
  
  try {
    const result = await whatsappService.sendApprovalNotificationWA(
      mockContract,
      mockApprover,
      'reviewer'
    );
    
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Approval notification sent successfully!');
    } else {
      console.log('\n❌ Failed to send approval notification');
    }
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

async function testStatusUpdateNotification() {
  console.log('\n\n🧪 Testing Status Update Notification...\n');
  
  const mockContract = {
    id: 'test-contract-id',
    contractNumber: 'JH-202602-0001',
    title: 'Test Contract - PKS Testing',
    submittedAt: new Date()
  };
  
  const mockRecipient = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: TEST_PHONE_NUMBER
  };
  
  try {
    const result = await whatsappService.sendStatusUpdateNotificationWA(
      mockContract,
      mockRecipient,
      'completed'
    );
    
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Status update notification sent successfully!');
    } else {
      console.log('\n❌ Failed to send status update notification');
    }
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

// Main test runner
async function runAll() {
  console.log('=' .repeat(60));
  console.log('WhatsApp Notification Test Suite');
  console.log('JH Contract Builder System');
  console.log('=' .repeat(60));
  
  await testWhatsAppConnection();
  
  // Uncomment to test specific notification types
  // await testApprovalNotification();
  // await testStatusUpdateNotification();
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test completed');
  console.log('=' .repeat(60));
}

// Run tests
runAll().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
