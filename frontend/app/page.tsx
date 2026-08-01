"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { ButtonLink } from "@/components/ui";

export default function HomePage() {
  return (
    <Shell>
      <section className="grid gap-8 py-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <span className="brut-badge bg-accent-mint">
            Portfolio-based hiring
          </span>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            Hire for what they{" "}
            <span className="relative inline-block">
              <span className="bg-accent-yellow px-2">can do</span>
            </span>
            , not what their résumé says.
          </h1>
          <p className="max-w-md text-lg text-ink/80">
            Candidates show real projects, outcomes, and skills. Employers
            compare evidence and move fast. No gates, no credentialism — just
            proof.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Start your portfolio
            </ButtonLink>
            <ButtonLink href="/discover" size="lg" variant="blue">
              Find talent
            </ButtonLink>
          </div>
        </div>

        <div className="space-y-4">
          <div className="brut-card bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border-2 border-ink bg-accent-orange font-display text-xl font-black">
                MC
              </div>
              <div>
                <p className="font-display font-bold">Maya Chen</p>
                <p className="text-sm text-ink/60">
                  Product Designer & Design Systems Lead
                </p>
              </div>
              <span className="ml-auto brut-badge bg-accent-mint">Live</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Design System Rebuild", "Onboarding Revamp", "Nova UI Tokens"].map(
                (t) => (
                  <div
                    key={t}
                    className="rounded-[10px] border-2 border-ink bg-accent-yellow p-2 text-center font-display text-[11px] font-bold uppercase"
                  >
                    {t}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="brut-card bg-white p-5">
            <p className="font-display text-sm font-bold uppercase">Outcome</p>
            <p className="mt-1 text-sm">
              &ldquo;Cut design-to-dev handoff time 40% across 5 product
              squads.&rdquo;
            </p>
          </div>

          <div className="brut-card bg-white p-5">
            <p className="font-display text-sm font-bold uppercase">Hiring, evidence-first</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Search by skill", "Compare projects", "Message directly", "Track applications"].map(
                (f) => (
                  <span
                    key={f}
                    className="rounded-full border-2 border-ink bg-canvas px-3 py-1 text-xs font-bold"
                  >
                    {f}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          {
            t: "For candidates",
            d: "Build a living portfolio that shows problems, your contribution, and measurable results.",
            c: "bg-accent-orange",
          },
          {
            t: "For employers",
            d: "Filter by real skills and experience. Compare proof side by side before the first call.",
            c: "bg-accent-blue",
          },
          {
            t: "For both",
            d: "Message, shortlist, apply, and move to interview — all on the evidence.",
            c: "bg-accent-mint",
          },
        ].map((x) => (
          <div key={x.t} className="brut-card overflow-hidden">
            <div className={`h-3 ${x.c}`} />
            <div className="p-5">
              <h3 className="font-display text-lg font-bold uppercase">{x.t}</h3>
              <p className="mt-1 text-sm text-ink/70">{x.d}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="mt-16 text-center">
        <Link href="/login" className="font-display font-bold uppercase underline underline-offset-4">
          Already have an account? Log in →
        </Link>
      </p>
    </Shell>
  );
}
