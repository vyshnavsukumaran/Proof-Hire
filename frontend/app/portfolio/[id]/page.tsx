"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Avatar, Badge, Button, Spinner, EmptyState } from "@/components/ui";
import { ProofCard, SkillChips } from "@/components/proof-card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UserWithProfile } from "@/lib/types";

export default function PortfolioPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [candidate, setCandidate] = useState<UserWithProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api
      .portfolio(Number(id))
      .then(setCandidate)
      .catch(() => setCandidate(null))
      .finally(() => setFetching(false));
  }, [id]);

  if (fetching) return <Shell><Spinner /></Shell>;
  if (!candidate) {
    return <Shell><EmptyState title="Portfolio not found" /></Shell>;
  }

  const canMessage = user && user.role === "employer";

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="brut-card flex flex-col gap-4 p-6 md:flex-row md:items-center">
          <Avatar name={candidate.name} src={candidate.avatar_url} size="lg" />
          <div>
            <h1 className="font-display text-3xl font-black uppercase leading-tight">
              {candidate.name}
            </h1>
            <p className="font-semibold text-ink/70">
              {candidate.profile?.headline || "No headline"}
            </p>
            <p className="mt-2 max-w-xl text-sm text-ink/70">
              {candidate.profile?.summary}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SkillChips skills={candidate.skills.map((s) => s.name)} />
              <Badge tone="mint">
                {candidate.availability || "Open"}
              </Badge>
            </div>
          </div>
        </div>

        {canMessage && (
          <Button
            onClick={() =>
              router.push(`/inbox?candidate=${candidate.id}&employer=${user.id}`)
            }
          >
            Message {candidate.name.split(" ")[0]}
          </Button>
        )}
      </div>

      <h2 className="mb-4 font-display text-2xl font-black uppercase">
        Proof of work
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {candidate.projects?.map((p) => (
          <ProofCard key={p.id} project={p} owner={candidate} />
        ))}
      </div>
    </Shell>
  );
}
