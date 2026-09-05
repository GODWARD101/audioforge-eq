import { InstallPrompt } from "@/components/InstallPrompt";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Link, Outlet } from "@tanstack/react-router";
import {
  AudioWaveform,
  LayoutGrid,
  Settings2,
  SlidersHorizontal,
  Waves,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/eq", label: "EQ", icon: SlidersHorizontal },
  { to: "/effects", label: "Effects", icon: Waves },
  { to: "/presets", label: "Presets", icon: AudioWaveform },
  { to: "/settings", label: "Settings", icon: Settings2 },
] as const;

/**
 * Root layout: frosted-glass header with navigation, the routed page content,
 * and an attribution footer. The header and footer use visually distinct
 * backgrounds from the content area.
 */
export function Layout() {
  const { themeDefinition } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl shadow-subtle">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            data-ocid="brand_link"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <AudioWaveform className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight text-foreground">
                AudioForge EQ
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {themeDefinition.name} rack
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
            data-ocid="nav"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <InstallPrompt />
            <div className="flex items-center gap-2 md:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Parametric EQ · Effects rack
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-accent/40 hover:text-foreground",
        "data-[status=active]:bg-accent/50 data-[status=active]:text-foreground",
      )}
      activeOptions={{ exact: to === "/" }}
      data-ocid={`nav_link_${label.toLowerCase()}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function MobileNav() {
  return (
    <nav
      className="flex items-center gap-1"
      aria-label="Primary navigation"
      data-ocid="nav"
    >
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-label={item.label}
          className={cn(
            "flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors",
            "hover:bg-accent/40 hover:text-foreground",
            "data-[status=active]:bg-accent/50 data-[status=active]:text-foreground",
          )}
          activeOptions={{ exact: item.to === "/" }}
          data-ocid={`nav_link_${item.label.toLowerCase()}`}
        >
          <item.icon className="size-5" aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}
