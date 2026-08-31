const { DocumentTemplate, User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { extractText, analyzeDocumentWithAI } = require('../utils/documentScanner');
const { cleanTemplate, validateTemplate } = require('../utils/templateCleaner');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// @desc    Upload document and extract text (Step 1 - Hybrid Flow)
// @route   POST /api/documents/upload-simple
// @access  Private (Supervisor, Admin)
exports.uploadDocumentSimple = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a document file'
      });
    }

    const { templateName, description, category } = req.body;

    if (!templateName) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).substring(1).toLowerCase();

    logger.info(`Uploading document: ${req.file.originalname}`);

    // AUTOMATIC TEMPLATE CLEANING - Fix Word formatting issues automatically
    if (fileType === 'docx') {
      logger.info('[Auto-Clean] Starting automatic template cleaning...');
      try {
        const cleanResult = await cleanTemplate(filePath);
        
        if (cleanResult.success && cleanResult.cleaned) {
          logger.info(`[Auto-Clean] ✅ Template cleaned successfully: ${cleanResult.message}`);
          logger.info(`[Auto-Clean] Issues fixed: ${cleanResult.issues.length}`);
          cleanResult.issues.forEach(issue => logger.info(`[Auto-Clean]   - ${issue}`));
        } else if (cleanResult.success && !cleanResult.cleaned) {
          logger.info('[Auto-Clean] Template is already clean, no changes needed');
        } else {
          logger.warn(`[Auto-Clean] ⚠️ Cleaning failed: ${cleanResult.message}`);
        }
      } catch (cleanError) {
        // Don't fail upload if cleaning fails - just log warning
        logger.warn('[Auto-Clean] Error during automatic cleaning:', cleanError.message);
        logger.warn('[Auto-Clean] Continuing with original template...');
      }
    }

    // Extract text for reference (non-blocking)
    let extractedText = '';
    try {
      extractedText = await extractText(filePath, fileType);
    } catch (err) {
      logger.warn('Text extraction failed, continuing without text:', err.message);
    }

    // Create document template in draft status
    const documentTemplate = await DocumentTemplate.create({
      templateName,
      description,
      category,
      originalFileName: req.file.originalname,
      originalFilePath: filePath,
      fileType,
      extractedText,
      fields: [],
      approvalMatrix: {},
      status: 'draft',
      createdBy: req.user.id
    });

    logger.info(`Document template draft created: ${templateName}`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: documentTemplate.id,
        templateName: documentTemplate.templateName,
        description: documentTemplate.description,
        category: documentTemplate.category,
        extractedText: extractedText.substring(0, 5000), // Limit to 5000 chars for preview
        hasExtractedText: extractedText.length > 0
      }
    });
  } catch (error) {
    logger.error('Upload document error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        logger.error('Error deleting file:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

// @desc    Extract placeholders from uploaded Word document
// @route   GET /api/documents/:id/extract-placeholders
// @access  Private (Supervisor, Admin)
exports.extractPlaceholders = async (req, res) => {
  try {
    const documentTemplate = await DocumentTemplate.findByPk(req.params.id);

    if (!documentTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(documentTemplate.originalFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found on server'
      });
    }

    // Only support Word documents
    if (documentTemplate.fileType !== 'docx') {
      return res.status(400).json({
        success: false,
        message: 'Only .docx files are supported for placeholder extraction'
      });
    }

    logger.info(`Extracting placeholders from: ${documentTemplate.originalFilePath}`);

    // Read the Word document as ZIP
    const content = fs.readFileSync(documentTemplate.originalFilePath, 'binary');
    const zip = new PizZip(content);
    
    // Extract document.xml content directly
    let documentXml = '';
    try {
      documentXml = zip.file('word/document.xml').asText();
    } catch (err) {
      logger.error('Error reading document.xml:', err);
      return res.status(400).json({
        success: false,
        message: 'Invalid Word document format'
      });
    }

    logger.info('Extracting text from XML...');

    // Step 1: Extract all text content from <w:t> tags (Word text elements)
    // This preserves the text even when split by formatting tags
    const textElements = [];
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = textRegex.exec(documentXml)) !== null) {
      textElements.push(match[1]);
    }

    // Join all text elements with no separator to reconstruct original text
    let fullText = textElements.join('');
    
    // Also try alternative: remove XML tags completely
    const cleanText = documentXml
      .replace(/<[^>]+>/g, '')  // Remove all XML tags
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();

    // Use the longer text (more complete)
    const textToSearch = fullText.length > cleanText.length ? fullText : cleanText;

    logger.info('Text extracted, length:', textToSearch.length);
    logger.info('Searching for placeholders...');

    // Extract all placeholders using multiple patterns
    const placeholderSet = new Set();
    
    // Pattern 1: Standard {{placeholder}}
    const regex1 = /\{\{([^}]+)\}\}/g;
    while ((match = regex1.exec(textToSearch)) !== null) {
      const cleanTag = match[1].trim();
      if (cleanTag && cleanTag.length > 0) {
        placeholderSet.add(cleanTag);
      }
    }

    // Pattern 2: Handle potential spacing issues {{  placeholder  }}
    const regex2 = /\{\{\s*([^}\s]+)\s*\}\}/g;
    while ((match = regex2.exec(textToSearch)) !== null) {
      const cleanTag = match[1].trim();
      if (cleanTag && cleanTag.length > 0) {
        placeholderSet.add(cleanTag);
      }
    }

    // Pattern 3: Search in original XML for any {{...}} pattern
    const regex3 = /\{\{([^}]+)\}\}/g;
    while ((match = regex3.exec(documentXml)) !== null) {
      const cleanTag = match[1]
        .replace(/<[^>]+>/g, '') // Remove XML tags within placeholder
        .replace(/\s+/g, '_')    // Convert spaces to underscores
        .trim();
      if (cleanTag && cleanTag.length > 0 && /^[a-zA-Z0-9_]+$/.test(cleanTag)) {
        placeholderSet.add(cleanTag);
      }
    }

    const placeholders = Array.from(placeholderSet).sort();

    logger.info(`Found ${placeholders.length} unique placeholders:`, placeholders);

    // Auto-generate field definitions from placeholders
    const autoFields = placeholders.map((placeholder, index) => {
      // Convert placeholder to readable label
      // Example: "contract_number" → "Contract Number"
      const label = placeholder
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Try to detect field type from placeholder name
      let fieldType = 'text';
      const lowerPlaceholder = placeholder.toLowerCase();
      
      if (lowerPlaceholder.includes('date') || lowerPlaceholder.includes('tanggal')) {
        fieldType = 'date';
      } else if (lowerPlaceholder.includes('email')) {
        fieldType = 'email';
      } else if (lowerPlaceholder.includes('phone') || lowerPlaceholder.includes('telp') || lowerPlaceholder.includes('hp')) {
        fieldType = 'phone';
      } else if (lowerPlaceholder.includes('amount') || lowerPlaceholder.includes('price') || lowerPlaceholder.includes('harga') || lowerPlaceholder.includes('nilai')) {
        fieldType = 'currency';
      } else if (lowerPlaceholder.includes('number') || lowerPlaceholder.includes('nomor') || lowerPlaceholder.includes('qty') || lowerPlaceholder.includes('jumlah')) {
        fieldType = 'number';
      }

      return {
        label: label,
        type: fieldType,
        required: true,
        placeholder: placeholder, // Store original placeholder name
        order: index + 1,
        validation: {}
      };
    });

    res.json({
      success: true,
      data: {
        placeholders,
        autoFields,
        count: placeholders.length
      }
    });

  } catch (error) {
    logger.error('Extract placeholders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error extracting placeholders from document',
      error: error.message
    });
  }
};

// @desc    Save template fields and approval matrix (Step 2 & 3 - Hybrid Flow)
// @route   PUT /api/documents/:id/complete
// @access  Private (Supervisor, Admin)
exports.completeTemplate = async (req, res) => {
  try {
    const { fields, approvalMatrix, status, targetedUsers } = req.body;

    const documentTemplate = await DocumentTemplate.findByPk(req.params.id);

    if (!documentTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    // Validate fields
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required'
      });
    }

    // Validate approval matrix
    if (!approvalMatrix || !approvalMatrix.reviewerId) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer is required in approval matrix'
      });
    }

    if (!approvalMatrix.approver1Id) {
      return res.status(400).json({
        success: false,
        message: 'Approver Layer 1 is required in approval matrix'
      });
    }

    // Verify users exist and have correct roles
    const reviewer = await User.findByPk(approvalMatrix.reviewerId);
    if (!reviewer || !['supervisor', 'staff', 'admin'].includes(reviewer.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reviewer - must be supervisor, staff, or admin'
      });
    }

    const approver1 = await User.findByPk(approvalMatrix.approver1Id);
    if (!approver1 || !['manager', 'c-level', 'admin'].includes(approver1.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approver layer 1 - must be manager, c-level, or admin'
      });
    }

    if (approvalMatrix.approver2Id) {
      const approver2 = await User.findByPk(approvalMatrix.approver2Id);
      if (!approver2 || !['c-level', 'admin'].includes(approver2.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid approver layer 2 - must be c-level or admin'
        });
      }
    }

    // Update template
    documentTemplate.fields = fields;
    documentTemplate.approvalMatrix = approvalMatrix;
    documentTemplate.status = status || 'published';
    
    // Handle targeted users
    if (targetedUsers !== undefined) {
      documentTemplate.targetedUsers = targetedUsers;
      const targetInfo = targetedUsers && targetedUsers.length > 0
        ? `TARGETED to ${targetedUsers.length} users: ${targetedUsers.join(', ')}`
        : 'PUBLIC (all users)';
      logger.info(`Template "${documentTemplate.templateName}" - ${targetInfo}`);
    }
    
    documentTemplate.updatedBy = req.user.id;
    await documentTemplate.save();

    logger.info(`Template completed: ${documentTemplate.templateName}, Status: ${documentTemplate.status}`);

    res.status(200).json({
      success: true,
      message: 'Template completed successfully',
      data: documentTemplate
    });
  } catch (error) {
    logger.error('Complete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing template',
      error: error.message
    });
  }
};

// @desc    Create document template by uploading and scanning file
// @route   POST /api/documents/upload
// @access  Private (Supervisor, Admin)
exports.uploadAndScanDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a document file'
      });
    }

    const { templateName, description, category } = req.body;

    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).substring(1);

    logger.info(`Scanning document: ${req.file.originalname}`);

    // Extract text from document
    const text = await extractText(filePath, fileType);

    // Analyze document and generate fields using AI
    const fields = await analyzeDocumentWithAI(text);

    // Create document template
    const documentTemplate = await DocumentTemplate.create({
      templateName,
      description,
      category,
      originalFileName: req.file.originalname,
      originalFilePath: filePath,
      fileType,
      fields,
      createdBy: req.user.id
    });

    logger.info(`Document template created: ${templateName}`);

    res.status(201).json({
      success: true,
      message: 'Document scanned and template created successfully',
      data: documentTemplate
    });
  } catch (error) {
    logger.error('Upload and scan document error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        logger.error('Error deleting file:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error scanning document',
      error: error.message
    });
  }
};

// @desc    Update document template fields
// @route   PUT /api/documents/:id/fields
// @access  Private (Supervisor, Staff, Admin)
exports.updateTemplateFields = async (req, res) => {
  try {
    const { fields } = req.body;

    const documentTemplate = await DocumentTemplate.findByPk(req.params.id);

    if (!documentTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    documentTemplate.fields = fields;
    documentTemplate.updatedBy = req.user.id;
    await documentTemplate.save();

    logger.info(`Template fields updated: ${documentTemplate.templateName}`);

    res.status(200).json({
      success: true,
      message: 'Template fields updated successfully',
      data: documentTemplate
    });
  } catch (error) {
    logger.error('Update template fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating template fields',
      error: error.message
    });
  }
};

// @desc    Set approval matrix for document template
// @route   PUT /api/documents/:id/approval-matrix
// @access  Private (Supervisor, Admin)
exports.setApprovalMatrix = async (req, res) => {
  try {
    const { approvalMatrix } = req.body;

    const documentTemplate = await DocumentTemplate.findByPk(req.params.id);

    if (!documentTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    // Validate approval matrix
    const validLayers = ['reviewer', 'approval1', 'approval2'];
    for (const matrix of approvalMatrix) {
      if (!validLayers.includes(matrix.layer)) {
        return res.status(400).json({
          success: false,
          message: `Invalid approval layer: ${matrix.layer}`
        });
      }
    }

    documentTemplate.approvalMatrix = approvalMatrix;
    documentTemplate.updatedBy = req.user.id;
    await documentTemplate.save();

    logger.info(`Approval matrix set for template: ${documentTemplate.templateName}`);

    res.status(200).json({
      success: true,
      message: 'Approval matrix set successfully',
      data: documentTemplate
    });
  } catch (error) {
    logger.error('Set approval matrix error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting approval matrix',
      error: error.message
    });
  }
};

// @desc    Get all document templates
// @route   GET /api/documents
// @access  Private
exports.getAllTemplates = async (req, res) => {
  try {
    const { category, search, isActive, page = 1, limit = 10 } = req.query;

    // Build query
    const where = {};
    
    // CRITICAL: Filter based on status, creator, AND targetedUsers
    // Draft templates - only visible to creator
    // Published templates - visible based on targetedUsers:
    //   - If targetedUsers is empty/null → PUBLIC (all users can see)
    //   - If targetedUsers has IDs → only those users + ADMIN ONLY can see
    
    const baseConditions = [];
    
    // User's own drafts
    baseConditions.push({ status: 'draft', createdBy: req.user.id });
    
    // Published templates filtering
    if (req.user.role === 'admin') {
      // ONLY ADMIN can see all published templates (full visibility)
      baseConditions.push({ status: 'published' });
    } else {
      // All other roles (supervisor, manager, staff, user): filtered by targeting
      baseConditions.push({ 
        status: 'published',
        [Op.or]: [
          { targetedUsers: { [Op.is]: null } }, // Public (null)
          Sequelize.literal(`("DocumentTemplate"."targetedUsers"::text = '[]')`), // Public (empty array)
          { targetedUsers: { [Op.contains]: [req.user.id] } } // Contains user's ID
        ]
      });
    }
    
    where[Op.or] = baseConditions;
    
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { templateName: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } }
          ]
        }
      ];
    }

    // Execute query with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: templates } = await DocumentTemplate.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'updater', attributes: ['id', 'name', 'email'] }
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    // Log for debugging
    logger.info(`getAllTemplates: User ${req.user.id} (${req.user.role}) - Retrieved ${templates.length} templates`);
    templates.forEach(t => {
      const targetInfo = !t.targetedUsers || t.targetedUsers.length === 0 
        ? 'PUBLIC' 
        : `TARGETED to ${t.targetedUsers.length} users`;
      logger.info(`  - Template: ${t.templateName} (${t.status}) - ${targetInfo}`);
    });

    res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get all templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates',
      error: error.message
    });
  }
};

// @desc    Get document template by ID
// @route   GET /api/documents/:id
// @access  Private
exports.getTemplateById = async (req, res) => {
  try {
    const template = await DocumentTemplate.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'updater', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    // CRITICAL: Check access permission
    // If template is draft, only creator can access
    if (template.status === 'draft' && template.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This draft template belongs to another user.'
      });
    }
    // Published templates are accessible to everyone

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Get template by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching template',
      error: error.message
    });
  }
};

// @desc    Update document template
// @route   PUT /api/documents/:id
// @access  Private (Supervisor, Admin)
exports.updateTemplate = async (req, res) => {
  try {
    const { templateName, description, category, isActive, fields, approvalMatrix, status, targetedUsers } = req.body;

    const template = await DocumentTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    // CRITICAL: Check permission
    // Draft: only creator or admin can edit
    // Published: admin, supervisor, staff can edit
    if (template.status === 'draft' && template.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own draft templates.'
      });
    }

    if (templateName) template.templateName = templateName;
    if (description !== undefined) template.description = description;
    if (category !== undefined) template.category = category;
    if (isActive !== undefined) template.isActive = isActive;
    if (fields) template.fields = fields;
    if (approvalMatrix) template.approvalMatrix = approvalMatrix;
    if (status) template.status = status;
    if (targetedUsers !== undefined) template.targetedUsers = targetedUsers; // New field
    template.updatedBy = req.user.id;

    await template.save();

    logger.info(`Template updated: ${template.templateName}`);
    if (targetedUsers && targetedUsers.length > 0) {
      logger.info(`Template targeted to ${targetedUsers.length} specific users`);
    } else {
      logger.info('Template is public (no specific targets)');
    }

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating template',
      error: error.message
    });
  }
};

// @desc    Delete document template
// @route   DELETE /api/documents/:id
// @access  Private (Supervisor, Admin)
exports.deleteTemplate = async (req, res) => {
  try {
    const documentTemplate = await DocumentTemplate.findByPk(req.params.id);

    if (!documentTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Document template not found'
      });
    }

    // CRITICAL: Check permission
    // Draft: only creator or admin can delete
    // Published: only admin and supervisor can delete
    if (documentTemplate.status === 'draft') {
      if (documentTemplate.createdBy !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own draft templates.'
        });
      }
    } else if (documentTemplate.status === 'published') {
      if (!['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admin and supervisor can delete published templates.'
        });
      }
    }

    // Delete file
    if (documentTemplate.originalFilePath && fs.existsSync(documentTemplate.originalFilePath)) {
      fs.unlinkSync(documentTemplate.originalFilePath);
    }

    await documentTemplate.destroy();

    logger.info(`Template deleted: ${documentTemplate.templateName}`);

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting template',
      error: error.message
    });
  }
};
