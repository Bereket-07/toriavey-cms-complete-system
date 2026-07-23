import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Send,
  BarChart,
  Video,
  Calendar,
  LogOut,
  Shield,
  BookMarked,
  Menu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function CMSNavigation() {
  const { logout, auth } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      title: "Dashboard",
      url: "/cms/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      title: "Recipes",
      url: "/cms/recipes",
      icon: BookOpen,
      description: "Manage Library",
    },
    {
      title: "Review",
      url: "/cms/review",
      icon: ClipboardCheck,
      description: "Content Approvals",
    },
    {
      title: "Ready to Post",
      url: "/cms/pending",
      icon: Send,
      description: "Publishing Queue",
    },
    {
      title: "Video Clips",
      url: "/cms/clips",
      icon: Video,
      description: "Media Assets",
    },
    {
      title: "Scheduler",
      url: "/cms/scheduler",
      icon: Calendar,
      description: "Content Calendar",
    },
    {
      title: "E-Books",
      url: "/cms/ebooks",
      icon: BookMarked,
      description: "Generate PDF E-Books",
    },
    {
      title: "Stats",
      url: "/cms/stats",
      icon: BarChart,
      description: "Performance",
    },
  ];
  if (auth.user?.isSuperAdmin) {
    navItems.push({
      title: "Users",
      url: "/cms/admin/users",
      icon: Shield,
      description: "Access Control",
    });
  }

  const name = auth.user?.name || "Tori Avey";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isItemActive = (url: string) =>
    location.pathname === url ||
    (url !== "/cms/dashboard" && location.pathname.startsWith(url));

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full">
      <div className="absolute inset-0 bg-[hsl(var(--warm-white)/0.85)] backdrop-blur-xl border-b border-border shadow-[var(--shadow-sm)]" />

      <div className="relative z-10 mx-auto flex h-16 max-w-[1920px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        {/* Brand */}
        <div className="flex min-w-0 flex-shrink items-center gap-2.5 lg:min-w-[210px]">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] font-display text-base font-semibold text-white shadow-[var(--shadow-sm)] sm:h-11 sm:w-11 sm:text-lg">
            TA
          </div>
          <div className="flex min-w-0 flex-col leading-none">
            <h1 className="truncate font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Tori Avey
            </h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">
              Content Studio
            </p>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center justify-center gap-1 overflow-x-auto py-2 no-scrollbar lg:flex">
          {navItems.map((item) => (
            <Tooltip key={item.title} delayDuration={300}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-300 ease-out xl:px-4",
                      isActive
                        ? "text-[#7C3AED]"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {isItemActive(item.url) && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 z-0 rounded-xl bg-[#7C3AED]/10 ring-1 ring-[#7C3AED]/25"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-300",
                        isItemActive(item.url)
                          ? "scale-110"
                          : "group-hover:scale-105",
                      )}
                    />
                    <span className="whitespace-nowrap text-[11px] font-semibold tracking-wide">
                      {item.title}
                    </span>
                  </div>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {item.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 xl:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED]/12 text-xs font-bold text-[#7C3AED]">
              {initials}
            </div>
            <span className="max-w-[110px] truncate text-xs font-semibold text-foreground">
              {name}
            </span>
          </div>
          <button
            onClick={logout}
            title="Logout"
            aria-label="Logout"
            className="group hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive lg:flex"
          >
            <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[290px] p-0 sm:w-[320px]">
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED]/12 text-sm font-bold text-[#7C3AED]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display font-semibold text-foreground">
                      {name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Content Studio
                    </div>
                  </div>
                </div>
                {/* Links */}
                <div className="flex-1 space-y-1 overflow-y-auto p-3">
                  {navItems.map((item) => {
                    const active = isItemActive(item.url);
                    return (
                      <NavLink
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                          active
                            ? "bg-[#7C3AED]/12 text-[#7C3AED]"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </NavLink>
                    );
                  })}
                </div>
                {/* Logout */}
                <div className="border-t border-border p-3">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" /> Log out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
