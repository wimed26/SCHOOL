import React from "react";
import { CalendarCheck, Wallet, PiggyBank, BookOpen, HelpCircle, Shield, MessageCircle } from "lucide-react";

const guides = [
  {
    icon: CalendarCheck,
    title: "Absensi",
    color: "bg-emerald-100 text-emerald-600",
    steps: [
      "Buka menu 'Absensi' di sidebar.",
      "Pilih tanggal dan kelas pada filter di bagian atas.",
      "Untuk setiap siswa, pilih status kehadiran: Hadir, Izin, Sakit, Alpha, atau Terlambat.",
      "Klik 'Simpan' untuk menyimpan data absensi.",
      "Gunakan tombol 'Export' untuk mengunduh rekap absensi bulanan dalam format CSV.",
    ],
  },
  {
    icon: Wallet,
    title: "Uang Kas",
    color: "bg-blue-100 text-blue-600",
    steps: [
      "Buka menu 'Uang Kas' di sidebar.",
      "Klik 'Tambah Transaksi' untuk mencatat pemasukan atau pengeluaran kas.",
      "Pilih jenis transaksi (Masuk/Keluar), masukkan jumlah, dan keterangan.",
      "Sistem otomatis menghitung total kas masuk, keluar, dan saldo saat ini.",
      "Riwayat transaksi tersedia di tabel bagian bawah halaman.",
    ],
  },
  {
    icon: PiggyBank,
    title: "Tabungan",
    color: "bg-violet-100 text-violet-600",
    steps: [
      "Buka menu 'Tabungan' untuk melihat ringkasan tabungan semua siswa.",
      "Klik 'Tambah Transaksi' untuk mencatat setoran atau penarikan.",
      "Pilih siswa, jenis (Setor/Tarik), jumlah, dan tanggal.",
      "Gunakan menu 'Buku Tabungan' untuk melihat riwayat transaksi detail per siswa.",
      "Saldo otomatis terupdate setiap kali ada transaksi baru.",
    ],
  },
  {
    icon: BookOpen,
    title: "Data Kelas & Siswa",
    color: "bg-amber-100 text-amber-600",
    steps: [
      "Menu 'Data Siswa' untuk menambah, mengubah, atau menghapus data siswa.",
      "Menu 'Data Kelas' untuk melihat kelas dan siswanya. Klik kelas untuk detail.",
      "Menu 'Manajemen Kelas' (admin) untuk mengelola kelas dan tahun ajaran.",
      "Pada detail kelas, Anda dapat melihat rekap absensi bulanan dan mengunduhnya.",
    ],
  },
];

export default function HelpCenter() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Pusat Bantuan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Panduan singkat mengoperasikan fitur aplikasi</p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><HelpCircle className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-bold text-primary">Selamat datang di SIMPAN!</h3>
            <p className="mt-1 text-sm text-muted-foreground">Platform administrasi sekolah untuk mengelola absensi, uang kas, dan tabungan siswa. Pilih topik di bawah untuk mempelajari cara menggunakan setiap fitur.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <div key={guide.title} className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${guide.color}`}><Icon className="h-5 w-5" /></div>
                <h3 className="text-base font-bold">{guide.title}</h3>
              </div>
              <ol className="space-y-2">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Shield className="h-4 w-4 text-primary" /> Role & Hak Akses</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-700">Admin</p>
            <p className="mt-1 text-xs text-muted-foreground">Akses penuh ke semua fitur, manajemen pengguna, dan pengaturan sistem.</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-700">User</p>
            <p className="mt-1 text-xs text-muted-foreground">Akses sesuai hak akses yang ditentukan oleh admin melalui menu Hak Akses.</p>
          </div>
          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-sm font-bold text-violet-700">Siswa</p>
            <p className="mt-1 text-xs text-muted-foreground">Akses terbatas sesuai konfigurasi admin, biasanya untuk melihat data sendiri.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white"><MessageCircle className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-bold text-emerald-800">Butuh Bantuan Lebih?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Hubungi admin melalui WhatsApp untuk pertanyaan atau bantuan teknis.</p>
            <a href="https://wa.me/6285361676130" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600">
              <MessageCircle className="h-4 w-4" /> M Harry R - Admin App (085361676130)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}