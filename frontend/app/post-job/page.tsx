"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Button, Card, Chip, EmptyState, Field, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

const LEVELS = ["entry", "junior", "mid", "senior", "lead"];
const TYPES = ["fulltime", "parttime", "contract", "freelance"];

export default function PostJobPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    required_skills: "",
    experience_level: "mid",
    employment_type: "fulltime",
    location: "",
    remote: false,
    salary_min: "",
    salary_max: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.createJob({
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
      });
      router.push("/discover");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post job");
      setBusy(false);
    }
  }

  if (loading) return <Shell><Spinner /></Shell>;
  if (!user || user.role !== "employer") {
    return <Shell><EmptyState title="Employers only" body="Sign up as an employer to post roles." /></Shell>;
  }

  return (
    <Shell>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Post a job</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <Field label="Role title">
            <input required className="brut-field" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Backend Engineer" />
          </Field>
          <Field label="Summary" hint="One or two lines recruiters can scan fast.">
            <textarea className="brut-field min-h-[70px]" value={form.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
          <Field label="Full brief">
            <textarea className="brut-field min-h-[140px]" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What will they own? What does success look like?" />
          </Field>
          <Field label="Required skills" hint="Comma-separated. These drive matching.">
            <input className="brut-field" value={form.required_skills} onChange={(e) => set("required_skills", e.target.value)} placeholder="Python, FastAPI, PostgreSQL" />
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <span className="brut-label">Experience level</span>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <Chip key={l} selected={form.experience_level === l} onClick={() => set("experience_level", l)}>{l}</Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="brut-label">Employment type</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <Chip key={t} selected={form.employment_type === t} onClick={() => set("employment_type", t)}>{t}</Chip>
              ))}
            </div>
          </div>
          <Field label="Location">
            <input className="brut-field" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Berlin, Toronto, …" />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-ink bg-canvas p-3">
            <input type="checkbox" checked={form.remote} onChange={(e) => set("remote", e.target.checked)} className="h-5 w-5 accent-accent-blue" />
            <span className="font-display text-sm font-bold uppercase">Remote-friendly</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary min">
              <input type="number" className="brut-field" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} placeholder="120000" />
            </Field>
            <Field label="Salary max">
              <input type="number" className="brut-field" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} placeholder="160000" />
            </Field>
          </div>
          {error && (
            <p className="rounded-[10px] border-2 border-ink bg-accent-orange/20 p-3 text-sm font-semibold">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Posting…" : "Post job"}
          </Button>
        </Card>
      </form>
    </Shell>
  );
}
