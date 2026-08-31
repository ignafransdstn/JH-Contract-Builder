const nodemailer = require('nodemailer');
const logger = require('./logger');
const teamsService = require('./teamsService');
const teamsPersonalService = require('./teamsPersonalService');
const smtpConfigService = require('./smtpConfigService');

// Initialize SMTP service
smtpConfigService.initializeSMTPService();

/**
 * Create dynamic SMTP transporter based on recipient email
 * @param {string} recipientEmail - Recipient email address
 * @returns {Object} - Nodemailer transporter
 */
const createTransporter = (recipientEmail) => {
  const smtpConfig = smtpConfigService.getSMTPConfig(recipientEmail || 'custom');
  
  logger.info(`Using SMTP: ${smtpConfig.description} for ${recipientEmail || 'default'}`);
  
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: smtpConfig.auth
  });
};

/**
 * Send email with dynamic SMTP configuration
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.fromName - Sender name (optional)
 * @returns {Promise<Object>} - Send result
 */
exports.sendEmail = async (options) => {
  try {
    // Create transporter based on recipient email
    const transporter = createTransporter(options.to);
    
    // Get appropriate sender based on provider
    const provider = smtpConfigService.detectEmailProvider(options.to);
    const sender = smtpConfigService.getDefaultSender(provider);
    
    const mailOptions = {
      from: `${options.fromName || sender.name} <${sender.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✓ Email sent to ${options.to} via ${provider} SMTP: ${info.messageId}`);
    return { success: true, messageId: info.messageId, provider };
  } catch (error) {
    logger.error(`✗ Email send error to ${options.to}:`, error.message);
    throw error;
  }
};

/**
 * Send approval notification to approver
 * Uses multiple channels:
 * 1. Teams Channel (webhook) - for team visibility
 * 2. Teams Personal (Graph API) - for M365 users only, personal notification
 * 3. Email (SMTP) - universal fallback
 * 
 * @param {Object} contract - Contract object
 * @param {Object} approver - Approver user object
 * @param {string} layer - Approval layer (reviewer/approval1/approval2)
 * @returns {Promise<Object>} - Notification result
 */
exports.sendApprovalNotification = async (contract, approver, layer) => {
  const subject = `Approval Required: ${contract.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #CC6F57; color: white; padding: 20px; text-align: center;">
        <h1>JH Contract Builder</h1>
      </div>
      <div style="padding: 20px; background-color: #f5f5f5;">
        <h2>Contract Approval Required</h2>
        <p>Dear ${approver?.name || 'Approver'},</p>
        <p>A new contract requires your approval:</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px; font-weight: bold;">Contract Number:</td>
              <td style="padding: 8px;">${contract.contractNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Title:</td>
              <td style="padding: 8px;">${contract.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Submitted By:</td>
              <td style="padding: 8px;">${contract.submittedBy?.name || 'Unknown'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Submitted Date:</td>
              <td style="padding: 8px;">${new Date(contract.submittedAt).toLocaleDateString('id-ID')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Approval Layer:</td>
              <td style="padding: 8px;">${layer === 'approval1' ? 'Layer 1' : layer === 'approval2' ? 'Layer 2' : 'Review'}</td>
            </tr>
          </table>
        </div>
        
        <p>Please review and take action on this contract.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contracts/${contract.id}" 
             style="background-color: #CC6F57; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Contract
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from JH Contract Builder System. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const isM365User = smtpConfigService.isM365Email(approver.email);

  // Send all channels in parallel
  const [teamsOutcome, personalOutcome, emailOutcome] = await Promise.allSettled([
    teamsService.sendApprovalNotification(contract, approver, layer),
    isM365User
      ? teamsPersonalService.sendPersonalApprovalNotification(contract, approver, layer)
      : Promise.resolve({ success: false, reason: 'not M365 user' }),
    exports.sendEmail({ to: approver.email, subject, html })
  ]);

  const results = {
    teamsChannel: teamsOutcome.status === 'fulfilled' && teamsOutcome.value?.success,
    teamsPersonal: personalOutcome.status === 'fulfilled' && personalOutcome.value?.success,
    email: emailOutcome.status === 'fulfilled' && emailOutcome.value?.success
  };

  if (teamsOutcome.status === 'rejected') logger.warn('Teams channel notification failed (non-critical):', teamsOutcome.reason?.message);
  if (personalOutcome.status === 'rejected') logger.warn('Teams personal notification failed (non-critical):', personalOutcome.reason?.message);
  if (emailOutcome.status === 'rejected') logger.warn('Email notification failed (non-critical):', emailOutcome.reason?.message);

  if (!isM365User) logger.info(`ℹ Skipping Teams personal message for ${approver.email} (not M365 user)`);
  if (results.teamsChannel) logger.info(`✓ Teams channel notification sent for contract ${contract.contractNumber}`);
  if (results.teamsPersonal) logger.info(`✓ Teams personal message sent to ${approver.email}`);
  if (results.email) logger.info(`✓ Email notification sent to ${approver.email}`);

  const successCount = Object.values(results).filter(r => r).length;
  logger.info(`Notification summary for ${approver.email}: ${successCount}/3 channels succeeded`, results);

  return { 
    success: successCount > 0, 
    channels: results,
    message: `Notification sent via ${successCount} channel(s)` 
  };
};

/**
 * Send status update notification to recipient
 * Uses multiple channels based on recipient email
 * 
 * @param {Object} contract - Contract object
 * @param {Object} recipient - Recipient user object
 * @param {string} status - Contract status
 * @returns {Promise<Object>} - Notification result
 */
exports.sendStatusUpdateNotification = async (contract, recipient, status) => {
  const statusMessages = {
    reviewed: 'has been reviewed',
    approved1: 'has been approved (Layer 1)',
    approved2: 'has been approved (Layer 2)',
    completed: 'has been completed',
    rejected: 'has been rejected'
  };

  const subject = `Contract Update: ${contract.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #CC6F57; color: white; padding: 20px; text-align: center;">
        <h1>JH Contract Builder</h1>
      </div>
      <div style="padding: 20px; background-color: #f5f5f5;">
        <h2>Contract Status Update</h2>
        <p>Dear ${recipient?.name || 'User'},</p>
        <p>Your contract ${statusMessages[status]}:</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px; font-weight: bold;">Contract Number:</td>
              <td style="padding: 8px;">${contract.contractNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Title:</td>
              <td style="padding: 8px;">${contract.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Status:</td>
              <td style="padding: 8px; text-transform: uppercase; color: #CC6F57;">${status}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contracts/${contract.id}" 
             style="background-color: #CC6F57; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Contract
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from JH Contract Builder System. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const isM365UserStatus = smtpConfigService.isM365Email(recipient.email);

  // Send all channels in parallel
  const [teamsOutcomeS, personalOutcomeS, emailOutcomeS] = await Promise.allSettled([
    teamsService.sendStatusUpdateNotification(contract, recipient, status),
    isM365UserStatus
      ? teamsPersonalService.sendPersonalStatusUpdate(contract, recipient, status)
      : Promise.resolve({ success: false, reason: 'not M365 user' }),
    exports.sendEmail({ to: recipient.email, subject, html })
  ]);

  const results = {
    teamsChannel: teamsOutcomeS.status === 'fulfilled' && teamsOutcomeS.value?.success,
    teamsPersonal: personalOutcomeS.status === 'fulfilled' && personalOutcomeS.value?.success,
    email: emailOutcomeS.status === 'fulfilled' && emailOutcomeS.value?.success
  };

  if (teamsOutcomeS.status === 'rejected') logger.warn('Teams channel notification failed (non-critical):', teamsOutcomeS.reason?.message);
  if (personalOutcomeS.status === 'rejected') logger.warn('Teams personal notification failed (non-critical):', personalOutcomeS.reason?.message);
  if (emailOutcomeS.status === 'rejected') logger.warn('Email notification failed (non-critical):', emailOutcomeS.reason?.message);

  if (results.teamsChannel) logger.info(`✓ Teams channel status update sent for contract ${contract.contractNumber}`);
  if (results.teamsPersonal) logger.info(`✓ Teams personal status update sent to ${recipient.email}`);
  if (results.email) logger.info(`✓ Email status update sent to ${recipient.email}`);

  const successCount = Object.values(results).filter(r => r).length;
  logger.info(`Status update notification summary for ${recipient.email}: ${successCount}/3 channels succeeded`, results);

  return { 
    success: successCount > 0, 
    channels: results,
    message: `Status update sent via ${successCount} channel(s)` 
  };
};
