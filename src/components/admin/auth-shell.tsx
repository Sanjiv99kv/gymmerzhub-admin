import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-black text-foreground">
      {/* Atmosphere — not a marketing panel */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 100% 80% at 50% -20%, oklch(0.92 0.22 125 / 0.14), transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)",
          }}
        />
        {/* Diagonal lime slash */}
        <div
          className="absolute -right-[20%] top-[35%] h-[2px] w-[70%] origin-right rotate-[-18deg] bg-gradient-to-l from-lime/50 via-lime/15 to-transparent animate-in fade-in duration-1000"
        />
        <div
          className="absolute -left-[10%] bottom-[22%] h-px w-[55%] origin-left rotate-[12deg] bg-gradient-to-r from-lime/25 via-transparent to-transparent"
        />
        {/* Giant watermark brand */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-[18%] select-none text-center font-mono text-[clamp(3.5rem,14vw,11rem)] font-bold leading-none tracking-[-0.06em] text-white/[0.03] animate-in fade-in duration-1000"
        >
          GYMMERZHUB
        </div>
      </div>

      {/* Top status strip */}
      <header className="relative z-10 flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 font-mono text-[11px] text-muted-foreground sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
            <span className="text-foreground/80">admin.gymmerzhub.com</span>
          </span>
          <span className="hidden text-white/20 sm:inline">│</span>
          <span className="hidden sm:inline">secure channel</span>
        </div>
        <span className="uppercase tracking-[0.18em] text-lime/80">ops · restricted</span>
      </header>

      {/* Center composition */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-9 space-y-4 text-center">
            <img
              src="/gymmerzhub.png"
              alt="GymmerzHub"
              width={56}
              height={56}
              className="mx-auto h-14 w-14 rounded-[14px] shadow-[0_0_32px_oklch(0.92_0.22_125/0.25)] animate-in zoom-in-95 duration-500"
            />
            <div className="space-y-2">
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                {title}
              </h1>
              <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>

          {children}

          {footer && (
            <div className="mt-8 text-center font-mono text-[11px] text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </main>

      {/* Bottom strip */}
      <footer className="relative z-10 flex h-10 shrink-0 items-center justify-between border-t border-white/[0.06] px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 sm:px-6">
        <span>© {new Date().getFullYear()} GymmerzHub</span>
        <span className="hidden sm:inline">platform operations console</span>
        <span>v0.1</span>
      </footer>
    </div>
  );
}
