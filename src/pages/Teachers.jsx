import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GraduationCap, Mail, Phone, Book, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportToExcel } from "@/lib/excelExport";
import { useAuth } from "@/lib/AuthContext";

export default function Teachers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "" });

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Teacher.list();
      setTeachers(data);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm({ name: "", phone: "", email: "", subject: "" }); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name || "", phone: t.phone || "", email: t.email || "", subject: t.subject || "" }); setDialogOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await base44.entities.Teacher.update(editing.id, form); toast({ title: "Guru diperbarui" }); }
      else { await base44.entities.Teacher.create(form); toast({ title: "Guru ditambahkan" }); }
      setDialogOpen(false); fetchTeachers();
    } catch (err) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  };

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "Nama", key: "name" },
      { header: "Mata Pelajaran", key: "subject" },
      { header: "Email", key: "email" },
      { header: "No HP", key: "phone" },
    ];
    const rows = teachers.map((t, i) => ({
      no: i + 1,
      name: t.name || "-",
      subject: t.subject || "-",
      email: t.email || "-",
      phone: t.phone || "-",
    }));
    await exportToExcel({
      filename: `Data_Guru_${today}.xlsx`,
      moduleName: "Daftar Guru",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [{ label: "Jumlah Data", value: teachers.length }],
    });
    toast({ title: "Export Excel berhasil" });
  };

  const handleDelete = async (t) => {
    if (!confirm(`Hapus guru "${t.name}"?`)) return;
    await base44.entities.Teacher.delete(t.id);
    toast({ title: "Guru dihapus" });
    fetchTeachers();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Daftar Guru</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola data staf pengajar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export Excel</Button>
          {isAdmin && <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Tambah Guru</Button>}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Memuat...</div>
      ) : teachers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
          <p>Belum ada guru</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
            <div key={t.id} className="group rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                  <GraduationCap className="h-5 w-5" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-lg font-bold">{t.name}</h3>
              {t.subject && <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Book className="h-3.5 w-3.5" /> {t.subject}</p>}
              <div className="mt-3 space-y-1">
                {t.email && <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {t.email}</p>}
                {t.phone && <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {t.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Guru" : "Tambah Guru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Nama *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Mata Pelajaran</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Nomor HP</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editing ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}