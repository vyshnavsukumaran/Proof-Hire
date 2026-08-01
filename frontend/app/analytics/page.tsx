"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card, EmptyState, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Analytics } from "@/lib/types";

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api.analytics().then(setData).catch(() => {});
  }, []);

  if (loading || !data) return <Shell><Spinner /></Shell>;
  if (!user || user.role !== "candidate") {
    return <Shell><EmptyState title="Candidates only" body="Portfolio analytics live in the candidate workspace." /></Shell>;
  }

  const stats = [
    { label: "Portfolio views", value: data.total_views, tone: "bg-accent-orange" },
    { label: "Project views", value: data.total_project_views, tone: "bg-accent-yellow" },
    { label: "Likes", value: data.total_likes, tone: "bg-accent-mint" },
    { label: "Applications", value: data.application_count, tone: "bg-accent-blue" },
    { label: "Interviews", value: data.interview_count, tone: "bg-accent-yellow" },
    { label: "Offers", value: data.offer_count, tone: "bg-accent-mint" },
  ];

  const maxView = Math.max(1, ...data.top_projects.map((p) => p.views));

  return (
    <Shell>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Portfolio analytics</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className={`h-2 w-12 rounded-full ${s.tone}`} />
            <p className="mt-3 font-display text-3xl font-black">{s.value}</p>
            <p className="font-display text-xs font-bold uppercase text-ink/60">{s.label}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-display text-xl font-black uppercase">Top projects</h2>
      {data.top_projects.length === 0 ? (
        <EmptyState title="No projects yet" />
      ) : (
        <Card className="p-5">
          <ul className="space-y-4">
            {data.top_projects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="flex items-center gap-3">
                  <span className="w-full">
                    <span className="block text-sm font-bold">{p.title}</span>
                    <span className="mt-1 block h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
                      <span
                        className="block h-full bg-accent-orange"
                        style={{ width: `${(p.views / maxView) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-bold uppercase text-ink/60">
                    {p.views} 👁 · {p.likes} ♥
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-6 bg-accent-yellow p-5">
        <h3 className="font-display font-bold uppercase">Make the numbers move</h3>
        <p className="mt-1 text-sm">
          Employers compare outcome lines. Rewrite each project&apos;s outcome
          with a measurable result to boost your match score and interviews.
        </p>
      </Card>
    </Shell>
  );
}
