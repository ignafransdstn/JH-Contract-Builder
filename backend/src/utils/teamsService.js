const axios = require('axios');
const logger = require('./logger');

// Teams Webhook URL from environment
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const TEAMS_ENABLED = process.env.TEAMS_NOTIFICATION_ENABLED === 'true';

// Check if Teams is configured
const isTeamsConfigured = () => {
  return !!(TEAMS_WEBHOOK_URL && TEAMS_ENABLED);
};

// Initialize Teams service
if (isTeamsConfigured()) {
  logger.info('✓ Microsoft Teams notification service initialized');
  logger.info(`✓ Teams webhook configured`);
} else {
  logger.warn('⚠ Microsoft Teams not configured - Teams notifications disabled');
}

/**
 * Send message to Microsoft Teams via Webhook
 * @param {Object} options - Message options
 * @param {string} options.title - Message title
 * @param {string} options.text - Message text (simple format)
 * @param {Object} options.card - Advanced card format (MessageCard or Adaptive Card)
 * @returns {Promise<Object>} - Result object
 */
exports.sendTeamsMessage = async (options) => {
  try {
    // Check if Teams is configured
    if (!isTeamsConfigured()) {
      logger.warn('Teams notification skipped - Not configured');
      return { success: false, reason: 'not_configured' };
    }

    // Prepare payload
    let payload;
    
    if (options.card) {
      // Use provided card (MessageCard or Adaptive Card)
      payload = options.card;
    } else {
      // Simple text message
      payload = {
        text: options.text || options.title || 'Notification from JH Contract Builder'
      };
    }

    // Send to Teams webhook
    const response = await axios.post(TEAMS_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });

    logger.info(`Teams notification sent successfully`);
    return { 
      success: true, 
      status: response.status,
      data: response.data 
    };
  } catch (error) {
    logger.error('Teams notification error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status
    };
  }
};

/**
 * Create MessageCard for approval notification
 * @param {Object} contract - Contract object
 * @param {Object} approver - Approver user object
 * @param {string} layer - Approval layer (reviewer/approval1/approval2)
 * @returns {Object} - MessageCard object
 */
const createApprovalCard = (contract, approver, layer) => {
  const layerText = {
    'reviewer': 'Review',
    'approval1': 'Approval - Layer 1',
    'approval2': 'Approval - Layer 2'
  }[layer] || layer;

  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": "CC6F57",
    "summary": `Contract Approval Required: ${contract.contractNumber}`,
    "sections": [
      {
        "activityTitle": "🔔 **Contract Approval Required**",
        "activitySubtitle": `@${approver.name}`,
        "activityImage": "https://adaptivecards.io/content/pending.png",
        "facts": [
          {
            "name": "Contract Number:",
            "value": contract.contractNumber
          },
          {
            "name": "Title:",
            "value": contract.title
          },
          {
            "name": "Submitted By:",
            "value": contract.submittedBy?.name || 'Unknown'
          },
          {
            "name": "Submitted Date:",
            "value": new Date(contract.submittedAt).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          },
          {
            "name": "Approval Layer:",
            "value": layerText
          },
          {
            "name": "Status:",
            "value": "⏳ Pending Review"
          }
        ],
        "markdown": true
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "📋 Review Contract",
        "targets": [
          {
            "os": "default",
            "uri": `${process.env.FRONTEND_URL}/contracts/${contract.id}`
          }
        ]
      },
      {
        "@type": "OpenUri",
        "name": "📊 View Dashboard",
        "targets": [
          {
            "os": "default",
            "uri": `${process.env.FRONTEND_URL}/dashboard`
          }
        ]
      }
    ]
  };
};

/**
 * Create MessageCard for status update notification
 * @param {Object} contract - Contract object
 * @param {Object} recipient - Recipient user object
 * @param {string} status - Contract status
 * @returns {Object} - MessageCard object
 */
const createStatusUpdateCard = (contract, recipient, status) => {
  const statusConfig = {
    reviewed: {
      icon: '✅',
      color: '0078D4',
      title: 'Contract Reviewed',
      message: 'Your contract has been reviewed'
    },
    approved1: {
      icon: '✅',
      color: '0078D4', 
      title: 'Contract Approved (Layer 1)',
      message: 'Your contract has been approved by Layer 1'
    },
    approved2: {
      icon: '✅',
      color: '0078D4',
      title: 'Contract Approved (Layer 2)',
      message: 'Your contract has been approved by Layer 2'
    },
    completed: {
      icon: '🎉',
      color: '107C10',
      title: 'Contract Completed',
      message: 'Your contract has been fully approved and completed!'
    },
    rejected: {
      icon: '❌',
      color: 'D13438',
      title: 'Contract Rejected',
      message: 'Your contract has been rejected'
    }
  };

  const config = statusConfig[status] || {
    icon: 'ℹ️',
    color: 'CC6F57',
    title: 'Contract Status Update',
    message: 'Your contract status has been updated'
  };

  const facts = [
    {
      "name": "Contract Number:",
      "value": contract.contractNumber
    },
    {
      "name": "Title:",
      "value": contract.title
    },
    {
      "name": "Status:",
      "value": `${config.icon} ${status.toUpperCase()}`
    }
  ];

  // Add rejection reason if rejected
  if (status === 'rejected' && contract.rejectionReason) {
    facts.push({
      "name": "Rejection Reason:",
      "value": contract.rejectionReason
    });
  }

  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": config.color,
    "summary": `${config.title}: ${contract.contractNumber}`,
    "sections": [
      {
        "activityTitle": `${config.icon} **${config.title}**`,
        "activitySubtitle": `@${recipient.name}`,
        "text": config.message,
        "facts": facts,
        "markdown": true
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "📋 View Contract",
        "targets": [
          {
            "os": "default",
            "uri": `${process.env.FRONTEND_URL}/contracts/${contract.id}`
          }
        ]
      }
    ]
  };
};

/**
 * Send approval notification to Teams
 * @param {Object} contract - Contract object
 * @param {Object} approver - Approver user object
 * @param {string} layer - Approval layer
 */
exports.sendApprovalNotification = async (contract, approver, layer) => {
  const card = createApprovalCard(contract, approver, layer);
  return await this.sendTeamsMessage({ card });
};

/**
 * Send status update notification to Teams
 * @param {Object} contract - Contract object
 * @param {Object} recipient - Recipient user object
 * @param {string} status - Contract status
 */
exports.sendStatusUpdateNotification = async (contract, recipient, status) => {
  const card = createStatusUpdateCard(contract, recipient, status);
  return await this.sendTeamsMessage({ card });
};

/**
 * Test Teams notification service
 * @returns {Promise<Object>} - Test result
 */
exports.testTeams = async () => {
  const testCard = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": "CC6F57",
    "summary": "JH Contract Builder - Test Notification",
    "sections": [
      {
        "activityTitle": "✅ **Test Notification**",
        "activitySubtitle": "JH Contract Builder System",
        "facts": [
          {
            "name": "Status:",
            "value": "Teams notification service is working!"
          },
          {
            "name": "Time:",
            "value": new Date().toLocaleString('id-ID')
          },
          {
            "name": "Environment:",
            "value": process.env.NODE_ENV || 'development'
          }
        ],
        "markdown": true
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "Open Application",
        "targets": [
          {
            "os": "default",
            "uri": process.env.FRONTEND_URL || 'http://localhost:3000'
          }
        ]
      }
    ]
  };

  return await this.sendTeamsMessage({ card: testCard });
};

module.exports = exports;
