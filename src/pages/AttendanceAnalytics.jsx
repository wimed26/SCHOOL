import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Percent, TrendingUp, CalendarCheck } from "lucide-react";

const STATUS_COLORS = { hadir: "#10b981", izin: "#3b82f6", sakit: "#f59e0b", alpha: "#ef4444", terlambat: "#8b5cf6" };
const STATUS_LABELS = { hadir: "Hadir", izin: "Izin", sakit: "Sakit", alpha: "Alpha", terlambat: "Terlambat" };

export default function AttendanceAnalytics() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, c, a] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.ClassRoom.list(),
        base44.entities.Attendance.list("-date", 1000),
      ]);
      setStudents(s); setClasses(c); setAttendance(a);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const totalRecords = attendance.length;
  const presentRecords = attendance.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
  const overallPct = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  const classData = classes.map((c) => {
    const classStudentIds = new Set(students.filter((s) => s.class_id === c.id).map((s) => s.id));
    const recs = attendance.filter((r) => classStudentIds.has(r.student_id) || r.class_id === c.id);
    const total = recs.length;
    const present = recs.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
    return { name: c.name, persen: total > 0 ? Math.round((present / total) * 100) : 0, total, present };
  });

  const trendData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const dayRecs = attendance.filter((r) => r.date === ds);
    const dayTotal = dayRecs.length;
    const dayPresent = dayRecs.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
    trendData.push({
      name: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      persen: dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0,
      total: dayTotal,
    });
  }

  const statusData = Object.keys(STATUS_LABELS).map((st) => ({
    name: STATUS_LABELS[st],
    value: attendance.filter((r) => r.status === st).length,
    color: STATUS_COLORS[st],
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Grafik Kehadiran</h1>
        <p className="mt-1 text-sm text-muted-foreground">Analisis kehadiran siswa per kelas dan tren waktu</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Memuat...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20"><Percent className="h-5 w-5" /></div>
                <div><p className="text-xs font-medium text-white/80">Persentase Kehadiran</p><p className="text-2xl font-extrabold">{overallPct}%</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><CalendarCheck className="h-5 w-5" /></div>
                <div><p className="text-xs font-medium text-muted-foreground">Total Record Absensi</p><p className="text-2xl font-extrabold">{totalRecords}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><TrendingUp className="h-5 w-5" /></div>
                <div><p className="text-xs font-medium text-muted-foreground">Hadir + Terlambat</p><p className="text-2xl font-extrabold">{presentRecords}</p></div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold">Tren Kehadiran (30 Hari)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`${v}%`, "Kehadiran"]} />
                <Line type="monotone" dataKey="persen" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold">Persentase Kehadiran per Kelas</h3>
              {classData.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data kelas</p> :
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`${v}%`, "Kehadiran"]} />
                  <Bar dataKey="persen" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>}
            </div>

            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold">Distribusi Status Absensi</h3>
              {statusData.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data</p> :
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value}`}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}