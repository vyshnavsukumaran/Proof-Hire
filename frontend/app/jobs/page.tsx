"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card, Chip, EmptyState, Field, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Job } from "@/lib/types";

const LEVELS = ["entry", "junior", "mid", "senior", "lead"];
const TYPES = ["fulltime", "parttime", "contract", "freelance"];
const SKILLS = [
  "Python",
  "FastAPI",
  "Flutter",
  "Figma",
  "React",
  "SQL",
  "Docker",
  "UX Research",
];

export default function JobsPage() {
  const { loading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string[]>([]);
  const [type, setType] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const levelKey = level.join(",");
  const typeKey = type.join(",");
  const skillsKey = skills.join(",");

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    api
      .jobs({
        q: q || undefined,
        experience_level: levelKey || undefined,
        employment_type: typeKey || undefined,
        skills: skillsKey || undefined,
      })
      .then((j) => {
        if (!cancelled) setJobs(j);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, levelKey, typeKey, skillsKey]);

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (loading) return <Shell><Spinner /></Shell>;

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-black uppercase">Open roles</h1>
        <div className="w-full max-w-xs">
          <Field label="Search roles">
            <input
              className="brut-field"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title or keyword…"
            />
          </Field>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <Chip key={l} selected={level.includes(l)} onClick={() => toggle(level, setLevel, l)}>
            {l}
          </Chip>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Chip key={t} selected={type.includes(t)} onClick={() => toggle(type, setType, t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <Chip key={s} selected={skills.includes(s)} onClick={() => toggle(skills, setSkills, s)}>
            {s}
          </Chip>
        ))}
      </div>

      <div className="mt-8">
        {fetching ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <EmptyState title="No roles match" body="Widen your filters or check back soon." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                <Card className="flex h-full flex-col gap-3 p-4" hover>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold leading-tight">{job.title}</h3>
                    <span className="brut-badge bg-accent-mint">{job.employment_type}</span>
                  </div>
                  <p className="text-xs font-semibold text-ink/60">{job.employer_name}</p>
                  <p className="line-clamp-2 text-sm text-ink/75">{job.summary}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {job.required_skill_list.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-md border-2 border-ink bg-canvas px-1.5 py-0.5 text-[11px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-ink/10 pt-2 text-[11px] font-bold uppercase text-ink/60">
                    <span>{job.remote ? "Remote" : job.location || "On-site"}</span>
                    <span className="brut-badge bg-white">{job.experience_level}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
