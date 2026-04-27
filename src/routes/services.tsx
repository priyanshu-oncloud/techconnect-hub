import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Cloud, Code2, Cpu, Lock, Database, Workflow, ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Nodefield" },
      { name: "description", content: "Cloud infrastructure, software engineering, AI systems, security, data and DevOps services from Nodefield." },
      { property: "og:title", content: "Services — Nodefield" },
      { property: "og:description", content: "Six engineering disciplines, one senior team." },
    ],
  }),
  component: Services,
});

const services = [
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    desc: "Multi-cloud and hybrid architectures with cost guardrails baked in.",
    bullets: ["AWS, GCP, Azure", "Terraform & Pulumi", "Cost optimization", "Multi-region HA"],
  },
  {
    icon: Code2,
    title: "Software Engineering",
    desc: "Production-grade web, mobile and backend systems delivered by senior engineers.",
    bullets: ["TypeScript / React", "Go & Rust services", "iOS & Android", "API design"],
  },
  {
    icon: Cpu,
    title: "AI & Machine Learning",
    desc: "Practical AI — RAG, agents, fine-tuning and ML pipelines that move metrics.",
    bullets: ["LLM applications", "RAG & vector search", "Custom model training", "MLOps"],
  },
  {
    icon: Lock,
    title: "Security & Compliance",
    desc: "Threat modeling, audits and certifications for regulated industries.",
    bullets: ["SOC 2 / ISO 27001", "Penetration testing", "Zero-trust networks", "Incident response"],
  },
  {
    icon: Database,
    title: "Data Engineering",
    desc: "Warehouses, lakes and real-time pipelines that analytics teams trust.",
    bullets: ["Snowflake / BigQuery", "dbt & Airflow", "Real-time CDC", "Analytics dashboards"],
  },
  {
    icon: Workflow,
    title: "DevOps & SRE",
    desc: "Ship faster, sleep better. CI/CD, observability and on-call done right.",
    bullets: ["Kubernetes platforms", "GitOps pipelines", "Observability stack", "SRE on retainer"],
  },
];

function Services() {
  return (
    <Layout>
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg" />
        <div className="glow-orb h-[400px] w-[400px] bg-primary/30 top-0 right-0 animate-pulse-glow" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">// Services</p>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold max-w-3xl mx-auto">
            End-to-end <span className="text-gradient-primary">engineering</span> capability
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Engage one discipline or the whole stack. Our teams plug into yours and stay
            accountable from kickoff through production.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="group relative rounded-2xl border border-border/60 bg-gradient-card p-8 hover:border-primary/40 transition-smooth"
            >
              <s.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              <ul className="mt-5 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-border/60 bg-gradient-card p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Have something specific in mind?</h2>
          <p className="mt-3 text-muted-foreground">We scope projects in days, not weeks.</p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition-smooth"
          >
            Talk to an engineer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
