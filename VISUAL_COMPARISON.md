# 🔍 Visual Comparison: Placeholder Rusak vs Bersih

## Problem: `{{tanggal}}` - BROKEN ❌

### Apa yang Anda lihat di Word:
```
{{tanggal}}
```
Terlihat **normal**, tapi sebenarnya rusak!

### Apa yang system lihat (XML):
```xml
<!-- RUSAK: 3 RUN TERPISAH -->
<w:r>
  <w:t>{{</w:t>
</w:r>
<w:r>
  <w:rPr>
    <w:rFonts w:ascii="Noto Serif" w:hAnsi="Noto Serif" w:cs="Noto Serif"/>
    <w:sz w:val="18"/>
    <w:szCs w:val="18"/>
  </w:rPr>
  <w:t>tanggal</w:t>   ⚠️ PUNYA FORMATTING BERBEDA!
</w:r>
<w:r>
  <w:t>}}</w:t>
</w:r>
```

### Apa yang Docxtemplater baca:
```
Parse token 1: "{{"
Parse token 2: "tanggal"  ← Terpisah dari {{
Parse token 3: "}}"

❌ ERROR: "Duplicate open tag at {{tang"
❌ ERROR: "Duplicate close tag at ggal}}"
```

### Kenapa pecah?
- Kata "tanggal" punya **revision ID berbeda** (`rsidR="00F27802"`)
- Ini terjadi saat Anda:
  1. Edit placeholder di tengah-tengah
  2. Double-click "tanggal" lalu ubah sesuatu
  3. Delete sebagian dan retype
  4. Copy-paste dari tempat lain

---

## Solution: `{{tanggal}}` - CLEAN ✅

### Yang harus Anda buat di Word:
```
{{tanggal}}
```
Ketik **SEKALI JALAN** tanpa edit di tengah

### XML yang dihasilkan:
```xml
<!-- BERSIH: 1 RUN SAJA -->
<w:r>
  <w:t>{{tanggal}}</w:t>   ✅ SEMUA DALAM SATU <w:t>
</w:r>
```

### Apa yang Docxtemplater baca:
```
Parse token: "{{tanggal}}"

✅ SUCCESS: Placeholder detected
✅ Will be replaced with data
```

---

## Comparison Table

| Aspect | RUSAK ❌ | BERSIH ✅ |
|--------|---------|----------|
| **Tampilan di Word** | `{{tanggal}}` | `{{tanggal}}` |
| **XML Runs** | 3 runs terpisah | 1 run |
| **XML Tags** | `<w:t>{{</w:t>`<br>`<w:t>tanggal</w:t>`<br>`<w:t>}}</w:t>` | `<w:t>{{tanggal}}</w:t>` |
| **Formatting** | Berbeda di tengah | Konsisten |
| **Docxtemplater** | ❌ Parse error | ✅ Success |
| **Error Count** | 2 errors | 0 errors |
| **Cara buat** | Edit berkali-kali | Ketik sekali jalan |

---

## 📸 Screenshot Guide (Simulasi)

### ❌ CARA SALAH (Menghasilkan placeholder rusak):

```
Step 1: Ketik "tanggal"
        tanggal

Step 2: Add brackets
        {tanggal}     ← Font property berubah di "tanggal"

Step 3: Add brackets
        {{tanggal}}   ← "tanggal" punya formatting berbeda!

❌ RUSAK: Word mencatat "tanggal" sebagai edit terpisah
```

**Atau:**
```
Step 1: Ketik "{{tanggal}}"
        {{tanggal}}

Step 2: Double-click "tanggal"
        {{[tanggal]}}  ← Word select

Step 3: Ubah font/size
        {{tanggal}}    ← "tanggal" punya rsidR berbeda!

❌ RUSAK: Edit di tengah merusak placeholder
```

---

### ✅ CARA BENAR (Menghasilkan placeholder bersih):

```
Step 1: Ketik "{{tanggal}}" SEKALI JALAN tanpa berhenti
        {{tanggal}}
        ^--------^ Ketik dari awal sampai akhir tanpa stop

Step 2: Tekan Ctrl+Space untuk clear formatting
        {{tanggal}}   ← Tidak berubah = BERSIH

Step 3: Verify dengan click di tengah placeholder
        {{tan|ggal}}  ← Font toolbar harus sama semua

✅ BERSIH: Semua karakter punya formatting yang sama
```

---

## 🧪 Test di Word

### Test 1: Clear Formatting Test

**RUSAK ❌:**
```
Before Ctrl+Space:  {{tanggal}}
After Ctrl+Space:   {{tanggal}}   ← Warna/ukuran berubah!
```

**BERSIH ✅:**
```
Before Ctrl+Space:  {{tanggal}}
After Ctrl+Space:   {{tanggal}}   ← Tidak berubah!
```

### Test 2: Font Check

**RUSAK ❌:**
```
Klik di "{{" → Font: Calibri 11pt
Klik di "tang" → Font: Noto Serif 9pt   ⚠️ BERBEDA!
Klik di "}}" → Font: Calibri 11pt
```

**BERSIH ✅:**
```
Klik di "{{" → Font: Calibri 11pt
Klik di "tang" → Font: Calibri 11pt   ✅ SAMA!
Klik di "}}" → Font: Calibri 11pt
```

---

## 📝 Step-by-Step Fix Guide

### For `{{tanggal}}`:

1. **Find:**
   - Ctrl+F → ketik "{{tanggal}}"
   
2. **Delete:**
   ```
   ❌ {{tanggal}}
   ```
   Select dari `{` pertama sampai `}` terakhir → Delete

3. **Retype:**
   ```
   ✅ {{tanggal}}
   ```
   Ketik: `{` `{` `t` `a` `n` `g` `g` `a` `l` `}` `}` (sekali jalan)

4. **Clear:**
   - Select `{{tanggal}}`
   - Tekan `Ctrl+Space`

5. **Verify:**
   - Klik di dalam placeholder
   - Check toolbar: Font sama semua
   - Tekan Ctrl+Space lagi: Tidak berubah

### For `{{nama1}}`:

1. **Find:**
   - Ctrl+F → ketik "{{nama1}}"

2. **Delete:**
   ```
   ❌ {{nama1}}
   ```

3. **Retype:**
   ```
   ✅ {{nama1}}
   ```
   Ketik: `{` `{` `n` `a` `m` `a` `1` `}` `}` (sekali jalan)

4. **Clear:**
   - Select `{{nama1}}`
   - Tekan `Ctrl+Space`

5. **Verify:**
   - Tidak berubah saat Ctrl+Space

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Edit di tengah placeholder
```
{{tang|gal}}  ← Jangan double-click!
      ↑
   Cursor di tengah = BAHAYA
```

### ❌ Mistake 2: Copy-paste placeholder
```
From: {{tanggal}} (dokumen lain)
To:   {{tanggal}}   ← Bawa formatting dari source!
```

### ❌ Mistake 3: Ubah font di tengah
```
{{tanggal}}  ← Select "tang"
{{tanggal}}  ← Ubah font = RUSAK
    ^^^^
  Font berbeda
```

### ✅ Correct Way:
```
1. Ketik baru: {{tanggal}}
2. Jangan edit: {{tanggal}}
3. Clear format: {{tanggal}} + Ctrl+Space
```

---

## 🎯 Summary

| Placeholder | Status | Action Needed |
|-------------|--------|---------------|
| `{{tanggal}}` | ❌ RUSAK | Delete → Retype → Clear |
| `{{nama1}}` | ❌ RUSAK | Delete → Retype → Clear |
| `{{perusahaan1}}` | ✅ BERSIH | No action |
| `{{alamat1}}` | ✅ BERSIH | No action |
| `{{posisi1}}` | ✅ BERSIH | No action |
| `{{perusahaan1a}}` | ✅ BERSIH | No action |
| `{{perusahaan2}}` | ✅ BERSIH | No action |
| `{{alamat2}}` | ✅ BERSIH | No action |
| `{{nama2}}` | ✅ BERSIH | No action |
| `{{posisi2}}` | ✅ BERSIH | No action |
| `{{perusahaan2a}}` | ✅ BERSIH | No action |
| `{{penandatangan1}}` | ✅ BERSIH | No action |
| `{{penandatangan2}}` | ✅ BERSIH | No action |

**Fix needed:** Only 2 out of 13 placeholders (15.4%)

---

## 💡 Pro Tips

1. **Always type placeholders in one go**
   - Don't stop in the middle
   - Don't go back to edit

2. **Use Ctrl+Space after typing**
   - Removes all character formatting
   - Makes placeholder consistent

3. **Test with Ctrl+Space**
   - Select placeholder
   - Press Ctrl+Space
   - Should NOT change at all

4. **Check font in toolbar**
   - Click in placeholder
   - All characters should show same font

5. **Use plain text editor first**
   - Type placeholders in Notepad
   - Copy to Word
   - Less likely to have formatting issues

---

**Need more help?** Share your fixed template and I'll verify it's clean!
