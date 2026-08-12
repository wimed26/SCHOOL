import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive, Download, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function ArchiveReports() {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [cash, setCash] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [a, ca, sa] = await Promise.all([
        base44.entities.Attendance.list("-date", 2000),
        base44.entities.CashTransaction.list("-date", 2000),
        base44.entities.SavingsTransaction.list("-date", 2000),
      ]);
      setAttendance(a); setCash(ca); setSavings(sa);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const yearAtt = attendance.filter((a) => a.date?.startsWith(year));
  const yearCash = cash.filter((c) => c.date?.startsWith(year));
  const yearSavings = savings.filter((s) => s.date?.startsWith(year));

  const cashIn = yearCash.filter((c) => c.type === "masuk").reduce((s, c) => s + (c.amount || 0), 0);
  const cashOut = yearCash.filter((c) => c.type === "keluar").reduce((s, c) => s + (c.amount || 0), 0);
  const totalSetor = yearSavings.filter((s) => s.type === "setor").reduce((s, t) => s + (t.amount || 0), 0);
  const totalTarik = yearSavings.filter((s) => s.type === "tarik").reduce((s, t) => s + (t.amount || 0), 0);

  const present = yearAtt.filter((a) => a.status === "hadir" || a.status === "terlambat").length;
  const attRate = yearAtt.length > 0 ? Math.round((present / yearAtt.length) * 100) : 0;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthlyData = monthNames.map((name, m) => {
    const monthStr = `${year}-${String(m + 1).padStart(2, "0")}`;
    const mAtt = yearAtt.filter((a) => a.date?.startsWith(monthStr));
    const mPresent = mAtt.filter((a) => a.status === "hadir" || a.status === "terlambat").length;
    return {
      month: name,
      attendance: mAtt.length,
      attRate: mAtt.length > 0 ? Math.round((mPresent / mAtt.length) * 100) : 0,
      cashIn: yearCash.filter((c) => c.date?.startsWith(monthStr) && c.type === "masuk").reduce((s, c) => s + (c.amount || 0), 0),
      cashOut: yearCash.filter((c) => c.date?.startsWith(monthStr) && c.type === "keluar").reduce((s, c) => s + (c.amount || 0), 0),
      savings: yearSavings.filter((s) => s.date?.startsWith(monthStr)).reduce((sum, t) => sum + (t.type === "setor" ? t.amount : -t.amount), 0),
    };
  });

  const downloadYearlyCSV = () => {
    const headers = ["Bulan", "Total Absensi", "Kehadiran (%)", "Kas Masuk", "Kas Keluar", "Tabungan"];
    const rows = monthlyData.map((m) => [m.month, m.attendance, m.attRate, m.cashIn, m.cashOut, m.savings]);
    const lines = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Arsip_Laporan_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export berhasil" });
  };

  const years = Array.from(new Set([
    ...attendance.map((a) => a.date?.slice(0, 4)),
    ...cash.map((c) => c.date?.slice(0, 4)),
    ...savings.map((s) => s.date?.slice(0, 4)),
    new Date().getFullYear().toString(),
  ].filter(Boolean))).sort((a, b) => b - a);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Arsip Laporan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rekap laporan tahunan untuk akses histori</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={downloadYearlyCSV}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Calendar className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Tingkat Kehadiran</p><p className="text-xl font-extrabold">{attRate}%</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Archive className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Absensi</p><p className="text-xl font-extrabold">{yearAtt.length}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Kas Masuk</p>
          <p className="text-lg font-extrabold text-emerald-600">{formatCurrency(cashIn)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Saldo Tabungan</p>
          <p className="text-lg font-extrabold text-violet-600">{formatCurrency(totalSetor - totalTarik)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="border-b border-border/60 p-4">
          <h3 className="text-sm font-bold">Rekap Bulanan {year}</h3>
        </div>
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead>Bulan</TableHead><TableHead>Absensi</TableHead><TableHead>Kehadiran (%)</TableHead>
            <TableHead>Kas Masuk</TableHead><TableHead>Kas Keluar</TableHead><TableHead>Tabungan</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Memuat...</TableCell></TableRow> :
            monthlyData.map((m) => (
              <TableRow key={m.month}>
                <TableCell className="font-medium">{m.month}</TableCell>
                <TableCell>{m.attendance}</TableCell>
                <TableCell className="font-semibold">{m.attRate}%</TableCell>
                <TableCell className="text-emerald-600">{formatCurrency(m.cashIn)}</TableCell>
                <TableCell className="text-rose-600">{formatCurrency(m.cashOut)}</TableCell>
                <TableCell className="text-violet-600">{formatCurrency(m.savings)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}