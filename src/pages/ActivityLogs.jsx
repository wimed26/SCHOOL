import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Search, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excelExport";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function ActivityLogs() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ActivityLog.list("-date", 500);
      setLogs(data);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const actionTypes = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((l) => {
    if (filter !== "all" && l.action !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.action?.toLowerCase().includes(q) || l.detail?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "Waktu", key: "date" },
      { header: "Pengguna", key: "user_name" },
      { header: "Aksi", key: "action" },
      { header: "Detail", key: "detail" },
    ];
    const rows = filtered.map((l, i) => ({
      no: i + 1,
      date: l.date ? new Date(l.date).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
      user_name: l.user_name || "-",
      action: l.action || "-",
      detail: l.detail || "-",
    }));
    await exportToExcel({
      filename: `Log_Aktivitas_${today}.xlsx`,
      moduleName: "Log Aktivitas",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [{ label: "Jumlah Data", value: filtered.length }],
    });
    toast({ title: "Export Excel berhasil" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Log Aktivitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pantau aktivitas sistem: persetujuan, perubahan data, transaksi</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari aktivitas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>Semua</button>
          {actionTypes.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === t ? "bg-primary text-primary-foreground" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>{t}</button>
          ))}
          <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto"><Download className="mr-1.5 h-3.5 w-3.5" /> Export Excel</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Waktu</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2"><ScrollText className="h-8 w-8 text-muted-foreground/50" /> Belum ada log aktivitas</div>
              </TableCell></TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(l.date)}</TableCell>
                  <TableCell className="font-medium">{l.user_name || "-"}</TableCell>
                  <TableCell><span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{l.action}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.detail || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}