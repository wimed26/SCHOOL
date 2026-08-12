import React from "react";
import { Link } from "react-router-dom";
import { UserCheck, Shield, UserCog } from "lucide-react";

const SETTING_ITEMS = [
  { to: "/user-verification", label: "Verifikasi Pengguna", desc: "Setujui pengguna baru dan kelola status akses", icon: UserCheck, color: "bg-emerald-100 text-emerald-600" },
  { to: "/role-permissions", label: "Hak Akses", desc: "Atur halaman yang dapat diakses tiap role", icon: Shield, color: "bg-blue-100 text-blue-600" },
  { to: "/pengguna", label: "Manajemen Pengguna", desc: "Kelola daftar pengguna dan role mereka", icon: UserCog, color: "bg-violet-100 text-violet-600" },
];

export default function AdminSettings() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola pengaturan administrasi sistem</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTING_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="group rounded-2xl border border-border/60 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} transition-transform group-hover:scale-110`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold">{item.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}