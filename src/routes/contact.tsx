import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Nodefield" },
      { name: "description", content: "Get in touch with Nodefield. We respond to every project inquiry within one business day." },
      { property: "og:title", content: "Contact — Nodefield" },
      { property: "og:description", content: "Tell us what you're building. We'll respond within one business day." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Message sent", { description: "We'll be in touch within one business day." });
    }, 800);
  };

  return (
    <Layout>
      <Toaster />
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-bg" />
        <div className="glow-orb h-[400px] w-[400px] bg-primary/30 top-0 right-1/4 animate-pulse-glow" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">// Contact</p>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold">
            Let's build something <span className="text-gradient-primary">together</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Tell us about your project and we'll get back within one business day with concrete next steps.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 grid lg:grid-cols-3 gap-10">
        <div className="space-y-6 lg:col-span-1">
          {[
            { icon: Mail, label: "Email", value: "hello@nodefield.io" },
            { icon: Phone, label: "Phone", value: "+1 (415) 555-0142" },
            { icon: MapPin, label: "Office", value: "San Francisco · Fully remote" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border/60 bg-gradient-card p-6 flex items-start gap-4">
              <div className="rounded-lg bg-primary/15 p-3">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
                <p className="mt-1 font-medium">{c.value}</p>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-border/60 bg-gradient-card p-6">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Hours</p>
            <p className="mt-1 font-medium">Mon–Fri · 9am–6pm PT</p>
            <p className="mt-3 text-sm text-muted-foreground">24/7 on-call available for retainer clients.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="lg:col-span-2 rounded-2xl border border-border/60 bg-gradient-card p-8 md:p-10 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
          </div>
          <Field label="Company" name="company" />
          <Field label="Budget range" name="budget" placeholder="$25k – $100k" />
          <div>
            <label className="block text-sm font-medium mb-2">Project details</label>
            <textarea
              name="message"
              required
              rows={6}
              placeholder="Tell us about what you're building, timelines, and the problem you're solving..."
              className="w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition-smooth disabled:opacity-60"
          >
            {submitting ? "Sending..." : (<>Send message <Send className="h-4 w-4" /></>)}
          </button>
        </form>
      </section>
    </Layout>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}{required && <span className="text-primary"> *</span>}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
      />
    </div>
  );
}
