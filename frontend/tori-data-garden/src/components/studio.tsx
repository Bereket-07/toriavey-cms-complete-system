import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared "studio" design primitives for the CMS.
 * These define the elevated visual language used across every page:
 * a signature gradient hero band, consistent section cards, and status chips.
 */

/* ---------- PageHero: the signature gradient band at the top of a page ---------- */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: React.ElementType;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border p-8 md:p-10",
        className,
      )}
      style={{ background: "#7C3AED" }}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-4 top-10 h-52 w-52 rounded-full border border-white/10" />
      <div className="relative z-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="text-white">
            {eyebrow && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                {Icon && <Icon className="h-4 w-4" />}
                {eyebrow}
              </div>
            )}
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-xl text-white/85">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
          )}
        </div>
        {children && <div className="relative z-10 mt-6">{children}</div>}
      </div>
    </section>
  );
}

/* ---------- SectionCard: a titled content panel ---------- */
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon: React.ElementType;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-[#7C3AED]/10 p-1.5 text-[#7C3AED]">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

/* ---------- StatusChip: consistent status pill ---------- */
const STATUS_STYLES: Record<string, string> = {
  posted: "bg-[#16A34A] text-white",
  completed: "bg-[#16A34A] text-white",
  pending: "bg-[#F59E0B] text-white",
  ready: "bg-[#F59E0B] text-white",
  generated: "bg-[#7C3AED] text-white",
  processing: "bg-[#2563EB] text-white",
  generating: "bg-[#2563EB] text-white",
  failed: "bg-[#DC2626] text-white",
  declined: "bg-[#DC2626] text-white",
  not_generated: "bg-[#64748B] text-white",
};

export function StatusChip({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status] || STATUS_STYLES.not_generated,
        className,
      )}
    >
      {label || status}
    </span>
  );
}
