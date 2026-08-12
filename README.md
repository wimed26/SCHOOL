# SIMPAN — Platform Administrasi Sekolah Digital

Platform administrasi sekolah digital untuk mengelola absensi, uang kas, dan tabungan siswa secara terintegrasi.

## Teknologi yang Digunakan

- **React 18** — Frontend Framework
- **Vite** — Build Tool & Dev Server
- **Tailwind CSS** — Styling & Design System
- **Base44 BaaS** — Backend, Database & Auth
- **shadcn/ui (Radix UI)** — UI Component Library
- **Recharts** — Data Visualization
- **react-router-dom** — Routing
- **exceljs** — Excel Export
- **JSZip + file-saver** — ZIP File Creation
- **lucide-react** — Iconography
- **date-fns + moment** — Date Utilities
- **@tanstack/react-query** — Data Fetching & Cache
- **framer-motion** — Animations
- **qrcode.react** — QR Code Generation
- **html5-qrcode** — QR Code Scanning

## Struktur Folder

```
project/
├── base44/
│   ├── entities/
│   │   ├── AcademicYear.jsonc
│   │   ├── ActivityLog.jsonc
│   │   ├── Announcement.jsonc
│   │   ├── Attendance.jsonc
│   │   ├── AttendanceSetting.jsonc
│   │   ├── CashTransaction.jsonc
│   │   ├── ClassRoom.jsonc
│   │   ├── DownloadLog.jsonc
│   │   ├── File.jsonc
│   │   ├── NotificationSetting.jsonc
│   │   ├── RolePermission.jsonc
│   │   ├── SavingsTransaction.jsonc
│   │   ├── Student.jsonc
│   │   ├── Subject.jsonc
│   │   ├── Task.jsonc
│   │   ├── Teacher.jsonc
│   │   └── User.jsonc
│   └── config.jsonc
├── src/
│   ├── api/
│   │   └── base44Client.js
│   ├── components/
│   │   ├── ui/
│   │   │   ├── accordion.jsx
│   │   │   ├── alert-dialog.jsx
│   │   │   ├── alert.jsx
│   │   │   ├── aspect-ratio.jsx
│   │   │   ├── avatar.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── breadcrumb.jsx
│   │   │   ├── button.jsx
│   │   │   ├── calendar.jsx
│   │   │   ├── card.jsx
│   │   │   ├── carousel.jsx
│   │   │   ├── chart.jsx
│   │   │   ├── checkbox.jsx
│   │   │   ├── collapsible.jsx
│   │   │   ├── command.jsx
│   │   │   ├── context-menu.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── drawer.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── form.jsx
│   │   │   ├── hover-card.jsx
│   │   │   ├── image.jsx
│   │   │   ├── input-otp.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── menubar.jsx
│   │   │   ├── navigation-menu.jsx
│   │   │   ├── pagination.jsx
│   │   │   ├── popover.jsx
│   │   │   ├── progress.jsx
│   │   │   ├── radio-group.jsx
│   │   │   ├── resizable.jsx
│   │   │   ├── scroll-area.jsx
│   │   │   ├── select.jsx
│   │   │   ├── separator.jsx
│   │   │   ├── sheet.jsx
│   │   │   ├── sidebar.jsx
│   │   │   ├── skeleton.jsx
│   │   │   ├── slider.jsx
│   │   │   ├── sonner.jsx
│   │   │   ├── switch.jsx
│   │   │   ├── table.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── toast.jsx
│   │   │   ├── toaster.jsx
│   │   │   ├── toggle-group.jsx
│   │   │   ├── toggle.jsx
│   │   │   ├── tooltip.jsx
│   │   │   └── use-toast.jsx
│   │   ├── AuthLayout.jsx
│   │   ├── GoogleIcon.jsx
│   │   ├── Layout.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── ScrollToTop.jsx
│   │   ├── StatCard.jsx
│   │   ├── UserNotRegisteredError.jsx
│   │   └── WaitingApproval.jsx
│   ├── hooks/
│   │   ├── use-mobile.jsx
│   │   └── use-size.jsx
│   ├── lib/
│   │   ├── app-params.js
│   │   ├── AuthContext.jsx
│   │   ├── authReturnTo.js
│   │   ├── excelExport.js
│   │   ├── PageNotFound.jsx
│   │   ├── query-client.js
│   │   ├── rolePermissions.js
│   │   ├── sourceCodeExport.js
│   │   └── utils.js
│   ├── pages/
│   │   ├── Account.jsx
│   │   ├── ActivityLogs.jsx
│   │   ├── AdminSettings.jsx
│   │   ├── AnnouncementArchive.jsx
│   │   ├── Announcements.jsx
│   │   ├── ArchiveReports.jsx
│   │   ├── Attendance.jsx
│   │   ├── AttendanceAnalytics.jsx
│   │   ├── BarcodeScan.jsx
│   │   ├── Cash.jsx
│   │   ├── Classes.jsx
│   │   ├── ClassManagement.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ExportSourceCode.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── HelpCenter.jsx
│   │   ├── Login.jsx
│   │   ├── MonthlyReports.jsx
│   │   ├── MyBarcode.jsx
│   │   ├── NotificationsSettings.jsx
│   │   ├── OAuthConsent.jsx
│   │   ├── Pembukuan.jsx
│   │   ├── Register.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── RolePermissions.jsx
│   │   ├── Savings.jsx
│   │   ├── SavingsDetails.jsx
│   │   ├── StudentBarcodes.jsx
│   │   ├── Students.jsx
│   │   ├── Teachers.jsx
│   │   ├── TransactionHistory.jsx
│   │   ├── UserManagement.jsx
│   │   └── UserVerification.jsx
│   ├── utils/
│   │   └── index.ts
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── components.json
├── eslint.config.js
├── index.html
├── jsconfig.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── vite.config.js
```

## Cara Install Dependency

```bash
npm install
```

## Konfigurasi Environment Variable

Aplikasi ini menggunakan **Base44 BaaS** yang menangani konfigurasi database, autentikasi, dan API secara otomatis.

Tidak diperlukan environment variable tambahan untuk menjalankan aplikasi di lingkungan Base44.
Lihat file `.env.example` untuk referensi variabel yang mungkin diperlukan jika dikembangkan di luar Base44.

## Cara Menjalankan Development Server

```bash
npm run dev
```

Server development akan berjalan di `http://localhost:5173`

## Build Production

```bash
npm run build
```

Hasil build akan berada di folder `dist/`.

## Preview Build

```bash
npm run preview
```

## Database & API

Aplikasi ini menggunakan **Base44 BaaS** untuk:

- **Database** — Schema entity-based (JSON schemas di `base44/entities/`)
- **Autentikasi** — Email/Password, Google OAuth, OTP verification
- **File Storage** — Upload dan manajemen file
- **API Functions** — Backend functions di `base44/functions/`
- **Real-time** — Subscriptions untuk update data real-time
- **Integrations** — LLM, Email, Push Notification, dll.

Lihat `DATABASE_EXPORT_INFO.md` untuk informasi lengkap tentang apa yang dapat dan tidak dapat diekspor.

## Informasi Export

| Item | Nilai |
|------|-------|
| Total File Source Code | 138 |
| Total Ukuran Source | ~502 KB |
| Tanggal Export | 2026-08-12 |
| Platform Asal | Base44 BaaS |

## Catatan Penting

1. Source code ini adalah **snapshot** yang diambil pada tanggal export di atas.
2. **Data database TIDAK termasuk** dalam export ini (lihat `DATABASE_EXPORT_INFO.md`).
3. **Akun pengguna** dikelola oleh Base44 Auth dan tidak dapat diekspor sebagai source code.
4. **File yang diunggah pengguna** tersimpan di Base44 Storage dan tidak termasuk dalam export.
5. Untuk mengembangkan aplikasi ini di lingkungan lain, Anda memerlukan akses ke platform Base44 atau migrasi backend ke solusi alternatif.
6. File `.npmrc` dan `package-lock.json` sengaja tidak disertakan karena mungkin berisi token otentikasi dan dapat dibuat ulang dengan `npm install`.

---
Generated by SIMPAN Source Code Export — 2026-08-12
