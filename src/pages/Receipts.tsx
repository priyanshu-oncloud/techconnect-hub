import { useState } from "react";
import { ref as dbRef, get, update } from "firebase/database";
import { database } from "@/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateReceiptPDF, type ReceiptData } from "@/utils/generateReceiptPDF";
import { Download, Search, ReceiptText, Undo2 } from "lucide-react";

interface PaymentRecord extends ReceiptData {
  refundStatus?: "none" | "requested" | "approved" | "rejected";
  refundReason?: string;
  type?: string;
}

const refundBadge = (s?: string) => {
  switch (s) {
    case "requested":
      return <Badge variant="secondary">Refund requested</Badge>;
    case "approved":
      return <Badge className="bg-destructive text-destructive-foreground">Refunded</Badge>;
    case "rejected":
      return <Badge variant="outline">Refund rejected</Badge>;
    default:
      return null;
  }
};

export default function Receipts() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [records, setRecords] = useState<PaymentRecord[]>([]);

  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const snap = await get(dbRef(database, "payments"));
      const all = snap.val() || {};
      const list = Object.values<PaymentRecord & { emailKey?: string }>(all)
        .filter(
          (p) => (p.emailKey || p.email || "").toLowerCase() === key
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      setRecords(list);
      setSearched(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Could not load receipts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitRefund = async () => {
    if (!refundTarget) return;
    if (refundReason.trim().length < 10) {
      toast({
        title: "Please add a reason",
        description: "Minimum 10 characters so our team can review it.",
        variant: "destructive",
      });
      return;
    }
    setRefundLoading(true);
    try {
      await update(dbRef(database, `payments/${refundTarget.invoiceNo}`), {
        refundStatus: "requested",
        refundReason: refundReason.trim(),
        refundRequestedAt: new Date().toISOString(),
      });
      setRecords((prev) =>
        prev.map((r) =>
          r.invoiceNo === refundTarget.invoiceNo
            ? { ...r, refundStatus: "requested", refundReason: refundReason.trim() }
            : r
        )
      );
      toast({
        title: "Refund request submitted",
        description: "Our team will review it within 5-7 working days.",
      });
      setRefundTarget(null);
      setRefundReason("");
    } catch (err) {
      console.error(err);
      toast({ title: "Request failed", variant: "destructive" });
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="py-20 bg-gradient-hero text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          Payment Receipts
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Enter the email you used while applying to view your invoice history,
          download receipts and request a refund.
        </p>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6">
            <form onSubmit={search} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Searching..." : "Find receipts"}
              </Button>
            </form>
          </Card>

          {searched && records.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">
              <ReceiptText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              No payments found for this email.
            </Card>
          )}

          {records.map((r) => (
            <Card key={r.invoiceNo} className="p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.invoiceNo}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(r.date).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {refundBadge(r.refundStatus)}
                  <Badge variant={r.status === "free" ? "secondary" : "default"}>
                    {r.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">₹{r.amountPaid}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount</p>
                  <p className="font-semibold">₹{r.discountApplied || 0}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Payment ID</p>
                  <p className="font-mono text-xs break-all">{r.paymentId}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => generateReceiptPDF(r)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download receipt
                </Button>
                {r.status !== "free" &&
                  (!r.refundStatus || r.refundStatus === "none") && (
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setRefundTarget(r);
                        setRefundReason("");
                      }}
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Request refund
                    </Button>
                  )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Dialog
        open={!!refundTarget}
        onOpenChange={(o) => !o && setRefundTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request a refund</DialogTitle>
            <DialogDescription>
              Invoice {refundTarget?.invoiceNo} — ₹{refundTarget?.amountPaid}.
              Refunds are processed as per our Terms & Conditions.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Tell us why you're requesting a refund..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            maxLength={500}
          />
          <Button onClick={submitRefund} disabled={refundLoading}>
            {refundLoading ? "Submitting..." : "Submit request"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
