import React, { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { QrCode, Loader2, UserCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function MyBarcode() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const barcodeRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const students = await base44.entities.Student.list();
        const match = students.find((s) =>
          s.name?.toLowerCase().trim() === user?.full_name?.toLowerCase().trim()
        );
        setStudent(match || null);
      } catch (e) {
        toast({ title: "Gagal memuat data", variant: "destructive" });
      }
      setLoading(false);
    };
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (barcodeRef.current && student?.nis) {
      try {
        JsBarcode(barcodeRef.current, student.nis, {
          format: "CODE128",
          displayValue: true,
          fontSize: 16,
          height: 80,
          width: 2.5,
          margin: 8,
        });
      } catch (e) {}
    }
  }, [student]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Barcode Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">Barcode pribadi untuk absensi scan</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : student ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg animate-float">
              <QrCode className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-extrabold">{student.name}</h2>
            <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
            <p className="text-sm text-muted-foreground">
              {student.class_name || "-"} · {student.gender === "L" ? "Laki-laki" : student.gender === "P" ? "Perempuan" : "-"}
            </p>
          </div>
          <div className="mt-6 flex justify-center rounded-xl bg-muted/30 p-4">
            <svg ref={barcodeRef} />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Tunjukkan barcode ini ke scanner untuk mencatat kehadiran
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <UserCircle className="h-8 w-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            Data siswa belum terhubung dengan akun Anda. Hubungi admin untuk mengaitkan data siswa dengan nama yang sesuai.
          </p>
        </div>
      )}
    </div>
  );
}