import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, todayStr } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const PRIORITY_CONFIG = {
  tinggi: { label: "Tinggi", color: "bg-rose-100 text-rose-700 border-rose-200" },
  sedang: { label: "Sedang", color: "bg-amber-100 text-amber-700 border-amber-200" },
  rendah: { label: "Rendah", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export default function Announcements() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", date: todayStr(), priority: "sedang" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Announcement.list("-date");
      setAnnouncements(data);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm({ title: "", content: "", date: todayStr(), priority: "sedang" }); setDialogOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ title: a.title || "", content: a.content || "", date: a.date || todayStr(), priority: a.priority || "sedang" }); setDialogOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await base44.entities.Announcement.update(editing.id, form); toast({ title: "Pengumuman diperbarui" }); }
      else { await base44.entities.Announcement.create(form); toast({ title: "Pengumuman ditambahkan" }); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  };

  const handleDelete = async (a) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    await base44.entities.Announcement.delete(a.id);
    toast({ title: "Pengumuman dihapus" });
    fetchData();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Pengumuman</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola pengumuman untuk siswa dan orang tua</p>
        </div>
        {isAdmin && <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Tambah Pengumuman</Button>}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Memuat...</div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Megaphone className="h-12 w-12 text-muted-foreground/40" />
          <p>Belum ada pengumuman</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="group rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{a.title}</h3>
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${PRIORITY_CONFIG[a.priority]?.color || PRIORITY_CONFIG.sedang.color}`}>
                      {PRIORITY_CONFIG[a.priority]?.label || "Sedang"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.date)}</p>
                  <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">{a.content}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Pengumuman" : "Tambah Pengumuman"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Judul *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div>
              <Label>Prioritas</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tinggi">Tinggi</SelectItem>
                  <SelectItem value="sedang">Sedang</SelectItem>
                  <SelectItem value="rendah">Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tanggal</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Isi *</Label><Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
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