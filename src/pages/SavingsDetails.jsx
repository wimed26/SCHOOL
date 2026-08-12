import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, ArrowLeft, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SavingsDetails() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.SavingsTransaction.list("-date", 1000),
      ]);
      setStudents(s); setTransactions(t);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.nis?.toLowerCase().includes(q);
  });

  // ===== Passbook View =====
  if (selectedStudent) {
    const studentTxns = transactions
      .filter((t) => t.student_id === selectedStudent.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    const txnsWithBalance = studentTxns.map((t) => {
      running += t.type === "setor" ? t.amount : -t.amount;
      return { ...t, balance: running };
    });
    const totalSetor = studentTxns.filter((t) => t.type === "setor").reduce((s, t) => s + t.amount, 0);
    const totalTarik = studentTxns.filter((t) => t.type === "tarik").reduce((s, t) => s + t.amount, 0);
    const currentBalance = totalSetor - totalTarik;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Buku Tabungan</h1>
            <p className="text-sm text-muted-foreground">{selectedStudent.name} • {selectedStudent.nis} • {selectedStudent.class_name || "-"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><ArrowDownCircle className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground">Total Setor</p><p className="text-lg font-extrabold">{formatCurrency(totalSetor)}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><ArrowUpCircle className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground">Total Tarik</p><p className="text-lg font-extrabold">{formatCurrency(totalTarik)}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20"><Wallet className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-white/80">Saldo Saat Ini</p><p className="text-lg font-extrabold">{formatCurrency(currentBalance)}</p></div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          <div className="border-b border-border/60 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4" /> Riwayat Transaksi</h3>
          </div>
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Tanggal</TableHead><TableHead>Jenis</TableHead><TableHead>Jumlah</TableHead><TableHead>Saldo</TableHead><TableHead>Keterangan</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {txnsWithBalance.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada transaksi</TableCell></TableRow> :
              txnsWithBalance.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.type === "setor" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.type === "setor" ? "Setor" : "Tarik"}</span></TableCell>
                  <TableCell className={`font-semibold ${t.type === "setor" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "setor" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(t.balance)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.description || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ===== Student Selector =====
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Buku Tabungan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pilih siswa untuk melihat riwayat tabungan</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari nama atau NIS siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead>NIS</TableHead><TableHead>Nama</TableHead><TableHead>Kelas</TableHead><TableHead className="text-right">Saldo</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Memuat...</TableCell></TableRow> :
            filteredStudents.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Siswa tidak ditemukan</TableCell></TableRow> :
            filteredStudents.map((s) => {
              const txns = transactions.filter((t) => t.student_id === s.id);
              const balance = txns.filter((t) => t.type === "setor").reduce((sum, t) => sum + t.amount, 0) - txns.filter((t) => t.type === "tarik").reduce((sum, t) => sum + t.amount, 0);
              return (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedStudent(s)}>
                  <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.class_name || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(balance)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}