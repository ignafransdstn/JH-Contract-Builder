const logger = require('./logger');

/**
 * SMTP Configuration Service
 * Automatically detect email provider and return appropriate SMTP settings
 * Supports: Gmail, Microsoft 365, and custom SMTP servers
 */

// Predefined SMTP configurations for common providers
const SMTP_CONFIGS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    requiresAuth: true,
    description: 'Gmail SMTP'
  },
  microsoft365: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // Use STARTTLS
    requiresAuth: true,
    description: 'Microsoft 365 SMTP'
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    description: 'Outlook.com SMTP'
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    description: 'Yahoo Mail SMTP'
  },
  custom: {
    host: process.env.CUSTOM_SMTP_HOST || 'localhost',
    port: parseInt(process.env.CUSTOM_SMTP_PORT) || 587,
    secure: process.env.CUSTOM_SMTP_SECURE === 'true',
    requiresAuth: process.env.CUSTOM_SMTP_AUTH === 'true',
    description: 'Custom SMTP Server'
  }
};

/**
 * Detect email provider from email address
 * @param {string} email - Email address
 * @returns {string} - Provider name (gmail, microsoft365, outlook, yahoo, custom)
 */
const detectEmailProvider = (email) => {
  if (!email) return 'custom';
  
  const emailLower = email.toLowerCase();
  
  // Gmail detection
  if (emailLower.endsWith('@gmail.com') || emailLower.endsWith('@googlemail.com')) {
    return 'gmail';
  }
  
  // Microsoft 365 detection (common M365 domains)
  if (
    emailLower.endsWith('@outlook.com') ||
    emailLower.endsWith('@hotmail.com') ||
    emailLower.endsWith('@live.com')
  ) {
    return 'outlook';
  }
  
  // Check if it's a Microsoft 365 business domain
  // This requires checking if the domain uses M365 - we'll use a custom marker
  if (process.env.M365_DOMAINS) {
    const m365Domains = process.env.M365_DOMAINS.split(',').map(d => d.trim().toLowerCase());
    const emailDomain = emailLower.split('@')[1];
    if (m365Domains.includes(emailDomain)) {
      return 'microsoft365';
    }
  }
  
  // Yahoo detection
  if (emailLower.endsWith('@yahoo.com') || emailLower.endsWith('@yahoo.co.id')) {
    return 'yahoo';
  }
  
  // Default to custom SMTP
  return 'custom';
};

/**
 * Check if email is Microsoft 365 domain
 * @param {string} email - Email address
 * @returns {boolean} - True if M365 domain
 */
const isM365Email = (email) => {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  
  // Check Outlook.com/Hotmail/Live consumer emails
  if (
    emailLower.endsWith('@outlook.com') ||
    emailLower.endsWith('@hotmail.com') ||
    emailLower.endsWith('@live.com')
  ) {
    return true;
  }
  
  // Check custom M365 business domains
  if (process.env.M365_DOMAINS) {
    const m365Domains = process.env.M365_DOMAINS.split(',').map(d => d.trim().toLowerCase());
    const emailDomain = emailLower.split('@')[1];
    return m365Domains.includes(emailDomain);
  }
  
  return false;
};

/**
 * Get SMTP configuration for email provider
 * @param {string} emailProvider - Provider name or email address
 * @returns {Object} - SMTP configuration object
 */
const getSMTPConfig = (emailProvider) => {
  // If it's an email address, detect the provider first
  let provider = emailProvider;
  if (emailProvider && emailProvider.includes('@')) {
    provider = detectEmailProvider(emailProvider);
  }
  
  // Get config for provider
  const config = SMTP_CONFIGS[provider] || SMTP_CONFIGS.custom;
  
  // Get credentials from environment based on provider
  let user, pass;
  
  switch (provider) {
    case 'gmail':
      user = process.env.GMAIL_USER || process.env.EMAIL_USER;
      pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;
      break;
    
    case 'microsoft365':
    case 'outlook':
      user = process.env.M365_USER || process.env.EMAIL_USER;
      pass = process.env.M365_PASSWORD || process.env.EMAIL_PASSWORD;
      break;
    
    case 'yahoo':
      user = process.env.YAHOO_USER || process.env.EMAIL_USER;
      pass = process.env.YAHOO_APP_PASSWORD || process.env.EMAIL_PASSWORD;
      break;
    
    default: // custom
      user = process.env.CUSTOM_SMTP_USER || process.env.EMAIL_USER;
      pass = process.env.CUSTOM_SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
  }
  
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.requiresAuth ? { user, pass } : undefined,
    provider: provider,
    description: config.description
  };
};

/**
 * Get default sender email based on provider
 * @param {string} provider - Email provider
 * @returns {Object} - { email, name }
 */
const getDefaultSender = (provider) => {
  const fromName = process.env.EMAIL_FROM_NAME || 'JH Contract Builder';
  
  let fromEmail;
  switch (provider) {
    case 'gmail':
      fromEmail = process.env.GMAIL_USER || process.env.EMAIL_FROM;
      break;
    case 'microsoft365':
    case 'outlook':
      fromEmail = process.env.M365_USER || process.env.EMAIL_FROM;
      break;
    case 'yahoo':
      fromEmail = process.env.YAHOO_USER || process.env.EMAIL_FROM;
      break;
    default:
      fromEmail = process.env.EMAIL_FROM || 'noreply@jimbaranhijau.com';
  }
  
  return { email: fromEmail, name: fromName };
};

/**
 * Initialize SMTP service - log available configurations
 */
const initializeSMTPService = () => {
  logger.info('=== SMTP Configuration Service Initialized ===');
  
  // Check which providers are configured
  const configuredProviders = [];
  
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    configuredProviders.push('Gmail');
  }
  
  if (process.env.M365_USER && process.env.M365_PASSWORD) {
    configuredProviders.push('Microsoft 365');
  }
  
  if (process.env.YAHOO_USER && process.env.YAHOO_APP_PASSWORD) {
    configuredProviders.push('Yahoo');
  }
  
  if (process.env.CUSTOM_SMTP_HOST && process.env.CUSTOM_SMTP_USER) {
    configuredProviders.push('Custom SMTP');
  }
  
  if (configuredProviders.length > 0) {
    logger.info(`✓ Configured email providers: ${configuredProviders.join(', ')}`);
  } else {
    logger.warn('⚠ No email providers configured - email notifications disabled');
  }
  
  if (process.env.M365_DOMAINS) {
    logger.info(`✓ M365 Business Domains: ${process.env.M365_DOMAINS}`);
  }
};

module.exports = {
  detectEmailProvider,
  isM365Email,
  getSMTPConfig,
  getDefaultSender,
  initializeSMTPService
};
