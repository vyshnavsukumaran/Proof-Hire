"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Button, Card, Chip, EmptyState, Field, Spinner, Avatar } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Job, UserWithProfile } from "@/lib/types";

const AVAILABILITIES = [
  { key: "fulltime", label: "Full-time" },
  { key: "freelance", label: "Freelance" },
  { key: "parttime", label: "Part-time" },
];

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

export default function DiscoverPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [talent, setTalent] = useState<UserWithProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);

  const skillsKey = skills.join(",");
  const availabilityKey = availability.join(",");

  useEffect(() => {
    async function load() {
      setFetching(true);
      try {
        const [t, j] = await Promise.all([
          api.searchTalent({
            skills: skillsKey || undefined,
            availability: availabilityKey || undefined,
            q: q || undefined,
          }),
          api.searchJobs({
            skills: skillsKey || undefined,
            q: q || undefined,
          }),
        ]);
        setTalent(t);
        setJobs(j);
      } catch {
        setTalent([]);
        setJobs([]);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [q, skillsKey, availabilityKey]);

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (loading) return <Shell><Spinner /></Shell>;

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] flex-1">
          <Field label="Search">
            <input
              className="brut-field"
              placeholder="Skills, roles, or keywords…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </Field>
        </div>
        {user?.role === "candidate" && (
          <Button
            variant="blue"
            onClick={() => router.push("/jobs")}
          >
            Browse all jobs
          </Button>
        )}
        {user?.role === "employer" && (
          <Button onClick={() => router.push("/post-job")}>
            + Post a job
          </Button>
        )}
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <Chip
            key={s}
            selected={skills.includes(s)}
            onClick={() => toggle(skills, setSkills, s)}
          >
            {s}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {AVAILABILITIES.map((a) => (
          <Chip
            key={a.key}
            selected={availability.includes(a.key)}
            onClick={() => toggle(availability, setAvailability, a.key)}
          >
            {a.label}
          </Chip>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-display text-2xl font-black uppercase">
          {user?.role === "employer" ? "Find talent" : "Find roles"}
        </h2>

        {fetching ? (
          <Spinner />
        ) : user?.role === "employer" ? (
          talent.length === 0 ? (
            <EmptyState title="No candidates match" body="Try widening your skill filters." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talent.map((c) => (
                <Link key={c.id} href={`/portfolio/${c.id}`} className="block">
                  <Card className="flex h-full flex-col gap-3 p-4" hover>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} src={c.avatar_url} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-display font-bold">{c.name}</p>
                        <p className="truncate text-xs text-ink/60">
                          {c.profile?.headline || "No headline yet"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.slice(0, 4).map((s) => (
                        <span key={s.id} className="rounded-md border-2 border-ink bg-canvas px-1.5 py-0.5 text-[11px] font-bold">
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-auto line-clamp-2 text-xs text-ink/70">
                      {c.profile?.summary}
                    </p>
                    <div className="flex items-center justify-between border-t-2 border-ink/10 pt-2 text-[11px] font-bold uppercase text-ink/60">
                      <span>{c.project_count} projects</span>
                      <span>{c.location || "—"}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : jobs.length === 0 ? (
          <EmptyState title="No open roles match" body="Try clearing a filter or two." />
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
                    {job.salary_max ? (
                      <span>
                        ${Math.round((job.salary_min ?? 0) / 1000)}–{Math.round(job.salary_max / 1000)}k
                      </span>
                    ) : (
                      <span>{job.experience_level}</span>
                    )}
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
