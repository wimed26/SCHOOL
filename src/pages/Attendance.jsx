import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Save, Search, Download, Percent, Trash2, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "@/lib/excelExport";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, todayStr } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import jsPDF from "jspdf";

const STATUS_CONFIG = {
  hadir: { label: "Hadir", color: "bg-emerald-500 text-white", badge: "bg-emerald-100 text-emerald-700" },
  izin: { label: "Izin", color: "bg-blue-500 text-white", badge: "bg-blue-100 text-blue-700" },
  sakit: { label: "Sakit", color: "bg-amber-500 text-white", badge: "bg-amber-100 text-amber-700" },
  alpha: { label: "Alpha", color: "bg-rose-500 text-white", badge: "bg-rose-100 text-rose-700" },
  terlambat: { label: "Terlambat", color: "bg-violet-500 text-white", badge: "bg-violet-100 text-violet-700" },
};

export default function Attendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [classId, setClassId] = useState("all");
  const [search, setSearch] = useState("");
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { fetchInitial(); }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [s, c, a] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.ClassRoom.list(),
        base44.entities.Attendance.list("-date", 500),
      ]);
      setStudents(s);
      setClasses(c);
      setRecords(a);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => {
    const map = {};
    records.filter((r) => r.date === date).forEach((r) => { map[r.student_id] = r; });
    setAttendanceMap(map);
  }, [records, date]);

  const filteredStudents = students.filter((s) => {
    if (classId !== "all" && s.class_id !== classId) return false;
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const setStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), student_id: studentId, status, date },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.values(attendanceMap).filter((a) => a.student_id && a.status);
      for (const entry of entries) {
        const student = students.find((s) => s.id === entry.student_id);
        const existing = records.find((r) => r.student_id === entry.student_id && r.date === date);
        const data = {
          student_id: entry.student_id,
          student_name: student?.name || "",
          student_nis: student?.nis || "",
          class_id: student?.class_id || "",
          class_name: student?.class_name || "",
          date,
          status: entry.status,
          note: entry.note || "",
        };
        if (existing) await base44.entities.Attendance.update(existing.id, data);
        else await base44.entities.Attendance.create(data);
      }
      toast({ title: "Absensi tersimpan", description: `${entries.length} data disimpan` });
      fetchInitial();
    } catch (e) { toast({ title: "Gagal menyimpan", variant: "destructive" }); }
    setSaving(false);
  };

  const recap = ["hadir", "izin", "sakit", "alpha", "terlambat"].map((st) => ({
    status: st,
    count: Object.values(attendanceMap).filter((a) => a.status === st).length,
  }));

  const totalMarked = recap.reduce((s, r) => s + r.count, 0);
  const presentCount = (recap.find((r) => r.status === "hadir")?.count || 0) + (recap.find((r) => r.status === "terlambat")?.count || 0);
  const attendancePercent = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  const handleExportXLSX = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "NIS", key: "nis" },
      { header: "Nama", key: "name" },
      { header: "Kelas", key: "class_name" },
      { header: "Status", key: "status" },
      { header: "Keterangan", key: "note" },
    ];
    const rows = filteredStudents.map((s, i) => {
      const att = attendanceMap[s.id];
      const statusLabel = att?.status ? STATUS_CONFIG[att.status]?.label : "-";
      return {
        no: i + 1,
        nis: s.nis || "",
        name: s.name || "",
        class_name: s.class_name || "-",
        status: statusLabel,
        note: att?.note || "-",
      };
    });
    await exportToExcel({
      filename: `Absensi_${date}_${today}.xlsx`,
      moduleName: "Absensi Siswa",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [
        { label: "Jumlah Data", value: filteredStudents.length },
        { label: "Total Hadir", value: recap.find((r) => r.status === "hadir")?.count || 0 },
        { label: "Total Izin", value: recap.find((r) => r.status === "izin")?.count || 0 },
        { label: "Total Sakit", value: recap.find((r) => r.status === "sakit")?.count || 0 },
        { label: "Total Alpha", value: recap.find((r) => r.status === "alpha")?.count || 0 },
        { label: "Total Terlambat", value: recap.find((r) => r.status === "terlambat")?.count || 0 },
        { label: "Persentase Kehadiran", value: attendancePercent + "%" },
      ],
    });
    toast({ title: "Export Excel berhasil" });
  };

  const handleReset = async () => {
    if (!window.confirm(`Hapus semua data absensi tanggal ${formatDate(date)}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const count = records.filter((r) => r.date === date).length;
      await base44.entities.Attendance.deleteMany({ date });
      toast({ title: "Data direset", description: `${count} data absensi tanggal ${formatDate(date)} dihapus` });
      setAttendanceMap({});
      fetchInitial();
    } catch (e) {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const exportToExcel = () => {
    const [year, month] = exportMonth.split("-");
    const exportStudents = classId !== "all" ? students.filter((s) => s.class_id === classId) : students;
    const monthRecords = records.filter((r) => {
      if (!r.date?.startsWith(exportMonth)) return false;
      if (classId !== "all" && r.class_id !== classId) return false;
      return true;
    });
    const studentMap = {};
    exportStudents.forEach((s) => {
      studentMap[s.id] = { nis: s.nis || "", name: s.name || "", class_name: s.class_name || "", hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0, total: 0 };
    });
    monthRecords.forEach((r) => {
      if (studentMap[r.student_id]) {
        studentMap[r.student_id][r.status] = (studentMap[r.student_id][r.status] || 0) + 1;
        studentMap[r.student_id].total += 1;
      }
    });
    const rows = Object.values(studentMap).filter((s) => s.total > 0);
    const header = ["NIS", "Nama", "Kelas", "Hadir", "Izin", "Sakit", "Alpha", "Terlambat", "Total Hari", "Persentase Kehadiran (%)"];
    const csvLines = [header.join(",")];
    rows.forEach((r) => {
      const pct = r.total > 0 ? Math.round(((r.hadir + r.terlambat) / r.total) * 100) : 0;
      csvLines.push([r.nis, `"${r.name}"`, `"${r.class_name}"`, r.hadir, r.izin, r.sakit, r.alpha, r.terlambat, r.total, pct].join(","));
    });
    const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    csvLines.push([]);
    csvLines.push(`"Rekap Absensi Bulan ${monthName}"`);
    const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Absensi_${exportMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export berhasil", description: `Rekap absensi ${monthName} diunduh` });
  };

  const exportToPDF = () => {
    const exportStudents = classId !== "all" ? students.filter((s) => s.class_id === classId) : students;
    const monthRecords = records.filter((r) => {
      if (!r.date?.startsWith(exportMonth)) return false;
      if (classId !== "all" && r.class_id !== classId) return false;
      return true;
    });
    const studentMap = {};
    exportStudents.forEach((s) => {
      studentMap[s.id] = { nis: s.nis || "", name: s.name || "", class_name: s.class_name || "", hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0, total: 0 };
    });
    monthRecords.forEach((r) => {
      if (studentMap[r.student_id]) {
        studentMap[r.student_id][r.status] = (studentMap[r.student_id][r.status] || 0) + 1;
        studentMap[r.student_id].total += 1;
      }
    });
    const rows = Object.values(studentMap).filter((s) => s.total > 0);
    const [year, month] = exportMonth.split("-");
    const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const className = classId !== "all" ? (classes.find((c) => c.id === classId)?.name || "") : "Semua Kelas";
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Rekap Absensi Bulanan", 14, 20);
    doc.setFontSize(10);
    doc.text(`Kelas: ${className}`, 14, 28);
    doc.text(`Bulan: ${monthName}`, 14, 34);
    let y = 46;
    doc.text("No", 14, y); doc.text("NIS", 28, y); doc.text("Nama", 55, y);
    doc.text("H", 120, y); doc.text("I", 130, y); doc.text("S", 140, y); doc.text("A", 150, y); doc.text("T", 160, y);
    doc.text("Total", 172, y); doc.text("%", 188, y);
    y += 6;
    doc.line(14, y - 2, 196, y - 2);
    y += 6;
    rows.forEach((s, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const pct = s.total > 0 ? Math.round(((s.hadir + s.terlambat) / s.total) * 100) : 0;
      doc.text(String(i + 1), 14, y);
      doc.text(String(s.nis || "-"), 28, y);
      doc.text(String(s.name || "-").substring(0, 25), 55, y);
      doc.text(String(s.hadir), 120, y);
      doc.text(String(s.izin), 130, y);
      doc.text(String(s.sakit), 140, y);
      doc.text(String(s.alpha), 150, y);
      doc.text(String(s.terlambat), 160, y);
      doc.text(String(s.total), 172, y);
      doc.text(`${pct}%`, 188, y);
      y += 8;
    });
    doc.save(`Rekap_Absensi_${className}_${exportMonth}.pdf`);
    toast({ title: "Export PDF berhasil" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Absensi Siswa</h1>
          <p className="mt-1 text-sm text-muted-foreground">Input kehadiran siswa harian</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="mr-1.5 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportXLSX}>
                <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export Excel
              </Button>
              <Button variant="destructive" onClick={handleReset}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Reset Tanggal Ini
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                <Save className="mr-1.5 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Absensi"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tanggal</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Kelas</label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Cari Siswa</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      {/* Recap + Percentage */}
      <div className="flex flex-wrap items-center gap-2">
        {recap.map((r) => (
          <div key={r.status} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${STATUS_CONFIG[r.status].badge}`}>
            {STATUS_CONFIG[r.status].label}: {r.count}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700">
          <Percent className="h-4 w-4" /> Kehadiran: {attendancePercent}%
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Export Rekap Bulanan {classId !== "all" ? `(${classes.find((c) => c.id === classId)?.name || ""})` : "(Semua Kelas)"}</label>
            <Input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="w-auto" />
          </div>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="mr-1.5 h-4 w-4" /> Export Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="mr-1.5 h-4 w-4" /> Export PDF
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>NIS</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2"><CalendarCheck className="h-8 w-8 text-muted-foreground/50" /> Tidak ada siswa</div>
              </TableCell></TableRow>
            ) : (
              filteredStudents.map((s) => {
                const att = attendanceMap[s.id];
                const currentStatus = att?.status;
                return (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell>{s.class_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <button
                            key={key}
                            onClick={() => isAdmin && setStatus(s.id, key)}
                            disabled={!isAdmin}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                              currentStatus === key ? cfg.color : "bg-muted text-muted-foreground hover:bg-muted/70"
                            } ${!isAdmin ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Riwayat */}
      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold">Riwayat Absensi Terbaru</h3>
        <div className="space-y-2">
          {records.slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{r.student_name}</span>
                <span className="ml-2 text-muted-foreground">{r.class_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[r.status]?.badge || ""}`}>{STATUS_CONFIG[r.status]?.label || r.status}</span>
              </div>
            </div>
          ))}
          {records.length === 0 && <p className="text-sm text-muted-foreground">Belum ada riwayat</p>}
        </div>
      </div>
    </div>
  );
}