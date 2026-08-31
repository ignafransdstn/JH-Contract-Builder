# Document Generation Testing Guide

## Overview
Sistem document generation sudah fully connected dari frontend ke backend. Preview Contract akan:
1. Create draft contract dengan data yang diisi
2. Generate Word document dengan merge placeholders
3. Download document secara otomatis

## Template Placeholder Requirements

### Format Placeholder di Word Document
Template Word Anda sudah benar menggunakan format `{{placeholder_name}}`:

```
{{contract_number}}
{{contract_date}}
{{corporate_name1}}
{{address_1}}
{{name_1}}
{{position_1}}
{{corporate_name2}}
{{address_2}}
{{name_2}}
{{position_2}}
```

### Field Label Conversion
Backend otomatis convert field label menjadi placeholder format:

| Field Label (di Template) | Placeholder (di Word) |
|---------------------------|----------------------|
| "Contract Number" | {{contract_number}} |
| "Contract Date" | {{contract_date}} |
| "Corporate Name 1" | {{corporate_name1}} |
| "Address 1" | {{address_1}} |
| "Name 1" | {{name_1}} |
| "Position 1" | {{position_1}} |
| "Corporate Name 2" | {{corporate_name2}} |
| "Address 2" | {{address_2}} |
| "Name 2" | {{name_2}} |
| "Position 2" | {{position_2}} |

**Conversion Logic:**
- Lowercase semua huruf
- Replace spasi dan karakter special dengan underscore `_`
- Remove leading/trailing underscores
- Example: "Corporate Name 1" → "corporate_name1"

## Testing Steps

### Step 1: Verify Template Fields
1. Go to **Document Templates** page
2. Find template: "Draft Perjanjian Kerja Sama Pekerjaan Pembangunan"
3. Click **Edit** button
4. Verify fields exist with exact labels:
   - Contract Number
   - Contract Date
   - Corporate Name 1
   - Address 1
   - Name 1
   - Position 1
   - Corporate Name 2
   - Address 2
   - Name 2
   - Position 2

**Important:** Field label harus EXACT match dengan placeholder di Word document (kecuali spasi/underscore/case).

### Step 2: Create New Contract
1. Go to **Contracts** page
2. Click **Ajukan Kontrak** on the template
3. Fill **Step 1: Informasi Kontrak**
   ```
   Judul Kontrak: Test Contract Generation
   Deskripsi: Testing document generation flow
   Catatan: First test
   ```
4. Click **Next**

### Step 3: Fill Contract Data
Fill all fields in **Step 2: Isi Data Kontrak**:

```
Contract Number: JH/2024/001
Contract Date: 2024-01-15
Corporate Name 1: PT Jimbaran Hijau
Address 1: Jl. Sunset Road No. 123, Bali
Name 1: John Doe
Position 1: Direktur Utama
Corporate Name 2: PT Mitra Kerja
Address 2: Jl. Bypass Ngurah Rai No. 456, Bali
Name 2: Jane Smith
Position 2: Manager Proyek
```

5. Click **Next** to Step 3

### Step 4: Preview Document
1. In **Step 3: Review & Submit**
2. Review all filled data
3. Click **"Review Contract"** button
4. **Expected Flow:**
   - Loading indicator shows
   - Toast: "Generating preview dokumen kontrak..."
   - Toast: "Generating dokumen dengan data terisi..."
   - Browser opens new tab with document download
   - Toast: "Preview dokumen berhasil di-generate! File akan didownload."
   - Toast: "Draft tersimpan. Klik Submit untuk ajukan ke approval workflow."

5. **Downloaded File:**
   - Filename: `CONTRACT-{number}-{timestamp}.docx`
   - Open file in Microsoft Word or LibreOffice
   - Verify placeholders replaced with actual data:
     ```
     {{contract_number}} → JH/2024/001
     {{contract_date}} → 2024-01-15
     {{corporate_name1}} → PT Jimbaran Hijau
     etc.
     ```

### Step 5: Submit for Approval
1. After preview successful, click **"Submit Contract"** button
2. **Expected:**
   - Existing draft contract updated to status "pending_review"
   - No duplicate contract created
   - Navigate to Contract Detail page
   - Reviewer receives email notification

## Troubleshooting

### Issue 1: Placeholders Not Replaced
**Symptom:** Downloaded document still shows `{{placeholder_name}}`

**Causes & Solutions:**

1. **Field Label Mismatch**
   - Check template field labels match exactly
   - Backend converts: "Contract Number" → "contract_number"
   - Word must have: `{{contract_number}}`

2. **Case/Space Differences**
   - "ContractNumber" → contractnumber ❌
   - "Contract Number" → contract_number ✅
   - "Contract-Number" → contract_number ✅

3. **Special Characters**
   - "Nama (Pihak 1)" → nama_pihak_1 ✅
   - Use underscore in Word: `{{nama_pihak_1}}`

**Fix:**
```javascript
// Backend conversion (already implemented):
const key = field.fieldLabel
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');
```

### Issue 2: Download Not Starting
**Check:**
1. Backend running on port 5000
2. Frontend running on port 3000
3. Browser console for errors
4. Network tab: `/api/contracts/{id}/generate` returns 200

**Fix:**
- Restart backend: `cd backend && npm start`
- Clear browser cache
- Check CORS settings

### Issue 3: Duplicate Contracts
**Symptom:** Preview creates contract, submit creates another

**Cause:** Draft contract ID not tracked

**Fix:** Already implemented - `draftContractId` state tracks draft, submit updates it.

### Issue 4: Generation Error
**Symptom:** Error toast appears

**Debug Steps:**
1. Open browser console (F12)
2. Check error message
3. Look for:
   ```
   Error previewing contract: {...}
   Error response: {...}
   ```

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Template file not found" | originalFilePath invalid | Re-upload template |
| "Invalid template format" | Word file corrupted | Use valid .docx |
| "Missing contract data" | Empty formData | Fill all required fields |

## Backend Logs

Check backend terminal for detailed logs:

```bash
cd backend
npm start

# Watch for:
[INFO] Contract created: CONTRACT-XXXXX by user@email.com (draft)
[INFO] Generating document for contract: CONTRACT-XXXXX
[INFO] Document generated successfully: uploads/generated/CONTRACT-XXXXX-timestamp.docx
```

## API Endpoints Used

### 1. Create Draft Contract
```http
POST /api/contracts
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": 1,
  "title": "Test Contract",
  "contractData": [...],
  "status": "draft"
}
```

### 2. Generate Document
```http
POST /api/contracts/{id}/generate
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "message": "Document generated successfully",
  "data": {
    "documentPath": "uploads/generated/CONTRACT-XXX.docx",
    "downloadUrl": "/api/contracts/1/download"
  }
}
```

### 3. Download Document
```http
GET /api/contracts/{id}/download
Authorization: Bearer {token}
```

Response: Binary file stream (Word document)

## Testing Checklist

- [ ] Template uploaded with correct fields
- [ ] Fields in template match Word placeholders
- [ ] Navigate to Create Contract page
- [ ] Fill all form fields
- [ ] Click "Review Contract"
- [ ] Document downloads automatically
- [ ] Open document, verify data merged
- [ ] No placeholders remain in document
- [ ] Click "Submit Contract"
- [ ] Contract status changes to "pending_review"
- [ ] Only ONE contract created (draft reused)
- [ ] Navigate to contract detail page
- [ ] Can download document again from detail page

## Success Criteria

✅ **Preview Flow Works:**
1. Form validation passes
2. Draft contract created
3. Document generated with data
4. File downloads successfully
5. Toast notifications appear

✅ **Submit Flow Works:**
1. Existing draft updated (not new contract)
2. Status changes to "pending_review"
3. Reviewer notified
4. Navigate to contract detail

✅ **Document Quality:**
1. All placeholders replaced
2. Formatting preserved
3. No errors in document
4. Data matches form input

## Next Steps After Testing

1. **If Preview Works:**
   - Test with real contract data
   - Verify document formatting
   - Test approval workflow
   - Generate final documents after approval

2. **If Preview Fails:**
   - Check field labels match
   - Verify Word template placeholders
   - Review browser console errors
   - Check backend logs
   - Report specific error messages

3. **Additional Features to Test:**
   - Download from Contract Detail page
   - Generate after approval complete
   - Email generated document
   - Bulk generation

## Contact for Issues

When reporting issues, provide:
1. Screenshot of error toast
2. Browser console errors (F12 → Console tab)
3. Network tab response (F12 → Network → failed request)
4. Backend terminal logs
5. Template field labels
6. Word document placeholders
