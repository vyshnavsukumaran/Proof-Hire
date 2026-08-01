"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { SkillChips } from "@/components/proof-card";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

function EvidenceBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value?: string | null;
  tone: string;
}) {
  return (
    <div className="brut-card overflow-hidden">
      <div className={`border-b-2 border-ink px-4 py-2 font-display text-sm font-black uppercase ${tone}`}>
        {label}
      </div>
      <div className="p-4 text-sm leading-relaxed text-ink/80">
        {value || <span className="text-ink/40">Not filled in yet.</span>}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api
      .project(Number(id))
      .then((p) => {
        setProject(p);
        api.recordView(p.id).catch(() => {});
      })
      .catch(() => setProject(null))
      .finally(() => setFetching(false));
  }, [id]);

  if (fetching) return <Shell><Spinner /></Shell>;
  if (!project) return <Shell><EmptyState title="Project not found" /></Shell>;

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink/50">
            <Link href="/my-portfolio" className="underline underline-offset-4">
              ← Back
            </Link>
          </p>
          <h1 className="mt-1 font-display text-4xl font-black uppercase leading-tight">
            {project.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="white">{project.project_type.replace("_", " ")}</Badge>
            {project.role && <Badge tone="yellow">{project.role}</Badge>}
            {project.tools && (
              <Badge tone="white">
                Tools: {project.tools}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 text-xs font-bold uppercase text-ink/60">
          <span className="brut-badge bg-white">👁 {project.views} views</span>
          <span className="brut-badge bg-white">♥ {project.likes} likes</span>
        </div>
      </div>

      <div className="mb-6">
        <SkillChips skills={project.skills.map((s) => s.name)} />
      </div>

      {project.media_url && (
        <div className="brut-card mb-6 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.media_url}
            alt={project.title}
            className="max-h-[420px] w-full object-cover"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <EvidenceBlock label="Problem" value={project.problem} tone="bg-accent-orange" />
        <EvidenceBlock label="My contribution" value={project.contribution} tone="bg-accent-blue text-white" />
        <EvidenceBlock label="Process" value={project.process} tone="bg-accent-yellow" />
        <EvidenceBlock label="Outcome" value={project.outcome} tone="bg-accent-mint" />
      </div>

      {project.project_url && (
        <a
          href={project.project_url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block brut-btn bg-accent-blue text-white"
        >
          View live project ↗
        </a>
      )}
    </Shell>
  );
}