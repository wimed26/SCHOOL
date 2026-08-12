import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Save, CalendarCheck, Wallet, PiggyBank, Megaphone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const NOTIF_TYPES = [
  { key: "attendance_notif", label: "Notifikasi Absensi", desc: "Pemberitahuan saat absensi dicatat atau diperbarui", icon: CalendarCheck, color: "bg-emerald-100 text-emerald-600" },
  { key: "cash_notif", label: "Notifikasi Kas", desc: "Pemberitahuan saat ada transaksi kas masuk atau keluar", icon: Wallet, color: "bg-blue-100 text-blue-600" },
  { key: "savings_notif", label: "Notifikasi Tabungan", desc: "Pemberitahuan saat ada setoran atau penarikan tabungan", icon: PiggyBank, color: "bg-violet-100 text-violet-600" },
  { key: "announcement_notif", label: "Notifikasi Pengumuman", desc: "Pemberitahuan saat ada pengumuman baru dari sekolah", icon: Megaphone, color: "bg-amber-100 text-amber-600" },
];

export default function NotificationsSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    attendance_notif: true, cash_notif: true, savings_notif: true, announcement_notif: true,
  });
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.NotificationSetting.filter({});
      if (data.length > 0) {
        setRecordId(data[0].id);
        setSettings({
          attendance_notif: data[0].attendance_notif ?? true,
          cash_notif: data[0].cash_notif ?? true,
          savings_notif: data[0].savings_notif ?? true,
          announcement_notif: data[0].announcement_notif ?? true,
        });
      }
    } catch (e) { toast({ title: "Gagal memuat pengaturan", variant: "destructive" }); }
    setLoading(false);
  };

  const toggle = (key) => { setSettings((prev) => ({ ...prev, [key]: !prev[key] })); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (recordId) { await base44.entities.NotificationSetting.update(recordId, settings); }
      else { const created = await base44.entities.NotificationSetting.create(settings); setRecordId(created.id); }
      toast({ title: "Pengaturan notifikasi disimpan" });
    } catch (e) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Pengaturan Notifikasi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pilih jenis notifikasi yang ingin Anda terima</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bell className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-bold">Preferensi Notifikasi</h3>
            <p className="text-xs text-muted-foreground">Aktifkan atau nonaktifkan jenis notifikasi</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Memuat...</div>
        ) : (
          <div className="space-y-2">
            {NOTIF_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <label key={type.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${settings[type.key] ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/30"}`}>
                  <Checkbox checked={settings[type.key]} onCheckedChange={() => toggle(type.key)} />
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${type.color}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>
    </div>
  );
}