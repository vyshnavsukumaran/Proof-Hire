"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Button, Card, Chip, EmptyState, Spinner, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Application } from "@/lib/types";

export default function ApplicationsPage() {
  const { user, loading } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loader =
      user?.role === "employer" ? api.receivedApplications() : api.myApplications();
    loader.then(setApps).catch(() => {}).finally(() => setFetching(false));
  }, [user?.role]);

  async function updateStatus(id: number, status: string) {
    await api.updateApplicationStatus(id, status);
    const loader =
      user?.role === "employer" ? api.receivedApplications() : api.myApplications();
    loader.then(setApps);
  }

  if (loading || fetching) return <Shell><Spinner /></Shell>;

  return (
    <Shell>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">
        {user?.role === "employer" ? "Applications received" : "My applications"}
      </h1>

      {apps.length === 0 ? (
        <EmptyState
          title={user?.role === "employer" ? "No applications yet" : "You haven't applied anywhere"}
          body={
            user?.role === "employer"
              ? "When candidates apply to your roles, they'll show up here."
              : "Browse open roles and apply with your portfolio as evidence."
          }
          action={
            user?.role === "employer" ? (
              <Link href="/post-job"><Button variant="blue">Post a job</Button></Link>
            ) : (
              <Link href="/jobs"><Button>Browse roles</Button></Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Card key={app.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold">
                    {user?.role === "employer" ? app.candidate_name : app.job_title}
                  </h3>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-ink/60">
                  {user?.role === "employer"
                    ? app.candidate_headline || "No headline"
                    : `Applied ${new Date(app.created_at).toLocaleDateString()}`}
                </p>
                {app.cover_letter && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink/75">{app.cover_letter}</p>
                )}
                {app.evidence_projects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {app.evidence_projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="rounded-md border-2 border-ink bg-accent-yellow px-2 py-0.5 text-xs font-bold hover:bg-accent-orange"
                      >
                        {p.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {user?.role === "employer" && (
                <div className="flex flex-wrap gap-2">
                  <Chip
                    selected={app.status === "reviewing"}
                    onClick={() => updateStatus(app.id, "reviewing")}
                  >
                    Review
                  </Chip>
                  <Chip
                    selected={app.status === "interview"}
                    onClick={() => updateStatus(app.id, "interview")}
                  >
                    Interview
                  </Chip>
                  <Chip
                    selected={app.status === "offer"}
                    onClick={() => updateStatus(app.id, "offer")}
                  >
                    Offer
                  </Chip>
                  <Chip
                    selected={app.status === "rejected"}
                    onClick={() => updateStatus(app.id, "rejected")}
                  >
                    Reject
                  </Chip>
                  <Button
                    size="sm"
                    variant="blue"
                    onClick={() =>
                      (window.location.href = `/inbox?candidate=${app.candidate_id}&employer=${user.id}&job=${app.job_id}`)
                    }
                  >
                    Message
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
