import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import heroImg from "@/assets/hero-network.jpg";
import { ArrowRight, Cloud, Code2, Cpu, Lock, Rocket, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nodefield — IT Infrastructure, Software & AI Engineering" },
      {
        name: "description",
        content:
          "Nodefield is a senior IT consultancy building cloud platforms, custom software, and AI systems for ambitious teams.",
      },
      { property: "og:title", content: "Nodefield — IT Infrastructure, Software & AI" },
      {
        property: "og:description",
        content:
          "Cloud, software, security and AI engineering — delivered by a senior team.",
      },
    ],
  }),
  component: Index,
});

const services = [
  { icon: Cloud, title: "Cloud Infrastructure", desc: "AWS, GCP & Azure architectures that scale without the surprise invoice." },
  { icon: Code2, title: "Software Engineering", desc: "Web, mobile and backend systems built with TypeScript, Go and Rust." },
  { icon: Cpu, title: "AI & Automation", desc: "LLM pipelines, RAG, agents and ML systems wired into your real workflows." },
  { icon: Lock, title: "Security & Compliance", desc: "SOC 2, ISO 27001, zero-trust networking and proactive threat hunting." },
];

const stats = [
  { value: "120+", label: "Projects shipped" },
  { value: "99.99%", label: "Uptime average" },
  { value: "14", label: "Countries served" },
  { value: "8 yrs", label: "Avg. engineer experience" },
];

const stack = ["TypeScript", "Go", "Rust", "Kubernetes", "Terraform", "PostgreSQL", "React", "Python", "AWS", "GCP"];

function Index() {
  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg" />
        <div className="glow-orb h-[500px] w-[500px] bg-primary/40 -top-40 -left-32 animate-pulse-glow" />
        <div className="glow-orb h-[400px] w-[400px] bg-accent/30 top-20 right-0 animate-pulse-glow" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/80 px-3 py-1 text-xs font-mono text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Now booking Q3 engagements
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              Engineering the <span className="text-gradient-primary">infrastructure</span> behind ambitious products.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Nodefield is a senior IT consultancy. We design, build and operate the cloud
              platforms, software and AI systems that the next generation of companies run on.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow hover:shadow-glow transition-smooth"
              >
                Start a project
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-6 py-3 font-medium hover:bg-surface transition-smooth"
              >
                Explore services
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6 text-xs font-mono text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Systems operational
              </span>
              <span>SOC 2 Type II</span>
              <span>ISO 27001</span>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-elegant">
              <img
                src={heroImg}
                alt="Glowing network of connected nodes representing cloud infrastructure"
                width={1536}
                height={1024}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/60 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-xl bg-surface-elevated/90 backdrop-blur border border-border/80 p-4 shadow-glow-sm animate-float">
              <div className="font-mono text-xs text-muted-foreground">deploy.status</div>
              <div className="font-display text-xl font-semibold text-primary">→ live in 4m 12s</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/50 bg-surface/30">
        <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">// What we do</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Four disciplines. One senior team.</h2>
          <p className="mt-4 text-muted-foreground">
            We work across the full stack of modern IT — from bare metal to user interface — so
            handoffs don't slow you down.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="group relative rounded-2xl border border-border/60 bg-gradient-card p-8 hover:border-primary/40 transition-smooth overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-smooth" />
              <s.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STACK */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-border/60 bg-surface/40 p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground text-center">
            // Tools we ship with
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {stack.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-mono text-muted-foreground hover:text-primary hover:border-primary/50 transition-smooth"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card p-12 md:p-16 text-center">
          <div className="glow-orb h-[300px] w-[300px] bg-primary/30 -top-20 left-1/2 -translate-x-1/2" />
          <Rocket className="relative mx-auto h-10 w-10 text-primary" />
          <h2 className="relative mt-6 text-4xl md:text-5xl font-bold max-w-2xl mx-auto">
            Ready to build something <span className="text-gradient-primary">unmistakable</span>?
          </h2>
          <p className="relative mt-4 text-muted-foreground max-w-xl mx-auto">
            Tell us what you're working on. We'll respond within one business day with a clear next step.
          </p>
          <Link
            to="/contact"
            className="relative mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-primary px-8 py-3 font-medium text-primary-foreground shadow-glow transition-smooth"
          >
            Get in touch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
