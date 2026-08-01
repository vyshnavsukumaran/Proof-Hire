import { Nav } from "@/components/nav";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">
        {children}
      </main>
      <footer className="border-t-2 border-ink bg-accent-yellow py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 font-display text-xs font-bold uppercase">
          <span>ProofHire</span>
          <span>Hire people for what they can do.</span>
        </div>
      </footer>
    </>
  );
}
