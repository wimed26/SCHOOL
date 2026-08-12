import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Users, School, CalendarCheck, Wallet,
  PiggyBank, Megaphone, LogOut, Menu, X, GraduationCap, UserCog, Settings,
  FileText, BarChart3, ScrollText, UserCheck, Shield,
  BookOpen, ClipboardList, HelpCircle, Bell,
  Archive, ArrowLeftRight, Calculator, Printer, ScanLine, QrCode, FileArchive } from
"lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getRolePermissions, isRouteAllowed } from "@/lib/rolePermissions";
import NotificationBell from "@/components/NotificationBell";

const baseNavItems = [
{ to: "/", label: "Dashboard", icon: LayoutDashboard },
{ to: "/siswa", label: "Data Siswa", icon: Users },
{ to: "/kelas", label: "Data Kelas", icon: School },
{ to: "/absensi", label: "Absensi", icon: CalendarCheck },
{ to: "/student-barcodes", label: "Barcode Siswa", icon: Printer },
{ to: "/barcode-scan", label: "Scan Absensi", icon: ScanLine },
{ to: "/attendance-analytics", label: "Grafik Kehadiran", icon: BarChart3 },
{ to: "/pembukuan", label: "Pembukuan", icon: Calculator },
{ to: "/pengumuman", label: "Pengumuman", icon: Megaphone },
{ to: "/help-center", label: "Pusat Bantuan", icon: HelpCircle },
{ to: "/notification-settings", label: "Notifikasi", icon: Bell }];


const adminNavItems = [
{ to: "/monthly-reports", label: "Laporan Bulanan", icon: FileText },
{ to: "/archive-reports", label: "Arsip Laporan", icon: Archive },
{ to: "/activity-logs", label: "Log Aktivitas", icon: ScrollText },
{ to: "/class-management", label: "Manajemen Kelas", icon: ClipboardList },
{ to: "/teacher-management", label: "Data Guru", icon: GraduationCap },
{ to: "/transaction-history", label: "Daftar Transaksi", icon: ArrowLeftRight },
{ to: "/announcement-archive", label: "Galeri Pengumuman", icon: Megaphone },
{ to: "/export-source-code", label: "Export Source Code", icon: FileArchive },
{ to: "/settings", label: "Pengaturan", icon: Settings }];


export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allowedRoutes, setAllowedRoutes] = useState(undefined);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) return;
    getRolePermissions(user?.role).then(setAllowedRoutes);
  }, [isAdmin]);

  const navItems = isAdmin
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems.filter((n) => isRouteAllowed(n.to, allowedRoutes));

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const NavLinks = () =>
  <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
      const Icon = item.icon;
      const active = location.pathname === item.to;
      return (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
          active ?
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20" :
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`
          }>
          
            <Icon className={`h-[18px] w-[18px] shrink-0 ${item.to === "/tabungan" ? "animate-wallet-bounce" : ""}`} />
            {item.label}
          </Link>);

    })}
    </nav>;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-white/80 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-800 text-white shadow-lg shadow-primary/30">
            <GraduationCap className="h-5 w-5 animate-float" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-foreground">SIMPAN KITA</h1>
            <p className="text-[10px] font-medium text-muted-foreground">Admin Sekolah Digital</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks />
        </div>
        <div className="border-t border-border/60 p-3">
          <Link
            to="/akun"
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              location.pathname === "/akun" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Settings className="h-[18px] w-[18px]" />
            Akun
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive">
            
            <LogOut className="h-[18px] w-[18px]" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen &&
      <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-800 text-white shadow-lg">
                  <GraduationCap className="h-5 w-5 animate-float" />
                </div>
                <h1 className="text-base font-extrabold tracking-tight">SIMPAN</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-2"><NavLinks /></div>
            <div className="border-t border-border/60 p-3">
              <Link
                to="/akun"
                onClick={() => setSidebarOpen(false)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  location.pathname === "/akun" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Settings className="h-[18px] w-[18px]" /> Akun
              </Link>
              <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-[18px] w-[18px]" /> Keluar
              </button>
            </div>
          </aside>
        </div>
      }

      {/* Floating Navigation Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-800 text-white shadow-xl shadow-primary/40 transition-transform hover:scale-110 active:scale-95 lg:hidden"
        aria-label="Buka navigasi"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-white/80 px-4 py-3.5 backdrop-blur-xl lg:px-8">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              {navItems.find((n) => n.to === location.pathname)?.label || "SIMPAN"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/akun" className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-blue-800 text-sm font-bold text-white transition-all hover:ring-2 hover:ring-primary/30">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="Foto" className="h-full w-full object-cover" />
              ) : (
                (user?.full_name || user?.email || "A").charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>);

}