import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CalendarCheck, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MonthlyReports() {
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [cash, setCash] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, a, c, sv] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Attendance.list("-date", 500),
        base44.entities.CashTransaction.list("-date", 500),
        base44.entities.SavingsTransaction.list("-date", 500),
      ]);
      setStudents(s); setAttendance(a); setCash(c); setSavings(sv);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const monthAttendance = attendance.filter((r) => r.date?.startsWith(month));
  const monthCash = cash.filter((t) => t.date?.startsWith(month));
  const monthSavings = savings.filter((t) => t.date?.startsWith(month));

  const attSummary = students.map((s) => {
    const recs = monthAttendance.filter((r) => r.student_id === s.id);
    const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0 };
    recs.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    const total = recs.length;
    const present = counts.hadir + counts.terlambat;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { ...s, ...counts, total, pct };
  }).filter((s) => s.total > 0);

  const cashIn = monthCash.filter((t) => t.type === "masuk").reduce((s, t) => s + (t.amount || 0), 0);
  const cashOut = monthCash.filter((t) => t.type === "keluar").reduce((s, t) => s + (t.amount || 0), 0);
  const savIn = monthSavings.filter((t) => t.type === "setor").reduce((s, t) => s + (t.amount || 0), 0);
  const savOut = monthSavings.filter((t) => t.type === "tarik").reduce((s, t) => s + (t.amount || 0), 0);

  const downloadCSV = (filename, headers, rows) => {
    const lines = [headers.join(",")];
    rows.forEach((r) => lines.push(r.map((c) => `"${c}"`).join(",")));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAttendance = () => {
    const headers = ["NIS", "Nama", "Kelas", "Hadir", "Izin", "Sakit", "Alpha", "Terlambat", "Total", "Persentase (%)"];
    const rows = attSummary.map((s) => [s.nis, s.name, s.class_name, s.hadir, s.izin, s.sakit, s.alpha, s.terlambat, s.total, s.pct]);
    downloadCSV(`Laporan_Absensi_${month}.csv`, headers, rows);
    toast({ title: "Export absensi berhasil" });
  };

  const exportCash = () => {
    const headers = ["Tanggal", "Siswa", "Kelas", "Jenis", "Jumlah", "Keterangan", "Status"];
    const rows = monthCash.map((t) => [formatDate(t.date), t.student_name, t.class_name, t.type === "masuk" ? "Masuk" : "Keluar", t.amount, t.description, t.status]);
    downloadCSV(`Laporan_Kas_${month}.csv`, headers, rows);
    toast({ title: "Export kas berhasil" });
  };

  const exportSavings = () => {
    const headers = ["Tanggal", "Siswa", "Kelas", "Jenis", "Jumlah", "Keterangan"];
    const rows = monthSavings.map((t) => [formatDate(t.date), t.student_name, t.class_name, t.type === "setor" ? "Setor" : "Tarik", t.amount, t.description]);
    downloadCSV(`Laporan_Tabungan_${month}.csv`, headers, rows);
    toast({ title: "Export tabungan berhasil" });
  };

  const exportAll = () => {
    exportAttendance();
    setTimeout(() => exportCash(), 300);
    setTimeout(() => exportSavings(), 600);
  };

  const monthName = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Laporan Bulanan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rekap absensi, kas, dan tabungan per bulan</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
          <Button onClick={exportAll} className="bg-primary hover:bg-primary/90"><Download className="mr-1.5 h-4 w-4" /> Export Semua</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CalendarCheck className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Data Absensi</p><p className="text-xl font-extrabold">{monthAttendance.length} record</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Kas Masuk / Keluar</p><p className="text-sm font-extrabold">{formatCurrency(cashIn)} / {formatCurrency(cashOut)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><PiggyBank className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Setor / Tarik</p><p className="text-sm font-extrabold">{formatCurrency(savIn)} / {formatCurrency(savOut)}</p></div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h3 className="text-sm font-bold">Rekap Absensi — {monthName}</h3>
          <Button variant="outline" size="sm" onClick={exportAttendance}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>NIS</TableHead><TableHead>Nama</TableHead><TableHead>Kelas</TableHead>
              <TableHead>H</TableHead><TableHead>I</TableHead><TableHead>S</TableHead>
              <TableHead>A</TableHead><TableHead>T</TableHead><TableHead>Total</TableHead><TableHead>%</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Memuat...</TableCell></TableRow> :
              attSummary.length === 0 ? <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Tidak ada data absensi bulan ini</TableCell></TableRow> :
              attSummary.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.class_name || "-"}</TableCell>
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

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h3 className="text-sm font-bold">Transaksi Kas — {monthName}</h3>
          <Button variant="outline" size="sm" onClick={exportCash}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Tanggal</TableHead><TableHead>Siswa</TableHead><TableHead>Jenis</TableHead>
              <TableHead>Jumlah</TableHead><TableHead>Keterangan</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {monthCash.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada transaksi kas bulan ini</TableCell></TableRow> :
              monthCash.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                  <TableCell className="font-medium">{t.student_name || "-"}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.type === "masuk" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.type === "masuk" ? "Masuk" : "Keluar"}</span></TableCell>
                  <TableCell className={`font-semibold ${t.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "masuk" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.description || "-"}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.status === "lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{t.status === "lunas" ? "Lunas" : "Belum"}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h3 className="text-sm font-bold">Transaksi Tabungan — {monthName}</h3>
          <Button variant="outline" size="sm" onClick={exportSavings}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Tanggal</TableHead><TableHead>Siswa</TableHead><TableHead>Jenis</TableHead>
              <TableHead>Jumlah</TableHead><TableHead>Keterangan</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {monthSavings.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada transaksi tabungan bulan ini</TableCell></TableRow> :
              monthSavings.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                  <TableCell className="font-medium">{t.student_name || "-"}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.type === "setor" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.type === "setor" ? "Setor" : "Tarik"}</span></TableCell>
                  <TableCell className={`font-semibold ${t.type === "setor" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "setor" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.description || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}