import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Stronger blur + opacity for elevated panels. */
  strong?: boolean;
  /** Inset recessed surface (e.g. for displays). */
  inset?: boolean;
}

/**
 * Frosted-glass panel with blur, depth, and an inset top highlight.
 * The signature surface of the AudioForge glassmorphism design.
 */
export function GlassPanel({
  className,
  strong = false,
  inset = false,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        inset ? "glass-inset" : strong ? "glass-panel-strong" : "glass-panel",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
