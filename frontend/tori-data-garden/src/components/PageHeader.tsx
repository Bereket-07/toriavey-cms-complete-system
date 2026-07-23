import { LucideIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onExport?: () => void;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  onExport,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8 pb-6 border-b border-border">
      <div className="flex items-start gap-4">
        <div className="p-3.5 rounded-2xl bg-[hsl(var(--olive)/0.1)] ring-1 ring-[hsl(var(--olive)/0.12)]">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div className="pt-0.5">
          <h1 className="text-[34px] leading-tight font-display font-semibold text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground text-base mt-1 max-w-2xl">
            {description}
          </p>
        </div>
      </div>
      {onExport && (
        <Button variant="outline" onClick={onExport} className="gap-2 shrink-0">
          <Download className="h-4 w-4" />
          Export
        </Button>
      )}
    </div>
  );
}
