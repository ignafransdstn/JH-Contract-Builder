const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mammoth = require('mammoth');
const htmlPdf = require('html-pdf-node');
const { DocumentTemplate, Contract } = require('../models');

/**
 * Fix broken placeholders in Word document XML
 * Word formatting often breaks {{placeholder}} into multiple <w:t> tags
 * This function uses a more aggressive approach to merge all text in a paragraph
 */
function fixBrokenPlaceholders(xmlContent) {
  try {
    console.log('[PLACEHOLDER FIX] ========== FUNCTION CALLED ==========');
    console.log('[PLACEHOLDER FIX] Starting aggressive placeholder fixing...');
    console.log('[PLACEHOLDER FIX] Original XML length:', xmlContent.length);
    
    // Save original XML to temp file for debugging
    const tempDir = os.tmpdir();
    const tempOriginal = path.join(tempDir, 'document_original.xml');
    fs.writeFileSync(tempOriginal, xmlContent);
    console.log('[PLACEHOLDER FIX] Original XML saved to:', tempOriginal);
    
    let fixedXml = xmlContent;
    let fixCount = 0;
    let placeholderParagraphs = [];
    
    // Strategy: For EVERY paragraph, merge ALL text into a single <w:r><w:t> tag
    // This removes ALL formatting but ensures placeholders work
    
    const paragraphRegex = /<w:p\b[^>]*?>([\s\S]*?)<\/w:p>/g;
    const matches = xmlContent.match(paragraphRegex);
    console.log('[PLACEHOLDER FIX] Found', matches ? matches.length : 0, 'paragraphs in document');
    
    fixedXml = fixedXml.replace(paragraphRegex, (fullParagraph, paragraphContent) => {
      // Check if paragraph has any paragraph properties (spacing, alignment, etc)
      const pPrMatch = paragraphContent.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
      const pPr = pPrMatch ? pPrMatch[0] : '';
      
      // Extract ALL text from ALL w:t tags in this paragraph
      const textRegex = /<w:t[^>]*?>([^<]*?)<\/w:t>/g;
      let textMatch;
      let allText = '';
      
      while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
        allText += textMatch[1];
      }
      
      // If paragraph has no text, return as is
      if (!allText || allText.trim().length === 0) {
        return fullParagraph;
      }
      
      // Check if text might contain placeholders (has {{ or }})
      if (allText.includes('{{') || allText.includes('}}') || allText.includes('{') || allText.includes('}')) {
        fixCount++;
        placeholderParagraphs.push(allText.substring(0, 100)); // Log first 100 chars
        
        console.log(`[PLACEHOLDER FIX] Fixing paragraph ${fixCount}: "${allText.substring(0, 50)}..."`);
        
        // Rebuild paragraph with minimal structure
        const newParagraph = `<w:p>${pPr}<w:r><w:t xml:space="preserve">${allText}</w:t></w:r></w:p>`;
        return newParagraph;
      }
      
      // For non-placeholder paragraphs, also simplify if they're short text
      if (allText.length < 500) {
        const newParagraph = `<w:p>${pPr}<w:r><w:t xml:space="preserve">${allText}</w:t></w:r></w:p>`;
        return newParagraph;
      }
      
      return fullParagraph;
    });
    
    console.log(`[PLACEHOLDER FIX] Fixed ${fixCount} paragraphs with placeholders`);
    console.log(`[PLACEHOLDER FIX] Fixed XML length:`, fixedXml.length);
    
    // Log first 3 placeholder paragraphs for debugging
    if (placeholderParagraphs.length > 0) {
      console.log('[PLACEHOLDER FIX] Sample placeholders found:');
      placeholderParagraphs.slice(0, 3).forEach((text, idx) => {
        console.log(`  ${idx + 1}. ${text}`);
      });
    } else {
      console.log('[PLACEHOLDER FIX] WARNING: No placeholders detected!');
    }
    
    // Additional cleanup
    fixedXml = fixedXml.replace(/<w:p><\/w:p>/g, '<w:p><w:r><w:t></w:t></w:r></w:p>');
    
    // Save fixed XML to temp file for debugging
    const tempFixed = path.join(tempDir, 'document_fixed.xml');
    fs.writeFileSync(tempFixed, fixedXml);
    console.log('[PLACEHOLDER FIX] Fixed XML saved to:', tempFixed);
    console.log('[PLACEHOLDER FIX] ========== FUNCTION COMPLETE ==========');
    
    return fixedXml;
    
  } catch (error) {
    console.error('[PLACEHOLDER FIX] ERROR in fix function:', error);
    console.error('[PLACEHOLDER FIX] Stack trace:', error.stack);
    return xmlContent;
  }
}

/**
 * Generate document from contract data
 * Takes a template docx file with placeholders like {{field_name}}
 * and replaces them with values from contractData
 */
exports.generateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get contract with template
    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: DocumentTemplate,
          as: 'template',
          attributes: ['id', 'templateName', 'originalFilePath', 'fileType']
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract tidak ditemukan'
      });
    }

    // Check if user has permission to view this contract
    if (contract.submittedById !== userId && 
        contract.reviewerId !== userId && 
        contract.approver1Id !== userId && 
        contract.approver2Id !== userId &&
        req.user.role !== 'admin' &&
        req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk generate dokumen ini'
      });
    }

    const template = contract.template;
    
    // Only support DOCX for now
    if (template.fileType !== 'docx') {
      return res.status(400).json({
        success: false,
        message: 'Hanya template DOCX yang didukung untuk document generation'
      });
    }

    // Check if template file exists
    const templatePath = path.join(__dirname, '../../', template.originalFilePath);
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        message: 'File template tidak ditemukan'
      });
    }

    console.log('[DOCUMENT GENERATOR] Loading template:', template.templateName);
    console.log('[DOCUMENT GENERATOR] Template path:', templatePath);
    
    // Load the template file
    const content = fs.readFileSync(templatePath, 'binary');
    console.log('[DOCUMENT GENERATOR] Template file loaded, size:', content.length, 'bytes');
    
    const zip = new PizZip(content);
    console.log('[DOCUMENT GENERATOR] ZIP loaded successfully');
    
    // Fix broken placeholders in all XML files
    console.log('[DOCUMENT GENERATOR] === STARTING PLACEHOLDER FIX ===');
    
    // Fix document.xml (main content)
    console.log('[DOCUMENT GENERATOR] Reading document.xml...');
    let documentXml = zip.file('word/document.xml').asText();
    console.log('[DOCUMENT GENERATOR] Original document.xml length:', documentXml.length);
    console.log('[DOCUMENT GENERATOR] First 500 chars:', documentXml.substring(0, 500));
    
    console.log('[DOCUMENT GENERATOR] Calling fixBrokenPlaceholders...');
    documentXml = fixBrokenPlaceholders(documentXml);
    console.log('[DOCUMENT GENERATOR] After fix, document.xml length:', documentXml.length);
    
    zip.file('word/document.xml', documentXml);
    console.log('[DOCUMENT GENERATOR] document.xml updated in ZIP');
    
    // Fix headers if they exist
    const headerFiles = ['word/header1.xml', 'word/header2.xml', 'word/header3.xml'];
    headerFiles.forEach(headerFile => {
      try {
        const headerXml = zip.file(headerFile);
        if (headerXml) {
          let fixedHeader = fixBrokenPlaceholders(headerXml.asText());
          zip.file(headerFile, fixedHeader);
          console.log(`[PLACEHOLDER FIX] Fixed ${headerFile}`);
        }
      } catch (e) {
        // Header file doesn't exist, skip
      }
    });
    
    // Fix footers if they exist
    const footerFiles = ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'];
    footerFiles.forEach(footerFile => {
      try {
        const footerXml = zip.file(footerFile);
        if (footerXml) {
          let fixedFooter = fixBrokenPlaceholders(footerXml.asText());
          zip.file(footerFile, fixedFooter);
          console.log(`[PLACEHOLDER FIX] Fixed ${footerFile}`);
        }
      } catch (e) {
        // Footer file doesn't exist, skip
      }
    });
    
    console.log('[DOCUMENT GENERATOR] All XML files fixed');
    
    // CRITICAL FIX: Re-generate ZIP binary to ensure Docxtemplater reads the updated XML
    console.log('[DOCUMENT GENERATOR] === RE-GENERATING ZIP WITH FIXED XML ===');
    const updatedZipBinary = zip.generate({ type: 'nodebuffer' });
    console.log('[DOCUMENT GENERATOR] ZIP binary re-generated, size:', updatedZipBinary.length);
    
    // Create NEW PizZip from updated binary
    const newZip = new PizZip(updatedZipBinary);
    console.log('[DOCUMENT GENERATOR] New ZIP object created from updated binary');
    
    // Debug: Verify fixed XML in NEW ZIP before creating Docxtemplater
    console.log('[DOCUMENT GENERATOR] === VERIFICATION IN NEW ZIP ===');
    const verifyXml = newZip.file('word/document.xml').asText();
    console.log('[DOCUMENT GENERATOR] Verified document.xml length:', verifyXml.length);
    
    // Extract ALL <w:t> text content
    console.log('[DOCUMENT GENERATOR] Extracting all <w:t> text nodes...');
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const textMatches = [...verifyXml.matchAll(textRegex)];
    console.log('[DOCUMENT GENERATOR] Found', textMatches.length, '<w:t> text nodes:');
    textMatches.forEach((match, idx) => {
      const textContent = match[1];
      if (textContent.includes('{') || textContent.includes('}')) {
        console.log(`  ${idx + 1}. [${textContent}] ← Contains braces!`);
      }
    });
    
    // Show first 500 chars of <w:body>
    const bodyMatch = verifyXml.match(/<w:body>([\s\S]+?)<\/w:body>/);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1];
      console.log('[DOCUMENT GENERATOR] <w:body> content (first 500 chars):');
      console.log(bodyContent.substring(0, 500));
    }
    
    // List all placeholders found
    const allPlaceholders = verifyXml.match(/\{\{[^}]+\}\}/g);
    if (allPlaceholders) {
      console.log('[DOCUMENT GENERATOR] Found', allPlaceholders.length, 'complete placeholders in NEW ZIP:');
      const uniquePlaceholders = [...new Set(allPlaceholders)];
      uniquePlaceholders.forEach((ph, idx) => {
        console.log(`  ${idx + 1}. ${ph}`);
      });
    } else {
      console.log('[DOCUMENT GENERATOR] WARNING: No complete placeholders found!');
    }
    console.log('[DOCUMENT GENERATOR] =======================================');
    
    // ============================================================================
    // APPROACH CHANGE: Skip Docxtemplater, do MANUAL placeholder replacement!
    // Docxtemplater has internal caching issues that prevent our XML fix from working
    // ============================================================================
    console.log('[DOCUMENT GENERATOR] === SKIPPING DOCXTEMPLATER - DOING MANUAL REPLACEMENT ===');
    
    // Prepare data for merge
    // Convert contractData array to object with field labels as keys
    const mergeData = {};
    
    // Add contract metadata
    mergeData.contract_number = contract.contractNumber;
    mergeData.contract_title = contract.title;
    mergeData.contract_description = contract.description || '';
    mergeData.contract_date = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Add form field data
    if (contract.contractData && Array.isArray(contract.contractData)) {
      contract.contractData.forEach(field => {
        // Use placeholder directly from field if available, otherwise convert label
        let key;
        if (field.placeholder) {
          // Remove {{ and }} from placeholder
          key = field.placeholder.replace(/^\{\{|\}\}$/g, '').trim();
        } else {
          // Fallback: Convert field label to snake_case for placeholder matching
          key = field.fieldLabel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
        }
        
        // Format value based on field type
        let value = field.value || '';
        
        if (field.fieldType === 'date' && value) {
          // Format date to Indonesian locale
          const date = new Date(value);
          value = date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else if (field.fieldType === 'currency' && value) {
          // Format currency
          value = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(value);
        } else if (field.fieldType === 'checkbox' && Array.isArray(value)) {
          // Join checkbox values
          value = value.join(', ');
        }
        
        mergeData[key] = value;
        console.log(`[MERGE DATA] ${key} = ${value}`);
      });
    }

    console.log('[DOCUMENT GENERATOR] Merge data prepared:', Object.keys(mergeData));
    console.log('[DOCUMENT GENERATOR] Total fields:', Object.keys(mergeData).length);

    // MANUAL REPLACEMENT: Replace placeholders in XML directly
    console.log('[DOCUMENT GENERATOR] === STARTING MANUAL PLACEHOLDER REPLACEMENT ===');
    
    try {
      // Get document.xml from NEW ZIP
      let documentXmlContent = newZip.file('word/document.xml').asText();
      console.log('[DOCUMENT GENERATOR] Original document.xml length:', documentXmlContent.length);
      
      // Replace each placeholder with actual data
      let replacementCount = 0;
      Object.keys(mergeData).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = mergeData[key] || '';
        
        // Count occurrences before replacement
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = documentXmlContent.match(regex);
        
        if (matches) {
          console.log(`[REPLACEMENT] Replacing ${matches.length}x ${placeholder} with "${value}"`);
          documentXmlContent = documentXmlContent.replace(regex, value);
          replacementCount += matches.length;
        }
      });
      
      console.log(`[DOCUMENT GENERATOR] Total replacements made: ${replacementCount}`);
      console.log('[DOCUMENT GENERATOR] Updated document.xml length:', documentXmlContent.length);
      
      // Update document.xml in ZIP
      newZip.file('word/document.xml', documentXmlContent);
      
      // Process headers if they exist
      const headerFiles = ['word/header1.xml', 'word/header2.xml', 'word/header3.xml'];
      headerFiles.forEach(headerFile => {
        try {
          const headerXmlObj = newZip.file(headerFile);
          if (headerXmlObj) {
            let headerContent = headerXmlObj.asText();
            let headerReplacements = 0;
            
            Object.keys(mergeData).forEach(key => {
              const placeholder = `{{${key}}}`;
              const value = mergeData[key] || '';
              const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
              const matches = headerContent.match(regex);
              
              if (matches) {
                headerContent = headerContent.replace(regex, value);
                headerReplacements += matches.length;
              }
            });
            
            if (headerReplacements > 0) {
              newZip.file(headerFile, headerContent);
              console.log(`[REPLACEMENT] Updated ${headerFile}: ${headerReplacements} replacements`);
            }
          }
        } catch (e) {
          // Header doesn't exist, skip
        }
      });
      
      // Process footers if they exist
      const footerFiles = ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'];
      footerFiles.forEach(footerFile => {
        try {
          const footerXmlObj = newZip.file(footerFile);
          if (footerXmlObj) {
            let footerContent = footerXmlObj.asText();
            let footerReplacements = 0;
            
            Object.keys(mergeData).forEach(key => {
              const placeholder = `{{${key}}}`;
              const value = mergeData[key] || '';
              const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
              const matches = footerContent.match(regex);
              
              if (matches) {
                footerContent = footerContent.replace(regex, value);
                footerReplacements += matches.length;
              }
            });
            
            if (footerReplacements > 0) {
              newZip.file(footerFile, footerContent);
              console.log(`[REPLACEMENT] Updated ${footerFile}: ${footerReplacements} replacements`);
            }
          }
        } catch (e) {
          // Footer doesn't exist, skip
        }
      });
      
      console.log('[DOCUMENT GENERATOR] ✓ All placeholders replaced successfully!');
      
    } catch (replacementError) {
      console.error('[DOCUMENT GENERATOR] ✗ Error during manual replacement:', replacementError);
      return res.status(500).json({
        success: false,
        message: 'Error saat mengganti placeholders',
        error: replacementError.message
      });
    }

    // Generate output buffer from modified ZIP
    console.log('[DOCUMENT GENERATOR] Generating final document buffer...');
    const outputBuffer = newZip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
    console.log('[DOCUMENT GENERATOR] Document buffer generated, size:', outputBuffer.length);

    // Create generated documents directory if not exists
    const generatedDocsDir = path.join(__dirname, '../../uploads/generated_documents');
    if (!fs.existsSync(generatedDocsDir)) {
      fs.mkdirSync(generatedDocsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const fileName = `Contract_${contract.contractNumber}_${timestamp}.docx`;
    const filePath = path.join(generatedDocsDir, fileName);

    // Save generated document
    fs.writeFileSync(filePath, outputBuffer);

    // Update contract with generated document info
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath);
    await contract.update({
      generatedDocument: {
        fileName: fileName,
        filePath: relativePath,
        generatedAt: new Date().toISOString(),
        generatedBy: userId
      }
    });

    res.json({
      success: true,
      message: 'Dokumen berhasil di-generate',
      data: {
        fileName: fileName,
        filePath: relativePath,
        downloadUrl: `/api/contracts/${id}/download`,
        mergedFields: Object.keys(mergeData).length
      }
    });

  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat generate dokumen',
      error: error.message
    });
  }
};

/**
 * Download generated document
 */
exports.downloadGeneratedDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get contract
    const contract = await Contract.findByPk(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract tidak ditemukan'
      });
    }

    // Check permission
    if (contract.submittedById !== userId && 
        contract.reviewerId !== userId && 
        contract.approver1Id !== userId && 
        contract.approver2Id !== userId &&
        req.user.role !== 'admin' &&
        req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk download dokumen ini'
      });
    }

    // Check if document has been generated
    if (!contract.generatedDocument || !contract.generatedDocument.filePath) {
      return res.status(404).json({
        success: false,
        message: 'Dokumen belum di-generate. Silakan generate terlebih dahulu.'
      });
    }

    // Get file path
    const filePath = path.join(__dirname, '../../', contract.generatedDocument.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File dokumen tidak ditemukan'
      });
    }

    // Set headers for download
    const fileName = contract.generatedDocument.fileName;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat download dokumen',
      error: error.message
    });
  }
};

/**
 * Get document generation preview (shows what data will be merged)
 */
exports.getGenerationPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get contract
    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: DocumentTemplate,
          as: 'template',
          attributes: ['id', 'templateName', 'fields']
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract tidak ditemukan'
      });
    }

    // Check permission
    if (contract.submittedById !== userId && 
        contract.reviewerId !== userId && 
        contract.approver1Id !== userId && 
        contract.approver2Id !== userId &&
        req.user.role !== 'admin' &&
        req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat kontrak ini'
      });
    }

    // Prepare merge preview data
    const mergeData = {};
    
    // Contract metadata
    mergeData.contract_number = contract.contractNumber;
    mergeData.contract_title = contract.title;
    mergeData.contract_description = contract.description || '';
    mergeData.contract_date = new Date().toLocaleDateString('id-ID');

    // Form fields
    if (contract.contractData && Array.isArray(contract.contractData)) {
      contract.contractData.forEach(field => {
        const key = field.fieldLabel
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        
        mergeData[key] = field.value || '';
      });
    }

    res.json({
      success: true,
      data: {
        contractNumber: contract.contractNumber,
        templateName: contract.template.templateName,
        mergeData: mergeData,
        placeholderInstructions: {
          format: '{{field_name}}',
          example: '{{nomor_dokumen}} akan diganti dengan nilai dari field "Nomor Dokumen"',
          availablePlaceholders: Object.keys(mergeData),
          note: 'Gunakan format snake_case untuk placeholder, spasi dan karakter khusus akan diubah menjadi underscore'
        }
      }
    });

  } catch (error) {
    console.error('Error getting generation preview:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

/**
 * View generated document inline (for preview in browser)
 */
exports.viewGeneratedDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get contract
    const contract = await Contract.findByPk(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract tidak ditemukan'
      });
    }

    // Check permission
    if (contract.submittedById !== userId && 
        contract.reviewerId !== userId && 
        contract.approver1Id !== userId && 
        contract.approver2Id !== userId &&
        req.user.role !== 'admin' &&
        req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat dokumen ini'
      });
    }

    // Check if document has been generated
    if (!contract.generatedDocument || !contract.generatedDocument.filePath) {
      return res.status(404).json({
        success: false,
        message: 'Dokumen belum di-generate. Silakan generate terlebih dahulu.'
      });
    }

    // Get file path
    const filePath = path.join(__dirname, '../../', contract.generatedDocument.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File dokumen tidak ditemukan'
      });
    }

    // Set headers for inline viewing (not download)
    const fileName = contract.generatedDocument.fileName;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menampilkan dokumen',
      error: error.message
    });
  }
};

/**
 * Convert and view generated document as PDF inline
 */
exports.viewGeneratedDocumentAsPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get contract
    const contract = await Contract.findByPk(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract tidak ditemukan'
      });
    }

    // Check permission
    if (contract.submittedById !== userId && 
        contract.reviewerId !== userId && 
        contract.approver1Id !== userId && 
        contract.approver2Id !== userId &&
        req.user.role !== 'admin' &&
        req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat dokumen ini'
      });
    }

    // Check if document has been generated
    if (!contract.generatedDocument || !contract.generatedDocument.filePath) {
      return res.status(404).json({
        success: false,
        message: 'Dokumen belum di-generate. Silakan generate terlebih dahulu.'
      });
    }

    // Get file path
    const docxFilePath = path.join(__dirname, '../../', contract.generatedDocument.filePath);

    // Check if file exists
    if (!fs.existsSync(docxFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'File dokumen tidak ditemukan'
      });
    }

    console.log('[PDF CONVERT] Converting DOCX to PDF:', docxFilePath);

    // Convert DOCX to HTML first using mammoth
    const docxBuffer = fs.readFileSync(docxFilePath);
    const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer });
    const htmlContent = htmlResult.value;

    console.log('[PDF CONVERT] DOCX converted to HTML, length:', htmlContent.length);

    // Add CSS styling for better PDF output
    const styledHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 2cm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            max-width: 21cm;
            margin: 0 auto;
          }
          h1, h2, h3 {
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          p {
            margin: 0.5em 0;
            text-align: justify;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
          }
          table, th, td {
            border: 1px solid #000;
          }
          th, td {
            padding: 8px;
            text-align: left;
          }
          .signature-section {
            margin-top: 3em;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    console.log('[PDF CONVERT] HTML styled, converting to PDF...');

    // Convert HTML to PDF
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    };

    const file = { content: styledHtml };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    console.log('[PDF CONVERT] PDF generated, size:', pdfBuffer.length, 'bytes');

    // Set headers for PDF inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="dokumen-kontrak.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    // Send PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error converting document to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengkonversi dokumen ke PDF',
      error: error.message
    });
  }
};
