const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const logger = require('./logger');

// Initialize OpenAI if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Extract text from DOCX file
 */
const extractTextFromDocx = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    logger.error('Error extracting text from DOCX:', error);
    throw error;
  }
};

/**
 * Extract text from PDF file
 */
const extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    logger.error('Error extracting text from PDF:', error);
    throw error;
  }
};

/**
 * Extract text from Excel file
 */
const extractTextFromExcel = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      jsonData.forEach(row => {
        text += row.join(' | ') + '\n';
      });
    });
    
    return text;
  } catch (error) {
    logger.error('Error extracting text from Excel:', error);
    throw error;
  }
};

/**
 * Extract text based on file type
 */
exports.extractText = async (filePath, fileType) => {
  const ext = fileType.toLowerCase();
  
  switch (ext) {
    case 'docx':
      return await extractTextFromDocx(filePath);
    case 'pdf':
      return await extractTextFromPdf(filePath);
    case 'xlsx':
    case 'xls':
      return await extractTextFromExcel(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

/**
 * Analyze document text and generate form fields using AI
 */
exports.analyzeDocumentWithAI = async (text) => {
  if (!openai) {
    // Fallback: Basic pattern matching if OpenAI is not configured
    return this.analyzeDocumentBasic(text);
  }

  try {
    const prompt = `Analyze the following contract document and extract all the fields that need to be filled in by users. 
For each field, provide:
1. A unique field name (camelCase, no spaces)
2. A user-friendly label
3. The field type (text, number, date, email, textarea, select)
4. Whether it's required or optional
5. Any validation rules if applicable

Document text:
${text.substring(0, 8000)} 

Please respond with a JSON array of field objects. Each object should have: fieldName, fieldLabel, fieldType, required, placeholder, and validation properties.

Example format:
[
  {
    "fieldName": "companyName",
    "fieldLabel": "Nama Perusahaan",
    "fieldType": "text",
    "required": true,
    "placeholder": "Masukkan nama perusahaan",
    "validation": {
      "minLength": 3
    }
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in analyzing contract documents and extracting form fields. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    // Extract JSON from response
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const fields = JSON.parse(jsonMatch[0]);
      return fields;
    }
    
    // If no JSON found, try parsing the entire content
    const fields = JSON.parse(content);
    return fields;
    
  } catch (error) {
    logger.error('Error analyzing document with AI:', error);
    // Fallback to basic analysis
    return this.analyzeDocumentBasic(text);
  }
};

/**
 * Basic document analysis without AI (fallback)
 */
exports.analyzeDocumentBasic = (text) => {
  const fields = [];
  let order = 0;

  // Pattern for finding placeholders like [FIELD_NAME], {FIELD_NAME}, __FIELD_NAME__, etc.
  const patterns = [
    /\[([A-Za-z0-9_\s]+)\]/g,
    /\{([A-Za-z0-9_\s]+)\}/g,
    /__([A-Za-z0-9_\s]+)__/g,
    /\(([A-Za-z0-9_\s]+)\)/g
  ];

  const foundFields = new Set();

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const fieldText = match[1].trim();
      
      // Skip common words that might be in brackets
      const skipWords = ['pihak', 'nama', 'tanggal', 'tempat', 'alamat'];
      if (fieldText.length < 3 || skipWords.some(word => fieldText.toLowerCase() === word)) {
        continue;
      }

      if (!foundFields.has(fieldText)) {
        foundFields.add(fieldText);
        
        const fieldName = fieldText
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        
        // Determine field type based on field name
        let fieldType = 'text';
        if (fieldText.toLowerCase().includes('tanggal') || fieldText.toLowerCase().includes('date')) {
          fieldType = 'date';
        } else if (fieldText.toLowerCase().includes('email')) {
          fieldType = 'email';
        } else if (fieldText.toLowerCase().includes('telepon') || fieldText.toLowerCase().includes('phone')) {
          fieldType = 'text';
        } else if (fieldText.toLowerCase().includes('alamat') || fieldText.toLowerCase().includes('address')) {
          fieldType = 'textarea';
        } else if (fieldText.toLowerCase().includes('jumlah') || fieldText.toLowerCase().includes('nilai') || 
                   fieldText.toLowerCase().includes('harga') || fieldText.toLowerCase().includes('amount')) {
          fieldType = 'number';
        }

        fields.push({
          fieldName,
          fieldLabel: fieldText,
          fieldType,
          required: true,
          placeholder: `Masukkan ${fieldText.toLowerCase()}`,
          order: order++
        });
      }
    }
  });

  // If no fields found, add some default fields
  if (fields.length === 0) {
    fields.push(
      {
        fieldName: 'pihak_pertama',
        fieldLabel: 'Pihak Pertama',
        fieldType: 'text',
        required: true,
        placeholder: 'Masukkan nama pihak pertama',
        order: 0
      },
      {
        fieldName: 'pihak_kedua',
        fieldLabel: 'Pihak Kedua',
        fieldType: 'text',
        required: true,
        placeholder: 'Masukkan nama pihak kedua',
        order: 1
      },
      {
        fieldName: 'tanggal_kontrak',
        fieldLabel: 'Tanggal Kontrak',
        fieldType: 'date',
        required: true,
        order: 2
      },
      {
        fieldName: 'nilai_kontrak',
        fieldLabel: 'Nilai Kontrak',
        fieldType: 'number',
        required: true,
        placeholder: 'Masukkan nilai kontrak',
        order: 3
      }
    );
  }

  return fields;
};
