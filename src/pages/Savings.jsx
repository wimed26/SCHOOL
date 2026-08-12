import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, PiggyBank, ArrowDownCircle, ArrowUpCircle, BookOpen, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportToExcel } from "@/lib/excelExport";
import { formatCurrency, formatDate, todayStr } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Savings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [form, setForm] = useState({ student_id: "", type: "setor", amount: "", date: todayStr(), description: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([base44.entities.SavingsTransaction.list("-date", 500), base44.entities.Student.list()]);
      setTransactions(t);
      setStudents(s);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const totalSetor = transactions.filter((t) => t.type === "setor").reduce((s, t) => s + (t.amount || 0), 0);
  const totalTarik = transactions.filter((t) => t.type === "tarik").reduce((s, t) => s + (t.amount || 0), 0);
  const totalSaldo = totalSetor - totalTarik;

  // Student balances
  const studentBalances = students.map((s) => {
    const txs = transactions.filter((t) => t.student_id === s.id);
    const saldo = txs.filter((t) => t.type === "setor").reduce((sum, t) => sum + (t.amount || 0), 0) - txs.filter((t) => t.type === "tarik").reduce((sum, t) => sum + (t.amount || 0), 0);
    return { ...s, saldo, txCount: txs.length };
  }).filter((s) => s.txCount > 0).sort((a, b) => b.saldo - a.saldo);

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "Tanggal", key: "date" },
      { header: "Siswa", key: "student_name" },
      { header: "Kelas", key: "class_name" },
      { header: "Jenis", key: "typeLabel" },
      { header: "Jumlah", key: "amount", type: "number", numFmt: '#,##0' },
      { header: "Keterangan", key: "description" },
    ];
    const rows = transactions.map((t, i) => ({
      no: i + 1,
      date: t.date ? new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "",
      student_name: t.student_name || "-",
      class_name: t.class_name || "-",
      typeLabel: t.type === "setor" ? "Setor" : "Tarik",
      amount: t.amount || 0,
      description: t.description || "-",
    }));
    await exportToExcel({
      filename: `Transaksi_Tabungan_${today}.xlsx`,
      moduleName: "Uang Tabungan",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [
        { label: "Jumlah Data", value: transactions.length },
        { label: "Total Setoran", value: totalSetor, numFmt: '#,##0' },
        { label: "Total Penarikan", value: totalTarik, numFmt: '#,##0' },
        { label: "Total Saldo", value: totalSaldo, numFmt: '#,##0' },
      ],
    });
    toast({ title: "Export Excel berhasil" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const student = students.find((s) => s.id === form.student_id);
    if (!student) { toast({ title: "Pilih siswa", variant: "destructive" }); return; }
    const data = { ...form, amount: Number(form.amount), student_name: student.name, class_name: student.class_name || "" };
    try {
      await base44.entities.SavingsTransaction.create(data);
      toast({ title: "Transaksi tabungan ditambahkan" });
      setDialogOpen(false);
      setForm({ student_id: "", type: "setor", amount: "", date: todayStr(), description: "" });
      fetchData();
    } catch (err) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  };

  const handleDelete = async (t) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await base44.entities.SavingsTransaction.delete(t.id);
    toast({ title: "Transaksi dihapus" });
    fetchData();
  };

  // Chart
  const chartData = [];
  let cumulative = 0;
  const sorted = [...transactions].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const daySetor = sorted.filter((t) => t.date === ds && t.type === "setor").reduce((s, t) => s + (t.amount || 0), 0);
    const dayTarik = sorted.filter((t) => t.date === ds && t.type === "tarik").reduce((s, t) => s + (t.amount || 0), 0);
    cumulative += daySetor - dayTarik;
    chartData.push({ name: d.toLocaleDateString("id-ID", { weekday: "short" }), Saldo: cumulative });
  }

  const bookStudent = students.find((s) => s.id === selectedStudent);
  const bookTransactions = transactions.filter((t) => t.student_id === selectedStudent).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  let runningBalance = 0;
  const bookWithBalance = [...bookTransactions].reverse().map((t) => {
    runningBalance += t.type === "setor" ? (t.amount || 0) : -(t.amount || 0);
    return { ...t, balance: runningBalance };
  }).reverse();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Uang Tabungan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola setoran, penarikan, dan buku tabungan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBookDialogOpen(true)}><BookOpen className="mr-1.5 h-4 w-4" /> Buku Tabungan</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export Excel</Button>
            {isAdmin && <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Tambah Transaksi</Button>}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><ArrowDownCircle className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Setoran</p><p className="text-xl font-extrabold text-emerald-600">{formatCurrency(totalSetor)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><ArrowUpCircle className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Penarikan</p><p className="text-xl font-extrabold text-rose-600">{formatCurrency(totalTarik)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20"><PiggyBank className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-white/80">Total Saldo Tabungan</p><p className="text-xl font-extrabold">{formatCurrency(totalSaldo)}</p></div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold">Grafik Pertumbuhan Tabungan (7 Hari)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs><linearGradient id="savG2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
            <Area type="monotone" dataKey="Saldo" stroke="#8b5cf6" fill="url(#savG2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Student Balances */}
      {studentBalances.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold">Saldo Tabungan per Siswa</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {studentBalances.slice(0, 6).map((s) => (
              <button key={s.id} onClick={() => { setSelectedStudent(s.id); setBookDialogOpen(true); }} className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-left transition-all hover:bg-muted/70">
                <div><p className="font-semibold text-sm">{s.name}</p><p className="text-xs text-muted-foreground">{s.class_name} • {s.txCount} transaksi</p></div>
                <p className="font-bold text-violet-600">{formatCurrency(s.saldo)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tanggal</TableHead>
              <TableHead>Siswa</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : transactions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2"><PiggyBank className="h-8 w-8 text-muted-foreground/50" /> Belum ada transaksi</div>
              </TableCell></TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                  <TableCell className="font-medium">{t.student_name}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.type === "setor" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.type === "setor" ? "Setor" : "Tarik"}</span></TableCell>
                  <TableCell className={`font-semibold ${t.type === "setor" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "setor" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{t.description || "-"}</TableCell>
                  <TableCell className="text-right">{isAdmin && <Button variant="ghost" size="icon" onClick={() => handleDelete(t)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah Transaksi Tabungan</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Siswa *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} - {s.class_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Jenis</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="setor">Setor</SelectItem><SelectItem value="tarik">Tarik</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Jumlah (Rp) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            </div>
            <div><Label>Tanggal</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Keterangan</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Buku Tabungan Dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Buku Tabungan Digital</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pilih Siswa</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} - {s.class_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {bookStudent && (
              <>
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white">
                  <p className="text-xs text-white/80">Saldo Tabungan</p>
                  <p className="text-2xl font-extrabold">{formatCurrency(bookWithBalance[0]?.balance || 0)}</p>
                  <p className="mt-1 text-sm text-white/90">{bookStudent.name} • {bookStudent.class_name}</p>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50 sticky top-0"><TableHead>Tanggal</TableHead><TableHead>Jenis</TableHead><TableHead>Jumlah</TableHead><TableHead>Saldo</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {bookWithBalance.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Belum ada transaksi</TableCell></TableRow>
                      ) : bookWithBalance.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">{formatDate(t.date)}</TableCell>
                          <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.type === "setor" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.type === "setor" ? "Setor" : "Tarik"}</span></TableCell>
                          <TableCell className={`text-sm font-semibold ${t.type === "setor" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "setor" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrency(t.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}