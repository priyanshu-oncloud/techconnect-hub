import { useEffect, useState } from "react";
import { ref, set, onValue, off, remove, update } from "firebase/database";
import { initializeApp, deleteApp, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { database, app } from "@/firebase";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Power, ShieldAlert } from "lucide-react";
import { useAdmin, type AdminRole } from "@/contexts/AdminContext";

interface AdminEntry {
  email: string;
  role: AdminRole;
  disabled?: boolean;
  createdAt?: string;
}

const emptyForm = {
  email: "",
  password: "",
  role: "editor" as AdminRole,
};

export default function ManageAdmins() {
  const { toast } = useToast();
  const { user, role, hasRole } = useAdmin();
  const [admins, setAdmins] = useState<Record<string, AdminEntry>>({});
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = ref(database, "admins");
    const cb = onValue(r, (snap) => setAdmins(snap.val() || {}));
    return () => off(r, "value", cb);
  }, []);

  const isSuperadmin = hasRole(["superadmin"]);

  const handleCreate = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast({ title: "Enter a valid email", variant: "destructive" });
    if (form.password.length < 6)
      return toast({ title: "Password must be at least 6 characters", variant: "destructive" });

    setLoading(true);
    let secondary;
    try {
      // Use a secondary Firebase app so the current admin session is not replaced
      try {
        secondary = getApp("admin-creator");
      } catch {
        secondary = initializeApp(app.options, "admin-creator");
      }
      const secondaryAuth = getAuth(secondary);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, form.password);

      await set(ref(database, `admins/${cred.user.uid}`), {
        email,
        role: form.role,
        disabled: false,
        createdAt: new Date().toISOString(),
      });

      await signOut(secondaryAuth);
      toast({ title: "Admin added", description: email });
      setForm(emptyForm);
    } catch (err: any) {
      const code = err?.code || "";
      let msg = "Could not create admin.";
      if (code.includes("email-already-in-use")) msg = "This email already has an account.";
      else if (code.includes("weak-password")) msg = "Password is too weak.";
      else if (code.includes("invalid-email")) msg = "Invalid email address.";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      if (secondary) {
        try { await deleteApp(secondary); } catch { /* ignore */ }
      }
      setLoading(false);
    }
  };

  const toggleActive = async (uid: string, entry: AdminEntry) => {
    if (uid === user?.uid)
      return toast({ title: "You cannot disable your own account", variant: "destructive" });
    await update(ref(database, `admins/${uid}`), { disabled: !entry.disabled });
    toast({ title: entry.disabled ? "Admin enabled" : "Admin disabled", description: entry.email });
  };

  const changeRole = async (uid: string, newRole: AdminRole) => {
    if (uid === user?.uid)
      return toast({ title: "You cannot change your own role", variant: "destructive" });
    await update(ref(database, `admins/${uid}`), { role: newRole });
    toast({ title: "Role updated" });
  };

  const handleDelete = async (uid: string, entry: AdminEntry) => {
    if (uid === user?.uid)
      return toast({ title: "You cannot remove your own access", variant: "destructive" });
    if (!confirm(`Remove admin access for ${entry.email}?`)) return;
    await remove(ref(database, `admins/${uid}`));
    toast({ title: "Admin access removed", description: entry.email });
  };

  if (!isSuperadmin) {
    return (
      <AdminLayout>
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Access denied</h2>
            <p className="text-sm text-muted-foreground">
              Only a superadmin can manage admins. Your role: {role || "none"}.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  const entries = Object.entries(admins);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Admins</h1>
          <p className="text-muted-foreground text-sm">
            Add new admins, change roles, and enable or disable access.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5" /> Add Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Password (min 6 chars)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as AdminRole })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Adding..." : "Add Admin"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Admins ({entries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admins yet.</p>
            ) : (
              <>
                {/* MOBILE CARDS */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {entries.map(([uid, entry]) => (
                    <div key={uid} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium break-all text-sm">
                          {entry.email}
                          {uid === user?.uid && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <Badge variant={entry.disabled ? "destructive" : "default"}>
                          {entry.disabled ? "Disabled" : "Active"}
                        </Badge>
                      </div>
                      <Select
                        value={entry.role}
                        onValueChange={(v) => changeRole(uid, v as AdminRole)}
                        disabled={uid === user?.uid}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="superadmin">Superadmin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => toggleActive(uid, entry)}
                          disabled={uid === user?.uid}
                        >
                          <Power className="w-4 h-4 mr-1" />
                          {entry.disabled ? "Enable" : "Disable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDelete(uid, entry)}
                          disabled={uid === user?.uid}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TABLE (desktop) */}
                <div className="hidden md:block overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(([uid, entry]) => (
                    <TableRow key={uid}>
                      <TableCell className="font-medium">
                        {entry.email}
                        {uid === user?.uid && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={entry.role}
                          onValueChange={(v) => changeRole(uid, v as AdminRole)}
                          disabled={uid === user?.uid}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="superadmin">Superadmin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.disabled ? "destructive" : "default"}>
                          {entry.disabled ? "Disabled" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(uid, entry)}
                          disabled={uid === user?.uid}
                        >
                          <Power className="w-4 h-4 mr-1" />
                          {entry.disabled ? "Enable" : "Disable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(uid, entry)}
                          disabled={uid === user?.uid}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
