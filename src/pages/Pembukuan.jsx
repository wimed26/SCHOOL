import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Calculator, Upload, Wallet, PiggyBank, ArrowLeftRight, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Pembukuan() {
  const { toast } = useToast();
  const [cash, setCash] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [importType, setImportType] = useState("cash");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        base44.entities.CashTransaction.list("-date", 200),
        base44.entities.SavingsTransaction.list("-date", 200),
      ]);
      setCash(c); setSavings(s);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const cashIn = cash.filter((c) => c.type === "masuk").reduce((s, c) => s + (c.amount || 0), 0);
  const cashOut = cash.filter((c) => c.type === "keluar").reduce((s, c) => s + (c.amount || 0), 0);
  const totalSavings = savings.reduce((s, t) => s + (t.type === "setor" ? (t.amount || 0) : -(t.amount || 0)), 0);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const itemSchema = importType === "cash" ? {
        type: "object",
        properties: {
          student_name: { type: "string" }, class_name: { type: "string" },
          type: { type: "string", enum: ["masuk", "keluar"] },
          amount: { type: "number" }, date: { type: "string" },
          description: { type: "string" }, status: { type: "string" },
        }
      } : {
        type: "object",
        properties: {
          student_name: { type: "string" }, class_name: { type: "string" },
          type: { type: "string", enum: ["setor", "tarik"] },
          amount: { type: "number" }, date: { type: "string" },
          description: { type: "string" },
        }
      };
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: "object", properties: { data: { type: "array", items: itemSchema } } }
      });
      if (result.status === "success" && result.output?.data) {
        const entity = importType === "cash" ? base44.entities.CashTransaction : base44.entities.SavingsTransaction;
        await entity.bulkCreate(result.output.data);
        toast({ title: "Import berhasil", description: `${result.output.data.length} data diimpor` });
        fetchData();
      } else {
        toast({ title: "Gagal mengimpor", variant: "destructive" });
      }
    } catch (e) { toast({ title: "Gagal mengimpor file", variant: "destructive" }); }
    setUploading(false);
    e.target.value = "";
  };

  const recentTx = [
    ...cash.map((c) => ({ ...c, source: "Kas" })),
    ...savings.map((s) => ({ ...s, source: "Tabungan" })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

  const QUICK_LINKS = [
    { to: "/transaction-history", label: "Daftar Transaksi", icon: ArrowLeftRight, color: "bg-emerald-100 text-emerald-600" },
    { to: "/kas", label: "Uang Kas", icon: Wallet, color: "bg-blue-100 text-blue-600" },
    { to: "/tabungan", label: "Tabungan", icon: PiggyBank, color: "bg-violet-100 text-violet-600" },
    { to: "/savings-details", label: "Buku Tabungan", icon: FileText, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Pembukuan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pusat pembukuan dan import data keuangan</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Wallet className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Saldo Kas</p><p className="text-lg font-extrabold">{formatCurrency(cashIn - cashOut)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><PiggyBank className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Tabungan</p><p className="text-lg font-extrabold">{formatCurrency(totalSavings)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Calculator className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Transaksi</p><p className="text-lg font-extrabold">{cash.length + savings.length}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to} className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.color} transition-transform group-hover:scale-110`}><Icon className="h-5 w-5" /></div>
              <span className="text-center text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><Upload className="h-4 w-4" /> Import Data dari File</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div>
            <Label>Jenis Data</Label>
            <select value={importType} onChange={(e) => setImportType(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm sm:w-48">
              <option value="cash">Transaksi Kas</option>
              <option value="savings">Transaksi Tabungan</option>
            </select>
          </div>
          <div>
            <Label>Upload File (CSV/Excel)</Label>
            <div className="mt-1">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-2 text-sm hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                {uploading ? "Mengimpor..." : "Pilih file"}
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Format kolom: Nama Siswa, Kelas, Jenis, Jumlah, Tanggal, Keterangan</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="border-b border-border/60 p-4">
          <h3 className="text-sm font-bold">Transaksi Terbaru</h3>
        </div>
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead>Tanggal</TableHead><TableHead>Sumber</TableHead><TableHead>Nama</TableHead><TableHead className="text-right">Jumlah</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Memuat...</TableCell></TableRow> :
            recentTx.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada transaksi</TableCell></TableRow> :
            recentTx.map((t, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.source === "Kas" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>{t.source}</span></TableCell>
                <TableCell className="font-medium">{t.student_name || "-"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(t.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}