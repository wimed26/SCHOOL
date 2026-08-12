import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Wallet, TrendingUp, TrendingDown, Scale, Download, FileText, CheckCircle2, XCircle, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { exportToExcel as exportExcelXLSX } from "@/lib/excelExport";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate, todayStr } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import jsPDF from "jspdf";

export default function Cash() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ student_id: "", type: "masuk", amount: "", date: todayStr(), description: "", status: "lunas" });
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [weekDate, setWeekDate] = useState(todayStr());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, s, c] = await Promise.all([
        base44.entities.CashTransaction.list("-date", 500),
        base44.entities.Student.list(),
        base44.entities.ClassRoom.list(),
      ]);
      setTransactions(t); setStudents(s); setClasses(c);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const cashIn = transactions.filter((t) => t.type === "masuk").reduce((s, t) => s + (t.amount || 0), 0);
  const cashOut = transactions.filter((t) => t.type === "keluar").reduce((s, t) => s + (t.amount || 0), 0);
  const balance = cashIn - cashOut;
  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const student = students.find((s) => s.id === form.student_id);
    const data = { ...form, amount: Number(form.amount), student_name: student?.name || "", class_name: student?.class_name || "" };
    try {
      await base44.entities.CashTransaction.create(data);
      toast({ title: "Transaksi kas ditambahkan" });
      setDialogOpen(false);
      setForm({ student_id: "", type: "masuk", amount: "", date: todayStr(), description: "", status: "lunas" });
      fetchData();
    } catch (err) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
  };

  const handleDelete = async (t) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await base44.entities.CashTransaction.delete(t.id);
    toast({ title: "Transaksi dihapus" });
    fetchData();
  };

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    chartData.push({
      name: d.toLocaleDateString("id-ID", { weekday: "short" }),
      Masuk: transactions.filter((t) => t.date === ds && t.type === "masuk").reduce((s, t) => s + (t.amount || 0), 0),
      Keluar: transactions.filter((t) => t.date === ds && t.type === "keluar").reduce((s, t) => s + (t.amount || 0), 0),
    });
  }

  // ===== Per-Class Weekly View =====
  const getWeekRange = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  };

  const weekRange = getWeekRange(weekDate);
  const weekStart = new Date(weekRange.start);
  const weekEnd = new Date(weekRange.end);
  const weekLabel = `${weekStart.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;
  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || "Semua Kelas";

  const classStudents = selectedClassId === "all" ? [] : students.filter((s) => s.class_id === selectedClassId);
  const weeklyData = classStudents.map((s) => {
    const paidTx = transactions.filter((t) => t.student_id === s.id && t.status === "lunas" && t.date >= weekRange.start && t.date <= weekRange.end);
    return { ...s, paid: paidTx.length > 0, paidAmount: paidTx.reduce((sum, t) => sum + (t.amount || 0), 0) };
  });
  const paidCount = weeklyData.filter((s) => s.paid).length;
  const unpaidCount = weeklyData.filter((s) => !s.paid).length;

  const shiftWeek = (days) => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + days);
    setWeekDate(d.toISOString().split("T")[0]);
  };

  const exportExcel = async () => {
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "NIS", key: "nis" },
      { header: "Nama", key: "name" },
      { header: "Kelas", key: "class_name" },
      { header: "Status", key: "paidLabel" },
      { header: "Jumlah Dibayar", key: "paidAmount", type: "number", numFmt: '#,##0' },
    ];
    const rows = weeklyData.map((s, i) => ({
      no: i + 1,
      nis: s.nis || "",
      name: s.name || "",
      class_name: s.class_name || selectedClassName,
      paidLabel: s.paid ? "Lunas" : "Belum",
      paidAmount: s.paidAmount || 0,
    }));
    await exportExcelXLSX({
      filename: `Rekap_Kas_${selectedClassName}_${weekRange.start}.xlsx`,
      moduleName: "Rekap Kas Per Kelas",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [
        { label: "Periode", value: weekLabel },
        { label: "Kelas", value: selectedClassName },
        { label: "Sudah Bayar", value: paidCount },
        { label: "Belum Bayar", value: unpaidCount },
      ],
    });
    toast({ title: "Export Excel berhasil" });
  };

  const exportTransactionExcel = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "Tanggal", key: "date" },
      { header: "Siswa", key: "student_name" },
      { header: "Jenis", key: "typeLabel" },
      { header: "Jumlah", key: "amount", type: "number", numFmt: '#,##0' },
      { header: "Keterangan", key: "description" },
      { header: "Status", key: "statusLabel" },
    ];
    const rows = filtered.map((t, i) => ({
      no: i + 1,
      date: t.date ? new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "",
      student_name: t.student_name || "-",
      typeLabel: t.type === "masuk" ? "Masuk" : "Keluar",
      amount: t.amount || 0,
      description: t.description || "-",
      statusLabel: t.status === "lunas" ? "Lunas" : "Belum",
    }));
    await exportExcelXLSX({
      filename: `Transaksi_Kas_${today}.xlsx`,
      moduleName: "Transaksi Kas",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [
        { label: "Jumlah Data", value: filtered.length },
        { label: "Total Kas Masuk", value: cashIn, numFmt: '#,##0' },
        { label: "Total Kas Keluar", value: cashOut, numFmt: '#,##0' },
        { label: "Saldo", value: balance, numFmt: '#,##0' },
      ],
    });
    toast({ title: "Export Excel berhasil" });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Rekap Kas Mingguan", 14, 20);
    doc.setFontSize(10);
    doc.text(`Kelas: ${selectedClassName}`, 14, 28);
    doc.text(`Periode: ${weekLabel}`, 14, 34);
    doc.text(`Sudah Bayar: ${paidCount} | Belum Bayar: ${unpaidCount}`, 14, 40);
    let y = 52;
    doc.text("No", 14, y); doc.text("NIS", 30, y); doc.text("Nama", 60, y); doc.text("Status", 140, y); doc.text("Jumlah", 170, y);
    y += 6;
    doc.line(14, y - 2, 196, y - 2);
    y += 6;
    weeklyData.forEach((s, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(String(i + 1), 14, y);
      doc.text(String(s.nis || "-"), 30, y);
      doc.text(String(s.name || "-").substring(0, 25), 60, y);
      doc.text(s.paid ? "Lunas" : "Belum", 140, y);
      doc.text(formatCurrency(s.paidAmount), 170, y);
      y += 8;
    });
    doc.save(`Rekap_Kas_${selectedClassName}_${weekRange.start}.pdf`);
    toast({ title: "Export PDF berhasil" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Uang Kas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola pembayaran kas dan pengeluaran</p>
        </div>
        {isAdmin && <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Tambah Transaksi</Button>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Kas Masuk</p><p className="text-xl font-extrabold text-emerald-600">{formatCurrency(cashIn)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><TrendingDown className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Kas Keluar</p><p className="text-xl font-extrabold text-rose-600">{formatCurrency(cashOut)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20"><Scale className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-white/80">Saldo Kas</p><p className="text-xl font-extrabold">{formatCurrency(balance)}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold">Grafik Keuangan Kas (7 Hari)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="kIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              <linearGradient id="kOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
            <Area type="monotone" dataKey="Masuk" stroke="#10b981" fill="url(#kIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="Keluar" stroke="#ef4444" fill="url(#kOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Class Weekly View */}
      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold">Rekap Kas Per Kelas (Mingguan)</h3>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => shiftWeek(-7)}><ChevronLeft className="h-4 w-4" /></Button>
              <Input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} className="w-auto" />
              <Button variant="outline" size="icon" onClick={() => shiftWeek(7)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {selectedClassId !== "all" && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Sudah Bayar: {paidCount}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700">
                <XCircle className="h-4 w-4" /> Belum Bayar: {unpaidCount}
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={exportExcel}><Download className="mr-1.5 h-3.5 w-3.5" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="mr-1.5 h-3.5 w-3.5" /> PDF</Button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border/40">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead>NIS</TableHead><TableHead>Nama</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Jumlah</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {weeklyData.length === 0 ? <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Tidak ada siswa di kelas ini</TableCell></TableRow> :
                  weeklyData.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        {s.paid ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Lunas</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><XCircle className="h-3.5 w-3.5" /> Belum</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatCurrency(s.paidAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {["all", "masuk", "keluar"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground border border-border/60 hover:bg-muted/50"}`}>
            {f === "all" ? "Semua" : f === "masuk" ? "Kas Masuk" : "Kas Keluar"}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={exportTransactionExcel} className="ml-auto">
          <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export Excel
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tanggal</TableHead><TableHead>Siswa</TableHead><TableHead>Jenis</TableHead><TableHead>Jumlah</TableHead><TableHead>Keterangan</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground"><div className="flex flex-col items-center gap-2"><Wallet className="h-8 w-8 text-muted-foreground/50" /> Belum ada transaksi</div></TableCell></TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                  <TableCell className="font-medium">{t.student_name || "-"}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.type === "masuk" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.type === "masuk" ? "Masuk" : "Keluar"}</span></TableCell>
                  <TableCell className={`font-semibold ${t.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "masuk" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{t.description || "-"}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.status === "lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{t.status === "lunas" ? "Lunas" : "Belum"}</span></TableCell>
                  <TableCell className="text-right">{isAdmin && <Button variant="ghost" size="icon" onClick={() => handleDelete(t)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah Transaksi Kas</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Siswa (opsional untuk kas masuk)</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} - {s.class_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Jenis</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="masuk">Kas Masuk</SelectItem><SelectItem value="keluar">Kas Keluar</SelectItem></SelectContent></Select></div>
              <div><Label>Jumlah (Rp) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tanggal</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lunas">Lunas</SelectItem><SelectItem value="belum">Belum</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Keterangan</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Kas bulanan" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}