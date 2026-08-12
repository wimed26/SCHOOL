import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Megaphone } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function NotificationBell() {
  const [announcements, setAnnouncements] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await base44.entities.Announcement.list("-date", 20);
        setAnnouncements(data);
      } catch (e) {}
    };
    fetchAnnouncements();
    const unsubscribe = base44.entities.Announcement.subscribe((event) => {
      if (event.type === "create") setAnnouncements((prev) => [event.data, ...prev].slice(0, 20));
      else if (event.type === "delete") setAnnouncements((prev) => prev.filter((a) => a.id !== event.data.id));
      else if (event.type === "update") setAnnouncements((prev) => prev.map((a) => a.id === event.data.id ? event.data : a));
    });
    return unsubscribe;
  }, []);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const recentCount = announcements.filter((a) => new Date(a.date) >= yesterday).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-muted"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {recentCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {recentCount > 9 ? "9+" : recentCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 max-h-96 w-80 overflow-y-auto rounded-2xl border border-border/60 bg-white shadow-xl">
            <div className="border-b border-border/60 p-3">
              <h3 className="flex items-center gap-2 text-sm font-bold"><Bell className="h-4 w-4" /> Notifikasi Realtime</h3>
            </div>
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
                <Megaphone className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                        a.priority === "tinggi" ? "bg-rose-100 text-rose-700" :
                        a.priority === "sedang" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>{a.priority || "sedang"}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.content}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(a.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}