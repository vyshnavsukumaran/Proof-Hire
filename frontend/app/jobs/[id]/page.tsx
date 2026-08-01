"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Badge, Button, EmptyState, Field, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [fetching, setFetching] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .job(Number(id))
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setFetching(false));
  }, [id]);

  useEffect(() => {
    if (user && user.role === "candidate") {
      api.myApplications().then((apps) => {
        if (apps.some((a) => a.job_id === Number(id))) setApplied(true);
      }).catch(() => {});
    }
  }, [user, id]);

  async function apply() {
    setBusy(true);
    setError("");
    try {
      const evidence = (user?.projects ?? []).filter((p) => p.visibility === "live").map((p) => p.id);
      await api.apply({
        job_id: Number(id),
        cover_letter: coverLetter || undefined,
        evidence_project_ids: evidence,
      });
      setApplied(true);
      router.push("/my-applications");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Apply failed");
      setBusy(false);
    }
  }

  if (loading || fetching) return <Shell><Spinner /></Shell>;
  if (!job) return <Shell><EmptyState title="Job not found" /></Shell>;

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="brut-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-4xl font-black uppercase leading-tight">
                  {job.title}
                </h1>
                <p className="mt-1 font-semibold text-ink/60">
                  {job.employer_name} · {job.remote ? "Remote" : job.location}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="mint">{job.experience_level}</Badge>
                <Badge tone="white">{job.employment_type}</Badge>
                {job.salary_min ? (
                  <Badge tone="yellow">
                    ${Math.round(job.salary_min / 1000)}–{Math.round((job.salary_max ?? job.salary_min) / 1000)}k
                  </Badge>
                ) : null}
              </div>
            </div>
            {job.summary && <p className="mt-4 text-ink/80">{job.summary}</p>}
          </div>

          <div className="brut-card p-6">
            <h2 className="mb-2 font-display text-lg font-black uppercase">The brief</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
              {job.description || "No full description provided yet."}
            </p>
          </div>

          <div className="brut-card p-6">
            <h2 className="mb-3 font-display text-lg font-black uppercase">Must-have skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.required_skill_list.map((s) => (
                <span key={s} className="rounded-md border-2 border-ink bg-accent-yellow px-2 py-1 text-sm font-bold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {user?.role === "candidate" ? (
            applied ? (
              <div className="brut-card border-accent-mint bg-accent-mint/20 p-5">
                <h3 className="font-display font-bold uppercase">Application sent</h3>
                <p className="mt-1 text-sm">You applied with your live portfolio as evidence.</p>
              </div>
            ) : (
              <div className="brut-card p-5">
                <h3 className="font-display text-lg font-bold uppercase">Apply with evidence</h3>
                <p className="mt-1 text-xs text-ink/60">
                  We attach your live portfolio projects to the application.
                </p>
                <div className="mt-4">
                  <Field label="Cover letter (optional)">
                    <textarea
                      className="brut-field min-h-[110px]"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell them why, then let the work speak."
                    />
                  </Field>
                </div>
                {error && (
                  <p className="mt-3 rounded-[10px] border-2 border-ink bg-accent-orange/20 p-2 text-sm font-semibold">
                    {error}
                  </p>
                )}
                <Button className="mt-4 w-full" onClick={apply} disabled={busy}>
                  {busy ? "Applying…" : "Apply now"}
                </Button>
              </div>
            )
          ) : (
            <div className="brut-card bg-accent-yellow p-5">
              <h3 className="font-display font-bold uppercase">Hiring side</h3>
              <p className="mt-1 text-sm">
                Log in as a candidate to apply with your portfolio.
              </p>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}
