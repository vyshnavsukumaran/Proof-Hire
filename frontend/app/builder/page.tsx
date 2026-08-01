"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Button, Card, Chip, EmptyState, Field, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { Project } from "@/lib/types";

const PROJECT_TYPES = [
  "professional",
  "personal",
  "case_study",
  "freelance",
  "open_source",
];

const SUGGESTED_SKILLS = [
  "Python",
  "FastAPI",
  "React",
  "TypeScript",
  "Flutter",
  "Dart",
  "Figma",
  "SQL",
  "Docker",
  "UX Research",
  "Design Systems",
  "Analytics",
];

interface Draft {
  title: string;
  project_type: string;
  role: string;
  problem: string;
  contribution: string;
  process: string;
  outcome: string;
  tools: string;
  project_url: string;
  skills: string[];
}

const emptyDraft: Draft = {
  title: "",
  project_type: "professional",
  role: "",
  problem: "",
  contribution: "",
  process: "",
  outcome: "",
  tools: "",
  project_url: "",
  skills: [],
};

export default function BuilderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [pendingMedia, setPendingMedia] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    if (user) setProjects(user.projects ?? []);
  }, [user]);

  const set = (key: keyof Draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleSkill = (s: string) =>
    setDraft((d) => ({
      ...d,
      skills: d.skills.includes(s)
        ? d.skills.filter((x) => x !== s)
        : [...d.skills, s],
    }));

  function editProject(p: Project) {
    setEditing(p.id);
    setMediaUrl(p.media_url ?? "");
    setPendingMedia(null);
    setDraft({
      title: p.title,
      project_type: p.project_type,
      role: p.role ?? "",
      problem: p.problem ?? "",
      contribution: p.contribution ?? "",
      process: p.process ?? "",
      outcome: p.outcome ?? "",
      tools: p.tools ?? "",
      project_url: p.project_url ?? "",
      skills: p.skills.map((s) => s.name),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      let projectId: number;
      if (editing) {
        await api.updateProject(editing, { ...draft });
        projectId = editing;
      } else {
        const created = await api.createProject({ ...draft });
        projectId = created.id;
      }
      if (pendingMedia) {
        setUploading(true);
        const res = await api.uploadProjectMedia(projectId, pendingMedia);
        setMediaUrl(res.media_url);
      }
      router.push("/my-portfolio");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
      setBusy(false);
    } finally {
      setUploading(false);
    }
  }

  async function onMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError("");
    if (editing) {
      setUploading(true);
      try {
        const res = await api.uploadProjectMedia(editing, file);
        setMediaUrl(res.media_url);
      } catch (err) {
        setMediaError(err instanceof ApiError ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    } else {
      setPendingMedia(file);
      setMediaUrl(URL.createObjectURL(file));
    }
    e.target.value = "";
  }

  async function remove(p: Project) {
    await api.deleteProject(p.id);
    const next = projects.filter((x) => x.id !== p.id);
    setProjects(next);
    await api.updateMe({});
  }

  const completion = [
    draft.title,
    draft.problem,
    draft.contribution,
    draft.process,
    draft.outcome,
  ].filter(Boolean).length;

  if (loading) return <Shell><Spinner /></Shell>;
  if (!user || user.role !== "candidate") {
    return <Shell><EmptyState title="Candidates only" /></Shell>;
  }

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-black uppercase">
          {editing ? "Edit project" : "Portfolio builder"}
        </h1>
        <div className="brut-card px-3 py-2">
          <span className="font-display text-xs font-bold uppercase">
            Completion {completion}/5
          </span>
          <div className="mt-1 h-3 w-32 overflow-hidden rounded-full border-2 border-ink bg-white">
            <div
              className={`h-full transition-all ${completion === 5 ? "bg-accent-mint" : "bg-accent-yellow"}`}
              style={{ width: `${(completion / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card className="p-5">
            <Field label="Project title" error={!draft.title && draft.title !== "" ? undefined : undefined}>
              <input
                className="brut-field"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Design System Rebuild"
              />
            </Field>
            <div className="mt-4">
              <span className="brut-label">Project type</span>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    selected={draft.project_type === t}
                    onClick={() => set("project_type", t)}
                  >
                    {t.replace("_", " ")}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Field label="Your role">
                <input
                  className="brut-field"
                  value={draft.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="e.g. Design Systems Lead"
                />
              </Field>
            </div>
          </Card>

          {(
            [
              { key: "problem" as const, label: "Problem", placeholder: "What needed solving, and who felt it?" },
              { key: "contribution" as const, label: "Contribution", placeholder: "What did you personally do?" },
              { key: "process" as const, label: "Process", placeholder: "How did you approach and execute it?" },
              { key: "outcome" as const, label: "Outcome", placeholder: "What measurable result did it produce?" },
            ]
          ).map((b) => (
            <Card key={b.key} className="p-5">
              <Field label={b.label}>
                <textarea
                  className="brut-field min-h-[90px]"
                  value={draft[b.key] ?? ""}
                  onChange={(e) => set(b.key, e.target.value)}
                  placeholder={b.placeholder}
                />
              </Field>
            </Card>
          ))}

          <Card className="p-5">
            <Field label="Tools & stack" hint="Comma-separated">
              <input
                className="brut-field"
                value={draft.tools}
                onChange={(e) => set("tools", e.target.value)}
                placeholder="Figma, Storybook, React"
              />
            </Field>
            <div className="mt-4">
              <Field label="Project URL">
                <input
                  className="brut-field"
                  value={draft.project_url}
                  onChange={(e) => set("project_url", e.target.value)}
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <span className="brut-label">Project image (thumbnail)</span>
            <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-32 w-44 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border-2 border-ink bg-canvas">
                {mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="Project thumbnail" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-center font-display text-xs font-bold uppercase text-ink/40">
                    No image
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-ink/60">
                  {pendingMedia && !editing
                    ? "Image staged — will upload when you save."
                    : "JPG, PNG, GIF or WebP — max 5MB. This becomes the card thumbnail."}
                </p>
                {mediaError && (
                  <p className="mt-2 text-sm font-semibold text-accent-orange" role="alert">
                    {mediaError}
                  </p>
                )}
                <label className="mt-3 inline-flex cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={onMediaChange}
                  />
                  <span className="brut-btn bg-accent-blue text-white text-sm">
                    {uploading ? "Uploading…" : mediaUrl ? "Replace image" : "Upload image"}
                  </span>
                </label>
                {mediaUrl && (
                  <button
                    type="button"
                    className="mt-2 block font-display text-xs font-bold uppercase text-accent-orange underline underline-offset-2"
                    onClick={() => {
                      setMediaUrl("");
                      setPendingMedia(null);
                    }}
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <span className="brut-label">Skills used</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SKILLS.map((s) => (
                <Chip
                  key={s}
                  selected={draft.skills.includes(s)}
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
            {draft.skills.filter((s) => !SUGGESTED_SKILLS.includes(s)).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.skills
                  .filter((s) => !SUGGESTED_SKILLS.includes(s))
                  .map((s) => (
                    <Chip key={s} selected onClick={() => toggleSkill(s)}>
                      {s}
                    </Chip>
                  ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                className="brut-field"
                id="custom-skill"
                placeholder="Add a custom skill"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !draft.skills.includes(value)) {
                      setDraft((d) => ({ ...d, skills: [...d.skills, value] }));
                    }
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <Button
                size="sm"
                variant="white"
                onClick={(e) => {
                  const input = (e.currentTarget.form?.elements.namedItem(
                    "custom-skill"
                  ) ?? document.getElementById("custom-skill")) as HTMLInputElement | null;
                  const value = input?.value.trim();
                  if (value && !draft.skills.includes(value)) {
                    setDraft((d) => ({ ...d, skills: [...d.skills, value] }));
                  }
                  if (input) input.value = "";
                }}
              >
                Add
              </Button>
            </div>
          </Card>

          {error && (
            <p className="rounded-[10px] border-2 border-ink bg-accent-orange/20 p-3 text-sm font-semibold">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={save} disabled={busy || !draft.title}>
              {busy ? "Saving…" : editing ? "Save changes" : "Save project"}
            </Button>
            <Button
              variant="white"
              onClick={() => {
                setEditing(null);
                setDraft(emptyDraft);
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <h3 className="font-display font-bold uppercase">Your projects</h3>
            {projects.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">Nothing yet. Build some proof!</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-[10px] border-2 border-ink bg-canvas p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {p.title}
                    </span>
                    <button
                      className="font-display text-xs font-bold uppercase underline underline-offset-2"
                      onClick={() => editProject(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="font-display text-xs font-bold uppercase text-accent-orange underline underline-offset-2"
                      onClick={() => remove(p)}
                    >
                      Del
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="bg-accent-yellow p-4">
            <h3 className="font-display font-bold uppercase">Tip</h3>
            <p className="mt-1 text-sm">
              Strong evidence includes a problem, your contribution, and a
              measurable outcome. Numbers help recruiters compare.
            </p>
          </Card>
        </aside>
      </div>
    </Shell>
  );
}
