import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TransactionHistory() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cash, savings] = await Promise.all([
        base44.entities.CashTransaction.list("-date", 2000),
        base44.entities.SavingsTransaction.list("-date", 2000),
      ]);
      const combined = [
        ...cash.map((c) => ({ ...c, source: "Kas", displayType: c.type === "masuk" ? "Masuk" : "Keluar" })),
        ...savings.map((s) => ({ ...s, source: "Tabungan", displayType: s.type === "setor" ? "Setor" : "Tarik" })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(combined);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const filtered = transactions.filter((t) => {
    if (filter !== "all" && t.source !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.student_name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalIn = transactions.filter((t) => (t.source === "Kas" && t.type === "masuk") || (t.source === "Tabungan" && t.type === "setor")).reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = transactions.filter((t) => (t.source === "Kas" && t.type === "keluar") || (t.source === "Tabungan" && t.type === "tarik")).reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Daftar Transaksi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Riwayat terpusat kas dan tabungan</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Masuk</p><p className="text-lg font-extrabold text-emerald-600">{formatCurrency(totalIn)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><TrendingDown className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Keluar</p><p className="text-lg font-extrabold text-rose-600">{formatCurrency(totalOut)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20"><Wallet className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-white/80">Net Flow</p><p className="text-lg font-extrabold">{formatCurrency(totalIn - totalOut)}</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama siswa atau keterangan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>Semua</button>
          <button onClick={() => setFilter("Kas")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === "Kas" ? "bg-primary text-primary-foreground" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>Kas</button>
          <button onClick={() => setFilter("Tabungan")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === "Tabungan" ? "bg-primary text-primary-foreground" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>Tabungan</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead>Tanggal</TableHead><TableHead>Sumber</TableHead><TableHead>Jenis</TableHead><TableHead>Nama Siswa</TableHead><TableHead>Keterangan</TableHead><TableHead className="text-right">Jumlah</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Memuat...</TableCell></TableRow> :
            filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada transaksi</TableCell></TableRow> :
            filtered.slice(0, 100).map((t, i) => {
              const isIn = (t.source === "Kas" && t.type === "masuk") || (t.source === "Tabungan" && t.type === "setor");
              return (
                <TableRow key={i}>
                  <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.source === "Kas" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>{t.source}</span></TableCell>
                  <TableCell>{t.displayType}</TableCell>
                  <TableCell className="font-medium">{t.student_name || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.description || "-"}</TableCell>
                  <TableCell className={`text-right font-semibold ${isIn ? "text-emerald-600" : "text-rose-600"}`}>{isIn ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}