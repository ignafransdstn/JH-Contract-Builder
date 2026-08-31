# Analisis Flow Sistem Contract Builder

## 📋 Rangkuman Flow Yang Ada Sekarang

### ✅ YANG SUDAH BENAR DAN TERHUBUNG:

#### 1. **Document Template Creation Flow** ✅
```
Admin/Supervisor → Upload Document (docx) → Extract Text
                ↓
         Create Template Draft
                ↓
         Define Fields (label, type, required, order)
                ↓
         Define Approval Matrix (reviewer, approver1, approver2)
                ↓
         Publish Template (status: published)
```

**Status**: ✅ SELESAI DAN BERFUNGSI
- Template disimpan dengan `fields` array
- Template disimpan dengan `approvalMatrix` object
- Status bisa `draft` atau `published`

#### 2. **Contract Selection Flow** ✅
```
User → Navigate ke /contracts
     ↓
View Published Templates (filtered by status = 'published')
     ↓
Select Template → Click "Ajukan Kontrak"
     ↓
Navigate to /contracts/create?templateId={id}
```

**Status**: ✅ SELESAI DAN BERFUNGSI
- Contracts.js sudah filter hanya template published
- Template cards show approval hierarchy
- Click "Ajukan Kontrak" pass templateId via URL

#### 3. **Contract Form Generation Flow** ✅
```
CreateContract Page receives templateId
            ↓
Load template.fields from backend
            ↓
Generate Dynamic Form (Step 2)
            ↓
Render input based on field.type (text, number, date, etc)
            ↓
User fills form data
```

**Status**: ✅ SELESAI DAN BERFUNGSI
- Template fields → Dynamic form inputs
- 10 field types supported
- Validation working

#### 4. **Contract Submission Flow** ✅
```
User fills all fields → Review (Step 3)
            ↓
Preview filled data
            ↓
Click "Ajukan Kontrak"
            ↓
Backend: Create Contract with:
  - templateId
  - title, description
  - contractData (array of {fieldLabel, fieldType, value, order})
  - approvalMatrix copied from template
  - status: 'pending_review'
            ↓
Contract saved to database
```

**Status**: ✅ SELESAI DAN BERFUNGSI
- Contract created with all data
- Approval matrix copied from template
- Status set to pending_review

---

## ❌ YANG BELUM TERHUBUNG / MISSING:

### 1. **Document Generation dengan Placeholder** ⚠️

**Expected Flow:**
```
Template Upload → Document has placeholders like {{nomor_dokumen}}
              ↓
User fills form with "Nomor Dokumen: 12326"
              ↓
Click "Review Contract" → Generate document
              ↓
Replace {{nomor_dokumen}} with "12326"
              ↓
Show/Download generated document
```

**Current Status:** 🟡 PARTIALLY IMPLEMENTED
- ✅ Backend controller ada (`documentGeneratorController.js`)
- ✅ Backend routes ada (`/api/contracts/:id/generate`)
- ✅ Library docxtemplater sudah installed
- ❌ **BELUM TERHUBUNG**: Frontend "Review Contract" button hanya show alert
- ❌ **BELUM TERHUBUNG**: Tidak ada actual document generation API call
- ❌ **MISSING**: Template Word belum ada placeholder

**Problem:**
Template dokumen Word yang diupload kemungkinan masih format lama:
```
No. __________  ← Ini bukan placeholder yang bisa di-parse
```

Seharusnya:
```
No. {{nomor_dokumen}}  ← Ini placeholder yang bisa di-replace otomatis
```

---

### 2. **Document Preview sebelum Submit** ⚠️

**Expected Flow:**
```
User fills form → Click "Review Contract"
              ↓
System generate preview document dengan data terisi
              ↓
User download/view preview document
              ↓
User review apakah data sudah benar
              ↓
User click "Ajukan Kontrak" untuk final submit
```

**Current Status:** 🟡 PARTIALLY IMPLEMENTED
- ❌ Tidak ada real document generation
- ❌ Hanya show alert dengan text data
- ❌ Tidak ada download preview document

---

### 3. **Post-Submit Document Generation** ❌

**Expected Flow:**
```
Contract submitted (status: pending_review)
              ↓
System automatically/manually generate final document
              ↓
Document saved dengan filled data
              ↓
Reviewer/Approver dapat download document
```

**Current Status:** ❌ NOT IMPLEMENTED
- Backend controller ada tapi belum dipanggil
- No automatic generation after submit
- No button di ContractDetail page untuk generate

---

## 🔧 YANG PERLU DIPERBAIKI:

### Priority 1: Template Placeholder ⭐⭐⭐
**Problem:** Template Word tidak memiliki placeholder yang bisa di-parse

**Solution:**
1. Edit template Word yang sudah diupload
2. Ganti field kosong `No. ______` dengan `No. {{nomor_dokumen}}`
3. Upload template baru
4. ATAU: Buat fitur "Placeholder Guide" di halaman create template

**File yang perlu diupdate:**
- Template Word document (manual edit by user)
- Atau create template editor di frontend

### Priority 2: Connect "Review Contract" Button ⭐⭐⭐
**Problem:** Button "Review Contract" hanya show alert, tidak generate document

**Solution:**
```javascript
// CreateContract.js - handlePreviewContract()
const handlePreviewContract = async () => {
  // Validate data
  if (!validateStep()) return;

  // FIRST: Save contract as DRAFT
  const draftContract = await contractService.createContract({
    ...payload,
    status: 'draft' // Simpan sebagai draft dulu
  });

  // THEN: Generate document with filled data
  const response = await contractService.generateDocument(draftContract.id);

  // THEN: Download generated document
  window.open(response.data.data.downloadUrl, '_blank');
  
  toast.success('Preview document generated!');
};
```

**File yang perlu diupdate:**
- `frontend/src/pages/Contracts/CreateContract.js`
- Add `generateDocument()` method di `frontend/src/services/index.js`

### Priority 3: Post-Approval Document Generation ⭐⭐
**Problem:** Setelah contract approved, tidak ada generated document

**Solution:**
1. Di ContractDetail page, tambah button "Generate Final Document"
2. Button available setelah status = 'completed'
3. Call `/api/contracts/:id/generate` endpoint
4. Show download link

**File yang perlu diupdate:**
- `frontend/src/pages/Contracts/ContractDetail.js`

---

## 📊 Flow Diagram Lengkap (As-Should-Be)

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: TEMPLATE CREATION (Admin/Supervisor)          │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
    1. Upload Document Word (dengan placeholder)
       File: "Draft Perjanjian.docx"
       Content: "No. {{nomor_dokumen}}"
                "Tanggal: {{tanggal_kontrak}}"
                        │
                        ↓
    2. Define Form Fields
       - Field: "Nomor Dokumen" (type: text, required: true)
       - Field: "Tanggal Kontrak" (type: date, required: true)
       (Placeholder otomatis = field name → snake_case)
                        │
                        ↓
    3. Define Approval Matrix
       - Reviewer: Ignatius Frans
       - Approver 1: Ignatius Frans Da Sales
       - Approver 2: (optional)
                        │
                        ↓
    4. Publish Template
       Status: 'draft' → 'published'
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: CONTRACT SUBMISSION (User/Staff)              │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
    5. Browse Published Templates
       GET /api/documents?status=published
       Show: Template cards with approval flow
                        │
                        ↓
    6. Select Template → "Ajukan Kontrak"
       Navigate: /contracts/create?templateId=xxx
                        │
                        ↓
    7. Fill Dynamic Form (Step 1-2)
       Form generated from template.fields:
       - "Nomor Dokumen": 12326
       - "Tanggal Kontrak": 2026-02-05
                        │
                        ↓
    8. Review & Preview Document (Step 3)
       Click "Review Contract":
         a) Save as DRAFT contract
         b) POST /api/contracts/:id/generate
         c) Download preview document
         d) User reviews document
                        │
                        ↓
    9. Submit Contract
       Click "Ajukan Kontrak":
         - Update contract status → 'pending_review'
         - Notify reviewer
         - Navigate to contract detail
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: APPROVAL WORKFLOW (Reviewer/Approver)         │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
    10. Reviewer Reviews Contract
        - View contract data
        - Download generated document
        - Approve/Reject
                        │
                        ↓
    11. Approver 1 Approves
        - View contract data
        - Download document
        - Approve/Reject
                        │
                        ↓
    12. (Optional) Approver 2 Approves
                        │
                        ↓
    13. Contract Completed
        Status: 'completed'
        - Final document available for download
        - All parties can access document
```

---

## 🎯 Action Items (Prioritized)

### CRITICAL - Do First:
1. ✅ **Verify Template has Placeholders**
   - Open Word document
   - Check if has `{{field_name}}` format
   - If not: Edit and re-upload template

2. ✅ **Connect Review Contract Button**
   - Implement actual document generation
   - Call backend API
   - Download preview document

3. ✅ **Test Full Flow**
   - Create template with placeholder
   - Submit contract
   - Generate preview
   - Verify data filled correctly

### IMPORTANT - Do Next:
4. ✅ **Add Generate Document di ContractDetail**
   - Button for manual generation
   - Download final document
   - Available after approved

5. ✅ **Add Placeholder Guide**
   - Documentation untuk admin
   - Example template
   - Field name → placeholder mapping

### NICE TO HAVE:
6. ⭐ **Auto-generate on Submit**
   - Generate document automatically
   - Save to contract.generatedDocument
   - No need manual generation

7. ⭐ **Template Preview Mode**
   - Show placeholder → field mapping
   - Validate placeholder exists
   - Warning if placeholder missing

---

## 💡 Kesimpulan

### Yang Sudah Baik:
- ✅ Database schema lengkap dan benar
- ✅ Template creation flow working
- ✅ Dynamic form generation excellent
- ✅ Approval matrix properly copied
- ✅ Backend document generation ready

### Yang Perlu Diperbaiki:
- ❌ Template Word belum ada placeholder (manual fix by user)
- ❌ "Review Contract" button belum call API
- ❌ No document generation integration
- ❌ No preview before submit

### Impact:
Saat ini sistem **HAMPIR LENGKAP** tapi:
1. **Data masuk ke database** ✅
2. **Form fields connect ke template** ✅
3. **Tapi TIDAK ADA DOCUMENT GENERATION** ❌

User mengisi form, data tersimpan, tapi **dokumen Word tidak ter-generate dengan data yang diisi**.

### Rekomendasi:
**FOKUS**: Connect document generation feature supaya data yang diisi user bisa masuk ke dokumen Word.

Priority actions:
1. Fix template placeholder (user edit Word document)
2. Connect "Review Contract" button ke API
3. Test end-to-end flow
