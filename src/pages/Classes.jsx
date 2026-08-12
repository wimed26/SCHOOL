import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, School, Users, ArrowLeft, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excelExport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

export default function Classes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", homeroom_teacher: "", academic_year: "" });
  const [selectedClass, setSelectedClass] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [teachers, setTeachers] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, s, a, t] = await Promise.all([
        base44.entities.ClassRoom.list(),
        base44.entities.Student.list(),
        base44.entities.Attendance.list("-date", 1000),
        base44.entities.Teacher.list(),
      ]);
      setClasses(c); setStudents(s); setAttendance(a); setTeachers(t);
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

  const downloadCSV = async () => {
    const classStudents = students.filter((s) => s.class_id === selectedClass.id);
    const monthAtt = attendance.filter((r) =>
      (r.class_id === selectedClass.id || classStudents.some((s) => s.id === r.student_id)) && r.date?.startsWith(month)
    );
    const classSummary = classStudents.map((s) => {
      const recs = monthAtt.filter((r) => r.student_id === s.id);
      const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0 };
      recs.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
      const total = recs.length;
      const present = counts.hadir + counts.terlambat;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return { ...s, ...counts, total, pct };
    });
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "NIS", key: "nis" },
      { header: "Nama", key: "name" },
      { header: "Hadir", key: "hadir", type: "number" },
      { header: "Izin", key: "izin", type: "number" },
      { header: "Sakit", key: "sakit", type: "number" },
      { header: "Alpha", key: "alpha", type: "number" },
      { header: "Terlambat", key: "terlambat", type: "number" },
      { header: "Total", key: "total", type: "number" },
      { header: "Persentase (%)", key: "pct", type: "number" },
    ];
    const rows = classSummary.map((s, i) => ({
      no: i + 1, nis: s.nis || "", name: s.name || "",
      hadir: s.hadir, izin: s.izin, sakit: s.sakit, alpha: s.alpha, terlambat: s.terlambat,
      total: s.total, pct: s.pct,
    }));
    const monthName = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    await exportToExcel({
      filename: `Rekap_Absensi_${selectedClass.name}_${month}.xlsx`,
      moduleName: `Absensi Kelas ${selectedClass.name}`,
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [
        { label: "Bulan", value: monthName },
        { label: "Kelas", value: selectedClass.name },
        { label: "Jumlah Siswa", value: classSummary.length },
        { label: "Total Hadir", value: classSummary.reduce((s, r) => s + r.hadir, 0) },
        { label: "Total Izin", value: classSummary.reduce((s, r) => s + r.izin, 0) },
        { label: "Total Sakit", value: classSummary.reduce((s, r) => s + r.sakit, 0) },
        { label: "Total Alpha", value: classSummary.reduce((s, r) => s + r.alpha, 0) },
        { label: "Total Terlambat", value: classSummary.reduce((s, r) => s + r.terlambat, 0) },
      ],
    });
    toast({ title: "Export Excel berhasil" });
  };

  // ===== Detail View =====
  if (selectedClass) {
    const classStudents = students.filter((s) => s.class_id === selectedClass.id);
    const monthAtt = attendance.filter((r) =>
      (r.class_id === selectedClass.id || classStudents.some((s) => s.id === r.student_id)) && r.date?.startsWith(month)
    );
    const attSummary = classStudents.map((s) => {
      const recs = monthAtt.filter((r) => r.student_id === s.id);
      const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0 };
      recs.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
      const total = recs.length;
      const present = counts.hadir + counts.terlambat;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return { ...s, ...counts, total, pct };
    });
    const monthName = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedClass(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Kelas {selectedClass.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Wali: {selectedClass.homeroom_teacher || "-"} {selectedClass.academic_year ? `• TA: ${selectedClass.academic_year}` : ""}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          <div className="border-b border-border/60 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4" /> Daftar Siswa ({classStudents.length})</h3>
          </div>
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>NIS</TableHead><TableHead>Nama</TableHead><TableHead>Jenis Kelamin</TableHead><TableHead>No HP</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {classStudents.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada siswa di kelas ini</TableCell></TableRow> :
              classStudents.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.gender === "L" ? "Laki-laki" : s.gender === "P" ? "Perempuan" : "-"}</TableCell>
                  <TableCell className="text-sm">{s.phone || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-bold">Rekap Absensi — {monthName}</h3>
            <div className="flex gap-2">
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
              <Button variant="outline" size="sm" onClick={downloadCSV}><Download className="mr-1.5 h-3.5 w-3.5" /> Export Excel</Button>
            </div>
          </div>
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>NIS</TableHead><TableHead>Nama</TableHead>
              <TableHead>H</TableHead><TableHead>I</TableHead><TableHead>S</TableHead><TableHead>A</TableHead><TableHead>T</TableHead>
              <TableHead>Total</TableHead><TableHead>%</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {attSummary.length === 0 ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Tidak ada data absensi bulan ini</TableCell></TableRow> :
              attSummary.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.hadir}</TableCell><TableCell>{s.izin}</TableCell><TableCell>{s.sakit}</TableCell>
                  <TableCell>{s.alpha}</TableCell><TableCell>{s.terlambat}</TableCell>
                  <TableCell className="font-semibold">{s.total}</TableCell>
                  <TableCell className={`font-bold ${s.pct >= 80 ? "text-emerald-600" : s.pct >= 60 ? "text-amber-600" : "text-rose-600"}`}>{s.pct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ===== List View =====
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Data Kelas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Klik kelas untuk melihat siswa dan rekap absensi</p>
        </div>
        {isAdmin && <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Tambah Kelas</Button>}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Memuat...</div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <School className="h-12 w-12 text-muted-foreground/40" />
          <p>Belum ada kelas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const count = students.filter((s) => s.class_id === c.id).length;
            return (
              <div key={c.id} className="group cursor-pointer rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40" onClick={() => setSelectedClass(c)}>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                    <School className="h-5 w-5" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-bold">{c.name}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Wali: {c.homeroom_teacher || "-"}</p>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {count} siswa
                </div>
                {c.academic_year && <p className="mt-1 text-xs text-muted-foreground">TA: {c.academic_year}</p>}
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}