import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, ClipboardCheck, Send, BarChart, Video, Calendar, LogOut, Sparkles, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CMSNavigation() {
  const { logout, auth } = useAuth();
  const location = useLocation();

  const navItems = [
    { title: "Dashboard", url: "/cms/dashboard", icon: LayoutDashboard, description: "Overview & Analytics" },
    { title: "Recipes", url: "/cms/recipes", icon: BookOpen, description: "Manage Library" },
    { title: "Review", url: "/cms/review", icon: ClipboardCheck, description: "Content Approvals" },
    { title: "Ready to Post", url: "/cms/pending", icon: Send, description: "Publishing Queue" },
    { title: "Video Clips", url: "/cms/clips", icon: Video, description: "Media Assets" },
    { title: "Scheduler", url: "/cms/scheduler", icon: Calendar, description: "Content Calendar" },
    { title: "Stats", url: "/cms/stats", icon: BarChart, description: "Performance" },
  ];

  if (auth.user?.isSuperAdmin) {
    navItems.push({ title: "Users", url: "/cms/admin/users", icon: Shield, description: "Access Control" });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm" />

      <div className="relative z-10 max-w-[1920px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
        {/* Logo Section */}
        <div className="flex flex-col min-w-[200px] flex-shrink-0 justify-center">
          <h1 className="text-xl font-bold font-playfair tracking-tight text-black">
            Tori Avey CMS
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-[#7C9A6D] font-bold">
            Content Manager
          </p>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto no-scrollbar py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url || (item.url !== '/cms/dashboard' && location.pathname.startsWith(item.url));

            return (
              <Tooltip key={item.title} delayDuration={300}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) => cn(
                      "relative group flex flex-col items-center justify-center px-5 py-2 rounded-xl transition-all duration-300 ease-out",
                      isActive
                        ? "text-slate-900 bg-white shadow-sm ring-1 ring-slate-200/60"
                        : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    {/* Active State Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-gradient-to-tr from-white to-slate-50 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] z-0"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <div className={cn(
                        "p-1.5 rounded-full transition-colors duration-300",
                        isActive ? "bg-[#7C9A6D]/10 text-[#7C9A6D]" : "group-hover:bg-slate-100/80"
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 transition-transform duration-300",
                          isActive ? "scale-110" : "group-hover:scale-105"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-semibold tracking-wide transition-colors",
                        isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                      )}>
                        {item.title}
                      </span>
                    </div>
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-none shadow-xl">
                  {item.description}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* User / Actions Section */}
        <div className="flex items-center gap-4 min-w-[180px] justify-end">
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-100/50 border border-slate-200/50">
            <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#7C9A6D]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                {auth.user?.name || "Tori Avey"}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="group relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
