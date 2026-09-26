import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/firebase";

export interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string; // Full-time, Internship, ...
  experience: string;
  salary: string;
  summary: string;
  description: string;
  responsibilities: string; // one per line
  requirements: string; // one per line
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const lines = (s?: string) =>
  (s || "").split("\n").map((l) => l.trim()).filter(Boolean);

export function useJobs(onlyPublished = false) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const r = ref(database, "jobs");
    const unsub = onValue(
      r,
      (snap) => {
        const val = snap.val() || {};
        let list: Job[] = Object.entries(val).map(([id, j]) => ({ ...(j as Job), id }));
        if (onlyPublished) list = list.filter((j) => j.published);
        list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setJobs(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [onlyPublished]);
  return { jobs, loading };
}
