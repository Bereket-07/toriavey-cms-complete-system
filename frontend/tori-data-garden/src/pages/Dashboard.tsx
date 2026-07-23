import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  BookOpen,
  Clock,
  CheckCircle2,
  Send,
  Video,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface DashboardStats {
  recipes: {
    total: number;
    not_generated: number;
    generated: number;
    pending: number;
    posted: number;
    by_platform?: Record<string, number>;
  };
  clips: {
    total_generated: number;
    total_posted: number;
    processing: number;
    failed: number;
    by_platform?: Record<string, number>;
  };
  scheduler: {
    is_running: boolean;
    next_run?: string;
    interval_minutes?: number;
  };
  videoScheduler: {
    running: boolean;
    interval_minutes?: number;
    last_run?: string;
    next_run?: string;
  };
}
interface RecentRecipe {
  id: number;
  title: string;
  image_url?: string;
  date: string;
  content_status?: { status: string; posted: boolean };
}
interface RecentClip {
  projectId: string;
  projectName: string;
  createdAt: string;
  status: string;
  generated_clips: any[];
}

const STATUS_LABEL: Record<string, string> = {
  posted: "Posted",
  pending: "Ready",
  generated: "Generated",
  not_generated: "New",
  processing: "Processing",
  failed: "Failed",
};
function statusClasses(status: string) {
  switch (status) {
    case "posted":
      return "bg-[#16A34A] text-white";
    case "completed":
      return "bg-[#16A34A] text-white";
    case "pending":
      return "bg-[#F59E0B] text-white";
    case "generated":
      return "bg-[#7C3AED] text-white";
    case "processing":
      return "bg-[#2563EB] text-white";
    case "failed":
      return "bg-[#DC2626] text-white";
    default:
      return "bg-[#64748B] text-white";
  }
}
function timeAgo(d?: string) {
  if (!d) return "";
  const t = new Date(d);
  return isNaN(t.getTime()) ? "" : formatDistanceToNow(t, { addSuffix: true });
}

/* ---------- Reusable primitives ---------- */
function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ ["--tile" as string]: color }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--tile)] hover:shadow-[var(--shadow-lg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tile)]"
    >
      {/* colored hover wash */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.08]"
        style={{ background: color }}
      />
      {/* left accent bar */}
      <span
        className="absolute left-0 top-0 h-full w-1 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: color }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className="rounded-xl p-2.5 text-white shadow-[var(--shadow-sm)]"
            style={{ background: color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight
            className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color }}
          />
        </div>
        <div className="mt-4 font-display text-5xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        <div className="mt-1 text-base font-bold text-foreground">{label}</div>
        <div className="mt-0.5 text-xs font-medium text-muted-foreground">
          {sub}
        </div>
      </div>
    </button>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Dashboard() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timeUntilNext, setTimeUntilNext] = useState<string>("");

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["wprm-status-summary"],
    queryFn: () => apiGet("/api/content/wprm-status-summary"),
    staleTime: 1000 * 60 * 5,
  });
  const { data: schedulerData, isLoading: isLoadingScheduler } = useQuery({
    queryKey: ["wprm-scheduler-status"],
    queryFn: () => apiGet("/api/wprm-scheduler/status"),
    staleTime: 1000 * 60 * 5,
  });
  const { data: videoSchedulerData, isLoading: isLoadingVideoScheduler } =
    useQuery({
      queryKey: ["youtube-scheduler-status"],
      queryFn: () => apiGet("/api/youtube-scheduler/status"),
      staleTime: 1000 * 60 * 5,
    });
  const { data: clipsStatsData, isLoading: isLoadingClipsStats } = useQuery({
    queryKey: ["clips-stats"],
    queryFn: () => apiGet("/api/clips/stats"),
    staleTime: 1000 * 60 * 5,
  });
  const { data: recentRecipesData, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ["recent-recipes"],
    queryFn: () => apiGet("/api/content/wprm-recipes?limit=5"),
    staleTime: 1000 * 60 * 5,
  });
  const { data: recentClipsData, isLoading: isLoadingClips } = useQuery({
    queryKey: ["recent-clips"],
    queryFn: () => apiGet("/api/clips/list"),
    staleTime: 1000 * 60 * 5,
  });

  const stats: DashboardStats = {
    recipes: {
      total: statsData?.total_recipes || 0,
      not_generated: statsData?.by_status?.not_generated || 0,
      generated: statsData?.by_status?.generated || 0,
      pending: statsData?.by_status?.pending || 0,
      posted: statsData?.by_status?.posted || 0,
      by_platform: statsData?.by_platform || undefined,
    },
    clips: {
      total_generated: clipsStatsData?.total_generated_clips || 0,
      total_posted: clipsStatsData?.total_posted_clips || 0,
      processing: clipsStatsData?.project_status?.processing || 0,
      failed: clipsStatsData?.project_status?.failed || 0,
      by_platform: clipsStatsData?.by_platform || undefined,
    },
    scheduler: {
      is_running: schedulerData?.is_running || false,
      next_run: schedulerData?.next_run,
      interval_minutes: schedulerData?.interval_minutes,
    },
    videoScheduler: {
      running: videoSchedulerData?.is_running || false,
      interval_minutes: videoSchedulerData?.config?.interval_minutes,
      last_run: undefined,
      next_run: videoSchedulerData?.next_run,
    },
  };

  const recentRecipes: RecentRecipe[] = recentRecipesData?.recipes || [];
  const recentClips: RecentClip[] = recentClipsData
    ? recentClipsData.slice(0, 5)
    : [];
  const loading =
    isLoadingStats ||
    isLoadingScheduler ||
    isLoadingVideoScheduler ||
    isLoadingClipsStats ||
    isLoadingRecipes ||
    isLoadingClips;

  useEffect(() => {
    if (stats.scheduler.next_run) {
      const interval = setInterval(() => {
        const nextRun = new Date(stats.scheduler.next_run!);
        const diff = nextRun.getTime() - new Date().getTime();
        if (diff <= 0) setTimeUntilNext("Running now…");
        else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeUntilNext(`${h}h ${m}m ${s}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else setTimeUntilNext("");
  }, [stats.scheduler.next_run]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wprm-status-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["wprm-scheduler-status"] }),
      queryClient.invalidateQueries({ queryKey: ["youtube-scheduler-status"] }),
      queryClient.invalidateQueries({ queryKey: ["clips-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["recent-recipes"] }),
      queryClient.invalidateQueries({ queryKey: ["recent-clips"] }),
    ]);
    toast({
      title: "Dashboard updated",
      description: "Latest statistics refreshed.",
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#7C3AED]/60" />
        <p className="text-muted-foreground animate-pulse">
          Preparing your dashboard…
        </p>
      </div>
    );
  }

  const firstName = (auth.user?.name || "Tori Avey").split(" ")[0];
  const totalRecipes = stats.recipes.total || 1;
  const pipeline = [
    { label: "New", value: stats.recipes.not_generated, color: "#94A3B8" },
    { label: "Generated", value: stats.recipes.generated, color: "#7C3AED" },
    { label: "Ready", value: stats.recipes.pending, color: "#F59E0B" },
    { label: "Posted", value: stats.recipes.posted, color: "#16A34A" },
  ];
  const quickActions = [
    {
      label: "Generate an e-book",
      icon: BookOpen,
      to: "/cms/ebooks",
      color: "#7C3AED",
    },
    {
      label: "Review queue",
      icon: CheckCircle2,
      to: "/cms/review",
      color: "#16A34A",
    },
    {
      label: "Ready to post",
      icon: Send,
      to: "/cms/pending",
      color: "#F59E0B",
    },
    { label: "Video clips", icon: Video, to: "/cms/clips", color: "#E11D48" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ---------- HERO ---------- */}
      <section
        className="relative overflow-hidden rounded-3xl border border-border p-8 md:p-10"
        style={{ background: "#7C3AED" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-4 top-10 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="text-white">
            {timeUntilNext && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5" /> Next auto-run in{" "}
                {timeUntilNext}
              </span>
            )}
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-2 max-w-md text-white/85">
              Your content studio at a glance — {stats.recipes.pending} ready to
              publish and {stats.recipes.posted} already live.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => navigate("/cms/ebooks")}
              className="gap-2 bg-white text-[#6D28D9] hover:bg-white/90"
            >
              <Sparkles className="h-4 w-4" /> Generate e-book
            </Button>
            <Button
              onClick={() => navigate("/cms/recipes")}
              variant="outline"
              className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <BookOpen className="h-4 w-4" /> Recipes
            </Button>
            <Button
              onClick={handleRefresh}
              size="icon"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- STAT TILES ---------- */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total recipes"
          value={stats.recipes.total}
          sub={`${stats.recipes.generated} generated`}
          icon={BookOpen}
          color="#7C3AED"
          onClick={() => navigate("/cms/recipes")}
        />
        <StatTile
          label="Ready to post"
          value={stats.recipes.pending}
          sub="awaiting publish"
          icon={Send}
          color="#F59E0B"
          onClick={() => navigate("/cms/pending")}
        />
        <StatTile
          label="Posted"
          value={stats.recipes.posted}
          sub="live on socials"
          icon={CheckCircle2}
          color="#16A34A"
          onClick={() => navigate("/cms/review")}
        />
        <StatTile
          label="Video clips"
          value={stats.clips.total_generated}
          sub={`${stats.clips.total_posted} posted`}
          icon={Video}
          color="#E11D48"
          onClick={() => navigate("/cms/clips")}
        />
      </section>

      {/* ---------- PIPELINE ---------- */}
      <SectionCard
        title="Content pipeline"
        icon={Layers}
        action={
          <span className="text-sm text-muted-foreground">
            {Math.round((stats.recipes.posted / totalRecipes) * 100)}% published
          </span>
        }
      >
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {pipeline.map((p) => (
            <div
              key={p.label}
              className="h-full transition-all"
              style={{
                background: p.color,
                width: `${Math.max((p.value / totalRecipes) * 100, p.value ? 3 : 0)}%`,
              }}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {pipeline.map((p) => (
            <div
              key={p.label}
              style={{ ["--seg" as string]: p.color }}
              className="group relative overflow-hidden rounded-xl border border-border bg-muted/30 px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--seg)] hover:shadow-[var(--shadow-md)]"
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.1]"
                style={{ background: p.color }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {p.label}
                  </span>
                </div>
                <div className="mt-1.5 font-display text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {p.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ---------- ACTIVITY + AUTOMATION ---------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent recipes */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Recent recipes"
            icon={BookOpen}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[#7C3AED]"
                onClick={() => navigate("/cms/recipes")}
              >
                View all <ChevronRight className="h-4 w-4" />
              </Button>
            }
          >
            {recentRecipes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent recipes yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentRecipes.map((r) => {
                  const st = r.content_status?.status || "not_generated";
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/cms/review-detail/${r.id}`)}
                      className="group -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[#7C3AED]/[0.05]"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-foreground group-hover:text-[#7C3AED]">
                          {r.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {timeAgo(r.date)}
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "border-none font-semibold",
                          statusClasses(st),
                        )}
                      >
                        {STATUS_LABEL[st] || st}
                      </Badge>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Automation + quick actions */}
        <div className="space-y-6">
          <SectionCard title="Automation" icon={Zap}>
            <div className="space-y-3">
              {[
                {
                  name: "Recipe scheduler",
                  running: stats.scheduler.is_running,
                  interval: stats.scheduler.interval_minutes,
                  extra: timeUntilNext,
                },
                {
                  name: "Video scheduler",
                  running: stats.videoScheduler.running,
                  interval: stats.videoScheduler.interval_minutes,
                  extra: "",
                },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "relative flex h-2.5 w-2.5",
                          !s.running && "opacity-40",
                        )}
                      >
                        {s.running && (
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-60" />
                        )}
                        <span
                          className={cn(
                            "relative inline-flex h-2.5 w-2.5 rounded-full",
                            s.running
                              ? "bg-[hsl(var(--success))]"
                              : "bg-muted-foreground",
                          )}
                        />
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {s.name}
                      </span>
                    </div>
                    <div className="mt-0.5 pl-4.5 text-xs text-muted-foreground">
                      {s.running
                        ? `Every ${s.interval || "—"} min${s.extra ? ` · next in ${s.extra}` : ""}`
                        : "Idle"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#7C3AED]"
                    onClick={() => navigate("/cms/scheduler")}
                  >
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Quick actions" icon={ArrowRight}>
            <div className="space-y-1.5">
              {quickActions.map((a) => (
                <button
                  key={a.to}
                  onClick={() => navigate(a.to)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all hover:border-[#7C3AED]/20 hover:bg-[#7C3AED]/[0.05]"
                >
                  <div
                    className="rounded-lg p-2 text-white shadow-[var(--shadow-sm)]"
                    style={{ background: a.color }}
                  >
                    <a.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {a.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#7C3AED]" />
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ---------- RECENT CLIPS ---------- */}
      <SectionCard
        title="Recent video clips"
        icon={Video}
        action={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-[#7C3AED]"
            onClick={() => navigate("/cms/clips")}
          >
            View all <ChevronRight className="h-4 w-4" />
          </Button>
        }
      >
        {recentClips.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No clips generated yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentClips.map((c) => (
              <button
                key={c.projectId}
                onClick={() => navigate("/cms/clips")}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E11D48]/12 text-[#E11D48]">
                  <Video className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground group-hover:text-[#7C3AED]">
                    {c.projectName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {timeAgo(c.createdAt)} · {c.generated_clips?.length || 0}{" "}
                    clips
                  </div>
                </div>
                <Badge
                  className={cn(
                    "border-none font-semibold",
                    statusClasses(c.status),
                  )}
                >
                  {STATUS_LABEL[c.status] || c.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
