import { useState } from "react";
import { Link } from "react-router-dom";
import { ref, set, update, remove, push } from "firebase/database";
import { z } from "zod";
import { database } from "@/firebase";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, MapPin, Briefcase } from "lucide-react";
import { Job, slugify, useJobs } from "@/lib/jobs";

const jobSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(100),
  department: z.string().trim().max(60),
  location: z.string().trim().min(2, "Location is required").max(80),
  type: z.string().min(1),
  experience: z.string().trim().max(40),
  salary: z.string().trim().max(60),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(300),
  description: z.string().trim().max(5000),
  responsibilities: z.string().max(3000),
  requirements: z.string().max(3000),
  published: z.boolean(),
});

type FormState = z.infer<typeof jobSchema>;

const empty: FormState = {
  title: "", department: "", location: "Remote", type: "Full-time", experience: "",
  salary: "", summary: "", description: "", responsibilities: "", requirements: "", published: false,
};

const TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"];

export default function ManageJobs() {
  const { jobs, loading } = useJobs(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const startCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (j: Job) => {
    setEditing(j);
    const { id, slug, createdAt, updatedAt, ...rest } = j;
    setForm({ ...empty, ...rest });
    setOpen(true);
  };

  const save = async () => {
    const parsed = jobSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Check the form", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = parsed.data;
      if (editing) {
        await update(ref(database, `jobs/${editing.id}`), { ...data, slug: slugify(data.title), updatedAt: now });
        toast({ title: "Job updated" });
      } else {
        const newRef = push(ref(database, "jobs"));
        await set(newRef, { ...data, slug: slugify(data.title), createdAt: now, updatedAt: now });
        toast({ title: "Job created" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (j: Job) => {
    await update(ref(database, `jobs/${j.id}`), { published: !j.published, updatedAt: new Date().toISOString() });
    toast({ title: j.published ? "Job unpublished" : "Job published" });
  };

  const del = async (j: Job) => {
    if (!confirm(`Delete "${j.title}"?`)) return;
    await remove(ref(database, `jobs/${j.id}`));
    toast({ title: "Job deleted" });
  };

  const filtered = jobs.filter((j) =>
    `${j.title} ${j.department} ${j.location}`.toLowerCase().includes(search.toLowerCase())
  );
  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Job Postings</h1>
            <p className="text-muted-foreground text-sm">
              {jobs.length} total · {jobs.filter((j) => j.published).length} published
            </p>
          </div>
          <Button onClick={startCreate}><Plus className="w-4 h-4 mr-2" /> New Job</Button>
        </div>

        <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No jobs yet. Create your first posting.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((j) => (
              <Card key={j.id} className="flex flex-col">
                <CardContent className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg leading-tight">{j.title}</h3>
                    <Badge variant={j.published ? "default" : "secondary"}>{j.published ? "Published" : "Draft"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{j.type}</span>
                    {j.department && <span>{j.department}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{j.summary}</p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={!!j.published} onCheckedChange={() => togglePublish(j)} />
                      {j.published ? "Live" : "Hidden"}
                    </label>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild title="View">
                        <Link to={`/careers/jobs/${j.id}`} target="_blank"><Eye className="w-4 h-4" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(j)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(j)} title="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Job" : "New Job"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={f("title")} placeholder="Frontend Developer" /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={f("department")} placeholder="Engineering" /></div>
              <div><Label>Location *</Label><Input value={form.location} onChange={f("location")} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Experience</Label><Input value={form.experience} onChange={f("experience")} placeholder="0-2 years" /></div>
              <div className="sm:col-span-2"><Label>Salary / Stipend</Label><Input value={form.salary} onChange={f("salary")} placeholder="₹10,000 / month" /></div>
            </div>
            <div><Label>Short summary *</Label><Textarea rows={2} value={form.summary} onChange={f("summary")} /></div>
            <div><Label>Full description</Label><Textarea rows={5} value={form.description} onChange={f("description")} /></div>
            <div><Label>Responsibilities (one per line)</Label><Textarea rows={4} value={form.responsibilities} onChange={f("responsibilities")} /></div>
            <div><Label>Requirements (one per line)</Label><Textarea rows={4} value={form.requirements} onChange={f("requirements")} /></div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              Publish on Careers page
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create job"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
