"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/lib/types";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [fetching, setFetching] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [convs, msgs] = await Promise.all([
        api.conversations(),
        api.messages(Number(id)),
      ]);
      const current = convs.find((c) => c.id === Number(id)) ?? null;
      setConv(current);
      setMessages(msgs);
    } catch {
      setConv(null);
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    const msg = await api.sendMessage(Number(id), body);
    setMessages((m) => [...m, msg]);
    setBody("");
    setSending(false);
    api.conversations().then((cs) => {
      const c = cs.find((x) => x.id === Number(id));
      if (c) setConv(c);
    });
  }

  if (loading || fetching) return <Shell><Spinner /></Shell>;
  if (!user) return <Shell><EmptyState title="Log in to read messages" /></Shell>;
  if (!conv) {
    return <Shell><EmptyState title="Conversation not found" /></Shell>;
  }

  const otherName = user.id === conv.candidate_id ? conv.employer_name : conv.candidate_name;

  return (
    <Shell>
      <div className="mb-4 flex items-center gap-3">
        <Button size="sm" variant="white" onClick={() => router.push("/inbox")}>
          ← Inbox
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-ink bg-accent-mint font-display text-sm font-black">
          {otherName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-lg font-black uppercase">{otherName}</h1>
          {conv.job_title && (
            <p className="text-xs text-ink/60">Re: {conv.job_title}</p>
          )}
        </div>
      </div>

      <div className="brut-card flex h-[50vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-ink/50">
              Say hello — start with why you reached out.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-[10px] border-2 border-ink px-3 py-2 text-sm shadow-[2px_2px_0_0_#151515] ${
                    mine ? "bg-accent-orange" : "bg-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="mt-1 text-right text-[10px] font-bold uppercase opacity-70">
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t-2 border-ink p-3">
          <input
            className="brut-field"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Message ${otherName.split(" ")[0]}…`}
          />
          <Button type="submit" disabled={sending || !body.trim()}>
            Send
          </Button>
        </form>
      </div>
    </Shell>
  );
}
