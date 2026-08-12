import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Users, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excelExport";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

export default function Students() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nis: "", name: "", class_id: "", gender: "L", address: "", phone: "", parent_name: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([base44.entities.Student.list(), base44.entities.ClassRoom.list()]);
      setStudents(s);
      setClasses(c);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.nis?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ nis: "", name: "", class_id: "", gender: "L", address: "", phone: "", parent_name: "" });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ nis: s.nis || "", name: s.name || "", class_id: s.class_id || "", gender: s.gender || "L", address: s.address || "", phone: s.phone || "", parent_name: s.parent_name || "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const classObj = classes.find((c) => c.id === form.class_id);
    const data = { ...form, class_name: classObj?.name || "" };
    try {
      if (editing) {
        await base44.entities.Student.update(editing.id, data);
        toast({ title: "Data siswa diperbarui" });
      } else {
        await base44.entities.Student.create(data);
        toast({ title: "Siswa ditambahkan" });
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  };

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "NIS", key: "nis" },
      { header: "Nama", key: "name" },
      { header: "Kelas", key: "class_name" },
      { header: "Jenis Kelamin", key: "gender" },
      { header: "No HP", key: "phone" },
      { header: "Nama Orang Tua", key: "parent_name" },
      { header: "Alamat", key: "address" },
    ];
    const rows = filtered.map((s, i) => ({
      no: i + 1,
      nis: s.nis || "",
      name: s.name || "",
      class_name: s.class_name || "-",
      gender: s.gender === "L" ? "Laki-laki" : s.gender === "P" ? "Perempuan" : "-",
      phone: s.phone || "-",
      parent_name: s.parent_name || "-",
      address: s.address || "-",
    }));
    await exportToExcel({
      filename: `Data_Siswa_${today}.xlsx`,
      moduleName: "Data Siswa",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [{ label: "Jumlah Data", value: filtered.length }],
    });
    toast({ title: "Export Excel berhasil" });
  };

  const handleDelete = async (s) => {
    if (!confirm(`Hapus siswa "${s.name}"?`)) return;
    await base44.entities.Student.delete(s.id);
    toast({ title: "Siswa dihapus" });
    fetchData();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Data Siswa</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola data siswa: tambah, edit, hapus</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-1.5 h-4 w-4" /> Export Excel
            </Button>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-1.5 h-4 w-4" /> Tambah Siswa
            </Button>
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari nama atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>NIS</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>JK</TableHead>
              <TableHead>No HP</TableHead>
              <TableHead>Orang Tua</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2"><Users className="h-8 w-8 text-muted-foreground/50" /> Belum ada data siswa</div>
              </TableCell></TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell>{s.class_name || "-"}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${s.gender === "L" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>{s.gender === "L" ? "Laki-laki" : "Perempuan"}</span></TableCell>
                  <TableCell className="text-sm">{s.phone || "-"}</TableCell>
                  <TableCell className="text-sm">{s.parent_name || "-"}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>NIS *</Label><Input value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} required /></div>
              <div><Label>Nama *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kelas</Label>
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jenis Kelamin</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Nomor HP</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Nama Orang Tua</Label><Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} /></div>
            <div><Label>Alamat</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
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