import Link from "next/link";
import type { Project, UserWithProfile } from "@/lib/types";
import { Badge } from "@/components/ui";

const accentByType: Record<string, string> = {
  professional: "bg-accent-blue",
  personal: "bg-accent-mint",
  case_study: "bg-accent-orange",
  freelance: "bg-accent-yellow",
  open_source: "bg-accent-mint",
};

export function ProjectTypeBadge({ type }: { type: string }) {
  const label = type.replace("_", " ").toUpperCase();
  return (
    <Badge tone="white">
      <span className={`mr-1 inline-block h-2 w-2 rounded-full ${accentByType[type] ?? "bg-ink"}`} />
      {label}
    </Badge>
  );
}

export function ProofCard({
  project,
  owner,
  compact = false,
}: {
  project: Project;
  owner?: UserWithProfile;
  compact?: boolean;
}) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="brut-card group flex h-full flex-col overflow-hidden hover:shadow-[6px_6px_0_0_#151515] hover:-translate-x-px hover:-translate-y-px transition-all">
        <div
          className={`relative flex items-center justify-center overflow-hidden border-b-2 border-ink ${
            accentByType[project.project_type] ?? "bg-accent-yellow"
          }`}
          style={{ minHeight: compact ? 96 : 132 }}
        >
          {project.media_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.media_url}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-4xl font-black text-ink/80 drop-shadow-[2px_2px_0_#fff]">
              {(project.title || "?")[0]}
            </span>
          )}
          <span className="absolute right-2 top-2">
            <ProjectTypeBadge type={project.project_type} />
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-display text-base font-bold leading-tight">
            {project.title}
          </h3>
          {owner && (
            <p className="text-xs font-semibold text-ink/60">{owner.name}</p>
          )}
          <p className="line-clamp-2 text-sm text-ink/75">{project.outcome}</p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {project.skills.slice(0, compact ? 2 : 3).map((s) => (
              <span
                key={s.id}
                className="rounded-md border-2 border-ink bg-canvas px-1.5 py-0.5 text-[11px] font-bold"
              >
                {s.name}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between border-t-2 border-ink/10 pt-2 text-[11px] font-bold text-ink/60">
            <span>👁 {project.views}</span>
            <span>♥ {project.likes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SkillChips({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <span
          key={s}
          className="rounded-md border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold"
        >
          {s}
        </span>
      ))}
    </div>
  );
}
