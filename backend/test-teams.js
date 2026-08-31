/**
 * Test Microsoft Teams Notification Service
 * 
 * This script tests the Teams notification functionality
 * Make sure to:
 * 1. Configure TEAMS_WEBHOOK_URL in backend/.env
 * 2. Set TEAMS_NOTIFICATION_ENABLED=true in backend/.env
 * 3. Verify Teams channel can receive webhooks
 */

require('dotenv').config();
const teamsService = require('./src/utils/teamsService');

console.log('============================================================');
console.log('Microsoft Teams Notification Test Suite');
console.log('JH Contract Builder System');
console.log('============================================================\n');

async function testTeamsConnection() {
  console.log('🧪 Testing Teams Notification Service...\n');
  
  // Check Teams configuration
  if (!process.env.TEAMS_WEBHOOK_URL) {
    console.error('❌ Teams not configured!');
    console.log('Please set TEAMS_WEBHOOK_URL in .env file');
    process.exit(1);
  }

  if (process.env.TEAMS_NOTIFICATION_ENABLED !== 'true') {
    console.error('❌ Teams notifications disabled!');
    console.log('Please set TEAMS_NOTIFICATION_ENABLED=true in .env file');
    process.exit(1);
  }
  
  console.log('✓ Teams webhook URL configured');
  console.log('✓ Teams notifications enabled\n');
  
  try {
    // Send test message
    console.log('📤 Sending test notification to Teams...\n');
    const result = await teamsService.testTeams();
    
    console.log('📊 Test Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Check your Teams channel for the test message.');
      console.log('   The message should appear in the configured channel.');
    } else {
      console.log('\n❌ FAILED!');
      if (result.reason === 'not_configured') {
        console.log('   Teams webhook not configured properly');
      } else if (result.error) {
        console.log('   Error:', result.error);
        if (result.status === 400) {
          console.log('   - Check webhook URL is correct');
          console.log('   - Verify webhook is still active in Teams');
        } else if (result.status === 401 || result.status === 403) {
          console.log('   - Webhook URL might be expired');
          console.log('   - Recreate webhook in Teams');
        } else if (result.status === 404) {
          console.log('   - Webhook endpoint not found');
          console.log('   - Verify URL is complete and correct');
        }
      }
    }
  } catch (error) {
    console.log('\n💥 UNEXPECTED ERROR!');
    console.error(error);
  }
}

async function testApprovalNotification() {
  console.log('\n============================================================');
  console.log('📋 Testing Approval Notification Format...\n');
  
  // Mock contract data
  const mockContract = {
    id: '123',
    contractNumber: 'JH-202602-TEST',
    title: 'Test Contract - Vendor Agreement',
    submittedBy: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    submittedAt: new Date(),
    status: 'pending_review'
  };

  // Mock approver data
  const mockApprover = {
    id: '456',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'reviewer'
  };

  try {
    console.log('📤 Sending approval notification to Teams...\n');
    const result = await teamsService.sendApprovalNotification(
      mockContract, 
      mockApprover, 
      'reviewer'
    );
    
    console.log('📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Approval notification sent!');
      console.log('   Check Teams for a rich card with:');
      console.log('   - Contract details');
      console.log('   - Approver mention');
      console.log('   - Review Contract button');
    } else {
      console.log('\n❌ Failed to send approval notification');
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.log('\n💥 Error sending approval notification');
    console.error(error);
  }
}

async function testStatusUpdateNotification() {
  console.log('\n============================================================');
  console.log('🔔 Testing Status Update Notification Format...\n');
  
  // Mock contract data
  const mockContract = {
    id: '123',
    contractNumber: 'JH-202602-TEST',
    title: 'Test Contract - Vendor Agreement',
    status: 'completed'
  };

  // Mock recipient data
  const mockRecipient = {
    id: '789',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user'
  };

  try {
    console.log('📤 Sending completed status notification to Teams...\n');
    const result = await teamsService.sendStatusUpdateNotification(
      mockContract, 
      mockRecipient, 
      'completed'
    );
    
    console.log('📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Status update notification sent!');
      console.log('   Check Teams for a completion notification card');
    } else {
      console.log('\n❌ Failed to send status update');
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.log('\n💥 Error sending status update');
    console.error(error);
  }
}

async function testRejectionNotification() {
  console.log('\n============================================================');
  console.log('❌ Testing Rejection Notification Format...\n');
  
  // Mock rejected contract
  const mockContract = {
    id: '123',
    contractNumber: 'JH-202602-TEST',
    title: 'Test Contract - Vendor Agreement',
    status: 'rejected',
    rejectionReason: 'Budget not approved. Please revise the contract terms.'
  };

  // Mock recipient data
  const mockRecipient = {
    id: '789',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user'
  };

  try {
    console.log('📤 Sending rejection notification to Teams...\n');
    const result = await teamsService.sendStatusUpdateNotification(
      mockContract, 
      mockRecipient, 
      'rejected'
    );
    
    console.log('📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Rejection notification sent!');
      console.log('   Check Teams for rejection card with reason');
    } else {
      console.log('\n❌ Failed to send rejection notification');
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.log('\n💥 Error sending rejection notification');
    console.error(error);
  }
}

// Run all tests
async function runAll() {
  try {
    await testTeamsConnection();
    
    // Ask user if they want to continue with other tests
    console.log('\n============================================================');
    console.log('ℹ️  Additional tests will send more messages to Teams');
    console.log('   Press Ctrl+C to stop, or wait 3 seconds to continue...');
    console.log('============================================================');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await testApprovalNotification();
    await testStatusUpdateNotification();
    await testRejectionNotification();
    
    console.log('\n============================================================');
    console.log('Test completed');
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('\n💥 Test suite error:', error);
    process.exit(1);
  }
}

runAll();
