import { useEffect, useMemo, useState } from "react";
import { ref as dbRef, onValue, update, remove } from "firebase/database";
import { database } from "@/firebase";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateReceiptPDF, type ReceiptData } from "@/utils/generateReceiptPDF";
import {
  Download,
  IndianRupee,
  Receipt,
  Undo2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileDown,
} from "lucide-react";

interface PaymentRecord extends ReceiptData {
  refundStatus?: "none" | "requested" | "approved" | "rejected";
  refundReason?: string;
  refundRequestedAt?: string;
  type?: string;
}

const statusBadge = (p: PaymentRecord) => {
  if (p.refundStatus === "approved")
    return <Badge className="bg-destructive text-destructive-foreground">Refunded</Badge>;
  if (p.refundStatus === "requested")
    return <Badge variant="secondary">Refund requested</Badge>;
  if (p.status === "free") return <Badge variant="outline">Free</Badge>;
  return <Badge>Paid</Badge>;
};

export default function ManagePayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const unsub = onValue(dbRef(database, "payments"), (snap) => {
      const val = snap.val() || {};
      const list = Object.values<PaymentRecord>(val).sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
      setPayments(list);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchQ =
        !q ||
        [p.invoiceNo, p.name, p.email, p.paymentId, p.couponCode, p.referralCode]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const matchF =
        filter === "all"
          ? true
          : filter === "paid"
          ? p.status === "paid" && p.refundStatus !== "approved"
          : filter === "free"
          ? p.status === "free"
          : filter === "refund_requested"
          ? p.refundStatus === "requested"
          : filter === "refunded"
          ? p.refundStatus === "approved"
          : true;
      return matchQ && matchF;
    });
  }, [payments, search, filter]);

  const stats = useMemo(() => {
    const collected = payments
      .filter((p) => p.refundStatus !== "approved")
      .reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
    const refunded = payments
      .filter((p) => p.refundStatus === "approved")
      .reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
    return {
      total: payments.length,
      collected,
      refunded,
      pending: payments.filter((p) => p.refundStatus === "requested").length,
    };
  }, [payments]);

  const setRefund = async (
    p: PaymentRecord,
    status: "approved" | "rejected" | "none"
  ) => {
    try {
      await update(dbRef(database, `payments/${p.invoiceNo}`), {
        refundStatus: status,
        refundUpdatedAt: new Date().toISOString(),
        ...(status === "approved" ? { status: "refunded" } : {}),
      });
      toast({ title: `Refund ${status}` });
    } catch (e) {
      console.error(e);
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const del = async (p: PaymentRecord) => {
    if (!confirm(`Delete invoice ${p.invoiceNo}?`)) return;
    await remove(dbRef(database, `payments/${p.invoiceNo}`));
    toast({ title: "Deleted" });
  };

  const exportCSV = () => {
    const headers = [
      "Invoice",
      "Date",
      "Name",
      "Email",
      "Phone",
      "Position",
      "Payment ID",
      "Original",
      "Discount",
      "Paid",
      "Coupon",
      "Referral",
      "Status",
      "Refund",
    ];
    const rows = filtered.map((p) => [
      p.invoiceNo,
      p.date,
      p.name,
      p.email,
      p.phone || "",
      p.position || "",
      p.paymentId,
      p.originalAmount,
      p.discountApplied,
      p.amountPaid,
      p.couponCode || "",
      p.referralCode || "",
      p.status,
      p.refundStatus || "none",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: string | number;
    icon: any;
  }) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  const RefundActions = ({ p }: { p: PaymentRecord }) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => generateReceiptPDF(p)}>
        <Download className="w-4 h-4" />
      </Button>
      {p.refundStatus === "requested" && (
        <>
          <Button size="sm" onClick={() => setRefund(p, "approved")}>
            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRefund(p, "rejected")}
          >
            <XCircle className="w-4 h-4 mr-1" /> Reject
          </Button>
        </>
      )}
      {(!p.refundStatus || p.refundStatus === "none") && p.status === "paid" && (
        <Button size="sm" variant="secondary" onClick={() => setRefund(p, "approved")}>
          <Undo2 className="w-4 h-4 mr-1" /> Mark refunded
        </Button>
      )}
      <Button size="sm" variant="destructive" onClick={() => del(p)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Payments & Invoices</h1>
            <p className="text-muted-foreground text-sm">
              Receipts, invoice history and refund requests
            </p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <FileDown className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Transactions" value={stats.total} icon={Receipt} />
          <StatCard label="Collected" value={`₹${stats.collected}`} icon={IndianRupee} />
          <StatCard label="Refunded" value={`₹${stats.refunded}`} icon={Undo2} />
          <StatCard label="Refund requests" value={stats.pending} icon={XCircle} />
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>All transactions</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search invoice, name, email, payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="free">Free (coupon)</SelectItem>
                  <SelectItem value="refund_requested">Refund requested</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No transactions found.
              </p>
            ) : (
              <>
                {/* MOBILE CARDS */}
                <div className="grid gap-3 md:hidden">
                  {filtered.map((p) => (
                    <Card key={p.invoiceNo} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{p.invoiceNo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.date).toLocaleString("en-IN")}
                          </p>
                        </div>
                        {statusBadge(p)}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-muted-foreground break-all">{p.email}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-semibold">₹{p.amountPaid}</span>
                      </div>
                      {p.refundReason && (
                        <p className="text-xs text-muted-foreground">
                          Reason: {p.refundReason}
                        </p>
                      )}
                      <RefundActions p={p} />
                    </Card>
                  ))}
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((p) => (
                        <TableRow key={p.invoiceNo}>
                          <TableCell>
                            <p className="font-medium">{p.invoiceNo}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(p.date).toLocaleDateString("en-IN")}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">₹{p.amountPaid}</p>
                            {p.discountApplied > 0 && (
                              <p className="text-xs text-muted-foreground">
                                -₹{p.discountApplied}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {p.couponCode || p.referralCode || "—"}
                          </TableCell>
                          <TableCell>{statusBadge(p)}</TableCell>
                          <TableCell>
                            <RefundActions p={p} />
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
