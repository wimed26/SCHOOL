import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, CheckCircle2, XCircle, Keyboard, ScanLine, Settings, Clock, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { todayStr } from "@/lib/utils";

export default function BarcodeScan() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canConfigure = user?.role === "admin" || user?.role === "user";
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [manualNis, setManualNis] = useState("");
  const [settings, setSettings] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [editLate, setEditLate] = useState("07:30");
  const [editStart, setEditStart] = useState("06:00");
  const [savingSettings, setSavingSettings] = useState(false);
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ text: "", time: 0 });
  const studentsRef = useRef([]);
  const attendanceRef = useRef([]);
  const settingsRef = useRef(null);

  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { attendanceRef.current = attendance; }, [attendance]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, a, st] = await Promise.all([
          base44.entities.Student.list(),
          base44.entities.Attendance.filter({ date: todayStr() }),
          base44.entities.AttendanceSetting.list(),
        ]);
        setStudents(s);
        setAttendance(a);
        const currentSetting = st[0] || null;
        setSettings(currentSetting);
        if (currentSetting) {
          setEditLate(currentSetting.late_threshold || "07:30");
          setEditStart(currentSetting.start_time || "06:00");
        }
      } catch (e) {
        toast({ title: "Gagal memuat data", variant: "destructive" });
      }
    };
    fetchData();
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop().then(() => scannerRef.current.clear()); } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, []);

  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const playErrorSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 200; osc.type = "square";
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  const playAlreadySound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 600; osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.15);
      });
    } catch (e) {}
  };

  const getCurrentTimeStr = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  };

  const checkLate = () => {
    const threshold = settingsRef.current?.late_threshold || "07:30";
    return getCurrentTimeStr() > threshold;
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      if (settings) {
        await base44.entities.AttendanceSetting.update(settings.id, { late_threshold: editLate, start_time: editStart });
      } else {
        const created = await base44.entities.AttendanceSetting.create({ late_threshold: editLate, start_time: editStart });
        setSettings(created);
      }
      setSettings((prev) => ({ ...prev, late_threshold: editLate, start_time: editStart }));
      toast({ title: "Pengaturan tersimpan" });
      setShowSettings(false);
    } catch (e) {
      toast({ title: "Gagal menyimpan pengaturan", variant: "destructive" });
    }
    setSavingSettings(false);
  };

  const handleScan = async (decodedText) => {
    const now = Date.now();
    if (decodedText === lastScanRef.current.text && now - lastScanRef.current.time < 3000) return;
    lastScanRef.current = { text: decodedText, time: now };

    let nis;
    try {
      const qrData = JSON.parse(decodedText);
      nis = qrData.nis;
    } catch (e) {
      nis = decodedText;
    }

    if (!nis) {
      playErrorSound();
      toast({ title: "QR tidak valid", description: "Data QR tidak dikenali", variant: "destructive" });
      return;
    }

    const student = studentsRef.current.find((s) => s.nis === nis);
    if (!student) {
      playErrorSound();
      toast({ title: "Siswa tidak ditemukan", description: `NIS: ${nis}`, variant: "destructive" });
      return;
    }

    const existing = attendanceRef.current.find((a) => a.student_id === student.id && a.date === todayStr());
    if (existing) {
      playAlreadySound();
      toast({ title: "Sudah tercatat", description: `${student.name} sudah tercatat hadir` });
      setRecentScans((prev) => [{ student, status: "sudah", time: new Date() }, ...prev].slice(0, 10));
      return;
    }

    try {
      const late = checkLate();
      const data = {
        student_id: student.id,
        student_name: student.name,
        student_nis: student.nis,
        class_id: student.class_id || "",
        class_name: student.class_name || "",
        date: todayStr(),
        status: late ? "terlambat" : "hadir",
        note: `Scan QR - ${getCurrentTimeStr()}`,
      };
      await base44.entities.Attendance.create(data);
      setAttendance((prev) => [...prev, data]);
      playSuccessSound();
      toast({ title: "Kehadiran tercatat", description: `${student.name} - ${late ? "Terlambat" : "Hadir"}` });
      setRecentScans((prev) => [{ student, status: "baru", time: new Date(), late }, ...prev].slice(0, 10));
    } catch (e) {
      playErrorSound();
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
  };

  const startScan = async () => {
    try {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        handleScan
      );
      setScanning(true);
    } catch (e) {
      toast({ title: "Gagal mengakses kamera", description: "Gunakan input manual di bawah", variant: "destructive" });
    }
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualNis.trim()) return;
    await handleScan(manualNis.trim());
    setManualNis("");
  };

  const todayAttended = attendance.filter((a) => a.status === "hadir" || a.status === "terlambat").length;
  const todayLate = attendance.filter((a) => a.status === "terlambat").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Scan Absensi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Scan barcode siswa untuk mencatat kehadiran otomatis</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Siswa</p>
          <p className="text-2xl font-extrabold">{students.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Hadir Hari Ini</p>
          <p className="text-2xl font-extrabold text-emerald-600">{todayAttended}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Terlambat</p>
          <p className="text-2xl font-extrabold text-violet-600">{todayLate}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Belum Hadir</p>
          <p className="text-2xl font-extrabold text-amber-600">{students.length - todayAttended}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Jam Absensi</p>
              <p className="text-xl font-extrabold tracking-tight">{currentTime.toLocaleTimeString("id-ID")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Batas Terlambat</p>
            <p className="text-sm font-bold text-amber-600">{settings?.late_threshold || "07:30"}</p>
          </div>
          {canConfigure && (
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="mr-1.5 h-4 w-4" /> Pengaturan
            </Button>
          )}
        </div>
        {showSettings && canConfigure && (
          <div className="mt-4 rounded-xl bg-muted/30 p-4">
            <h4 className="mb-3 text-sm font-bold">Pengaturan Absensi</h4>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Jam Mulai Absensi</label>
                <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="w-auto" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Batas Keterlambatan</label>
                <Input type="time" value={editLate} onChange={(e) => setEditLate(e.target.value)} className="w-auto" />
              </div>
              <Button onClick={saveSettings} disabled={savingSettings} className="bg-primary hover:bg-primary/90">
                <Save className="mr-1.5 h-4 w-4" /> {savingSettings ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold"><ScanLine className="h-4 w-4" /> Scanner QR Code</div>
        <div id="barcode-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-xl" />
        <div className="mt-4 text-center">
          {!scanning ? (
            <Button onClick={startScan} className="bg-primary hover:bg-primary/90">
              <Camera className="mr-1.5 h-4 w-4" /> Mulai Scan
            </Button>
          ) : (
            <Button onClick={stopScan} variant="destructive">
              <CameraOff className="mr-1.5 h-4 w-4" /> Stop Scan
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Keyboard className="h-4 w-4" /> Input Manual NIS</h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input placeholder="Masukkan NIS siswa..." value={manualNis} onChange={(e) => setManualNis(e.target.value)} />
          <Button type="submit" className="bg-primary hover:bg-primary/90">Catat</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold">Riwayat Scan Terbaru</h3>
        {recentScans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada scan</p>
        ) : (
          <div className="space-y-2">
            {recentScans.map((scan, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  {scan.status === "baru" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-amber-500" />}
                  <span className="font-medium">{scan.student.name}</span>
                  <span className="text-xs text-muted-foreground">{scan.student.class_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${scan.status === "baru" ? (scan.late ? "text-violet-600" : "text-emerald-600") : "text-amber-600"}`}>
                    {scan.status === "baru" ? (scan.late ? "Terlambat" : "Hadir") : "Sudah tercatat"}
                  </span>
                  <span className="text-xs text-muted-foreground">{scan.time.toLocaleTimeString("id-ID")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}