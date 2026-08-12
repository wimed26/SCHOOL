import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Megaphone, Search, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

const PRIORITY_CONFIG = {
  tinggi: { label: "Tinggi", color: "bg-rose-100 text-rose-700", border: "border-rose-200" },
  sedang: { label: "Sedang", color: "bg-amber-100 text-amber-700", border: "border-amber-200" },
  rendah: { label: "Rendah", color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
};

export default function AnnouncementArchive() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Announcement.list("-date");
      setAnnouncements(data);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const filtered = announcements.filter((a) => {
    if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Galeri Pengumuman</h1>
        <p className="mt-1 text-sm text-muted-foreground">Arsip riwayat semua pengumuman berdasarkan tanggal atau prioritas</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari pengumuman..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPriorityFilter("all")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${priorityFilter === "all" ? "bg-primary text-primary-foreground" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>Semua</button>
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <button key={key} onClick={() => setPriorityFilter(key)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${priorityFilter === key ? "bg-primary text-primary-foreground" : "bg-white border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>{config.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Megaphone className="h-12 w-12 text-muted-foreground/40" />
          <p>Belum ada pengumuman</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const config = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.sedang;
            return (
              <div key={a.id} className={`rounded-2xl border ${config.border} bg-white p-5 shadow-sm transition-all hover:shadow-md`}>
                <div className="mb-2 flex items-start justify-between">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${config.color}`}>{config.label}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {formatDate(a.date)}</span>
                </div>
                <h3 className="text-base font-bold">{a.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}