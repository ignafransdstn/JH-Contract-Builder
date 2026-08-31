const logger = require('./logger');

/**
 * Configuration Validator
 * Validates environment configuration on startup
 * Provides warnings for missing/misconfigured settings
 */

const validateConfig = () => {
  console.log('\n=== Configuration Validation ===\n');
  
  const warnings = [];
  const infos = [];
  let hasMinimalConfig = false;
  
  // ===== SMTP Configuration Check =====
  const gmailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const m365Configured = !!(process.env.M365_USER && process.env.M365_PASSWORD);
  const yahooConfigured = !!(process.env.YAHOO_USER && process.env.YAHOO_APP_PASSWORD);
  const customSMTPConfigured = !!(process.env.CUSTOM_SMTP_HOST && process.env.CUSTOM_SMTP_USER);
  
  if (gmailConfigured) {
    infos.push('✓ Gmail SMTP configured');
    hasMinimalConfig = true;
  }
  
  if (m365Configured) {
    infos.push('✓ Microsoft 365 SMTP configured');
    hasMinimalConfig = true;
  }
  
  if (yahooConfigured) {
    infos.push('✓ Yahoo SMTP configured');
    hasMinimalConfig = true;
  }
  
  if (customSMTPConfigured) {
    infos.push('✓ Custom SMTP configured');
    hasMinimalConfig = true;
  }
  
  if (!hasMinimalConfig) {
    warnings.push('⚠️  WARNING: No SMTP provider configured - Email notifications will fail!');
    warnings.push('   → Configure at least one: GMAIL_USER, M365_USER, YAHOO_USER, or CUSTOM_SMTP_HOST');
  }
  
  // ===== Teams Channel Webhook =====
  if (process.env.TEAMS_WEBHOOK_URL && process.env.TEAMS_NOTIFICATION_ENABLED === 'true') {
    infos.push('✓ Teams Channel webhook configured');
  } else if (!process.env.TEAMS_WEBHOOK_URL) {
    warnings.push('⚠️  Teams Channel webhook not configured');
  }
  
  // ===== Teams Personal Messaging (Graph API) =====
  if (process.env.M365_GRAPH_ENABLED === 'true') {
    if (process.env.M365_TENANT_ID && process.env.M365_CLIENT_ID && process.env.M365_CLIENT_SECRET) {
      infos.push('✓ Teams Personal Messaging (Graph API) configured');
    } else {
      warnings.push('⚠️  M365 Graph API enabled but missing credentials');
      warnings.push('   → Required: M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET');
    }
  } else {
    infos.push('ℹ  Teams Personal Messaging disabled (optional feature)');
  }
  
  // ===== M365 Business Domains =====
  if (process.env.M365_DOMAINS) {
    infos.push(`✓ M365 Business Domains: ${process.env.M365_DOMAINS}`);
  } else {
    infos.push('ℹ  No M365 business domains configured (optional)');
  }
  
  // ===== Database =====
  if (process.env.DB_HOST && process.env.DB_NAME) {
    infos.push('✓ Database configuration present');
  } else {
    warnings.push('⚠️  Database configuration missing');
  }
  
  // ===== JWT =====
  if (process.env.JWT_SECRET) {
    infos.push('✓ JWT configuration present');
  } else {
    warnings.push('⚠️  JWT_SECRET not configured');
  }
  
  // ===== Frontend URL =====
  if (process.env.FRONTEND_URL) {
    infos.push(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
  } else {
    warnings.push('⚠️  FRONTEND_URL not configured');
  }
  
  // ===== Print Results =====
  console.log('Configuration Status:');
  console.log('');
  
  infos.forEach(info => console.log(info));
  
  if (warnings.length > 0) {
    console.log('');
    console.log('⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(warning));
  }
  
  console.log('');
  console.log('=== Notification Channels Summary ===');
  
  const emailChannels = [];
  if (gmailConfigured) emailChannels.push('Gmail');
  if (m365Configured) emailChannels.push('M365');
  if (yahooConfigured) emailChannels.push('Yahoo');
  if (customSMTPConfigured) emailChannels.push('Custom SMTP');
  
  console.log(`Email: ${emailChannels.length > 0 ? emailChannels.join(', ') : '❌ Not configured'}`);
  console.log(`Teams Channel: ${process.env.TEAMS_WEBHOOK_URL ? '✓ Configured' : '❌ Not configured'}`);
  console.log(`Teams Personal: ${process.env.M365_GRAPH_ENABLED === 'true' ? '✓ Enabled' : 'ℹ  Disabled'}`);
  
  console.log('\n================================\n');
  
  // Return validation result
  return {
    valid: warnings.length === 0,
    warnings: warnings,
    hasMinimalConfig: hasMinimalConfig,
    emailConfigured: hasMinimalConfig,
    teamsChannelConfigured: !!(process.env.TEAMS_WEBHOOK_URL),
    teamsPersonalConfigured: !!(process.env.M365_GRAPH_ENABLED === 'true' && 
                                 process.env.M365_TENANT_ID && 
                                 process.env.M365_CLIENT_ID)
  };
};

/**
 * Quick validation - returns boolean
 */
const isConfigValid = () => {
  // Minimal requirement: At least 1 notification channel
  const hasEmail = !!(process.env.GMAIL_USER || process.env.M365_USER || 
                      process.env.YAHOO_USER || process.env.CUSTOM_SMTP_HOST);
  const hasTeams = !!(process.env.TEAMS_WEBHOOK_URL);
  
  return hasEmail || hasTeams;
};

/**
 * Get configuration warnings
 */
const getConfigWarnings = () => {
  const warnings = [];
  
  if (!process.env.GMAIL_USER && !process.env.M365_USER && 
      !process.env.YAHOO_USER && !process.env.CUSTOM_SMTP_HOST) {
    warnings.push('No SMTP provider configured');
  }
  
  if (!process.env.TEAMS_WEBHOOK_URL) {
    warnings.push('Teams webhook not configured');
  }
  
  return warnings;
};

module.exports = {
  validateConfig,
  isConfigValid,
  getConfigWarnings
};
