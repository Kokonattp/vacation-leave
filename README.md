# ระบบลาพักร้อน - QC TEAM

ระบบจัดการวันลาพักร้อนสำหรับทีม QC

## 🚀 วิธี Deploy บน Vercel

1. สร้าง Repository ใหม่บน GitHub
2. Upload ไฟล์ทั้งหมดในโฟลเดอร์นี้
3. ไปที่ [Vercel](https://vercel.com)
4. Import repository จาก GitHub
5. กด Deploy

## 📁 โครงสร้างไฟล์

```
vacation-leave/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── next.config.js
├── package.json
└── README.md
```

## ⚙️ Supabase Configuration

URL: `https://kylizhmvqpzdhylzvwog.supabase.co`

### ตาราง SQL

```sql
-- ตารางพนักงาน
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ตารางวันลา
CREATE TABLE leaves (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_date DATE DEFAULT CURRENT_DATE,
  created_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for leaves" ON leaves FOR ALL USING (true) WITH CHECK (true);
```

## 📱 Responsive

- Desktop (>900px): ฟอร์มซ้าย ปฏิทินขวา
- Mobile (<900px): ฟอร์มบน ปฏิทินล่าง
