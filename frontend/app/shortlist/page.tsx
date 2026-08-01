"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Button, Card, Chip, EmptyState, Spinner, StatusBadge, Avatar } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ShortlistEntry } from "@/lib/types";

export default function ShortlistPage() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<ShortlistEntry[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api
      .shortlist()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    await api.updateShortlist(id, { status });
    const list = await api.shortlist();
    setEntries(list);
  }

  if (loading || fetching) return <Shell><Spinner /></Shell>;
  if (!user || user.role !== "employer") {
    return <Shell><EmptyState title="Employers only" body="Shortlisting is for hiring teams." /></Shell>;
  }

  return (
    <Shell>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Shortlist</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            body="Visit a candidate's portfolio and hit save to build a shortlist."
          />
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <Link href={`/portfolio/${entry.candidate_id}`} className="flex items-center gap-3">
                  <Avatar
                    name={entry.candidate?.name ?? "?"}
                    src={entry.candidate?.avatar_url}
                    size="md"
                  />
                  <div>
                    <p className="font-display font-bold">{entry.candidate?.name}</p>
                    <p className="text-xs text-ink/60">{entry.candidate?.profile?.headline}</p>
                  </div>
                </Link>
                <StatusBadge status={entry.status} />
              </div>
              {entry.score && (
                <div>
                  <div className="mb-1 flex justify-between text-[11px] font-bold uppercase text-ink/60">
                    <span>Match</span>
                    <span>{entry.score}/100</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
                    <div className="h-full bg-accent-orange" style={{ width: `${entry.score}%` }} />
                  </div>
                </div>
              )}
              {entry.notes && <p className="rounded-[8px] border-2 border-ink bg-canvas p-2 text-xs">{entry.notes}</p>}
              <div className="mt-auto flex flex-wrap gap-2 border-t-2 border-ink/10 pt-3">
                <Chip
                  selected={entry.status === "saved"}
                  onClick={() => updateStatus(entry.id, "saved")}
                >
                  Save
                </Chip>
                <Chip
                  selected={entry.status === "interview_requested"}
                  onClick={() => updateStatus(entry.id, "interview_requested")}
                >
                  Request interview
                </Chip>
                <Chip
                  selected={entry.status === "passed"}
                  onClick={() => updateStatus(entry.id, "passed")}
                >
                  Pass
                </Chip>
                <Button
                  size="sm"
                  variant="white"
                  onClick={() => {
                    void api.removeShortlist(entry.id);
                    setEntries((l) => l.filter((e) => e.id !== entry.id));
                  }}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </Shell>
  );
}
