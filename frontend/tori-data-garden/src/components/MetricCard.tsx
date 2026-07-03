import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconColor?: string;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  subtitle,
  onClick,
  active = true,
  className,
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const clickable = typeof onClick === "function";

  return (
    <Card
      className={cn(
        "p-6 transition-smooth hover:shadow-recipe-card",
        clickable ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary" : "",
        !active ? "opacity-60 border-primary/40" : "",
        active ? "bg-card-hover" : "",
        className,
      )}
      role={clickable ? "switch" : undefined}
      aria-checked={clickable ? active : undefined}
  aria-label={clickable ? title : undefined}
  tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!clickable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-playfair font-bold text-foreground mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp className="h-4 w-4 text-green-600" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-600" />}
              <span
                className={`text-sm font-medium ${
                  isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"
                }`}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColor || "bg-primary/10"}`}>
          <Icon className={`h-6 w-6 ${iconColor ? "" : "text-primary"}`} />
        </div>
      </div>
    </Card>
  );
}
