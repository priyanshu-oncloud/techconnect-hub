import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Briefcase, Clock, IndianRupee, CheckCircle2 } from "lucide-react";
import { Job, lines } from "@/lib/jobs";

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = onValue(ref(database, `jobs/${id}`), (snap) => {
      setJob(snap.exists() ? { ...(snap.val() as Job), id } : null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (job) document.title = `${job.title} | Careers`;
  }, [job]);

  if (loading) return <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading...</div>;

  if (!job || !job.published)
    return (
      <div className="min-h-screen pt-32 text-center px-4">
        <h1 className="text-3xl font-bold mb-3">Job not available</h1>
        <p className="text-muted-foreground mb-6">This position may have been filled or removed.</p>
        <Button asChild><Link to="/careers">View all openings</Link></Button>
      </div>
    );

  const resp = lines(job.responsibilities);
  const reqs = lines(job.requirements);
  const applyHref = `/careers?position=${encodeURIComponent(job.title)}#apply`;

  return (
    <div className="min-h-screen pt-20">
      <section className="py-16 bg-gradient-hero">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/careers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> All openings
          </Link>
          {job.department && <Badge variant="secondary" className="mb-3">{job.department}</Badge>}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{job.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.type}</span>
            {job.experience && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.experience}</span>}
            {job.salary && <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" />{job.salary}</span>}
          </div>
          <Button size="lg" asChild><a href={applyHref}>Apply for this role</a></Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl grid gap-8">
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-3">About the role</h2>
            <p className="text-muted-foreground whitespace-pre-line">{job.description || job.summary}</p>
          </Card>
          {resp.length > 0 && (
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-4">Responsibilities</h2>
              <ul className="space-y-2">{resp.map((r, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" />{r}</li>
              ))}</ul>
            </Card>
          )}
          {reqs.length > 0 && (
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="space-y-2">{reqs.map((r, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" />{r}</li>
              ))}</ul>
            </Card>
          )}
          <div className="text-center">
            <Button size="lg" asChild><a href={applyHref}>Apply now</a></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
