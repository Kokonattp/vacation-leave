# 📅 ระบบลาพักร้อน - QC TEAM

ระบบบันทึกวันลาพักร้อนสำหรับทีม QC พัฒนาด้วย Next.js และ Google Sheets

## 🚀 วิธี Deploy

### ขั้นตอนที่ 1: ตั้งค่า Google Apps Script (Backend)

1. ไปที่ [Google Sheets](https://sheets.google.com) สร้างไฟล์ใหม่
2. ไปที่ **Extensions > Apps Script**
3. ลบโค้ดเดิม แล้ววางโค้ดนี้:

```javascript
const LEAVES_SHEET = 'Leaves';
const EMPLOYEES_SHEET = 'Employees';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let leavesSheet = ss.getSheetByName(LEAVES_SHEET);
  if (!leavesSheet) {
    leavesSheet = ss.insertSheet(LEAVES_SHEET);
    leavesSheet.getRange(1, 1, 1, 6).setValues([['id', 'name', 'startDate', 'endDate', 'createdDate', 'createdTime']]);
    leavesSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#fff');
    leavesSheet.setFrozenRows(1);
  }
  
  let empSheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!empSheet) {
    empSheet = ss.insertSheet(EMPLOYEES_SHEET);
    empSheet.getRange(1, 1).setValue('name');
    empSheet.getRange(1, 1).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#fff');
    const defaultEmployees = [['จุฑามาศ'],['ขนิษฐา'],['ณัฐธิดา'],['วรรณา'],['จารุวรรณ'],['นริศรา'],['อภินันท์']];
    empSheet.getRange(2, 1, defaultEmployees.length, 1).setValues(defaultEmployees);
    empSheet.setFrozenRows(1);
  }
}

function doGet(e) {
  const action = e.parameter.action || 'getLeaves';
  let result;
  if (action === 'getLeaves') result = getLeaves();
  else if (action === 'getEmployees') result = getEmployees();
  else result = { success: false, message: 'Unknown action' };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  let result;
  if (data.action === 'addLeave') result = addLeave(data);
  else if (data.action === 'addEmployee') result = addEmployee(data.name);
  else result = { success: false, message: 'Unknown action' };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getLeaves() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEAVES_SHEET);
  if (!sheet) return { success: false, data: [] };
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [] };
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const leaves = data.filter(row => row[0]).map(row => ({
    id: row[0], name: row[1], startDate: formatDate(row[2]), endDate: formatDate(row[3]),
    createdDate: formatDate(row[4]), createdTime: row[5]
  }));
  return { success: true, data: leaves };
}

function addLeave(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEAVES_SHEET);
  if (!sheet) return { success: false, message: 'Sheet not found' };
  sheet.appendRow([data.id || Date.now(), data.name, data.startDate, data.endDate, data.createdDate, data.createdTime]);
  return { success: true, message: 'บันทึกแล้ว' };
}

function getEmployees() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) return { success: true, data: [] };
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [] };
  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  return { success: true, data: data.flat().filter(name => name) };
}

function addEmployee(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) return { success: false, message: 'Sheet not found' };
  sheet.appendRow([name]);
  return { success: true, message: 'เพิ่มพนักงานแล้ว' };
}

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return Utilities.formatDate(new Date(date), 'Asia/Bangkok', 'yyyy-MM-dd');
}
```

4. กด **Save** (Ctrl+S)
5. รัน function `setup()` (เลือก setup > Run)
6. อนุญาต permissions
7. กด **Deploy > New deployment**
8. เลือก Type: **Web app**
9. ตั้งค่า:
   - Execute as: **Me**
   - Who has access: **Anyone**
10. กด **Deploy** แล้ว **Copy URL**

---

### ขั้นตอนที่ 2: แก้ไข URL ใน Code

เปิดไฟล์ `app/page.js` แก้บรรทัดที่ 4:

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/xxxxx/exec';
```

---

### ขั้นตอนที่ 3: Push ขึ้น GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vacation-leave.git
git push -u origin main
```

---

### ขั้นตอนที่ 4: เปิด GitHub Pages

1. ไปที่ repo บน GitHub
2. Settings > Pages
3. Source: **GitHub Actions**
4. รอ deploy เสร็จ (ดูที่ Actions tab)
5. เข้าเว็บที่ `https://YOUR_USERNAME.github.io/vacation-leave/`

---

## ⚠️ หมายเหตุ

ถ้า repo ไม่ได้ชื่อ `YOUR_USERNAME.github.io` ต้องแก้ `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/vacation-leave',  // ← ใส่ชื่อ repo
  images: { unoptimized: true },
}
```

---

## 📁 โครงสร้างไฟล์

```
vacation-leave-nextjs/
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js             # หน้าหลัก
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```
