import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/StatCard";
import { formatCurrency, todayStr } from "@/lib/utils";
import {
  Users, School, CalendarCheck, Wallet, PiggyBank, ArrowLeftRight
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [attendanceChart, setAttendanceChart] = useState([]);
  const [cashChart, setCashChart] = useState([]);
  const [savingsChart, setSavingsChart] = useState([]);
  const [statusPie, setStatusPie] = useState([]);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [students, classes, attendance, cash, savings] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.ClassRoom.list(),
        base44.entities.Attendance.list("-date", 200),
        base44.entities.CashTransaction.list("-date", 200),
        base44.entities.SavingsTransaction.list("-date", 200),
      ]);

      const today = todayStr();
      const todayAttendance = attendance.filter((a) => a.date === today);
      const cashIn = cash.filter((c) => c.type === "masuk").reduce((s, c) => s + (c.amount || 0), 0);
      const cashOut = cash.filter((c) => c.type === "keluar").reduce((s, c) => s + (c.amount || 0), 0);
      const totalSavings = savings.reduce((s, t) => s + (t.type === "setor" ? (t.amount || 0) : -(t.amount || 0)), 0);
      const todayTx = [...cash, ...savings].filter((t) => t.date === today).length;

      setStats({
        studentCount: students.length,
        classCount: classes.length,
        todayPresent: todayAttendance.filter((a) => a.status === "hadir").length,
        todayTotal: todayAttendance.length,
        cashBalance: cashIn - cashOut,
        cashIn,
        cashOut,
        totalSavings,
        todayTx,
      });

      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const dayAtt = attendance.filter((a) => a.date === ds);
        last7.push({
          name: d.toLocaleDateString("id-ID", { weekday: "short" }),
          Hadir: dayAtt.filter((a) => a.status === "hadir").length,
          Izin: dayAtt.filter((a) => a.status === "izin").length,
          Sakit: dayAtt.filter((a) => a.status === "sakit").length,
          Alpha: dayAtt.filter((a) => a.status === "alpha").length,
        });
      }
      setAttendanceChart(last7);

      const statuses = ["hadir", "izin", "sakit", "alpha", "terlambat"];
      const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];
      setStatusPie(
        statuses
          .map((s, i) => ({ name: s, value: todayAttendance.filter((a) => a.status === s).length, color: colors[i] }))
          .filter((p) => p.value > 0)
      );

      const cash7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        cash7.push({
          name: d.toLocaleDateString("id-ID", { weekday: "short" }),
          Masuk: cash.filter((c) => c.date === ds && c.type === "masuk").reduce((s, c) => s + (c.amount || 0), 0),
          Keluar: cash.filter((c) => c.date === ds && c.type === "keluar").reduce((s, c) => s + (c.amount || 0), 0),
        });
      }
      setCashChart(cash7);

      const sav7 = [];
      let cumulative = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const daySetor = savings.filter((t) => t.date === ds && t.type === "setor").reduce((s, t) => s + (t.amount || 0), 0);
        const dayTarik = savings.filter((t) => t.date === ds && t.type === "tarik").reduce((s, t) => s + (t.amount || 0), 0);
        cumulative += daySetor - dayTarik;
        sav7.push({ name: d.toLocaleDateString("id-ID", { weekday: "short" }), Saldo: cumulative });
      }
      setSavingsChart(sav7);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ringkasan data administrasi sekolah hari ini</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Jumlah Siswa" value={stats.studentCount} loading={loading} color="emerald" />
        <StatCard icon={School} label="Jumlah Kelas" value={stats.classCount} loading={loading} color="blue" />
        <StatCard icon={CalendarCheck} label="Kehadiran Hari Ini" value={`${stats.todayPresent}/${stats.todayTotal}`} loading={loading} color="violet" />
        <StatCard icon={ArrowLeftRight} label="Transaksi Hari Ini" value={stats.todayTx} loading={loading} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatCard icon={Wallet} label="Saldo Kas" value={formatCurrency(stats.cashBalance)} loading={loading} color="emerald"
          sublabel={`Masuk: ${formatCurrency(stats.cashIn)} • Keluar: ${formatCurrency(stats.cashOut)}`} />
        <StatCard icon={PiggyBank} label="Total Tabungan" value={formatCurrency(stats.totalSavings)} loading={loading} color="rose" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">Grafik Kehadiran (7 Hari)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Izin" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sakit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Alpha" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">Grafik Kas (7 Hari)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cashChart}>
              <defs>
                <linearGradient id="cIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="cOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="Masuk" stroke="#10b981" fill="url(#cIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="Keluar" stroke="#ef4444" fill="url(#cOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">Grafik Tabungan (7 Hari)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={savingsChart}>
              <defs><linearGradient id="savG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="Saldo" stroke="#8b5cf6" fill="url(#savG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">Status Kehadiran Hari Ini</h3>
          {statusPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                  {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">Belum ada data absensi hari ini</div>
          )}
        </div>
      </div>
    </div>
  );
}