const AdmZip = require('adm-zip');
const fs = require('fs');
const logger = require('./logger');

/**
 * Automatically clean Word template formatting issues that break Docxtemplater
 * This allows users to upload templates without worrying about Word formatting
 * 
 * Issues fixed:
 * 1. Split placeholders across multiple <w:t> tags
 * 2. Spell check markers (<w:proofErr>) inside placeholders
 * 3. Empty formatting runs between placeholder parts
 * 4. Revision ID splits (rsidRPr) after placeholders
 * 
 * @param {string} templatePath - Absolute path to .docx template file
 * @returns {Object} - { success: boolean, cleaned: boolean, placeholdersFound: number, issues: string[], message: string }
 */
async function cleanTemplate(templatePath) {
  const result = {
    success: false,
    cleaned: false,
    placeholdersFound: 0,
    issues: [],
    message: ''
  };

  try {
    // Load template
    const zip = new AdmZip(templatePath);
    let xml = zip.readAsText('word/document.xml');
    const originalXml = xml;
    const originalLength = xml.length;

    logger.info(`[Template Cleaner] Processing: ${templatePath}`);
    logger.info(`[Template Cleaner] Original XML length: ${originalLength}`);

    // Count original placeholders
    const originalPlaceholders = (xml.match(/\{\{/g) || []).length;
    result.placeholdersFound = originalPlaceholders;

    let changesCounter = {
      spellCheckMarkers: 0,
      splitOpenings: 0,
      splitClosings: 0,
      emptyRuns: 0,
      formattingAfter: 0,
      formattingBefore: 0,
      stuckText: 0
    };

    // ====================
    // STEP 1: Remove spell check markers
    // ====================
    const spellBefore = (xml.match(/<w:proofErr/g) || []).length;
    if (spellBefore > 0) {
      xml = xml.replace(/<w:proofErr[^>]*\/>/g, '');
      changesCounter.spellCheckMarkers = spellBefore;
      result.issues.push(`Removed ${spellBefore} spell check markers`);
      logger.info(`[Template Cleaner] Removed ${spellBefore} spell check markers`);
    }

    // ====================
    // STEP 2: Fix split opening {{ brackets
    // ====================
    // Pattern: {{</w:t></w:r>...tags...<w:r><w:t>word  →  {{word
    // Also: {</w:t></w:r>...tags...<w:r><w:t>{word}}  →  {{word}}
    for (let i = 0; i < 10; i++) {
      const before = xml.length;
      
      // Fix double open split: {{</w:t>...<w:t>word
      xml = xml.replace(/\{\{<\/w:t><\/w:r>(?:<[^>]+>)*<w:r[^>]*>(?:<[^>]+>)*<w:t>(\w+)/g, '{{$1');
      
      // Fix single open split: {</w:t>...<w:t>{word}}
      xml = xml.replace(/\{<\/w:t><\/w:r>(?:<[^>]+>)*<w:r[^>]*>(?:<[^>]+>)*<w:t>(\{[a-zA-Z0-9]+\}\})/g, '{$1');
      
      const after = xml.length;
      if (before !== after) {
        changesCounter.splitOpenings++;
      } else {
        break;
      }
    }

    if (changesCounter.splitOpenings > 0) {
      result.issues.push(`Fixed ${changesCounter.splitOpenings} split opening brackets`);
      logger.info(`[Template Cleaner] Fixed ${changesCounter.splitOpenings} split opening brackets`);
    }

    // ====================
    // STEP 3: Fix split closing }} brackets
    // ====================
    // Pattern: word</w:t></w:r>...tags...<w:r><w:t>}}  →  word}}
    for (let i = 0; i < 10; i++) {
      const before = xml.length;
      xml = xml.replace(/(\w+)<\/w:t><\/w:r>(?:<[^>]+>)*<w:r[^>]*>(?:<[^>]+>)*<w:t>\}\}/g, '$1}}');
      const after = xml.length;
      if (before !== after) {
        changesCounter.splitClosings++;
      } else {
        break;
      }
    }

    if (changesCounter.splitClosings > 0) {
      result.issues.push(`Fixed ${changesCounter.splitClosings} split closing brackets`);
      logger.info(`[Template Cleaner] Fixed ${changesCounter.splitClosings} split closing brackets`);
    }

    // ====================
    // STEP 4: Remove empty formatting runs between placeholder parts (CONSERVATIVE)
    // ====================
    const emptyBefore = xml.length;
    // Pattern: {{partial</w:t></w:r><w:r><w:rPr>...</w:rPr><w:t>content}}
    // IMPORTANT: Use conservative matching to avoid deleting content
    xml = xml.replace(/(\{\{[^}]{0,30})<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>(?:[^<]|<(?!\/w:rPr>))*<\/w:rPr>)?<w:t>([^{}<>]{0,30}\}\})/g, '$1$2');
    const emptyRemoved = emptyBefore - xml.length;
    
    if (emptyRemoved > 0) {
      changesCounter.emptyRuns = emptyRemoved;
      result.issues.push(`Removed ${emptyRemoved} bytes of empty formatting runs`);
      logger.info(`[Template Cleaner] Removed ${emptyRemoved} bytes of empty formatting runs`);
    }

    // ====================
    // STEP 5: Clean formatting AFTER closing }} (CONSERVATIVE)
    // ====================
    const afterBefore = xml.length;
    // Pattern: }}</w:t></w:r><w:r rsidRPr="..."><w:rPr>...</w:rPr><w:t>  →  }}</w:t><w:t>
    // IMPORTANT: Match only ADJACENT runs, not across paragraphs or placeholders
    // Use [^<]* instead of [\s\S]* to avoid matching across tags
    xml = xml.replace(/\}\}<\/w:t><\/w:r><w:r[^>]*><w:rPr>(?:[^<]|<(?!\/w:rPr>))*<\/w:rPr><w:t>/g, '}}</w:t><w:t>');
    const afterRemoved = afterBefore - xml.length;
    
    if (afterRemoved > 0) {
      changesCounter.formattingAfter = afterRemoved;
      result.issues.push(`Cleaned ${afterRemoved} bytes of formatting after placeholders`);
      logger.info(`[Template Cleaner] Cleaned ${afterRemoved} bytes after placeholders`);
    }

    // ====================
    // STEP 6: Clean formatting BEFORE opening {{ (CONSERVATIVE)
    // ====================
    const beforeBefore = xml.length;
    // Pattern: </w:t></w:r><w:r rsidRPr="..."><w:rPr>...</w:rPr><w:t>{{  →  </w:t><w:t>{{
    // IMPORTANT: Match only ADJACENT runs, not across paragraphs or placeholders
    // Use [^<]* instead of [\s\S]* to avoid matching across tags
    xml = xml.replace(/<\/w:t><\/w:r><w:r[^>]*><w:rPr>(?:[^<]|<(?!\/w:rPr>))*<\/w:rPr><w:t>\{\{/g, '</w:t><w:t>{{');
    const beforeRemoved = beforeBefore - xml.length;
    
    if (beforeRemoved > 0) {
      changesCounter.formattingBefore = beforeRemoved;
      result.issues.push(`Cleaned ${beforeRemoved} bytes of formatting before placeholders`);
      logger.info(`[Template Cleaner] Cleaned ${beforeRemoved} bytes before placeholders`);
    }

    // ====================
    // STEP 7: Merge consecutive text elements
    // ====================
    for (let i = 0; i < 5; i++) {
      const before = xml.length;
      xml = xml.replace(/<\/w:t><w:t(?:\s+xml:space="preserve")?>/g, '');
      const after = xml.length;
      if (before === after) break;
    }

    // ====================
    // STEP 8: Separate text stuck to placeholders
    // ====================
    // This fixes patterns like: <w:t>{{placeholder}}text</w:t>
    // Should be: <w:t>{{placeholder}}</w:t></w:r><w:r><w:t>text</w:t>
    const stuckBefore = xml.length;
    let stuckTextFixed = 0;
    
    // Pattern 1: Text AFTER closing }} - {{placeholder}}word
    // Find and split into separate runs
    xml = xml.replace(/<w:t([^>]*)>(\{\{[a-zA-Z0-9_]+\}\})([a-zA-Z]+)<\/w:t>/g, (match, attrs, placeholder, text) => {
      stuckTextFixed++;
      return `<w:t${attrs}>${placeholder}</w:t></w:r><w:r w:rsidRPr="00972614"><w:t>${text}</w:t>`;
    });
    
    // Pattern 2: Text BEFORE opening {{ - word{{placeholder}}
    xml = xml.replace(/<w:t([^>]*)>([a-zA-Z]+)(\{\{[a-zA-Z0-9_]+\}\})<\/w:t>/g, (match, attrs, text, placeholder) => {
      stuckTextFixed++;
      return `<w:t${attrs}>${text}</w:t></w:r><w:r w:rsidRPr="00972614"><w:t>${placeholder}</w:t>`;
    });
    
    if (stuckTextFixed > 0) {
      changesCounter.stuckText = stuckTextFixed;
      result.issues.push(`Separated ${stuckTextFixed} text elements stuck to placeholders`);
      logger.info(`[Template Cleaner] Separated ${stuckTextFixed} stuck text elements`);
    }

    // ====================
    // Final verification
    // ====================
    const finalLength = xml.length;
    const bytesRemoved = originalLength - finalLength;
    const finalPlaceholders = (xml.match(/\{\{/g) || []).length;

    // Check if any changes were made
    result.cleaned = xml !== originalXml;

    if (result.cleaned) {
      // Create backup before saving
      const backupPath = templatePath.replace('.docx', '_ORIGINAL_BACKUP.docx');
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(templatePath, backupPath);
        logger.info(`[Template Cleaner] Backup created: ${backupPath}`);
      }

      // Save cleaned template
      zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
      zip.writeZip(templatePath);

      logger.info(`[Template Cleaner] Template cleaned successfully`);
      logger.info(`[Template Cleaner] Bytes removed: ${bytesRemoved}`);
      logger.info(`[Template Cleaner] Placeholders: ${originalPlaceholders} → ${finalPlaceholders}`);

      result.message = `Template automatically cleaned: ${bytesRemoved} bytes removed, ${result.issues.length} issues fixed`;
    } else {
      logger.info(`[Template Cleaner] Template is already clean, no changes needed`);
      result.message = 'Template is already clean';
    }

    // Check for placeholder count mismatch
    if (finalPlaceholders !== originalPlaceholders) {
      result.issues.push(`WARNING: Placeholder count changed (${originalPlaceholders} → ${finalPlaceholders})`);
      logger.warn(`[Template Cleaner] Placeholder count mismatch: ${originalPlaceholders} → ${finalPlaceholders}`);
    }

    result.success = true;
    return result;

  } catch (error) {
    logger.error('[Template Cleaner] Error cleaning template:', error);
    result.success = false;
    result.message = `Error cleaning template: ${error.message}`;
    result.issues.push(error.message);
    return result;
  }
}

/**
 * Validate template placeholders are properly formatted
 * Returns list of broken placeholders with their issues
 * 
 * @param {string} templatePath - Absolute path to .docx template file
 * @returns {Object} - { valid: boolean, placeholders: Array, issues: Array }
 */
async function validateTemplate(templatePath) {
  const result = {
    valid: true,
    placeholders: [],
    issues: []
  };

  try {
    const zip = new AdmZip(templatePath);
    const xml = zip.readAsText('word/document.xml');

    // Extract all placeholder names
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    let match;
    const placeholderNames = new Set();

    while ((match = regex.exec(xml)) !== null) {
      placeholderNames.add(match[1]);
    }

    result.placeholders = Array.from(placeholderNames);

    // Check each placeholder is in single <w:t> tag
    for (const name of placeholderNames) {
      const pattern = new RegExp(`<w:t[^>]*>\\{\\{${name}\\}\\}<\\/w:t>`);
      const isClean = pattern.test(xml);

      if (!isClean) {
        result.valid = false;
        result.issues.push(`Placeholder {{${name}}} is split across multiple formatting runs`);
      }
    }

    logger.info(`[Template Validator] Found ${result.placeholders.length} placeholders`);
    logger.info(`[Template Validator] Valid: ${result.valid}`);

    return result;

  } catch (error) {
    logger.error('[Template Validator] Error validating template:', error);
    return {
      valid: false,
      placeholders: [],
      issues: [error.message]
    };
  }
}

module.exports = {
  cleanTemplate,
  validateTemplate
};
