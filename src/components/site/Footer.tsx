import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow-sm flex items-center justify-center text-primary-foreground font-mono text-sm">
              N
            </span>
            Nodefield
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            We build resilient cloud infrastructure, modern software, and AI systems
            for teams who refuse to ship anything mediocre.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground transition-smooth">About</Link></li>
            <li><Link to="/services" className="hover:text-foreground transition-smooth">Services</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-smooth">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>hello@nodefield.io</li>
            <li>+1 (415) 555-0142</li>
            <li>San Francisco · Remote</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">© {new Date().getFullYear()} NODEFIELD INC.</span>
          <span className="font-mono">v1.0.0 · all systems operational</span>
        </div>
      </div>
    </footer>
  );
}
