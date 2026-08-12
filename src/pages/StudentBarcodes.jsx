import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function StudentBarcodes() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([base44.entities.Student.list(), base44.entities.ClassRoom.list()]);
      setStudents(s); setClasses(c);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const filtered = students.filter((s) => {
    if (classFilter !== "all" && s.class_id !== classFilter) return false;
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.nis?.includes(search)) return false;
    return true;
  });

  const qrValue = (s) => JSON.stringify({
    nis: s.nis || "",
    name: s.name || "",
    class: s.class_name || "",
    gender: s.gender || "",
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">QR Code Siswa</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cetak QR code untuk absensi scan otomatis</p>
        </div>
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="mr-1.5 h-4 w-4" /> Cetak QR
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter kelas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Memuat...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="break-inside-avoid rounded-xl border border-border/60 bg-white p-4 text-center shadow-sm">
              <p className="text-sm font-bold">{s.name}</p>
              <p className="text-xs text-muted-foreground">NIS: {s.nis}</p>
              <p className="text-xs text-muted-foreground">{s.class_name || "-"} · {s.gender === "L" ? "L" : s.gender === "P" ? "P" : "-"}</p>
              <div className="mt-2 flex justify-center">
                <QRCodeSVG value={qrValue(s)} size={130} level="M" />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full py-8 text-center text-muted-foreground">Tidak ada siswa</div>}
        </div>
      )}
    </div>
  );
}