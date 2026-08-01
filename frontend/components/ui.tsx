import { forwardRef } from "react";
import Link from "next/link";

type Variant = "orange" | "yellow" | "mint" | "blue" | "white" | "ghost";

const variantClasses: Record<Variant, string> = {
  orange: "bg-accent-orange text-ink",
  yellow: "bg-accent-yellow text-ink",
  mint: "bg-accent-mint text-ink",
  blue: "bg-accent-blue text-white",
  white: "bg-white text-ink",
  ghost: "bg-transparent text-ink shadow-none border-transparent active:shadow-none",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "orange", size = "md", className = "", ...props }, ref) => {
    const sizeClass =
      size === "sm"
        ? "min-h-[36px] px-3 text-xs"
        : size === "lg"
          ? "min-h-[52px] px-7 text-base"
          : "px-5 text-sm";
    return (
      <button
        ref={ref}
        className={`brut-btn ${sizeClass} ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export function ButtonLink({
  href,
  variant = "orange",
  size = "md",
  className = "",
  children,
  onClick,
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const sizeClass =
    size === "sm"
      ? "min-h-[36px] px-3 text-xs"
      : size === "lg"
        ? "min-h-[52px] px-7 text-base"
        : "px-5 text-sm";
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`brut-btn ${sizeClass} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Chip({
  selected = false,
  onClick,
  children,
  className = "",
  count,
  disabled,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  count?: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`brut-chip ${selected ? "brut-chip-selected" : "hover:bg-canvas"} ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
    >
      {selected && <span aria-hidden>✓</span>}
      {children}
      {typeof count === "number" && (
        <span className="rounded-full bg-ink px-1.5 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

const badgeTones: Record<string, string> = {
  orange: "bg-accent-orange",
  yellow: "bg-accent-yellow",
  mint: "bg-accent-mint",
  blue: "bg-accent-blue text-white",
  gray: "bg-ink/10",
};

export function Badge({
  children,
  tone = "yellow",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span className={`brut-badge ${badgeTones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "yellow" | "mint" | "blue" | "gray" | "orange" }> = {
    draft: { label: "Draft", tone: "gray" },
    live: { label: "Live", tone: "mint" },
    interviewing: { label: "Interviewing", tone: "blue" },
    closed: { label: "Closed", tone: "gray" },
    open: { label: "Open", tone: "mint" },
    applied: { label: "Applied", tone: "yellow" },
    reviewing: { label: "Reviewing", tone: "blue" },
    interview: { label: "Interview", tone: "blue" },
    offer: { label: "Offer", tone: "mint" },
    rejected: { label: "Rejected", tone: "orange" },
    withdrawn: { label: "Withdrawn", tone: "gray" },
    saved: { label: "Saved", tone: "yellow" },
    passed: { label: "Passed", tone: "gray" },
    interview_requested: { label: "Interview Req.", tone: "blue" },
  };
  const config = map[status] ?? { label: status, tone: "gray" as const };
  return (
    <span className="brut-badge bg-white">
      <span
        className={`mr-1 inline-block h-2.5 w-2.5 rounded-full ${badgeTones[config.tone]}`}
        aria-hidden
      />
      {config.label}
    </span>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="brut-label">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-ink/60">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs font-semibold text-accent-orange" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  const interactive = onClick
    ? "cursor-pointer hover:shadow-[6px_6px_0_0_#151515] hover:-translate-x-px hover:-translate-y-px transition-all"
    : hover
      ? "hover:shadow-[6px_6px_0_0_#151515] hover:-translate-x-px hover:-translate-y-px transition-all"
      : "";
  return (
    <div className={`brut-card ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 p-8" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      <span className="font-display text-sm font-bold uppercase">{label}</span>
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-9 w-9 rounded-[10px] text-sm",
    md: "h-12 w-12 rounded-[10px] text-lg",
    lg: "h-20 w-20 rounded-[12px] text-2xl",
  };
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border-2 border-ink bg-accent-orange font-display font-black shadow-[2px_2px_0_0_#151515] ${sizes[size]} ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="brut-card flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-accent-yellow font-display text-3xl">
        !
      </div>
      <h3 className="font-display text-lg font-bold uppercase">{title}</h3>
      {body && <p className="max-w-sm text-sm text-ink/70">{body}</p>}
      {action}
    </div>
  );
}
