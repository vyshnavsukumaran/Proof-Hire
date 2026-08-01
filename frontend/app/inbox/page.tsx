"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/shell";
import { EmptyState, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Conversation } from "@/lib/types";

function InboxInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.conversations().then(setConvs).catch(() => {}).finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    const candidate = params.get("candidate");
    const employer = params.get("employer");
    if (candidate && employer && user && !starting) {
      setStarting(true);
      api
        .startConversation({
          candidate_id: Number(candidate),
          employer_id: Number(employer),
          job_id: params.get("job") ? Number(params.get("job")) : null,
        })
        .then((conv) => {
          setConvs((l) => {
            if (l.some((c) => c.id === conv.id)) return l;
            return [conv, ...l];
          });
          router.replace(`/inbox/${conv.id}`);
        })
        .finally(() => setStarting(false));
    }
  }, [params, user, router, starting]);

  if (loading || fetching) return <Spinner />;
  if (!user) return <EmptyState title="Log in to see messages" />;

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Inbox</h1>
      {convs.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body={
            user.role === "employer"
              ? "Open a candidate's portfolio and hit message to start a conversation."
              : "When an employer reaches out, it'll land here."
          }
        />
      ) : (
        <div className="space-y-3">
          {convs.map((c) => {
            const otherName =
              user.id === c.candidate_id ? c.employer_name : c.candidate_name;
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/inbox/${c.id}`)}
                className="brut-card flex w-full items-center gap-4 p-4 text-left hover:shadow-[6px_6px_0_0_#151515] hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border-2 border-ink bg-accent-orange font-display font-black">
                  {otherName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-display font-bold">{otherName}</p>
                    {c.unread > 0 && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-accent-orange font-display text-xs font-black">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink/60">
                    {c.job_title ? `${c.job_title} · ` : ""}
                    {c.last_message || "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function InboxPage() {
  return (
    <Shell>
      <Suspense fallback={<Spinner />}>
        <InboxInner />
      </Suspense>
    </Shell>
  );
}

