require('dotenv').config();
const { sequelize } = require('./src/models');
const User = require('./src/models/User');
const smtpConfigService = require('./src/utils/smtpConfigService');

/**
 * Test Email Provider Detection from Database Users
 * 
 * This script demonstrates how the system auto-detects
 * SMTP provider based on user emails from database
 */

const testEmailDetectionFromDatabase = async () => {
  console.log('\n=== EMAIL PROVIDER AUTO-DETECTION TEST (FROM DATABASE) ===\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Fetch all users from database
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role'],
      order: [['createdAt', 'ASC']]
    });

    if (users.length === 0) {
      console.log('⚠️  No users found in database');
      console.log('   Please create users first\n');
      return;
    }

    console.log(`Found ${users.length} users in database:\n`);

    // Test detection for each user
    console.log('┌──────────────────────────────────────┬──────────────────────────────────┬─────────────────┬─────────┬──────────────┐');
    console.log('│ Name                                 │ Email                            │ Provider        │ Is M365 │ SMTP Status  │');
    console.log('├──────────────────────────────────────┼──────────────────────────────────┼─────────────────┼─────────┼──────────────┤');

    users.forEach(user => {
      if (!user.email) {
        console.log(`│ ${pad(user.name || 'Unknown', 36)} │ ${pad('[NO EMAIL]', 32)} │ ${pad('-', 15)} │ ${pad('-', 7)} │ ${pad('N/A', 12)} │`);
        return;
      }

      // Auto-detect provider (same logic used in emailService.js)
      const provider = smtpConfigService.detectEmailProvider(user.email);
      const isM365 = smtpConfigService.isM365Email(user.email);
      const smtpConfig = smtpConfigService.getSMTPConfig(provider);
      
      // Check if SMTP is configured for this provider
      const smtpConfigured = !!smtpConfig;
      const status = smtpConfigured ? '✓ Ready' : '✗ Not Config';

      console.log(`│ ${pad(user.name, 36)} │ ${pad(user.email, 32)} │ ${pad(provider, 15)} │ ${pad(isM365 ? 'Yes' : 'No', 7)} │ ${pad(status, 12)} │`);
    });

    console.log('└──────────────────────────────────────┴──────────────────────────────────┴─────────────────┴─────────┴──────────────┘');

    // Summary
    console.log('\n--- SMTP Provider Summary ---\n');
    
    const providerCounts = {};
    const configuredProviders = new Set();
    
    users.forEach(user => {
      if (!user.email) return;
      
      const provider = smtpConfigService.detectEmailProvider(user.email);
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      
      const smtpConfig = smtpConfigService.getSMTPConfig(provider);
      if (smtpConfig) {
        configuredProviders.add(provider);
      }
    });

    Object.entries(providerCounts).forEach(([provider, count]) => {
      const configured = configuredProviders.has(provider);
      const icon = configured ? '✓' : '✗';
      const status = configured ? 'CONFIGURED' : 'NOT CONFIGURED';
      console.log(`${icon} ${provider.toUpperCase()}: ${count} user(s) - ${status}`);
    });

    // Configuration guidance
    console.log('\n--- Configuration Guidance ---\n');
    
    const unconfiguredProviders = Object.keys(providerCounts).filter(p => !configuredProviders.has(p));
    
    if (unconfiguredProviders.length > 0) {
      console.log('⚠️  You have users with unconfigured SMTP providers:');
      unconfiguredProviders.forEach(provider => {
        console.log(`\n   ${provider.toUpperCase()}:`);
        
        switch(provider) {
          case 'gmail':
            console.log('   → Add to .env:');
            console.log('     GMAIL_USER=your@gmail.com');
            console.log('     GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx');
            break;
          case 'microsoft365':
            console.log('   → Add to .env:');
            console.log('     M365_USER=your@company.com');
            console.log('     M365_PASSWORD=your_password');
            console.log('     M365_DOMAINS=company.com');
            break;
          case 'yahoo':
            console.log('   → Add to .env:');
            console.log('     YAHOO_USER=your@yahoo.com');
            console.log('     YAHOO_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx');
            break;
          case 'custom':
            console.log('   → Add to .env:');
            console.log('     CUSTOM_SMTP_HOST=smtp.yourdomain.com');
            console.log('     CUSTOM_SMTP_PORT=587');
            console.log('     CUSTOM_SMTP_USER=your@yourdomain.com');
            console.log('     CUSTOM_SMTP_PASSWORD=your_password');
            break;
        }
      });
    } else {
      console.log('✅ All user email providers are configured!');
    }

    console.log('\n--- Auto-Detection Examples ---\n');
    
    if (users.length > 0) {
      const exampleUser = users[0];
      if (exampleUser.email) {
        console.log('Example flow when sending notification:');
        console.log(`1. System gets user from database: ${exampleUser.name}`);
        console.log(`2. User email: ${exampleUser.email}`);
        console.log(`3. Auto-detect provider: ${smtpConfigService.detectEmailProvider(exampleUser.email)}`);
        console.log(`4. Use corresponding SMTP config`);
        console.log(`5. Send email via detected provider`);
      }
    }

    console.log('\n=== TEST COMPLETED ===\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
};

// Helper function to pad strings for table display
function pad(str, length) {
  str = String(str);
  if (str.length > length) {
    return str.substring(0, length - 2) + '..';
  }
  return str + ' '.repeat(Math.max(0, length - str.length));
}

// Run test
testEmailDetectionFromDatabase();
