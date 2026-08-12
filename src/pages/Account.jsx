import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { Camera, Save, LogOut, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Image } from "@/components/ui/image";

export default function Account() {
  const { toast } = useToast();
  const { user, checkUserAuth, logout } = useAuth();
  const [name, setName] = useState(user?.full_name || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [myStudent, setMyStudent] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const students = await base44.entities.Student.list();
        const match = students.find((s) => s.name?.toLowerCase().trim() === user?.full_name?.toLowerCase().trim());
        setMyStudent(match || null);
      } catch (e) {}
    };
    if (user) fetchStudent();
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      toast({ title: "Foto terunggah", description: "Klik Simpan untuk menyimpan perubahan" });
    } catch (err) {
      toast({ title: "Gagal mengunggah foto", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: name, photo_url: photoUrl });
      await checkUserAuth();
      toast({ title: "Profil diperbarui" });
    } catch (err) {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ubah foto profil dan nama Anda</p>
      </div>

      <form onSubmit={handleSave} className="max-w-md space-y-5">
        <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-bold text-white">
                {photoUrl ? (
                  <Image src={photoUrl} className="h-full w-full" fittingType="fill" />
                ) : (
                  (name || user?.email || "A").charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-white shadow-sm hover:bg-muted">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" disabled={uploading} />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">{uploading ? "Mengunggah..." : "Klik ikon kamera untuk mengubah foto"}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
          <div>
            <Label>Nama Lengkap</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama lengkap" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
            <p className="mt-1 text-xs text-muted-foreground">Email tidak dapat diubah</p>
          </div>
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
            <Save className="mr-1.5 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>

      {myStudent && (
        <div className="max-w-md rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><QrCode className="h-4 w-4" /> QR Code Saya</h3>
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center rounded-xl bg-muted/30 p-4">
              <QRCodeSVG value={JSON.stringify({ nis: myStudent.nis || "", name: myStudent.name || "", class: myStudent.class_name || "", gender: myStudent.gender || "" })} size={160} level="M" />
            </div>
            <div className="text-center">
              <p className="font-bold">{myStudent.name}</p>
              <p className="text-sm text-muted-foreground">NIS: {myStudent.nis}</p>
              <p className="text-sm text-muted-foreground">{myStudent.class_name || "-"} · {myStudent.gender === "L" ? "Laki-laki" : myStudent.gender === "P" ? "Perempuan" : "-"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-rose-700">Keluar dari Akun</h3>
        <p className="mt-1 text-xs text-muted-foreground">Anda akan keluar dari aplikasi dan perlu login kembali</p>
        <Button variant="destructive" onClick={() => logout()} className="mt-3">
          <LogOut className="mr-1.5 h-4 w-4" /> Keluar
        </Button>
      </div>
    </div>
  );
}