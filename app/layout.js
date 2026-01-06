import './globals.css'

export const metadata = {
  title: 'ระบบลาพักร้อน - QC TEAM',
  description: 'ระบบจัดการวันลาพักร้อนสำหรับทีม QC',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
