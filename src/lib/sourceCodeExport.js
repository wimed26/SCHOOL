export const APP_NAME = "SIMPAN";
export const APP_DESCRIPTION =
  "Platform administrasi sekolah digital untuk mengelola absensi, uang kas, dan tabungan siswa secara terintegrasi.";

export const TECH_STACK = [
  { name: "React 18", category: "Frontend Framework" },
  { name: "Vite", category: "Build Tool & Dev Server" },
  { name: "Tailwind CSS", category: "Styling & Design System" },
  { name: "Base44 BaaS", category: "Backend, Database & Auth" },
  { name: "shadcn/ui (Radix UI)", category: "UI Component Library" },
  { name: "Recharts", category: "Data Visualization" },
  { name: "react-router-dom", category: "Routing" },
  { name: "exceljs", category: "Excel Export" },
  { name: "JSZip + file-saver", category: "ZIP File Creation" },
  { name: "lucide-react", category: "Iconography" },
  { name: "date-fns + moment", category: "Date Utilities" },
  { name: "@tanstack/react-query", category: "Data Fetching & Cache" },
  { name: "framer-motion", category: "Animations" },
  { name: "qrcode.react", category: "QR Code Generation" },
  { name: "html5-qrcode", category: "QR Code Scanning" },
];

export function buildFileTree(filePaths) {
  const root = { name: "", children: {}, isDir: true };
  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (!current.children[part]) {
        current.children[part] = { name: part, isDir: !isLast, children: {} };
      }
      current = current.children[part];
    }
  }
  return root;
}

function sortChildren(children) {
  return Object.values(children).sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function formatTreeNode(node, prefix, isLast) {
  const connector = isLast ? "└── " : "├── ";
  let result = prefix + connector + node.name + (node.isDir ? "/" : "") + "\n";
  if (node.isDir) {
    const children = sortChildren(node.children);
    const newPrefix = prefix + (isLast ? "    " : "│   ");
    children.forEach((child, i) => {
      result += formatTreeNode(child, newPrefix, i === children.length - 1);
    });
  }
  return result;
}

export function formatTree(rootNode) {
  let result = "project/\n";
  const children = sortChildren(rootNode.children);
  children.forEach((child, i) => {
    result += formatTreeNode(child, "", i === children.length - 1);
  });
  return result;
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(size < 10 && unitIdx > 0 ? 1 : 0)} ${units[unitIdx]}`;
}

export function generateReadme(filePaths, totalSizeBytes) {
  const fileCount = filePaths.length;
  const tree = formatTree(buildFileTree(filePaths));
  const today = new Date().toISOString().slice(0, 10);

  return `# SIMPAN — Platform Administrasi Sekolah Digital

${APP_DESCRIPTION}

## Teknologi yang Digunakan

${TECH_STACK.map((t) => `- **${t.name}** — ${t.category}`).join("\n")}

## Struktur Folder

\`\`\`
${tree}\`\`\`

## Cara Install Dependency

\`\`\`bash
npm install
\`\`\`

## Konfigurasi Environment Variable

Aplikasi ini menggunakan **Base44 BaaS** yang menangani konfigurasi database, autentikasi, dan API secara otomatis.

Tidak diperlukan environment variable tambahan untuk menjalankan aplikasi di lingkungan Base44.
Lihat file \`.env.example\` untuk referensi variabel yang mungkin diperlukan jika dikembangkan di luar Base44.

## Cara Menjalankan Development Server

\`\`\`bash
npm run dev
\`\`\`

Server development akan berjalan di \`http://localhost:5173\`

## Build Production

\`\`\`bash
npm run build
\`\`\`

Hasil build akan berada di folder \`dist/\`.

## Preview Build

\`\`\`bash
npm run preview
\`\`\`

## Database & API

Aplikasi ini menggunakan **Base44 BaaS** untuk:

- **Database** — Schema entity-based (JSON schemas di \`base44/entities/\`)
- **Autentikasi** — Email/Password, Google OAuth, OTP verification
- **File Storage** — Upload dan manajemen file
- **API Functions** — Backend functions di \`base44/functions/\`
- **Real-time** — Subscriptions untuk update data real-time
- **Integrations** — LLM, Email, Push Notification, dll.

Lihat \`DATABASE_EXPORT_INFO.md\` untuk informasi lengkap tentang apa yang dapat dan tidak dapat diekspor.

## Informasi Export

| Item | Nilai |
|------|-------|
| Total File Source Code | ${fileCount} |
| Total Ukuran Source | ~${(totalSizeBytes / 1024).toFixed(0)} KB |
| Tanggal Export | ${today} |
| Platform Asal | Base44 BaaS |

## Catatan Penting

1. Source code ini adalah **snapshot** yang diambil pada tanggal export di atas.
2. **Data database TIDAK termasuk** dalam export ini (lihat \`DATABASE_EXPORT_INFO.md\`).
3. **Akun pengguna** dikelola oleh Base44 Auth dan tidak dapat diekspor sebagai source code.
4. **File yang diunggah pengguna** tersimpan di Base44 Storage dan tidak termasuk dalam export.
5. Untuk mengembangkan aplikasi ini di lingkungan lain, Anda memerlukan akses ke platform Base44 atau migrasi backend ke solusi alternatif.
6. File \`.npmrc\` dan \`package-lock.json\` sengaja tidak disertakan karena mungkin berisi token otentikasi dan dapat dibuat ulang dengan \`npm install\`.

---
Generated by SIMPAN Source Code Export — ${today}
`;
}

export function generateDatabaseInfo() {
  return `# Database Export Information

Dokumen ini menjelaskan bagian database dan backend mana saja yang dapat dan tidak dapat diekspor sebagai source code.

## Yang DAPAT Diekspor

### 1. Entity Schemas (Database Structure)
- **Lokasi**: \`base44/entities/\`
- **Format**: JSON schema (\`.jsonc\` files)
- **Isi**: Definisi struktur data untuk setiap entity (fields, types, validation, RLS rules)
- **Cara Pakai**: Schema ini mendefinisikan struktur database. Di platform Base44, entity dibuat berdasarkan schema ini.

### 2. Backend Functions
- **Lokasi**: \`base44/functions/\`
- **Format**: TypeScript (\`.ts\` files)
- **Isi**: Custom API endpoints, integrasi dengan layanan eksternal
- **Catatan**: Fungsi ini berjalan di runtime Deno Base44

### 3. Frontend Code
- **Lokasi**: \`src/\`
- **Isi**: Semua halaman, komponen, utility, hooks, dan logic frontend
- **Status**: Lengkap dan dapat diedit

### 4. Configuration Files
- \`package.json\` — Daftar dependency
- \`vite.config.js\` — Konfigurasi build
- \`tailwind.config.js\` — Konfigurasi styling
- \`index.html\` — Entry point HTML
- \`jsconfig.json\`, \`eslint.config.js\`, \`postcss.config.js\` — Config lainnya

## Yang TIDAK DAPAT Diekspor

### 1. Data Database Aktual
- **Status**: TIDAK tersedia sebagai source code
- **Alasan**: Data tersimpan di server database Base44 dan hanya dapat diakses melalui API
- **Alternatif**: Gunakan Base44 API (\`base44.entities.EntityName.list()\`) untuk mengambil data, lalu simpan sebagai JSON/CSV

### 2. Akun Pengguna (User Accounts)
- **Status**: TIDAK tersedia
- **Alasan**: Dikelola oleh Base44 Auth (password hash, session token, OAuth tokens)
- **Alternatif**: Buat ulang akun melalui sistem registrasi di aplikasi baru

### 3. File Uploads (User Files)
- **Status**: TIDAK tersedia
- **Alasan**: Tersimpan di Base44 Storage dengan URL yang spesifik per platform
- **Alternatif**: Gunakan Base44 API untuk mendapatkan file URLs, lalu download manual

### 4. Platform Internal Code
- **Status**: TIDAK tersedia
- **Alasan**: Kode internal Base44 (SDK, runtime, auth system) bersifat proprietary
- **Catatan**: \`@base44/sdk\` dan \`@base44/vite-plugin\` adalah package npm yang dapat diinstall

### 5. Environment Secrets
- **Status**: Sengaja TIDAK disertakan
- **Alasan**: Keamanan (API keys, tokens, credentials)
- **File yang dikecualikan**: \`.npmrc\`, \`.env*\`, \`package-lock.json\`

## Cara Backup Data (Jika Diperlukan)

### Via Base44 API (Frontend)
\`\`\`javascript
import { base44 } from '@/api/base44Client';

// Export semua data sebuah entity
const allStudents = await base44.entities.Student.list(null, 10000);
const jsonString = JSON.stringify(allStudents, null, 2);
// Simpan jsonString sebagai file backup
\`\`\`

### Via Base44 Dashboard
1. Login ke Base44 dashboard
2. Buka aplikasi
3. Navigasi ke Entities → pilih entity
4. Export data (jika fitur tersedia)

### Via GitHub Sync
1. Hubungkan repository GitHub di pengaturan Base44
2. Sync akan menyimpan source code ke GitHub
3. Data database tetap di Base44, tidak ikut tersync

## Migrasi ke Platform Lain

Jika Anda ingin mengembangkan aplikasi ini di luar Base44:

1. **Backend**: Ganti Base44 BaaS dengan alternatif (Supabase, Firebase, custom Node.js)
2. **Database**: Buat ulang schema berdasarkan \`base44/entities/\` (dalam format SQL/NoSQL)
3. **Auth**: Implementasi sistem autentikasi sendiri
4. **API**: Buat ulang API endpoints berdasarkan logika di \`base44/functions/\`
5. **File Storage**: Gunakan alternatif (AWS S3, Cloudinary, dll)
6. **Frontend**: Kode frontend (\`src/\`) dapat digunakan langsung dengan penyesuaian import path

---
Generated by SIMPAN Source Code Export
`;
}

export function generateEnvExample() {
  return `# Environment Variables Template
# Aplikasi SIMPAN menggunakan Base44 BaaS yang menangani konfigurasi secara otomatis.
# File ini disediakan sebagai referensi jika Anda ingin mengembangkan di luar Base44.

# Base44 Configuration (dikelola otomatis oleh platform)
# VITE_BASE44_API_URL=https://api.base44.com
# VITE_BASE44_APP_ID=your_app_id_here

# Database (jika migrasi dari Base44)
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Auth (jika implementasi sendiri)
# JWT_SECRET=your_jwt_secret_here
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Storage (jika migrasi dari Base44 Storage)
# S3_BUCKET=your_bucket_name
# S3_REGION=your_region
# S3_ACCESS_KEY=your_access_key
# S3_SECRET_KEY=your_secret_key

# Email Service (jika implementasi sendiri)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your_email@example.com
# SMTP_PASSWORD=your_password

# Catatan: Hanya masukkan nama variabel, JANGAN masukkan nilai rahasia.
# Salin file ini menjadi .env dan isi dengan nilai asli.
`;
}

export function generateGitignore() {
  return `# Dependencies
node_modules/
.pnp/
.pnp.js

# Build outputs
dist/
dist-ssr/
build/
*.local

# Environment files (JANGAN commit secrets)
.env
.env.local
.env.*.local
.env.production
.env.development

# IDE & Editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
logs/
*.log

# Cache
.cache/
.parcel-cache/
.eslintcache
.next/

# Base44 (platform-specific, jangan commit)
.npmrc
base44/.secrets/
`;
}