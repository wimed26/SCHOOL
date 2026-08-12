import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Save, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { invalidateRolePermissions } from "@/lib/rolePermissions";

const AVAILABLE_ROUTES = [
  { to: "/", label: "Dashboard" },
  { to: "/siswa", label: "Data Siswa" },
  { to: "/kelas", label: "Data Kelas" },
  { to: "/absensi", label: "Absensi" },
  { to: "/attendance-analytics", label: "Grafik Kehadiran" },
  { to: "/kas", label: "Uang Kas" },
  { to: "/tabungan", label: "Tabungan" },
  { to: "/savings-details", label: "Buku Tabungan" },
  { to: "/pengumuman", label: "Pengumuman" },
  { to: "/announcement-archive", label: "Galeri Pengumuman" },
  { to: "/transaction-history", label: "Daftar Transaksi" },
  { to: "/pembukuan", label: "Pembukuan" },
  { to: "/student-barcodes", label: "Barcode Siswa" },
  { to: "/barcode-scan", label: "Scan Absensi" },
  { to: "/help-center", label: "Pusat Bantuan" },
  { to: "/notification-settings", label: "Notifikasi" },
];

const MANAGED_ROLES = [
  { value: "user", label: "User" },
  { value: "siswa", label: "Siswa" },
];

export default function RolePermissions() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("user");
  const [allowed, setAllowed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(null);

  useEffect(() => { fetchPermissions(selectedRole); }, [selectedRole]);

  const fetchPermissions = async (role) => {
    setLoading(true);
    try {
      const data = await base44.entities.RolePermission.filter({ role });
      if (data.length > 0) {
        setRecordId(data[0].id);
        setAllowed(data[0].allowed_routes?.split(",").filter(Boolean) || AVAILABLE_ROUTES.map((r) => r.to));
      } else {
        setRecordId(null);
        setAllowed(AVAILABLE_ROUTES.map((r) => r.to));
      }
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const toggle = (route) => {
    setAllowed((prev) => prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { role: selectedRole, allowed_routes: allowed.join(",") };
      if (recordId) {
        await base44.entities.RolePermission.update(recordId, payload);
      } else {
        const created = await base44.entities.RolePermission.create(payload);
        setRecordId(created.id);
      }
      invalidateRolePermissions();
      toast({ title: "Hak akses disimpan" });
    } catch (e) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Hak Akses Role</h1>
        <p className="mt-1 text-sm text-muted-foreground">Atur halaman apa saja yang dapat diakses oleh tiap role</p>
      </div>

      <div className="flex gap-2">
        {MANAGED_ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => setSelectedRole(r.value)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${selectedRole === r.value ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-bold">Role: {MANAGED_ROLES.find((r) => r.value === selectedRole)?.label}</h3>
            <p className="text-xs text-muted-foreground">Centang halaman yang boleh diakses</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Memuat...</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AVAILABLE_ROUTES.map((route) => (
              <label key={route.to} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all ${allowed.includes(route.to) ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/30"}`}>
                <Checkbox checked={allowed.includes(route.to)} onCheckedChange={() => toggle(route.to)} />
                <span className="text-sm font-medium">{route.label}</span>
                {allowed.includes(route.to) && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
              </label>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Hak Akses"}
          </Button>
        </div>
      </div>
    </div>
  );
}