import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ref as dbRef, push, onValue } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebase";
import {
  Award,
  Briefcase,
  Crown,
  Gift,
  GraduationCap,
  Medal,
  Quote,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

const benefits = [
  { icon: GraduationCap, title: "Official Certificate", desc: "Verified Campus Ambassador certificate on completion." },
  { icon: Briefcase, title: "Internship Priority", desc: "Fast-tracked for Nestgen internship programs." },
  { icon: Gift, title: "Cash & Rewards", desc: "Performance-based cash prizes, vouchers and goodies." },
  { icon: Users, title: "Pan-India Network", desc: "Grow with ambassadors from colleges across India." },
];

const rewardTiers = [
  { name: "Bronze", icon: Medal, target: "10 registrations", perk: "Certificate" },
  { name: "Silver", icon: Award, target: "25 registrations", perk: "Certificate + Voucher" },
  { name: "Gold", icon: Trophy, target: "50 registrations", perk: "Cash Reward + LOR" },
  { name: "Platinum", icon: Crown, target: "100+ registrations", perk: "Cash Prize + Internship" },
];

const timeline = ["Apply", "Shortlist", "Interview", "Selection", "Training", "Go Live"];

const faqs = [
  { q: "Is there any registration fee?", a: "No. Applying for the Nestgen Student Ambassador Program is completely free." },
  { q: "Is this remote?", a: "Yes. The role is fully remote with optional on-campus activities." },
  { q: "Will I receive a certificate?", a: "Yes, every ambassador who completes the program gets an official certificate." },
  { q: "Can first-year students apply?", a: "Yes, students from any year and any college in India can apply." },
  { q: "How are rewards calculated?", a: "Rewards are based on the number of successful registrations you bring in." },
];

const fallbackTestimonials = [
  { name: "Ananya Sharma", college: "VIT Bhopal", message: "The program gave me real marketing experience and my first internship offer." },
  { name: "Rohit Verma", college: "NIT Raipur", message: "Working with the Nestgen team improved my communication and confidence massively." },
  { name: "Sneha Patil", college: "Pune University", message: "The leaderboard kept me motivated every single week." },
];

const fallbackLeaderboard = [
  { name: "Ananya Sharma", college: "VIT Bhopal", points: 480 },
  { name: "Rohit Verma", college: "NIT Raipur", points: 365 },
  { name: "Sneha Patil", college: "Pune University", points: 290 },
  { name: "Aman Gupta", college: "IIIT Bhopal", points: 240 },
  { name: "Kriti Singh", college: "LNCT Indore", points: 185 },
];

const courses = ["BCA", "B.Tech", "MCA", "Diploma", "MBA", "B.Sc", "M.Sc", "Other"];

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  college: "",
  course: "",
  year: "",
  city: "",
  whyJoin: "",
};

const StudentAmbassador = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  const [collegeCount, setCollegeCount] = useState(0);
  const [leaders, setLeaders] = useState<{ name: string; college: string; points: number }[]>([]);

  useEffect(() => {
    const unsubA = onValue(dbRef(database, "ambassador_applications"), (snap) => {
      const list = Object.values(snap.val() || {}) as any[];
      setApplicationCount(list.length);
      setCollegeCount(
        new Set(list.map((a) => (a.college || "").trim().toLowerCase()).filter(Boolean)).size
      );
    });
    const unsubL = onValue(dbRef(database, "ambassadors"), (snap) => {
      const list = Object.values(snap.val() || {}) as any[];
      setLeaders(
        list
          .map((a) => ({
            name: a.fullName || "Ambassador",
            college: a.college || "—",
            points: a.successfulRegistrations || 0,
          }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 5)
      );
    });
    return () => {
      unsubA();
      unsubL();
    };
  }, []);

  const shownLeaders = useMemo(
    () => (leaders.length ? leaders : fallbackLeaderboard),
    [leaders]
  );

  const update = (key: keyof typeof emptyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const scrollToForm = () => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.college || !form.course) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Please accept the terms and conditions", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let resumeUrl = "";
      if (resume) {
        const fileRef = storageRef(storage, `ambassador_resumes/${Date.now()}_${resume.name}`);
        await uploadBytes(fileRef, resume);
        resumeUrl = await getDownloadURL(fileRef);
      }

      const referralCode = `NG${form.fullName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase()}${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      await push(dbRef(database, "ambassador_applications"), {
        ...form,
        resumeUrl,
        referralCode,
        status: "pending",
        referrals: 0,
        successfulRegistrations: 0,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Application submitted!",
        description: `Your referral code is ${referralCode}. Create your portal account to track progress.`,
      });
      setForm(emptyForm);
      setResume(null);
      setAgreed(false);
    } catch {
      toast({ title: "Submission failed. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pt-20">
      {/* HERO */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
        <div className="container relative mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="mr-1 h-3 w-3" /> Applications Open · Batch 2026
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Become a{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Student Ambassador
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground md:text-lg">
            Represent Nestgen Solutions on your campus. Build skills, earn rewards and unlock
            internships — 100% free to apply.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="lg" onClick={scrollToForm}>
              Apply Now
            </Button>
            <Link to="/ambassador/login">
              <Button variant="outline" size="lg">
                Ambassador Login
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              { v: `${applicationCount || 500}+`, l: "Applicants" },
              { v: `${collegeCount || 80}+`, l: "Colleges" },
              { v: "₹0", l: "Fee" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-bold text-primary md:text-3xl">{s.v}</p>
                <p className="text-xs text-muted-foreground md:text-sm">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Why Join?</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <Card key={b.title} className="p-6 transition-colors hover:border-primary">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* REWARDS */}
      <section className="bg-secondary/20 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Rewards</h2>
          <p className="mt-3 text-center text-muted-foreground">
            The more students you bring, the bigger the reward.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rewardTiers.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.name} className="p-6 text-center transition-transform hover:-translate-y-1">
                  <Icon className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-3 text-lg font-bold">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.target}</p>
                  <p className="mt-4 text-sm font-medium">{t.perk}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Selection Process</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {timeline.map((step, i) => (
              <Card key={step} className="p-5 text-center">
                <span className="text-xs font-semibold text-primary">STEP {i + 1}</span>
                <p className="mt-1 font-medium">{step}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS + LEADERBOARD */}
      <section className="bg-secondary/20 py-16">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Ambassadors Say</h2>
            <div className="mt-6 space-y-4">
              {fallbackTestimonials.map((t) => (
                <Card key={t.name} className="p-5">
                  <Quote className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">{t.message}</p>
                  <p className="mt-3 text-sm font-semibold">
                    {t.name} <span className="font-normal text-muted-foreground">· {t.college}</span>
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Top Ambassadors</h2>
            <Card className="mt-6 divide-y divide-border">
              {shownLeaders.map((l, i) => (
                <div key={`${l.name}-${i}`} className="flex items-center gap-4 p-4">
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.college}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{l.points}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">FAQs</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="bg-secondary/30 py-16">
        <div className="container mx-auto max-w-2xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Apply Now</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Takes 2 minutes. No registration fee.
          </p>

          <Card className="mt-8 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Full Name *" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} maxLength={100} />
              <Input type="email" placeholder="Email *" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} />
              <Input placeholder="Phone *" value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={15} />
              <Input placeholder="College *" value={form.college} onChange={(e) => update("college", e.target.value)} maxLength={150} />
              <Select value={form.course} onValueChange={(v) => update("course", v)}>
                <SelectTrigger><SelectValue placeholder="Course *" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.year} onValueChange={(v) => update("year", v)}>
                <SelectTrigger><SelectValue placeholder="Year of Study" /></SelectTrigger>
                <SelectContent>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year"].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input className="sm:col-span-2" placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} maxLength={80} />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-muted-foreground">Resume (PDF, optional)</label>
                <Input type="file" accept="application/pdf" onChange={(e) => setResume(e.target.files?.[0] || null)} />
              </div>
              <Textarea
                className="sm:col-span-2"
                placeholder="Why do you want to join?"
                value={form.whyJoin}
                onChange={(e) => update("whyJoin", e.target.value)}
                maxLength={1000}
              />
              <div className="flex items-start gap-3 sm:col-span-2">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the terms and conditions.
                </label>
              </div>
              <Button type="submit" variant="hero" size="lg" className="sm:col-span-2" disabled={submitting || !agreed}>
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already an ambassador?{" "}
            <Link to="/ambassador/login" className="font-medium text-primary hover:underline">
              Open your dashboard
            </Link>
          </p>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <Button variant="hero" className="w-full" onClick={scrollToForm}>
          Apply Now — Free
        </Button>
      </div>
    </main>
  );
};

export default StudentAmbassador;
