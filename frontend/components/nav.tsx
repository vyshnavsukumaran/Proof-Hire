"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar, Button } from "@/components/ui";

function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-[10px] border-2 border-ink px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide ${
        active ? "bg-accent-yellow" : "bg-white hover:bg-canvas"
      }`}
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = user?.role === "employer"
    ? [
        { href: "/discover", label: "Discover" },
        { href: "/jobs", label: "Jobs" },
        { href: "/shortlist", label: "Shortlist" },
        { href: "/inbox", label: "Inbox" },
      ]
    : [
        { href: "/discover", label: "Discover" },
        { href: "/my-portfolio", label: "Portfolio" },
        { href: "/my-applications", label: "Applications" },
        { href: "/analytics", label: "Analytics" },
        { href: "/inbox", label: "Inbox" },
      ];

  if (loading) {
    return <div className="h-16" />;
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-canvas">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={user ? "/discover" : "/"} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border-2 border-ink bg-accent-orange font-display text-lg font-black shadow-[2px_2px_0_0_#151515]">
            P
          </span>
          <span className="font-display text-lg font-black uppercase tracking-tight">
            ProofHire
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-2 overflow-x-auto">
          {user ? (
            <>
              {links.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  active={pathname.startsWith(l.href)}
                >
                  {l.label}
                </NavLink>
              ))}
              <Link href="/settings" title="Settings">
                <Avatar name={user.name} src={user.avatar_url} size="sm" />
              </Link>
              <Button
                size="sm"
                variant="white"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <NavLink href="/login" active={pathname === "/login"}>
                Log in
              </NavLink>
              <NavLink href="/register" active={pathname === "/register"}>
                Join
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
