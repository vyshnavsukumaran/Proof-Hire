"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Avatar, Badge, Button, EmptyState, Spinner } from "@/components/ui";
import { ProofCard, SkillChips } from "@/components/proof-card";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function MyPortfolioPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setProjects(user.projects ?? []);
    }
  }, [user]);

  async function toggleVisibility() {
    if (!user?.profile) return;
    setBusy(true);
    const next = user.profile.visibility === "live" ? "draft" : "live";
    await api.updateMe({ visibility: next });
    await refresh();
    setBusy(false);
  }

  if (loading) return <Shell><Spinner /></Shell>;
  if (!user || user.role !== "candidate") {
    return (
      <Shell>
        <EmptyState title="Candidates only" body="This workspace is for candidate portfolios." />
      </Shell>
    );
  }

  const isLive = user.profile?.visibility === "live";

  return (
    <Shell>
      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="brut-card flex flex-col gap-4 p-6 md:flex-row md:items-center">
          <Avatar name={user.name} src={user.avatar_url} size="lg" />
          <div>
            <h1 className="font-display text-3xl font-black uppercase leading-tight">
              {user.name}
            </h1>
            <p className="font-semibold text-ink/70">
              {user.profile?.headline || "Add a headline — say what you make."}
            </p>
            <p className="mt-2 text-sm text-ink/70">{user.profile?.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SkillChips skills={user.skills.map((s) => s.name)} />
              <Badge tone={isLive ? "mint" : "gray"}>
                {isLive ? "Live" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <Button variant={isLive ? "white" : "mint"} onClick={toggleVisibility} disabled={busy}>
            {isLive ? "Set to draft" : "Publish portfolio"}
          </Button>
          <Button variant="orange" onClick={() => router.push("/builder")}>
            Edit portfolio
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-black uppercase">
          Proof of work
        </h2>
        <Link href="/builder">
          <Button size="sm">+ Add project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Add your first project so employers can see what you can do."
          action={
            <Link href="/builder">
              <Button variant="blue">Start a project</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProofCard key={p.id} project={p} owner={user} />
          ))}
        </div>
      )}
    </Shell>
  );
}
