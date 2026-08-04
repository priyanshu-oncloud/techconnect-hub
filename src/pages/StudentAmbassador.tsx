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
import { TestimonialCard } from "@/components/TestimonialCard";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  Crown,
  FileText,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/";
const BROCHURE_URL = "/brochure/nestgen-student-ambassador.pdf";

const highlights = [
  { icon: GraduationCap, label: "Certificate" },
  { icon: Gift, label: "Performance Rewards" },
  { icon: Briefcase, label: "Internship Opportunity" },
  { icon: FileText, label: "Letter of Recommendation" },
  { icon: Globe, label: "National Recognition" },
];

const benefits = [
  { icon: Crown, title: "Leadership Experience", desc: "Become the official representative of Nestgen Solutions in your college." },
  { icon: Building2, title: "Industry Exposure", desc: "Work with professionals and gain real corporate experience." },
  { icon: Users, title: "Build Your Network", desc: "Connect with students from different colleges across India." },
  { icon: Briefcase, title: "Internship Priority", desc: "Get priority for Nestgen Internship Programs." },
  { icon: BadgeCheck, title: "Certificate", desc: "Receive an official Campus Ambassador Certificate." },
  { icon: FileText, title: "Letter of Recommendation", desc: "Top performers receive an LOR signed by the company." },
  { icon: Gift, title: "Performance Rewards", desc: "Earn exciting rewards based on your referrals." },
  { icon: TrendingUp, title: "Resume Building", desc: "Add valuable experience to your resume and LinkedIn profile." },
];

const responsibilities = [
  "Promote Nestgen Internship Programs.",
  "Share posters on social media.",
  "Invite students to webinars.",
  "Organize campus awareness sessions.",
  "Bring student registrations.",
  "Represent Nestgen professionally.",
  "Collect student feedback.",
  "Build Nestgen's campus community.",
];

const courses = ["BCA", "B.Tech", "MCA", "Diploma", "MBA", "B.Sc", "M.Sc", "Any Undergraduate Student", "Any Postgraduate Student"];
const requirements = [
  "Good Communication Skills",
  "Leadership Qualities",
  "Active on Social Media",
  "Passionate About Learning",
  "Basic Marketing Skills (Optional)",
];

const rewardTiers = [
  { name: "Bronze", icon: Medal, target: "10 Successful Registrations", perks: ["Certificate"] },
  { name: "Silver", icon: Award, target: "25 Successful Registrations", perks: ["Certificate", "Gift Voucher"] },
  { name: "Gold", icon: Trophy, target: "50 Successful Registrations", perks: ["Cash Reward", "Letter of Recommendation"] },
  { name: "Platinum", icon: Crown, target: "100+ Successful Registrations", perks: ["Cash Prize", "Trophy", "Pre Placement Interview", "Exclusive Internship"] },
];

const referralPerks = ["Unique Referral Code", "Referral Link", "Personal Dashboard", "Performance Tracking", "Monthly Leaderboard"];

const learnings = [
  "Digital Marketing", "Social Media Marketing", "LinkedIn Branding", "Public Speaking",
  "Sales Skills", "Leadership", "Communication Skills", "Networking",
  "Personal Branding", "Professional Email Writing", "Resume Building", "Interview Skills",
];

const timeline = [
  { step: "Step 1", title: "Application" },
  { step: "Step 2", title: "Shortlisting" },
  { step: "Step 3", title: "Interview" },
  { step: "Step 4", title: "Selection" },
  { step: "Step 5", title: "Training" },
  { step: "Step 6", title: "Become Official Ambassador" },
];

const faqs = [
  { q: "Is this paid?", a: "The program is unpaid, but performance-based rewards, cash prizes and vouchers are available." },
  { q: "Is there any registration fee?", a: "No. Applying for the Nestgen Student Ambassador Program is completely free." },
  { q: "Is this remote?", a: "Yes. The role is remote with optional on-campus activities." },
  { q: "Will I receive a certificate?", a: "Yes. Every ambassador who completes the program receives an official certificate." },
  { q: "Can first-year students apply?", a: "Yes. Students from any year of study can apply." },
  { q: "How are rewards calculated?", a: "Rewards are based on the number of successful registrations you bring in." },
  { q: "Will I get an internship?", a: "Top performers receive internship opportunities and pre-placement interviews." },
  { q: "Can students from any college apply?", a: "Yes. Students from any college or university in India can apply." },
];

const fallbackTestimonials = [
  { clientName: "Ananya Sharma", role: "Campus Ambassador", company: "VIT Bhopal", message: "The program gave me real marketing experience and my first internship offer.", rating: 5 },
  { clientName: "Rohit Verma", role: "Previous Intern", company: "NIT Raipur", message: "Working with the Nestgen team improved my communication and confidence massively.", rating: 5 },
  { clientName: "Sneha Patil", role: "Student", company: "Pune University", message: "Loved the webinars and the leaderboard — it kept me motivated every single week.", rating: 5 },
];

const fallbackLeaderboard = [
  { name: "Ananya Sharma", college: "VIT Bhopal", points: 480, reward: "Platinum" },
  { name: "Rohit Verma", college: "NIT Raipur", points: 365, reward: "Gold" },
  { name: "Sneha Patil", college: "Pune University", points: 290, reward: "Gold" },
  { name: "Aditya Nair", college: "Anna University", points: 210, reward: "Silver" },
  { name: "Kavya Reddy", college: "JNTU Hyderabad", points: 150, reward: "Silver" },
];

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  college: "",
  university: "",
  course: "",
  year: "",
  city: "",
  state: "",
  linkedin: "",
  instagram: "",
  whyJoin: "",
  hearAbout: "",
};

const StudentAmbassador = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [collegeCount, setCollegeCount] = useState(0);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const unsubT = onValue(dbRef(database, "testimonials"), (snap) => {
      if (!snap.exists()) return;
      setTestimonials(Object.values(snap.val() || {}));
    });
    const unsubS = onValue(dbRef(database, "settings"), (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });
    const unsubA = onValue(dbRef(database, "ambassador_applications"), (snap) => {
      const val = snap.val() || {};
      const list = Object.values(val) as any[];
      setApplicationCount(list.length);
      setCollegeCount(new Set(list.map((a) => (a.college || "").trim().toLowerCase()).filter(Boolean)).size);
    });
    return () => { unsubT(); unsubS(); unsubA(); };
  }, []);

  const shownTestimonials = useMemo(
    () => (testimonials.length ? testimonials.slice(0, 3) : fallbackTestimonials),
    [testimonials]
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
        const path = `ambassador_resumes/${Date.now()}_${resume.name}`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, resume);
        resumeUrl = await getDownloadURL(fileRef);
      }

      const referralCode = `NG${form.fullName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

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
        description: `Your referral code is ${referralCode}. We'll contact you soon.`,
      });
      setForm(emptyForm);
      setResume(null);
      setAgreed(false);
    } catch (err) {
      toast({ title: "Submission failed. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pt-20">
      {/* 1. HERO */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="mr-1 h-3 w-3" /> Applications Open · Batch 2026
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Become a{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Nestgen Student Ambassador
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Represent Nestgen Solutions in your college, develop leadership skills, earn exciting
            rewards, and grow your professional network.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="hero" size="lg" onClick={scrollToForm}>Apply Now</Button>
            <Button variant="outline" size="lg" asChild>
              <a href={BROCHURE_URL} download>Download Brochure</a>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href={WHATSAPP_COMMUNITY} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Join WhatsApp Community
              </a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {highlights.map((h) => (
              <div key={h.label} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                <h.icon className="h-4 w-4 text-primary" />
                {h.label}
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-3">
            {[
              { value: `${1250 + applicationCount}+`, label: "Students Joined" },
              { value: `${120 + collegeCount}+`, label: "Colleges Covered" },
              { value: "3 Months", label: "Program Duration" },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 2. ABOUT */}
      <section id="about" className="py-16">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            What is the Nestgen Student Ambassador Program?
          </h2>
          <p className="mt-6 text-muted-foreground">
            The Nestgen Student Ambassador Program is designed for passionate students who want to
            develop leadership, communication, and marketing skills while representing Nestgen
            Solutions in their college.
          </p>
          <p className="mt-4 text-muted-foreground">
            As a Campus Ambassador, you will promote our internship programs, workshops, webinars,
            hackathons, and career initiatives.
          </p>
        </div>
      </section>

      {/* 3. WHY JOIN */}
      <section id="benefits" className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Why Join?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <Card key={b.title} className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary">
                  <b.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RESPONSIBILITIES */}
      <section id="responsibilities" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Your Responsibilities</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {responsibilities.map((r) => (
              <div key={r} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ELIGIBILITY */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Who Can Apply?</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {courses.map((c) => (
              <Badge key={c} variant="secondary" className="px-4 py-2 text-sm">{c}</Badge>
            ))}
          </div>
          <h3 className="mt-12 text-center text-xl font-semibold">Requirements</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requirements.map((r) => (
              <div key={r} className="flex items-center gap-3 rounded-lg bg-card p-4 text-sm">
                <BadgeCheck className="h-5 w-5 text-primary" /> {r}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. DURATION */}
      <section className="py-16">
        <div className="container mx-auto grid max-w-4xl gap-6 px-4 md:grid-cols-3">
          {[
            { icon: Clock, label: "Duration", value: "3 Months" },
            { icon: Sparkles, label: "Working Hours", value: "Flexible" },
            { icon: MapPin, label: "Location", value: "Remote + Campus Activities" },
          ].map((d) => (
            <Card key={d.label} className="p-6 text-center">
              <d.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">{d.label}</p>
              <p className="mt-1 font-semibold">{d.value}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. REWARDS */}
      <section id="rewards" className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Reward Structure</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {rewardTiers.map((t) => (
              <Card key={t.name} className="flex flex-col p-6">
                <t.icon className="mb-3 h-7 w-7 text-accent" />
                <h3 className="text-lg font-bold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.target}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {p}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. REFERRAL SYSTEM */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Every Ambassador Gets</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {referralPerks.map((p) => (
              <Card key={p} className="p-5">
                <Share2 className="mx-auto mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-medium">{p}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. LEARNING */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">
            During the Program You Will Learn
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {learnings.map((l) => (
              <div key={l} className="rounded-full border border-border bg-card px-4 py-2 text-sm">
                {l}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. TIMELINE */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Selection Timeline</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-6">
            {timeline.map((t, i) => (
              <div key={t.step} className="relative">
                <Card className="h-full p-5 text-center">
                  <span className="text-xs font-semibold text-primary">{t.step}</span>
                  <p className="mt-2 text-sm font-medium">{t.title}</p>
                </Card>
                {i < timeline.length - 1 && (
                  <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 text-muted-foreground md:hidden">↓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. PERFORMANCE DASHBOARD PREVIEW */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Performance Dashboard</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Once selected, track everything in real time from your ambassador dashboard.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Referrals", value: "—" },
              { label: "Successful Registrations", value: "—" },
              { label: "Pending Applications", value: "—" },
              { label: "Leaderboard Rank", value: "—" },
              { label: "Rewards Earned", value: "—" },
              { label: "Certificates", value: "—" },
              { label: "Current Level", value: "—" },
              { label: "Referral Code", value: "—" },
            ].map((s) => (
              <Card key={s.label} className="p-5">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 12. TESTIMONIALS */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">What Students Say</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {shownTestimonials.map((t: any, i: number) => (
              <TestimonialCard
                key={i}
                name={t.name}
                clientName={t.clientName}
                role={t.role}
                company={t.company}
                content={t.content}
                message={t.message}
                rating={t.rating || 5}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 13. FAQ */}
      <section id="faq" className="bg-secondary/30 py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">
            Frequently Asked Questions
          </h2>
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

      {/* 14. LEADERBOARD */}
      <section id="leaderboard" className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Top Ambassadors</h2>
          <Card className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Ambassador</th>
                  <th className="p-4">College</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Reward</th>
                </tr>
              </thead>
              <tbody>
                {fallbackLeaderboard.map((r, i) => (
                  <tr key={r.name} className="border-b border-border last:border-0">
                    <td className="p-4 font-semibold text-primary">#{i + 1}</td>
                    <td className="p-4">{r.name}</td>
                    <td className="p-4 text-muted-foreground">{r.college}</td>
                    <td className="p-4">{r.points}</td>
                    <td className="p-4"><Badge variant="secondary">{r.reward}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      {/* 15. APPLY FORM */}
      <section id="apply" className="bg-secondary/30 py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Apply Now</h2>
          <p className="mt-3 text-center text-muted-foreground">
            No registration fee. Fill the form and our team will get back to you.
          </p>

          <Card className="mt-8 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Full Name *" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} maxLength={100} />
              <Input type="email" placeholder="Email *" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} />
              <Input placeholder="Phone Number *" value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={15} />
              <Input placeholder="College Name *" value={form.college} onChange={(e) => update("college", e.target.value)} maxLength={150} />
              <Input placeholder="University" value={form.university} onChange={(e) => update("university", e.target.value)} maxLength={150} />
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
              <Input placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} maxLength={80} />
              <Input placeholder="State" value={form.state} onChange={(e) => update("state", e.target.value)} maxLength={80} />
              <Input placeholder="LinkedIn Profile" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} maxLength={200} />
              <Input placeholder="Instagram Profile" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} maxLength={200} />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-muted-foreground">Resume Upload (PDF)</label>
                <Input type="file" accept="application/pdf" onChange={(e) => setResume(e.target.files?.[0] || null)} />
              </div>
              <Textarea
                className="sm:col-span-2"
                placeholder="Why do you want to join?"
                value={form.whyJoin}
                onChange={(e) => update("whyJoin", e.target.value)}
                maxLength={1000}
              />
              <Select value={form.hearAbout} onValueChange={(v) => update("hearAbout", v)}>
                <SelectTrigger className="sm:col-span-2"><SelectValue placeholder="How did you hear about us?" /></SelectTrigger>
                <SelectContent>
                  {["Instagram", "LinkedIn", "WhatsApp", "Friend / Senior", "College", "Google Search", "Other"].map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
        </div>
      </section>

      {/* 16. CONTACT */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Need Help?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm hover:border-primary">
                <Mail className="h-4 w-4 text-primary" /> {settings.email}
              </a>
            )}
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm hover:border-primary">
                <Phone className="h-4 w-4 text-primary" /> {settings.phone}
              </a>
            )}
            {settings.phone && (
              <a href={`https://wa.me/${String(settings.phone).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm hover:border-primary">
                <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
              </a>
            )}
            {settings.linkedin && (
              <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm hover:border-primary">
                <Linkedin className="h-4 w-4 text-primary" /> LinkedIn
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm hover:border-primary">
                <Instagram className="h-4 w-4 text-primary" /> Instagram
              </a>
            )}
            <Link to="/contact" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm hover:border-primary">
              <Globe className="h-4 w-4 text-primary" /> Contact Page
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/certificate-input" className="hover:text-primary">Certificate Verification</Link>
            <Link to="/careers" className="hover:text-primary">Careers</Link>
            <Link to="/contact" className="hover:text-primary">Support</Link>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <Button variant="hero" className="w-full" onClick={scrollToForm}>
          <Handshake className="mr-2 h-4 w-4" /> Apply Now — It's Free
        </Button>
      </div>
    </main>
  );
};

export default StudentAmbassador;
