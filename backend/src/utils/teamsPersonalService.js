const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
require('isomorphic-fetch');
const logger = require('./logger');

/**
 * Microsoft 365 Teams Personal Messaging Service
 * Sends direct personal messages to Teams users via Microsoft Graph API
 * 
 * Requirements:
 * - Azure AD App Registration with:
 *   - Chat.ReadWrite (Application permission)
 *   - User.Read.All (Application permission)
 *   - Admin consent granted
 */

// Check if M365 Graph API is configured
const isGraphConfigured = () => {
  return !!(
    process.env.M365_TENANT_ID &&
    process.env.M365_CLIENT_ID &&
    process.env.M365_CLIENT_SECRET &&
    process.env.M365_GRAPH_ENABLED === 'true'
  );
};

// Initialize Graph Client
let graphClient = null;

const getGraphClient = () => {
  if (!isGraphConfigured()) {
    return null;
  }

  if (!graphClient) {
    try {
      const credential = new ClientSecretCredential(
        process.env.M365_TENANT_ID,
        process.env.M365_CLIENT_ID,
        process.env.M365_CLIENT_SECRET
      );

      graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const token = await credential.getToken('https://graph.microsoft.com/.default');
            return token.token;
          }
        }
      });

      logger.info('✓ Microsoft Graph client initialized for Teams personal messaging');
    } catch (error) {
      logger.error('Failed to initialize Graph client:', error.message);
      return null;
    }
  }

  return graphClient;
};

/**
 * Get user ID from email address using Microsoft Graph
 * @param {string} email - User email address
 * @returns {Promise<string|null>} - User ID or null if not found
 */
const getUserIdByEmail = async (email) => {
  const client = getGraphClient();
  if (!client) {
    return null;
  }

  try {
    const user = await client
      .api('/users')
      .filter(`mail eq '${email}' or userPrincipalName eq '${email}'`)
      .select('id,mail,userPrincipalName,displayName')
      .get();

    if (user.value && user.value.length > 0) {
      logger.info(`Found M365 user: ${user.value[0].displayName} (${email})`);
      return user.value[0].id;
    }

    logger.warn(`M365 user not found for email: ${email}`);
    return null;
  } catch (error) {
    logger.error(`Error getting user ID for ${email}:`, error.message);
    return null;
  }
};

/**
 * Send personal chat message to Teams user
 * @param {string} userId - Microsoft Graph user ID
 * @param {string} message - Message text
 * @returns {Promise<Object>} - Result object
 */
const sendChatMessage = async (userId, message) => {
  const client = getGraphClient();
  if (!client) {
    return { success: false, reason: 'graph_not_configured' };
  }

  try {
    // Create chat or get existing chat with user
    const chat = {
      chatType: 'oneOnOne',
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`
        }
      ]
    };

    // Try to create chat (will return existing if already exists)
    let chatId;
    try {
      const chatResponse = await client.api('/chats').post(chat);
      chatId = chatResponse.id;
    } catch (error) {
      // If chat already exists, search for it
      const chats = await client.api('/chats').filter(`chatType eq 'oneOnOne'`).get();
      
      // Find chat with this user
      const existingChat = chats.value.find(c => 
        c.members?.some(m => m.userId === userId)
      );
      
      if (existingChat) {
        chatId = existingChat.id;
      } else {
        throw new Error('Could not create or find chat');
      }
    }

    // Send message to chat
    const chatMessage = {
      body: {
        contentType: 'html',
        content: message
      }
    };

    const result = await client.api(`/chats/${chatId}/messages`).post(chatMessage);

    logger.info(`Personal Teams message sent to user: ${userId}`);
    return { success: true, messageId: result.id, chatId };
  } catch (error) {
    logger.error('Error sending Teams personal message:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send approval notification to Teams user personally
 * @param {Object} contract - Contract object
 * @param {Object} approver - Approver user object with email
 * @param {string} layer - Approval layer
 * @returns {Promise<Object>} - Result object
 */
const sendPersonalApprovalNotification = async (contract, approver, layer) => {
  if (!isGraphConfigured()) {
    logger.warn('Teams personal messaging not configured');
    return { success: false, reason: 'not_configured' };
  }

  try {
    // Get user ID from email
    const userId = await getUserIdByEmail(approver.email);
    if (!userId) {
      return { success: false, reason: 'user_not_found' };
    }

    const layerText = {
      'reviewer': 'Review',
      'approval1': 'Approval - Layer 1',
      'approval2': 'Approval - Layer 2'
    }[layer] || layer;

    // Create HTML message
    const message = `
      <h2>🔔 Contract Approval Required</h2>
      <p>Hello <strong>${approver.name}</strong>,</p>
      <p>A new contract requires your attention:</p>
      
      <table style="border-collapse: collapse; margin: 15px 0;">
        <tr><td style="padding: 5px; font-weight: bold;">Contract Number:</td><td style="padding: 5px;">${contract.contractNumber}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Title:</td><td style="padding: 5px;">${contract.title}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Submitted By:</td><td style="padding: 5px;">${contract.submittedBy?.name || 'Unknown'}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Submitted Date:</td><td style="padding: 5px;">${new Date(contract.submittedAt).toLocaleDateString('id-ID')}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Approval Layer:</td><td style="padding: 5px;">${layerText}</td></tr>
      </table>
      
      <p>
        <a href="${process.env.FRONTEND_URL}/contracts/${contract.id}" style="background-color: #CC6F57; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          📋 Review Contract Now
        </a>
      </p>
      
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        <em>This is an automated notification from JH Contract Builder</em>
      </p>
    `;

    return await sendChatMessage(userId, message);
  } catch (error) {
    logger.error('Error sending personal approval notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send status update notification to Teams user personally
 * @param {Object} contract - Contract object
 * @param {Object} recipient - Recipient user object with email
 * @param {string} status - Contract status
 * @returns {Promise<Object>} - Result object
 */
const sendPersonalStatusUpdate = async (contract, recipient, status) => {
  if (!isGraphConfigured()) {
    logger.warn('Teams personal messaging not configured');
    return { success: false, reason: 'not_configured' };
  }

  try {
    // Get user ID from email
    const userId = await getUserIdByEmail(recipient.email);
    if (!userId) {
      return { success: false, reason: 'user_not_found' };
    }

    const statusConfig = {
      reviewed: { icon: '✅', color: '#0078D4', title: 'Contract Reviewed' },
      approved1: { icon: '✅', color: '#0078D4', title: 'Contract Approved (Layer 1)' },
      approved2: { icon: '✅', color: '#0078D4', title: 'Contract Approved (Layer 2)' },
      completed: { icon: '🎉', color: '#107C10', title: 'Contract Completed!' },
      rejected: { icon: '❌', color: '#D13438', title: 'Contract Rejected' }
    };

    const config = statusConfig[status] || { icon: 'ℹ️', color: '#CC6F57', title: 'Contract Status Update' };

    // Create HTML message
    let message = `
      <h2>${config.icon} ${config.title}</h2>
      <p>Hello <strong>${recipient.name}</strong>,</p>
      <p>Your contract status has been updated:</p>
      
      <table style="border-collapse: collapse; margin: 15px 0;">
        <tr><td style="padding: 5px; font-weight: bold;">Contract Number:</td><td style="padding: 5px;">${contract.contractNumber}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Title:</td><td style="padding: 5px;">${contract.title}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Status:</td><td style="padding: 5px; color: ${config.color};">${config.icon} ${status.toUpperCase()}</td></tr>
    `;

    // Add rejection reason if rejected
    if (status === 'rejected' && contract.rejectionReason) {
      message += `<tr><td style="padding: 5px; font-weight: bold;">Rejection Reason:</td><td style="padding: 5px;">${contract.rejectionReason}</td></tr>`;
    }

    message += `
      </table>
      
      <p>
        <a href="${process.env.FRONTEND_URL}/contracts/${contract.id}" style="background-color: ${config.color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          📋 View Contract
        </a>
      </p>
      
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        <em>This is an automated notification from JH Contract Builder</em>
      </p>
    `;

    return await sendChatMessage(userId, message);
  } catch (error) {
    logger.error('Error sending personal status update:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test Teams personal messaging
 * @param {string} testEmail - Email to send test message
 * @returns {Promise<Object>} - Test result
 */
const testTeamsPersonal = async (testEmail) => {
  if (!isGraphConfigured()) {
    return { 
      success: false, 
      reason: 'not_configured',
      message: 'M365 Graph API not configured. Please set M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET, and M365_GRAPH_ENABLED=true'
    };
  }

  try {
    const userId = await getUserIdByEmail(testEmail);
    if (!userId) {
      return { 
        success: false, 
        reason: 'user_not_found',
        message: `User not found in Microsoft 365 directory: ${testEmail}`
      };
    }

    const testMessage = `
      <h2>✅ Test Notification</h2>
      <p>This is a test message from <strong>JH Contract Builder</strong></p>
      <p>Teams personal messaging is working correctly!</p>
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        <em>Time: ${new Date().toLocaleString('id-ID')}</em>
      </p>
    `;

    return await sendChatMessage(userId, testMessage);
  } catch (error) {
    logger.error('Error testing Teams personal messaging:', error.message);
    return { success: false, error: error.message };
  }
};

// Initialize on load
if (isGraphConfigured()) {
  logger.info('✓ Microsoft Teams Personal Messaging configured');
  getGraphClient(); // Initialize client
} else {
  logger.warn('⚠ Microsoft Teams Personal Messaging not configured');
}

module.exports = {
  isGraphConfigured,
  sendPersonalApprovalNotification,
  sendPersonalStatusUpdate,
  testTeamsPersonal,
  getUserIdByEmail
};
