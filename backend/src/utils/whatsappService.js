const twilio = require('twilio');
const logger = require('./logger');

// Initialize Twilio client (will be null if credentials not set)
let twilioClient = null;

// Check if Twilio credentials are configured
const isTwilioConfigured = () => {
  return !!(process.env.TWILIO_ACCOUNT_SID && 
            process.env.TWILIO_AUTH_TOKEN && 
            process.env.TWILIO_WHATSAPP_NUMBER);
};

// Initialize Twilio client if configured
if (isTwilioConfigured()) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    logger.info('✓ Twilio WhatsApp service initialized');
  } catch (error) {
    logger.error('✗ Failed to initialize Twilio:', error);
  }
} else {
  logger.warn('⚠ Twilio WhatsApp not configured - WhatsApp notifications disabled');
}

/**
 * Format phone number to WhatsApp format
 * @param {string} phone - Phone number (e.g., "081234567890" or "+6281234567890")
 * @returns {string} - Formatted phone (e.g., "+6281234567890")
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0, replace with +62 (Indonesia)
  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.substring(1);
  }
  
  // If doesn't start with +, add +62
  if (!cleaned.startsWith('+')) {
    cleaned = '+62' + cleaned;
  }
  
  return cleaned;
};

/**
 * Check if user has valid WhatsApp number
 * @param {Object} user - User object with phone property
 * @returns {boolean}
 */
const hasWhatsAppNumber = (user) => {
  return !!(user && user.phone && user.phone.trim());
};

/**
 * Send WhatsApp message via Twilio
 * @param {Object} options - Message options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - Message text
 * @returns {Promise<Object>} - Twilio response
 */
exports.sendWhatsApp = async (options) => {
  try {
    // Check if Twilio is configured
    if (!twilioClient) {
      logger.warn('WhatsApp notification skipped - Twilio not configured');
      return { success: false, reason: 'not_configured' };
    }

    // Check if recipient has phone number
    if (!options.to) {
      logger.warn('WhatsApp notification skipped - No phone number provided');
      return { success: false, reason: 'no_phone' };
    }

    // Format phone number
    const toNumber = formatPhoneNumber(options.to);
    if (!toNumber) {
      logger.warn('WhatsApp notification skipped - Invalid phone number');
      return { success: false, reason: 'invalid_phone' };
    }

    // Send message via Twilio
    const message = await twilioClient.messages.create({
      body: options.message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${toNumber}`
    });

    logger.info(`WhatsApp sent: ${message.sid} to ${toNumber}`);
    return { 
      success: true, 
      messageId: message.sid,
      to: toNumber 
    };
  } catch (error) {
    logger.error('WhatsApp send error:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

/**
 * Send approval notification to approver via WhatsApp
 * @param {Object} contract - Contract object
 * @param {Object} approver - User object (reviewer/approver)
 * @param {string} layer - 'reviewer', 'approval1', or 'approval2'
 */
exports.sendApprovalNotificationWA = async (contract, approver, layer) => {
  // Check if approver has WhatsApp number
  if (!hasWhatsAppNumber(approver)) {
    logger.info(`WhatsApp skipped for ${approver.email} - No phone number`);
    return { success: false, reason: 'no_phone' };
  }

  const layerText = {
    'reviewer': 'Review',
    'approval1': 'Approval Layer 1',
    'approval2': 'Approval Layer 2'
  }[layer] || layer;

  const message = `
🔔 *JH Contract Builder - Approval Required*

Halo *${approver.name}*,

Kontrak baru membutuhkan ${layerText} Anda:

📄 *${contract.title}*
📋 Nomor: ${contract.contractNumber}
👤 Diajukan: ${contract.submittedBy?.name || 'Unknown'}
📅 Tanggal: ${new Date(contract.submittedAt).toLocaleDateString('id-ID')}

Silakan review dan approve melalui sistem:
${process.env.FRONTEND_URL}/contracts/${contract.id}

_JH Contract Builder System_
`.trim();

  return await this.sendWhatsApp({
    to: approver.phone,
    message
  });
};

/**
 * Send status update notification via WhatsApp
 * @param {Object} contract - Contract object
 * @param {Object} recipient - User object (usually submitter)
 * @param {string} status - 'reviewed', 'approved', 'rejected', 'completed'
 */
exports.sendStatusUpdateNotificationWA = async (contract, recipient, status) => {
  // Check if recipient has WhatsApp number
  if (!hasWhatsAppNumber(recipient)) {
    logger.info(`WhatsApp skipped for ${recipient.email} - No phone number`);
    return { success: false, reason: 'no_phone' };
  }

  const statusMessages = {
    reviewed: {
      emoji: '✅',
      text: 'telah direview dan dilanjutkan ke proses approval'
    },
    approved: {
      emoji: '✅',
      text: 'telah disetujui'
    },
    completed: {
      emoji: '🎉',
      text: 'telah selesai diproses dan disetujui semua pihak'
    },
    rejected: {
      emoji: '❌',
      text: 'ditolak'
    }
  };

  const statusInfo = statusMessages[status] || { emoji: 'ℹ️', text: 'diperbarui' };

  const message = `
${statusInfo.emoji} *JH Contract Builder - Status Update*

Halo *${recipient.name}*,

Kontrak Anda ${statusInfo.text}:

📄 *${contract.title}*
📋 Nomor: ${contract.contractNumber}
${status === 'rejected' && contract.rejectionReason ? `\n💬 Alasan: ${contract.rejectionReason}` : ''}

Lihat detail lengkap:
${process.env.FRONTEND_URL}/contracts/${contract.id}

_JH Contract Builder System_
`.trim();

  return await this.sendWhatsApp({
    to: recipient.phone,
    message
  });
};

/**
 * Test WhatsApp connection
 * @param {string} testNumber - Phone number to send test message
 */
exports.testWhatsApp = async (testNumber) => {
  const message = `
🧪 *Test Message from JH Contract Builder*

WhatsApp notification is working! ✅

This is a test message to verify your WhatsApp integration.

_JH Contract Builder System_
`.trim();

  return await this.sendWhatsApp({
    to: testNumber,
    message
  });
};

module.exports = exports;
