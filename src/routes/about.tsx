import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Target, Heart, Zap, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Nodefield" },
      { name: "description", content: "Nodefield is a senior IT consultancy of engineers who care about craft, outcomes and long-term partnerships." },
      { property: "og:title", content: "About — Nodefield" },
      { property: "og:description", content: "A senior team of engineers building infrastructure that lasts." },
    ],
  }),
  component: About,
});

const values = [
  { icon: Target, title: "Outcomes over output", desc: "We measure success in business metrics moved, not tickets closed." },
  { icon: Heart, title: "Craft is non-negotiable", desc: "Code we ship is code we'd be happy to maintain three years later." },
  { icon: Zap, title: "Senior by default", desc: "Every engagement is staffed with engineers who've shipped at scale." },
  { icon: Users, title: "Partners, not vendors", desc: "We embed inside your team and transfer ownership cleanly." },
];

function About() {
  return (
    <Layout>
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg" />
        <div className="glow-orb h-[400px] w-[400px] bg-accent/30 -top-20 -left-20 animate-pulse-glow" />
        <div className="relative mx-auto max-w-4xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">// About</p>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold leading-tight">
            We're a small team of <span className="text-gradient-primary">stubborn engineers</span> with strong opinions.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Nodefield was founded in 2018 by a group of engineers who were tired of consultancies
            that promise everything and ship spreadsheets. We stayed small on purpose — every
            project gets people who've built and operated systems at serious scale.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">// Our story</p>
          <h2 className="mt-3 text-4xl font-bold">Built by people who were the on-call.</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              The Nodefield founders met running platform engineering at three different
              high-growth startups. We wrote the runbooks, woke up at 3am, and learned what
              actually breaks in production.
            </p>
            <p>
              That perspective shapes how we work today: we design systems for the people who
              will operate them at year three, not for the demo on launch day.
            </p>
            <p>
              Today we're a fully remote team of 28 engineers across 9 time zones, partnering
              with companies from seed-stage startups to global enterprises.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border/60 bg-gradient-card p-6">
              <v.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-border/60 bg-gradient-card p-12 grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2">
            <h2 className="text-3xl md:text-4xl font-bold">Want to work with us?</h2>
            <p className="mt-2 text-muted-foreground">We're always open to interesting problems and exceptional engineers.</p>
          </div>
          <Link
            to="/contact"
            className="justify-self-start md:justify-self-end inline-flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition-smooth"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </Layout>
  );
}
