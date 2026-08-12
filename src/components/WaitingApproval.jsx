import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function WaitingApproval({ user }) {
  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30 p-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold tracking-tight">Menunggu Persetujuan Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akun Anda belum disetujui oleh admin. Silakan hubungi admin sekolah untuk mengaktifkan akses akun Anda.
        </p>
        {user?.email && (
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium">{user.email}</p>
        )}
        <Button onClick={handleLogout} variant="outline" className="mt-5 w-full">
          <LogOut className="mr-1.5 h-4 w-4" /> Keluar
        </Button>
      </div>
    </div>
  );
}