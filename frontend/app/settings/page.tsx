"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { Avatar, Button, Card, Chip, EmptyState, Field, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

const AVAILABILITIES = ["fulltime", "freelance", "parttime", "not_available"];
const SKILL_OPTIONS = [
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
  "SEO",
];

export default function SettingsPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [form, setForm] = useState({
    headline: "",
    summary: "",
    bio: "",
    location: "",
    years_experience: "",
    availability: "fulltime",
    visibility: "draft",
    skills: [] as string[],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatar_url ?? "");
      setForm({
        headline: user.profile?.headline ?? "",
        summary: user.profile?.summary ?? "",
        bio: user.bio ?? "",
        location: user.location ?? "",
        years_experience: String(user.profile?.years_experience ?? 0),
        availability: user.availability ?? "fulltime",
        visibility: user.profile?.visibility ?? "draft",
        skills: user.skills.map((s) => s.name),
      });
    }
  }, [user]);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const res = await api.uploadAvatar(file);
      setAvatarUrl(res.url);
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  const toggleSkill = (s: string) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s],
    }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.updateMe({
        headline: form.headline || null,
        summary: form.summary || null,
        bio: form.bio || null,
        location: form.location || null,
        years_experience: Number(form.years_experience) || 0,
        availability: form.availability,
        visibility: form.visibility,
        skills: form.skills,
      });
      await refresh();
      router.push("/my-portfolio");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
      setBusy(false);
    }
  }

  if (loading) return <Shell><Spinner /></Shell>;
  if (!user || user.role !== "candidate") {
    return <Shell><EmptyState title="Candidates only" /></Shell>;
  }

  return (
    <Shell>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Profile settings</h1>

      <Card className="mb-6 flex flex-col items-center gap-4 p-6 sm:flex-row">
        <div className="relative">
          <Avatar name={user.name} src={avatarUrl} size="lg" />
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[12px] border-2 border-ink bg-white/80">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-black uppercase">Profile picture</h2>
          <p className="mt-1 text-sm text-ink/60">
            JPG, PNG, GIF or WebP — max 5MB. Shows next to your name across ProofHire.
          </p>
          {avatarError && (
            <p className="mt-2 text-sm font-semibold text-accent-orange" role="alert">
              {avatarError}
            </p>
          )}
          <label className="mt-3 inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={onAvatarChange}
            />
            <span className="brut-btn bg-accent-yellow text-sm">
              {uploadingAvatar ? "Uploading…" : "Upload picture"}
            </span>
          </label>
        </div>
      </Card>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <Field label="Headline">
            <input
              className="brut-field"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              placeholder="e.g. Product Designer & Design Systems Lead"
            />
          </Field>
          <Field label="Summary">
            <textarea
              className="brut-field min-h-[110px]"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
          </Field>
          <Field label="Short bio">
            <input
              className="brut-field"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input
                className="brut-field"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </Field>
            <Field label="Years experience">
              <input
                type="number"
                min={0}
                className="brut-field"
                value={form.years_experience}
                onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <span className="brut-label">Availability</span>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITIES.map((a) => (
                <Chip
                  key={a}
                  selected={form.availability === a}
                  onClick={() => setForm((f) => ({ ...f, availability: a }))}
                >
                  {a.replace("_", " ")}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="brut-label">Portfolio visibility</span>
            <div className="flex flex-wrap gap-2">
              {["draft", "live"].map((v) => (
                <Chip
                  key={v}
                  selected={form.visibility === v}
                  onClick={() => setForm((f) => ({ ...f, visibility: v }))}
                >
                  {v === "live" ? "Live (searchable)" : "Draft (hidden)"}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="brut-label">Skills</span>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((s) => (
                <Chip key={s} selected={form.skills.includes(s)} onClick={() => toggleSkill(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          {error && (
            <p className="rounded-[10px] border-2 border-ink bg-accent-orange/20 p-3 text-sm font-semibold">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </Card>
      </form>
    </Shell>
  );
}
