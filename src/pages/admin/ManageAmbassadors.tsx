import { useEffect, useMemo, useState } from "react";
import { ref, onValue, off, remove, update } from "firebase/database";
import { database } from "@/firebase";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Check, X, Trash2, Download, Eye, Users, Clock, Award, TrendingUp, Search,
} from "lucide-react";

interface Application {
  fullName?: string;
  email?: string;
  phone?: string;
  college?: string;
  course?: string;
  year?: string;
  city?: string;
  why?: string;
  resumeUrl?: string;
  referralCode?: string;
  status?: string;
  createdAt?: string;
  [k: string]: unknown;
}

interface Ambassador {
  fullName?: string;
  email?: string;
  phone?: string;
  college?: string;
  referralCode?: string;
  referrals?: number;
  successfulRegistrations?: number;
  status?: string;
  createdAt?: string;
}

const tierOf = (n: number) =>
  n >= 50 ? "Platinum" : n >= 25 ? "Gold" : n >= 10 ? "Silver" : "Bronze";

const statusVariant = (s?: string) =>
  s === "approved" || s === "active"
    ? "default"
    : s === "rejected" || s === "suspended"
    ? "destructive"
    : "secondary";

const toCSV = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
};

export default function ManageAmbassadors() {
  const { toast } = useToast();
  const [apps, setApps] = useState<Record<string, Application>>({});
  const [ambs, setAmbs] = useState<Record<string, Ambassador>>({});
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState<{ id: string; data: Application } | null>(null);

  useEffect(() => {
    const rA = ref(database, "ambassador_applications");
    const rB = ref(database, "ambassadors");
    const cbA = onValue(rA, (s) => setApps(s.val() || {}));
    const cbB = onValue(rB, (s) => setAmbs(s.val() || {}));
    return () => {
      off(rA, "value", cbA);
      off(rB, "value", cbB);
    };
  }, []);

  const appList = useMemo(
    () =>
      Object.entries(apps)
        .filter(([, a]) => (statusFilter === "all" ? true : (a.status || "pending") === statusFilter))
        .filter(([, a]) =>
          q
            ? [a.fullName, a.email, a.college, a.referralCode]
                .join(" ")
                .toLowerCase()
                .includes(q.toLowerCase())
            : true
        )
        .sort((a, b) => String(b[1].createdAt || "").localeCompare(String(a[1].createdAt || ""))),
    [apps, q, statusFilter]
  );

  const ambList = useMemo(
    () =>
      Object.entries(ambs)
        .filter(([, a]) =>
          q
            ? [a.fullName, a.email, a.college, a.referralCode]
                .join(" ")
                .toLowerCase()
                .includes(q.toLowerCase())
            : true
        )
        .sort(
          (a, b) => (b[1].successfulRegistrations || 0) - (a[1].successfulRegistrations || 0)
        ),
    [ambs, q]
  );

  const stats = useMemo(() => {
    const all = Object.values(apps);
    return {
      total: all.length,
      pending: all.filter((a) => (a.status || "pending") === "pending").length,
      approved: all.filter((a) => a.status === "approved").length,
      registrations: Object.values(ambs).reduce(
        (s, a) => s + (a.successfulRegistrations || 0),
        0
      ),
    };
  }, [apps, ambs]);

  const setAppStatus = async (id: string, status: string) => {
    await update(ref(database, `ambassador_applications/${id}`), {
      status,
      reviewedAt: new Date().toISOString(),
    });
    toast({ title: `Application ${status}` });
  };

  const deleteApp = async (id: string) => {
    await remove(ref(database, `ambassador_applications/${id}`));
    toast({ title: "Application deleted" });
  };

  const setAmbField = async (uid: string, patch: Partial<Ambassador>) => {
    await update(ref(database, `ambassadors/${uid}`), patch);
    toast({ title: "Ambassador updated" });
  };

  const deleteAmb = async (uid: string) => {
    await remove(ref(database, `ambassadors/${uid}`));
    toast({ title: "Ambassador removed", description: "Login account must be removed separately." });
  };

  const exportCSV = (rows: Record<string, unknown>[], name: string) => {
    const csv = toCSV(rows);
    if (!csv) return toast({ title: "Nothing to export", variant: "destructive" });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Applications", value: stats.total, icon: Users },
    { label: "Pending Review", value: stats.pending, icon: Clock },
    { label: "Approved", value: stats.approved, icon: Award },
    { label: "Total Registrations", value: stats.registrations, icon: TrendingUp },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Student Ambassadors</h1>
          <p className="text-sm md:text-base text-muted-foreground">Review applications and manage active ambassadors.</p>
        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className="h-8 w-8 text-primary/60" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, college or code"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger className="flex-1 sm:flex-none text-xs sm:text-sm" value="applications">Applications ({appList.length})</TabsTrigger>
            <TabsTrigger className="flex-1 sm:flex-none text-xs sm:text-sm" value="ambassadors">Ambassadors ({ambList.length})</TabsTrigger>
          </TabsList>


          <TabsContent value="applications" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Applications</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(appList.map(([, a]) => a as Record<string, unknown>), "ambassador-applications")}
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {/* MOBILE CARDS */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {appList.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">No applications found.</p>
                  )}
                  {appList.map(([id, a]) => (
                    <div key={id} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{a.fullName || "—"}</p>
                          <p className="text-xs text-muted-foreground break-all">{a.email}</p>
                        </div>
                        <Badge variant={statusVariant(a.status)}>{a.status || "pending"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.college || "—"}</p>
                      <p className="font-mono text-xs">{a.referralCode || "—"}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewing({ id, data: a })}>
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAppStatus(id, "approved")}>
                          <Check className="mr-1 h-4 w-4 text-green-500" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAppStatus(id, "rejected")}>
                          <X className="mr-1 h-4 w-4 text-destructive" /> Reject
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteApp(id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TABLE (desktop) */}
                <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No applications found.
                        </TableCell>
                      </TableRow>
                    )}
                    {appList.map(([id, a]) => (
                      <TableRow key={id}>
                        <TableCell>
                          <div className="font-medium">{a.fullName || "—"}</div>
                          <div className="text-xs text-muted-foreground">{a.email}</div>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">{a.college || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{a.referralCode || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(a.status)}>{a.status || "pending"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setViewing({ id, data: a })}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setAppStatus(id, "approved")}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setAppStatus(id, "rejected")}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteApp(id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ambassadors" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Active Ambassadors</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(ambList.map(([, a]) => a as Record<string, unknown>), "ambassadors")}
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {/* MOBILE CARDS */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {ambList.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">No ambassadors yet.</p>
                  )}
                  {ambList.map(([uid, a]) => (
                    <div key={uid} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{a.fullName || "—"}</p>
                          <p className="text-xs text-muted-foreground break-all">{a.email}</p>
                          <p className="font-mono text-xs">{a.referralCode || "—"}</p>
                        </div>
                        <Badge variant="outline">{tierOf(a.successfulRegistrations || 0)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Referrals</p>
                          <Input
                            type="number"
                            className="h-9"
                            defaultValue={a.referrals || 0}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== (a.referrals || 0)) setAmbField(uid, { referrals: v });
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Registrations</p>
                          <Input
                            type="number"
                            className="h-9"
                            defaultValue={a.successfulRegistrations || 0}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== (a.successfulRegistrations || 0))
                                setAmbField(uid, { successfulRegistrations: v });
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={a.status || "active"}
                          onValueChange={(v) => setAmbField(uid, { status: v })}
                        >
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="destructive" onClick={() => deleteAmb(uid)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TABLE (desktop) */}
                <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Registrations</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ambList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          No ambassadors yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {ambList.map(([uid, a]) => (
                      <TableRow key={uid}>
                        <TableCell>
                          <div className="font-medium">{a.fullName || "—"}</div>
                          <div className="text-xs text-muted-foreground">{a.email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{a.referralCode || "—"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 w-20"
                            defaultValue={a.referrals || 0}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== (a.referrals || 0)) setAmbField(uid, { referrals: v });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 w-20"
                            defaultValue={a.successfulRegistrations || 0}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== (a.successfulRegistrations || 0))
                                setAmbField(uid, { successfulRegistrations: v });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tierOf(a.successfulRegistrations || 0)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={a.status || "active"}
                            onValueChange={(v) => setAmbField(uid, { status: v })}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => deleteAmb(uid)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.data.fullName || "Application"}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              {Object.entries(viewing.data)
                .filter(([k]) => k !== "resumeUrl")
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                    <span className="col-span-2 break-words">{String(v ?? "—")}</span>
                  </div>
                ))}
              {viewing.data.resumeUrl && (
                <a
                  href={viewing.data.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block font-medium text-primary hover:underline"
                >
                  View resume
                </a>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setAppStatus(viewing.id, "approved");
                    setViewing(null);
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setAppStatus(viewing.id, "rejected");
                    setViewing(null);
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
