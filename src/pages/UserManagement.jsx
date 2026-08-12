import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, UserX, Shield, Users, Clock, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excelExport";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.User.list();
      setUsers(data);
    } catch (e) { toast({ title: "Gagal memuat data pengguna", variant: "destructive" }); }
    setLoading(false);
  };

  const toggleApproval = async (u) => {
    try {
      await base44.entities.User.update(u.id, { is_approved: !u.is_approved });
      toast({ title: u.is_approved ? "Akses pengguna dicabut" : "Pengguna disetujui" });
      fetchUsers();
    } catch (e) { toast({ title: "Gagal mengubah status", variant: "destructive" }); }
  };

  const changeRole = async (u, newRole) => {
    if (newRole === u.role) return;
    try {
      await base44.entities.User.update(u.id, { role: newRole });
      toast({ title: `Role diubah menjadi ${newRole}` });
      fetchUsers();
    } catch (e) { toast({ title: "Gagal mengubah role", variant: "destructive" }); }
  };

  const pendingCount = users.filter((u) => !u.is_approved).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const columns = [
      { header: "No", key: "no", type: "number" },
      { header: "Nama", key: "full_name" },
      { header: "Email", key: "email" },
      { header: "Role", key: "role" },
      { header: "Status", key: "statusLabel" },
      { header: "Terdaftar", key: "created_date" },
    ];
    const rows = users.map((u, i) => ({
      no: i + 1,
      full_name: u.full_name || "-",
      email: u.email || "-",
      role: u.role === "admin" ? "Admin" : u.role === "siswa" ? "Siswa" : "User",
      statusLabel: u.is_approved ? "Disetujui" : "Menunggu",
      created_date: u.created_date ? new Date(u.created_date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-",
    }));
    await exportToExcel({
      filename: `Data_Pengguna_${today}.xlsx`,
      moduleName: "Manajemen Pengguna",
      columns, rows,
      userName: user?.full_name || user?.email || "",
      summary: [
        { label: "Jumlah Pengguna", value: users.length },
        { label: "Menunggu Persetujuan", value: pendingCount },
        { label: "Admin", value: adminCount },
      ],
    });
    toast({ title: "Export Excel berhasil" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-muted-foreground">Setujui pengguna baru dan kelola role akses</p>
        </div>
        <Button variant="outline" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export Excel</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Users className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Total Pengguna</p><p className="text-xl font-extrabold">{users.length}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Clock className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Menunggu Persetujuan</p><p className="text-xl font-extrabold text-amber-600">{pendingCount}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Shield className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Admin</p><p className="text-xl font-extrabold text-emerald-600">{adminCount}</p></div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada pengguna</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold">{u.full_name || "-"}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-emerald-100 text-emerald-700" : u.role === "siswa" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                      {u.role === "admin" ? "Admin" : u.role === "siswa" ? "Siswa" : "User"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${u.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {u.is_approved ? "Disetujui" : "Menunggu"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(u.created_date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Select value={u.role} onValueChange={(newRole) => changeRole(u, newRole)}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="siswa">Siswa</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant={u.is_approved ? "destructive" : "default"} size="sm" onClick={() => toggleApproval(u)}>
                        {u.is_approved ? <><UserX className="mr-1 h-3.5 w-3.5" /> Cabut</> : <><UserCheck className="mr-1 h-3.5 w-3.5" /> Setujui</>}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}