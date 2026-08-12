import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, School, Calendar, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function ClassManagement() {
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", homeroom_teacher: "", academic_year: "" });
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [yearForm, setYearForm] = useState({ semester: "Ganjil", school_year: "", is_active: true });
  const [teachers, setTeachers] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, s, y, t] = await Promise.all([
        base44.entities.ClassRoom.list(),
        base44.entities.Student.list(),
        base44.entities.AcademicYear.list("-school_year"),
        base44.entities.Teacher.list(),
      ]);
      setClasses(c); setStudents(s); setAcademicYears(y); setTeachers(t);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm({ name: "", homeroom_teacher: "", academic_year: "" }); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name || "", homeroom_teacher: c.homeroom_teacher || "", academic_year: c.academic_year || "" }); setDialogOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await base44.entities.ClassRoom.update(editing.id, form); toast({ title: "Kelas diperbarui" }); }
      else { await base44.entities.ClassRoom.create(form); toast({ title: "Kelas ditambahkan" }); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Hapus kelas "${c.name}"?`)) return;
    await base44.entities.ClassRoom.delete(c.id);
    toast({ title: "Kelas dihapus" });
    fetchData();
  };

  const openAddYear = () => { setYearForm({ semester: "Ganjil", school_year: "", is_active: true }); setYearDialogOpen(true); };

  const handleYearSubmit = async (e) => {
    e.preventDefault();
    try {
      if (yearForm.is_active) {
        for (const y of academicYears.filter((y) => y.is_active)) {
          await base44.entities.AcademicYear.update(y.id, { is_active: false });
        }
      }
      await base44.entities.AcademicYear.create(yearForm);
      toast({ title: "Tahun ajaran ditambahkan" });
      setYearDialogOpen(false); fetchData();
    } catch (err) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  };

  const toggleYearActive = async (y) => {
    try {
      if (!y.is_active) {
        for (const ay of academicYears.filter((ay) => ay.is_active && ay.id !== y.id)) {
          await base44.entities.AcademicYear.update(ay.id, { is_active: false });
        }
      }
      await base44.entities.AcademicYear.update(y.id, { is_active: !y.is_active });
      toast({ title: "Status tahun ajaran diperbarui" });
      fetchData();
    } catch (e) { toast({ title: "Gagal mengubah status", variant: "destructive" }); }
  };

  const deleteYear = async (y) => {
    if (!confirm(`Hapus tahun ajaran ${y.school_year} ${y.semester}?`)) return;
    await base44.entities.AcademicYear.delete(y.id);
    toast({ title: "Tahun ajaran dihapus" });
    fetchData();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Kelas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola daftar kelas, wali kelas, dan tahun ajaran aktif</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold"><Calendar className="h-4 w-4" /> Tahun Ajaran</h3>
          <Button size="sm" onClick={openAddYear} className="bg-primary hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> Tambah</Button>
        </div>
        <div className="flex flex-wrap gap-3 p-4">
          {academicYears.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada tahun ajaran</p> :
          academicYears.map((y) => (
            <div key={y.id} className={`flex items-center gap-3 rounded-xl border p-3 ${y.is_active ? "border-primary/40 bg-primary/5" : "border-border/60"}`}>
              <div>
                <p className="text-sm font-bold">{y.school_year} - {y.semester}</p>
                {y.is_active && <p className="flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="h-3 w-3" /> Aktif</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => toggleYearActive(y)} className="h-7 text-xs">{y.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
                <Button variant="ghost" size="icon" onClick={() => deleteYear(y)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold"><School className="h-4 w-4" /> Daftar Kelas</h3>
          <Button size="sm" onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> Tambah Kelas</Button>
        </div>
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead>Nama Kelas</TableHead><TableHead>Wali Kelas</TableHead><TableHead>Tahun Ajaran</TableHead><TableHead>Jumlah Siswa</TableHead><TableHead className="text-right">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Memuat...</TableCell></TableRow> :
            classes.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada kelas</TableCell></TableRow> :
            classes.map((c) => {
              const count = students.filter((s) => s.class_id === c.id).length;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-bold">{c.name}</TableCell>
                  <TableCell>{c.homeroom_teacher || "-"}</TableCell>
                  <TableCell>{c.academic_year || "-"}</TableCell>
                  <TableCell>{count} siswa</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Nama Kelas *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Contoh: 7A" /></div>
            <div>
              <Label>Wali Kelas</Label>
              <Select value={form.homeroom_teacher} onValueChange={(val) => setForm({ ...form, homeroom_teacher: val })}>
                <SelectTrigger><SelectValue placeholder="Pilih wali kelas" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}{t.subject ? ` (${t.subject})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tahun Ajaran</Label><Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="Contoh: 2025/2026" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editing ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah Tahun Ajaran</DialogTitle></DialogHeader>
          <form onSubmit={handleYearSubmit} className="space-y-3">
            <div><Label>Tahun Pelajaran *</Label><Input value={yearForm.school_year} onChange={(e) => setYearForm({ ...yearForm, school_year: e.target.value })} required placeholder="Contoh: 2025/2026" /></div>
            <div>
              <Label>Semester</Label>
              <select value={yearForm.semester} onChange={(e) => setYearForm({ ...yearForm, semester: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={yearForm.is_active} onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })} />
              <span className="text-sm">Set sebagai aktif</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setYearDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Tambah</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}