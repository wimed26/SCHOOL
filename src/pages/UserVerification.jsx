import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, UserX, Clock, ShieldCheck, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

export default function UserVerification() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.User.list();
      setUsers(data);
    } catch (e) { toast({ title: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  const logActivity = async (email, action, detail) => {
    try {
      await base44.entities.ActivityLog.create({
        user_name: email, action, detail, date: new Date().toISOString(),
      });
    } catch (e) {}
  };

  const approveUser = async (u) => {
    try {
      await base44.entities.User.update(u.id, { is_approved: true });
      await logActivity(u.email, "Persetujuan Pengguna", `Pengguna ${u.email} disetujui`);
      toast({ title: "Pengguna disetujui", description: u.email });
      fetchUsers();
    } catch (e) { toast({ title: "Gagal menyetujui", variant: "destructive" }); }
  };

  const revokeUser = async (u) => {
    try {
      await base44.entities.User.update(u.id, { is_approved: false });
      await logActivity(u.email, "Pencabutan Akses", `Akses pengguna ${u.email} dicabut`);
      toast({ title: "Akses dicabut", description: u.email });
      fetchUsers();
    } catch (e) { toast({ title: "Gagal mengubah status", variant: "destructive" }); }
  };

  const changeRole = async (u, newRole) => {
    if (newRole === u.role) return;
    try {
      await base44.entities.User.update(u.id, { role: newRole });
      await logActivity(u.email, "Perubahan Role", `Role ${u.email} diubah menjadi ${newRole}`);
      toast({ title: `Role diubah menjadi ${newRole}` });
      fetchUsers();
    } catch (e) { toast({ title: "Gagal mengubah role", variant: "destructive" }); }
  };

  const roleBadge = (role) => {
    const map = { admin: "bg-emerald-100 text-emerald-700", siswa: "bg-violet-100 text-violet-700", user: "bg-blue-100 text-blue-700" };
    const label = { admin: "Admin", siswa: "Siswa", user: "User" };
    return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${map[role] || map.user}`}>{label[role] || "User"}</span>;
  };

  const pendingUsers = users.filter((u) => !u.is_approved);
  const approvedUsers = users.filter((u) => u.is_approved);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Verifikasi Pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">Setujui pengguna baru dan kelola role akses</p>
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
            <div><p className="text-xs font-medium text-muted-foreground">Menunggu Persetujuan</p><p className="text-xl font-extrabold text-amber-600">{pendingUsers.length}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="text-xs font-medium text-muted-foreground">Pengguna Aktif</p><p className="text-xl font-extrabold text-emerald-600">{approvedUsers.length}</p></div>
          </div>
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
          <div className="border-b border-amber-200/60 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800">
              <Clock className="h-4 w-4" /> Menunggu Persetujuan ({pendingUsers.length})
            </h3>
          </div>
          <Table>
            <TableHeader><TableRow className="bg-amber-100/50">
              <TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Terdaftar</TableHead><TableHead className="text-right">Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {pendingUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold">{u.full_name || "-"}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(u.created_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => approveUser(u)} className="bg-emerald-600 hover:bg-emerald-700">
                      <UserCheck className="mr-1 h-3.5 w-3.5" /> Setujui
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="border-b border-border/60 p-4">
          <h3 className="text-sm font-bold">Semua Pengguna</h3>
        </div>
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Terdaftar</TableHead><TableHead className="text-right">Aksi</TableHead>
          </TableRow></TableHeader>
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
                    <Select value={u.role} onValueChange={(newRole) => changeRole(u, newRole)}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="siswa">Siswa</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${u.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{u.is_approved ? "Disetujui" : "Menunggu"}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(u.created_date)}</TableCell>
                  <TableCell className="text-right">
                    {u.is_approved ? (
                      <Button variant="outline" size="sm" onClick={() => revokeUser(u)} className="text-destructive hover:text-destructive">
                        <UserX className="mr-1 h-3.5 w-3.5" /> Cabut
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => approveUser(u)} className="bg-emerald-600 hover:bg-emerald-700">
                        <UserCheck className="mr-1 h-3.5 w-3.5" /> Setujui
                      </Button>
                    )}
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