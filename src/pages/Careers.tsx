import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useJobs } from "@/lib/jobs";
import { useEffect, useState } from "react";
import axios from "axios";

import { ref as dbRef, push, get, set, runTransaction } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebase";
import {
  generateReceiptPDF,
  makeInvoiceNo,
  type ReceiptData,
} from "@/utils/generateReceiptPDF";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Briefcase,
  Users,
  Award,
  Coffee,
  TrendingUp
} from "lucide-react";

/* ---------------- RAZORPAY CONFIG ---------------- */
// TODO: Replace with your actual Razorpay Key ID (publishable, safe in frontend)
const RAZORPAY_KEY_ID = "rzp_test_XXXXXXXXXXXXXX";
const APPLICATION_FEE = 99; // ₹99
const REFERRAL_DISCOUNT = 30; // ₹30 off when an ambassador referral code is used


declare global {
  interface Window {
    Razorpay: any;
  }
}

/* Load Razorpay Checkout script dynamically */
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ---------------- BENEFITS ---------------- */

const benefits = [
  { icon: TrendingUp, title: "Career Growth", description: "Training budget and certification support" },
  { icon: Coffee, title: "Work-Life Balance", description: "Flexible hours and remote work options" },
  { icon: Award, title: "Competitive Salary", description: "Market-leading compensation packages" },
  { icon: Users, title: "Great Team", description: "Collaborative and supportive work environment" },
  { icon: Briefcase, title: "Latest Tech", description: "Work with cutting-edge technologies" },
];

/* ---------------- POSITIONS ---------------- */

const positions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "Data Analyst",
  "DevOps Engineer",
  "Intern",
];

/* ---------------- NAME FORMAT FUNCTION ---------------- */

const formatName = (name: string) => {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/* ---------------- COMPONENT ---------------- */

export default function Careers() {
  const { jobs: openJobs } = useJobs(true);
  const allPositions = Array.from(new Set([...openJobs.map((j) => j.title), ...positions]));
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

  /* ---- COUPON STATE ---- */
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<null | {
    code: string;
    discountType: "flat" | "percent";
    discountValue: number;
  }>(null);
  /* referral (ambassador) code applied in the same field */
  const [appliedReferral, setAppliedReferral] = useState<null | {
    code: string;
    uid: string;
    name: string;
  }>(null);

  const discount = appliedCoupon
    ? appliedCoupon.discountType === "flat"
      ? Math.min(appliedCoupon.discountValue, APPLICATION_FEE)
      : Math.round((APPLICATION_FEE * appliedCoupon.discountValue) / 100)
    : appliedReferral
    ? Math.min(REFERRAL_DISCOUNT, APPLICATION_FEE)
    : 0;
  const finalAmount = Math.max(0, APPLICATION_FEE - discount);

  const applyCoupon = async (codeArg?: string) => {
    const code = (codeArg ?? couponInput).trim().toUpperCase();
    if (!code) return;
    if (codeArg) setCouponInput(code);
    setCouponLoading(true);
    try {
      const snap = await get(dbRef(database, `coupons/${code}`));
      if (snap.exists()) {
        const c = snap.val();
        if (!c.active) {
          toast({ title: "Coupon is inactive", variant: "destructive" });
          return;
        }
        if (c.expiresAt && new Date(c.expiresAt) < new Date()) {
          toast({ title: "Coupon expired", variant: "destructive" });
          return;
        }
        if (c.usageLimit && c.usedCount >= c.usageLimit) {
          toast({ title: "Coupon usage limit reached", variant: "destructive" });
          return;
        }
        setAppliedReferral(null);
        setAppliedCoupon({
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
        });
        toast({
          title: "Coupon applied!",
          description: `${code} — you saved ₹${
            c.discountType === "flat"
              ? Math.min(c.discountValue, APPLICATION_FEE)
              : Math.round((APPLICATION_FEE * c.discountValue) / 100)
          }`,
        });
        return;
      }

      /* ---- Not a coupon? Try ambassador referral code ---- */
      const ambSnap = await get(dbRef(database, "ambassadors"));
      const ambs = ambSnap.exists() ? ambSnap.val() : {};
      const match = Object.entries<any>(ambs).find(
        ([, a]) => (a.referralCode || "").toUpperCase() === code
      );

      if (!match) {
        toast({ title: "Invalid code", variant: "destructive" });
        return;
      }
      const [uid, amb] = match;
      if (amb.status && amb.status !== "active") {
        toast({ title: "This referral code is not active", variant: "destructive" });
        return;
      }

      setAppliedCoupon(null);
      setAppliedReferral({ code, uid, name: amb.fullName || "Ambassador" });
      toast({
        title: "Referral code applied!",
        description: `Referred by ${amb.fullName || "an ambassador"} — you saved ₹${Math.min(
          REFERRAL_DISCOUNT,
          APPLICATION_FEE
        )}`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Could not apply code", variant: "destructive" });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setAppliedReferral(null);
    setCouponInput("");
  };

  /* ---- AUTO-APPLY REFERRAL LINK (?ref=CODE) + CLICK TRACKING ---- */
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) return;
    const code = ref.trim().toUpperCase();
    applyCoupon(code);
    runTransaction(dbRef(database, `referral_clicks/${code}/count`), (c) => (c || 0) + 1).catch(
      () => {}
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- PREFILL POSITION FROM JOB DETAIL (?position=Title) ---- */
  useEffect(() => {
    const pos = new URLSearchParams(window.location.search).get("position");
    if (pos) {
      setFormData((f) => ({ ...f, position: pos.slice(0, 100) }));
      setTimeout(() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    experience: "",
    resume: null as File | null,
    message: "",
  });

  /* ---------------- ACTUAL SUBMISSION (after payment) ---------------- */

  const submitApplication = async (paymentId: string) => {
    try {
      setLoading(true);

      /* ---------- 1️⃣ UPLOAD RESUME ---------- */
      const fileName = `${Date.now()}_${formData.resume!.name}`;
      const resumeRef = storageRef(storage, `resumes/${fileName}`);
      await uploadBytes(resumeRef, formData.resume!);
      const resumeUrl = await getDownloadURL(resumeRef);

      /* ---------- 2️⃣ SAVE TO DATABASE ---------- */
      const invoiceNo = makeInvoiceNo();
      const submittedAt = new Date().toISOString();
      const submission = {
        name: formatName(formData.name),
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        experience: formData.experience,
        resumeName: formData.resume!.name,
        resumeUrl,
        message: formData.message,
        paymentId,
        invoiceNo,
        originalAmount: APPLICATION_FEE,
        couponCode: appliedCoupon?.code || null,
        referralCode: appliedReferral?.code || null,
        referredByUid: appliedReferral?.uid || null,
        discountApplied: discount,
        amountPaid: finalAmount,
        paymentStatus: finalAmount === 0 ? "free" : "paid",
        submittedAt,
      };

      await push(dbRef(database, "careers_applications"), submission);

      /* ---------- 2️⃣a PAYMENT / INVOICE RECORD ---------- */
      const receipt: ReceiptData = {
        invoiceNo,
        date: submittedAt,
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        position: submission.position,
        paymentId,
        originalAmount: APPLICATION_FEE,
        discountApplied: discount,
        amountPaid: finalAmount,
        couponCode: submission.couponCode,
        referralCode: submission.referralCode,
        status: submission.paymentStatus,
      };
      try {
        await set(dbRef(database, `payments/${invoiceNo}`), {
          ...receipt,
          emailKey: submission.email.trim().toLowerCase(),
          refundStatus: "none",
          type: "career_application",
        });
      } catch (e) {
        console.warn("Payment record save failed:", e);
      }
      setLastReceipt(receipt);
      setReceiptOpen(true);


      /* ---------- 2️⃣b INCREMENT COUPON USAGE ---------- */
      if (appliedCoupon) {
        try {
          await runTransaction(
            dbRef(database, `coupons/${appliedCoupon.code}/usedCount`),
            (cur) => (cur || 0) + 1
          );
        } catch (e) {
          console.warn("Coupon counter update failed:", e);
        }
      }

      /* ---------- 2️⃣c CREDIT AMBASSADOR (only on successful payment) ---------- */
      if (appliedReferral && submission.paymentStatus === "paid") {
        try {
          await runTransaction(
            dbRef(database, `ambassadors/${appliedReferral.uid}/successfulRegistrations`),
            (cur) => (cur || 0) + 1
          );
          await runTransaction(
            dbRef(database, `ambassadors/${appliedReferral.uid}/referrals`),
            (cur) => (cur || 0) + 1
          );
        } catch (e) {
          console.warn("Referral credit failed:", e);
        }
      }

      /* ---------- 3️⃣ SEND EMAIL ---------- */
      try {
        await axios.post(
          "https://us-central1-nestgen-solutions.cloudfunctions.net/sendCareerConfirmation",
          { ...submission }
        );
      } catch (emailError) {
        console.warn("Email failed but data saved:", emailError);
      }

      toast({
        title: "Application Submitted!",
        description: finalAmount === 0
          ? `Coupon applied — free registration. Your application has been received.`
          : `Payment successful (₹${finalAmount}). Your application has been received.`,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        experience: "",
        resume: null,
        message: "",
      });
      setAppliedCoupon(null);
      setAppliedReferral(null);
      setCouponInput("");

    } catch (error) {
      console.error(error);
      toast({
        title: "Submission Failed",
        description: "Payment received but submission failed. Please contact support with your payment ID.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- HANDLE SUBMIT (open Razorpay first) ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.resume) {
      toast({ title: "Please upload resume (PDF)", variant: "destructive" });
      return;
    }

    if (formData.phone.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: "Accept Terms & Conditions",
        description: "Please read and accept the Terms & Conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    /* ---------- FREE (100% discount) → skip Razorpay ---------- */
    if (finalAmount === 0) {
      setLoading(true);
      await submitApplication("FREE_COUPON_" + (appliedCoupon?.code || ""));
      return;
    }

    /* ---------- LOAD RAZORPAY ---------- */
    setLoading(true);
    const ok = await loadRazorpayScript();
    if (!ok) {
      setLoading(false);
      toast({
        title: "Payment Error",
        description: "Failed to load Razorpay. Check your internet connection.",
        variant: "destructive",
      });
      return;
    }

    /* ---------- OPEN CHECKOUT ---------- */
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: finalAmount * 100, // paise
      currency: "INR",
      name: "Nestgen Solutions",
      description: `Application Fee - ${formData.position || "Internship"}`,
      image: "/placeholder.svg",
      handler: function (response: any) {
        // Payment success → auto-submit
        submitApplication(response.razorpay_payment_id);
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        position: formData.position,
      },
      theme: {
        color: "#6366f1",
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          toast({
            title: "Payment Cancelled",
            description: "Your application was not submitted.",
            variant: "destructive",
          });
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setLoading(false);
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Please try again.",
          variant: "destructive",
        });
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast({
        title: "Payment Error",
        description: "Could not open payment window.",
        variant: "destructive",
      });
    }
  };


  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen pt-20">

      {/* HERO */}
      <section className="py-24 bg-gradient-hero text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Join Our Team
        </h1>
        <p className="text-xl text-muted-foreground">
          Build your career with passionate innovators shaping the future.
        </p>
      </section>

      {/* BENEFITS */}
      <section className="py-24">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <Card key={i} className="p-6">
              <b.icon className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-semibold">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* OPEN POSITIONS */}
      {openJobs.length > 0 && (
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Open Positions</h2>
            <p className="text-center text-muted-foreground mb-10">Find a role that fits you.</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {openJobs.map((j) => (
                <Link key={j.id} to={`/careers/jobs/${j.id}`} className="group">
                  <Card className="p-6 h-full flex flex-col transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                    {j.department && <span className="text-xs font-medium text-primary mb-2">{j.department}</span>}
                    <h3 className="text-xl font-semibold mb-2">{j.title}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{j.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{j.summary}</p>
                    <span className="mt-4 text-sm font-medium text-primary">View details →</span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FORM */}
      <section id="apply" className="py-24 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Apply Now</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <Input
                  required
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">

                {/* PHONE FIX */}
                <Input
                  placeholder="Phone (10 digits)"
                  value={formData.phone}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setFormData({ ...formData, phone: value });
                    }
                  }}
                />

                {/* POSITION SELECT */}
                <Select
                  value={formData.position}
                  onValueChange={(value) =>
                    setFormData({ ...formData, position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Position" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPositions.map((pos, i) => (
                      <SelectItem key={i} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  placeholder="Experience"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                />
                <Input
                  required
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resume: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>

              <Textarea
                required
                rows={6}
                placeholder="Cover letter / Message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />

              {/* COUPON CODE */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold">
                    Have a coupon or referral code?
                  </label>
                  {appliedCoupon && (
                    <Badge variant="default">{appliedCoupon.code} applied</Badge>
                  )}
                  {appliedReferral && (
                    <Badge variant="default">
                      {appliedReferral.code} — {appliedReferral.name}
                    </Badge>
                  )}
                </div>

                {!appliedCoupon && !appliedReferral ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon / referral code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="uppercase"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyCoupon()}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? "Checking..." : "Apply"}
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={removeCoupon}>
                    Remove code
                  </Button>
                )}

                <div className="text-sm space-y-1 pt-2 border-t border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Registration Fee</span>
                    <span>₹{APPLICATION_FEE}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>− ₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total Payable</span>
                    <span>₹{finalAmount}</span>
                  </div>
                </div>
              </div>

              {/* TERMS & CONDITIONS */}
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(c) => setAcceptedTerms(c === true)}
                  className="mt-1"
                />
                <label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer">
                  I have read and agree to the{" "}
                  <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-primary underline font-medium hover:opacity-80"
                      >
                        Terms & Conditions
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Internship Program — Terms & Conditions</DialogTitle>
                        <DialogDescription>
                          Please review the terms before paying the ₹{APPLICATION_FEE} registration fee.
                        </DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-5 text-sm leading-relaxed">
                          <p className="text-muted-foreground">
                            This document outlines the terms and conditions for participation in the
                            Nestgen Solutions Internship Program.
                          </p>

                          <div>
                            <h4 className="font-semibold mb-1">1. Registration Fee</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>A one-time non-refundable fee of ₹99 is required to enroll in the internship program.</li>
                              <li>This fee is charged for administrative, onboarding, and training resources.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">2. Internship Nature</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>This is a skill-based internship designed for learning and practical exposure.</li>
                              <li>The internship may be remote or hybrid depending on project requirements.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">3. Duration</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>The internship duration ranges from 1 to 3 months (flexible).</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">4. Deliverables</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>Interns must complete assigned tasks, projects, or reports.</li>
                              <li>Performance will be evaluated based on quality, consistency, and participation.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">5. Certification</h4>
                            <p className="text-muted-foreground mb-1">Interns will receive:</p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>Offer Letter</li>
                              <li>Internship Completion Certificate</li>
                              <li>Letter of Recommendation (based on performance)</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">6. Attendance & Participation</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>Minimum participation is required to qualify for certification.</li>
                              <li>Inactive interns may not receive completion benefits.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">7. No Salary Clause</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>This is an unpaid internship focused on learning and experience.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">8. Confidentiality</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>Interns must not share company data, project details, or client information.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">9. Termination</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>The company reserves the right to terminate the internship at any time.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-1">10. Acceptance</h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li>By registering and paying ₹99, the intern agrees to all terms mentioned above.</li>
                            </ul>
                          </div>

                          <p className="pt-2 font-medium">— Nestgen Solutions</p>
                        </div>
                      </ScrollArea>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTermsOpen(false)}
                        >
                          Close
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setAcceptedTerms(true);
                            setTermsOpen(false);
                          }}
                        >
                          I Agree
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>{" "}
                  and the non-refundable ₹{APPLICATION_FEE} registration fee.
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || !acceptedTerms}
              >
                {loading
                  ? "Processing..."
                  : finalAmount === 0
                    ? "Submit Application (Free)"
                    : `Pay ₹${finalAmount} & Submit Application`}
              </Button>

            </form>
          </Card>
        </div>
      </section>

      {/* CULTURE */}
      <section className="py-24 bg-gradient-primary text-primary-foreground text-center">
        <h2 className="text-4xl font-bold mb-6">Our Culture</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {["Innovation", "Collaboration", "Growth", "Integrity", "Excellence"].map((v, i) => (
            <Badge key={i} variant="secondary" className="px-4 py-2">
              {v}
            </Badge>
          ))}
        </div>
      </section>

      {/* PAYMENT RECEIPT DIALOG */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Application Submitted 🎉</DialogTitle>
            <DialogDescription>
              Your payment receipt is ready. Keep the invoice number for future
              reference.
            </DialogDescription>
          </DialogHeader>

          {lastReceipt && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice No.</span>
                <span className="font-semibold">{lastReceipt.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-xs break-all text-right">
                  {lastReceipt.paymentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">₹{lastReceipt.amountPaid}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => generateReceiptPDF(lastReceipt)}
                >
                  Download Receipt
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setReceiptOpen(false)}
                >
                  Close
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                All your receipts are available anytime at{" "}
                <a href="/receipts" className="underline">
                  /receipts
                </a>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>

  );
}