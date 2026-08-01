"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Button, Field } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({ email, password, name, role });
      router.push(role === "candidate" ? "/builder" : "/discover");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-md pt-12">
        <div className="brut-card p-6">
          <h1 className="font-display text-3xl font-black uppercase">Join ProofHire</h1>
          <p className="mt-1 text-sm text-ink/60">
            Candidates build proof. Employers review it.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {(
              [
                { key: "candidate", label: "I'm a candidate", icon: "✍" },
                { key: "employer", label: "I'm hiring", icon: "🔍" },
              ] as const
            ).map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                aria-pressed={role === r.key}
                className={`rounded-[12px] border-2 border-ink p-3 text-left font-display text-sm font-bold uppercase transition-all ${
                  role === r.key
                    ? "bg-accent-yellow shadow-[3px_3px_0_0_#151515]"
                    : "bg-white hover:bg-canvas"
                }`}
              >
                <span className="mr-1">{r.icon}</span> {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <Field label="Name">
              <input
                required
                className="brut-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                className="brut-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input
                type="password"
                required
                minLength={8}
                className="brut-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            {error && (
              <p className="rounded-[10px] border-2 border-ink bg-accent-orange/20 p-3 text-sm font-semibold">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Already registered?{" "}
            <Link href="/login" className="font-bold underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
