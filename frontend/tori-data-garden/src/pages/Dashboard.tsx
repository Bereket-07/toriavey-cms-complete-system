
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, BookOpen, Clock, CheckCircle2, Send, Video, Calendar, Sparkles, ArrowRight, Play, ExternalLink, RefreshCw, AlertCircle, Facebook, Instagram, Linkedin } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

interface VideoSchedulerStats {
  running: boolean;
  interval_minutes?: number;
  last_run?: string;
  next_run?: string;
}

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
  videoScheduler: VideoSchedulerStats;
}

interface RecentRecipe {
  id: number;
  title: string;
  image_url?: string;
  date: string;
  content_status?: {
    status: string;
    posted: boolean;
  };
}

interface RecentClip {
  projectId: string;
  projectName: string;
  createdAt: string;
  status: string;
  generated_clips: any[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timeUntilNext, setTimeUntilNext] = useState<string>("");

  // fetch stats & summary
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['wprm-status-summary'],
    queryFn: () => apiGet("/api/content/wprm-status-summary"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: schedulerData, isLoading: isLoadingScheduler } = useQuery({
    queryKey: ['wprm-scheduler-status'],
    queryFn: () => apiGet("/api/wprm-scheduler/status"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: videoSchedulerData, isLoading: isLoadingVideoScheduler } = useQuery({
    queryKey: ['youtube-scheduler-status'],
    queryFn: () => apiGet("/api/youtube-scheduler/status"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: clipsStatsData, isLoading: isLoadingClipsStats } = useQuery({
    queryKey: ['clips-stats'],
    queryFn: () => apiGet("/api/clips/stats"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentRecipesData, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['recent-recipes'],
    queryFn: () => apiGet("/api/content/wprm-recipes?limit=5"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentClipsData, isLoading: isLoadingClips } = useQuery({
    queryKey: ['recent-clips'],
    queryFn: () => apiGet("/api/clips/list"),
    staleTime: 1000 * 60 * 5,
  });


  // Derived stats object to maintain structure
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
      next_run: videoSchedulerData?.next_run
    }
  };

  const recentRecipes: RecentRecipe[] = recentRecipesData?.recipes || [];
  const recentClips: RecentClip[] = recentClipsData ? recentClipsData.slice(0, 5) : [];

  const loading = isLoadingStats || isLoadingScheduler || isLoadingVideoScheduler || isLoadingClipsStats || isLoadingRecipes || isLoadingClips;


  useEffect(() => {
    if (stats.scheduler.next_run) {
      const interval = setInterval(() => {
        const nextRun = new Date(stats.scheduler.next_run!);
        const now = new Date();
        const diff = nextRun.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeUntilNext("Running now...");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeUntilNext("");
    }
  }, [stats.scheduler.next_run]);


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'pending': return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'generated': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'failed': return 'bg-red-100 text-red-700 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  const handleRefresh = async () => {
    // Invalidate all dashboard queries to trigger a refetch
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wprm-status-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['wprm-scheduler-status'] }),
      queryClient.invalidateQueries({ queryKey: ['youtube-scheduler-status'] }),
      queryClient.invalidateQueries({ queryKey: ['clips-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['recent-recipes'] }),
      queryClient.invalidateQueries({ queryKey: ['recent-clips'] })
    ]);

    toast({
      title: "Dashboard Updated",
      description: "Latest content statistics have been refreshed.",
      duration: 3000,
    });
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
        <p className="text-muted-foreground animate-pulse">Preparing your dashboard...</p>
      </div>
    );
  }

  const renderPlatformBadges = (platformData: Record<string, number> | undefined, mode: 'recipe' | 'video' = 'recipe') => {
    if (!platformData || Object.keys(platformData).length === 0) {
      return null;
    }

    let processedData = { ...platformData };

    if (mode === 'video') {
      const normalized: Record<string, number> = {};

      Object.entries(platformData).forEach(([key, count]) => {
        const k = key.toLowerCase();

        // Filter unwanted
        if (k.includes('tiktok') || k.includes('twitter') || k.includes('x')) return;

        // Normalize
        if (k.includes('facebook')) {
          normalized['Facebook'] = (normalized['Facebook'] || 0) + count;
        } else if (k.includes('instagram')) {
          normalized['Instagram'] = (normalized['Instagram'] || 0) + count;
        } else if (k.includes('youtube')) {
          normalized['YouTube'] = (normalized['YouTube'] || 0) + count;
        } else {
          // Keep others if we haven't filtered them out above
          normalized[key] = (normalized[key] || 0) + count;
        }
      });
      processedData = normalized;
    }

    // Sort by count descending
    const sorted = Object.entries(processedData)
      .sort(([, a], [, b]) => b - a);

    return (
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        {sorted.map(([platform, count]) => {
          let Icon = ExternalLink;
          let color = "text-gray-500 bg-gray-50";

          const p = platform.toLowerCase();
          if (p.includes('facebook')) { Icon = Facebook; color = "text-blue-600 bg-blue-50"; }
          else if (p.includes('instagram')) { Icon = Instagram; color = "text-pink-600 bg-pink-50"; }
          else if (p.includes('twitter') || p.includes('x')) { Icon = XIcon; color = "text-black bg-gray-100"; }
          else if (p.includes('linkedin')) { Icon = Linkedin; color = "text-blue-700 bg-blue-50"; }
          else if (p.includes('youtube')) { Icon = Video; color = "text-red-600 bg-red-50"; }

          return (
            <div key={platform} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${color}`}>
              <Icon className="h-3 w-3" />
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlatformTooltip = (platformData: Record<string, number> | undefined, defaultText: string) => {
    if (!platformData || Object.keys(platformData).length === 0) {
      return <p>{defaultText}</p>;
    }

    // Sort by count descending
    const sorted = Object.entries(platformData)
      .sort(([, a], [, b]) => b - a);

    return (
      <div className="space-y-1">
        <p className="font-semibold text-xs text-gray-400 mb-1 uppercase tracking-wider">Platform Breakdown</p>
        {sorted.map(([platform, count]) => (
          <div key={platform} className="flex items-center justify-between text-sm gap-4 min-w-[120px]">
            <span className="capitalize">{platform.replace('_', ' ')}:</span>
            <span className="font-mono font-medium">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10">

        {/* --- WORKFLOW ENGINES (Dashboard 3.0) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Recipe Content Engine */}
          {/* Recipe Content Engine (High Fidelity) */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-gradient-to-br from-[#E0F2E9] via-[#F0FDF4] to-[#E6FFFA] shadow-xl transition-all hover:shadow-2xl group min-h-[500px] flex flex-col">

            {/* Decorative Background Pattern (Leaves) */}
            <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z' fill='%23059669' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize: '120px 120px' }}></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300/10 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 p-8 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-extrabold text-[#1a4731] tracking-tight">Recipe Content Engine</h2>
                <p className="text-[#3f6251] font-medium text-base mt-1">From Source to Social</p>
              </div>
              <Tooltip delayDuration={0}>
                <TooltipTrigger>
                  <div className="h-8 w-8 rounded-full border border-[#b2d8c3] bg-white/50 backdrop-blur-sm flex items-center justify-center text-[#2d5c43] hover:bg-white transition-colors cursor-help shadow-sm">
                    <span className="font-bold text-sm italic">i</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-white/95 backdrop-blur-xl text-slate-800 border-none p-4 shadow-xl max-w-[250px] rounded-2xl">
                  <p className="font-bold mb-2 text-emerald-800">How it Works:</p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Our AI scrapes recipe data, generates optimized content for your blog and social platforms, and automatically schedules posts to save you time.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Flow Visualizer */}
            <div className="relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-8">

              {/* Node 1: Web Scraper */}
              <div className="flex flex-col items-center gap-3">
                <div className="h-24 w-24 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center ring-1 ring-emerald-100/50">
                  <div className="p-3 bg-gradient-to-br from-[#e6f4ea] to-[#d1e7dd] rounded-xl shadow-inner border border-white">
                    <BookOpen className="h-8 w-8 text-[#2e7d58]" />
                  </div>
                </div>
                <span className="font-bold text-[#2d5c43] text-sm">Web Scraper</span>
              </div>

              {/* Arrow */}
              <div className="flex-1 max-w-[60px] h-1.5 bg-gradient-to-r from-emerald-200/50 via-emerald-400 to-emerald-200/50 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-white/50 w-full animate-shimmer-flow"></div>
                <ArrowRight className="absolute -right-2 -top-2.5 h-6 w-6 text-emerald-400 fill-current" />
              </div>

              {/* Node 2: AI Generation (Central) */}
              <div className="relative">
                <div className="w-40 bg-white/30 backdrop-blur-xl border border-white/70 rounded-3xl p-4 shadow-xl ring-1 ring-emerald-50">
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#34d399] to-[#10b981] shadow-lg flex items-center justify-center text-white ring-4 ring-white/40">
                      <Sparkles className="h-6 w-6 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center mb-3">
                    <span className="font-bold text-[#1a4731] text-sm block">AI Generation</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="bg-white/60 rounded-full px-2 py-1 text-[10px] font-semibold text-[#2d5c43] text-center shadow-sm">Recipe Details</div>
                    <div className="flex gap-1 justify-center">
                      <span className="bg-white/60 rounded-full px-2 py-1 text-[10px] font-semibold text-[#2d5c43] shadow-sm">Blog Post</span>
                      <span className="bg-white/60 rounded-full px-2 py-1 text-[10px] font-semibold text-[#2d5c43] shadow-sm">Tags</span>
                    </div>
                    <div className="h-1.5 w-full bg-emerald-900/10 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 w-2/3 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-1 max-w-[60px] h-1.5 bg-gradient-to-r from-emerald-200/50 via-emerald-400 to-emerald-200/50 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-white/50 w-full animate-shimmer-flow"></div>
                <ArrowRight className="absolute -right-2 -top-2.5 h-6 w-6 text-emerald-400 fill-current" />
              </div>

              {/* Node 3: Social Output */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {/* Stacked Cards Effect */}
                  <div className="absolute top-0 left-0 w-20 h-24 bg-white/20 rounded-xl transform -rotate-6 scale-90 border border-white/40"></div>
                  <div className="absolute top-0 right-0 w-20 h-24 bg-white/40 rounded-xl transform rotate-3 scale-95 border border-white/40"></div>
                  <div className="relative w-20 h-24 bg-gradient-to-b from-white/60 to-white/30 backdrop-blur-md rounded-xl border border-white/60 shadow-lg flex items-center justify-center">
                    <div className="w-full px-2 text-center">
                      <div className="h-1.5 w-12 bg-emerald-800/10 rounded-full mx-auto mb-1"></div>
                      <div className="h-1.5 w-8 bg-emerald-800/10 rounded-full mx-auto"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center mt-1">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 shadow-sm flex items-center justify-center text-white"><Instagram className="h-3 w-3" /></div>
                  <div className="h-6 w-6 rounded-lg bg-[#1877F2] shadow-sm flex items-center justify-center text-white"><Facebook className="h-3 w-3" /></div>
                  <div className="h-6 w-6 rounded-lg bg-[#E60023] shadow-sm flex items-center justify-center text-white"><span className="font-bold text-[10px]">P</span></div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar (Neon Glow) */}
            <div className="p-6 mt-auto relative z-20">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6ceeb0] to-[#34d399] p-[1px] shadow-[0_4px_20px_-4px_rgba(52,211,153,0.5)]">
                <div className="bg-gradient-to-r from-[#e6f9f0] to-[#dcfce7] rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#10b981] flex items-center justify-center shadow-lg shadow-emerald-300/50">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#064e3b]">Automated Scheduling</h3>
                      <p className="text-xs text-[#065f46] font-medium opacity-80">{stats.scheduler.is_running ? 'Active & Running' : 'Schedule Paused'}</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/cms/scheduler')} className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl shadow-lg shadow-emerald-200 border-none px-6 font-semibold">
                    Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Repurposing Engine */}
          {/* Video Repurposing Engine (High Fidelity) */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#F0F9FF] shadow-xl transition-all hover:shadow-2xl group min-h-[500px] flex flex-col">

            {/* Decorative Background Pattern (Waves) */}
            <div className="absolute top-1/2 left-0 right-0 h-32 -translate-y-1/2 opacity-10 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #6366f1 10px, #6366f1 11px)` }}></div>
            <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-300/10 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 p-8 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-extrabold text-[#312e81] tracking-tight">Video Repurposing Engine</h2>
                <p className="text-[#4338ca] font-medium text-base mt-1">Long-Form to Short-Form</p>
              </div>
              <Tooltip delayDuration={0}>
                <TooltipTrigger>
                  <div className="h-8 w-8 rounded-full border border-[#c7d2fe] bg-white/50 backdrop-blur-sm flex items-center justify-center text-[#3730a3] hover:bg-white transition-colors cursor-help shadow-sm">
                    <span className="font-bold text-sm italic">i</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-white/95 backdrop-blur-xl text-slate-800 border-none p-4 shadow-xl max-w-[250px] rounded-2xl">
                  <p className="font-bold mb-2 text-indigo-900">How it Works:</p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    The AI analyzes your long-form YouTube videos, automatically identifies key moments, and transforms them into engaging, vertical short videos with captions for social media.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Flow Visualizer */}
            <div className="relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-8">

              {/* Node 1: YouTube */}
              <div className="flex flex-col items-center gap-3">
                <div className="h-24 w-24 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center ring-1 ring-indigo-100/50">
                  <div className="relative h-14 w-14 rounded-xl bg-gradient-to-b from-[#ffffff] to-[#f3f4f6] shadow-md flex items-center justify-center">
                    <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center shadow-inner">
                      <Play className="h-5 w-5 text-white fill-current" />
                    </div>
                  </div>
                </div>
                <span className="font-bold text-[#3730a3] text-sm">YouTube</span>
              </div>

              {/* Arrow */}
              <div className="flex-1 max-w-[60px] h-1.5 bg-gradient-to-r from-indigo-200/50 via-indigo-400 to-indigo-200/50 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-white/50 w-full animate-shimmer-flow"></div>
                <ArrowRight className="absolute -right-2 -top-2.5 h-6 w-6 text-indigo-400 fill-current" />
              </div>

              {/* Node 2: AI Clip Processing (Central) */}
              <div className="relative">
                <div className="w-40 bg-white/30 backdrop-blur-xl border border-white/70 rounded-3xl p-4 shadow-xl ring-1 ring-indigo-50">
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#818cf8] to-[#4f46e5] shadow-lg flex items-center justify-center text-white ring-4 ring-white/40">
                      <Video className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-center mb-3">
                    <span className="font-bold text-[#312e81] text-sm block">AI Clip Processing</span>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-[#4338ca] uppercase">Analyzing Video</div>
                      <div className="h-1 w-full bg-indigo-900/10 rounded-full"><div className="h-full bg-indigo-400 w-full rounded-full"></div></div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-[#4338ca] uppercase">Selecting Highlights</div>
                      <div className="h-1 w-full bg-indigo-900/10 rounded-full"><div className="h-full bg-indigo-400 w-3/4 rounded-full"></div></div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-[#4338ca] uppercase">Adding Captions</div>
                      <div className="h-1 w-full bg-indigo-900/10 rounded-full"><div className="h-full bg-indigo-400 w-1/2 rounded-full"></div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-1 max-w-[60px] h-1.5 bg-gradient-to-r from-indigo-200/50 via-indigo-400 to-indigo-200/50 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-white/50 w-full animate-shimmer-flow"></div>
                <ArrowRight className="absolute -right-2 -top-2.5 h-6 w-6 text-indigo-400 fill-current" />
              </div>

              {/* Node 3: Shorts Output */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {/* Reels Icon Glass Card */}
                  <div className="w-20 h-24 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/20"></div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-md flex items-center justify-center text-white z-10">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center mt-1">
                  <div className="h-6 w-6 rounded-lg bg-black shadow-sm flex items-center justify-center text-white"><span className="text-[8px] font-bold">TikTok</span></div>
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 shadow-sm flex items-center justify-center text-white"><Instagram className="h-3 w-3" /></div>
                </div>
                <span className="font-bold text-[#3730a3] text-sm">Shorts/Reels</span>
              </div>
            </div>

            {/* Bottom Action Bar (Neon Glow) */}
            <div className="p-6 mt-auto relative z-20">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#a5b4fc] to-[#818cf8] p-[1px] shadow-[0_4px_20px_-4px_rgba(129,140,248,0.5)]">
                <div className="bg-gradient-to-r from-[#eef2ff] to-[#e0e7ff] rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#6366f1] flex items-center justify-center shadow-lg shadow-indigo-300/50">
                      <Play className="h-5 w-5 text-white fill-current ml-0.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#312e81]">Create Engaging Shorts</h3>
                      <p className="text-xs text-[#3730a3] font-medium opacity-80">{stats.videoScheduler.running ? 'Watching Channel' : 'Ready to Repurpose'}</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/cms/clips')} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl shadow-lg shadow-indigo-200 border-none px-6 font-semibold">
                    Repurpose
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* --- RECIPE PIPELINE SECTION --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Recipe Pipeline</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Total Library */}
            <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer" onClick={() => navigate('/cms/recipes')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs font-normal bg-gray-50">Total Library</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of recipes in your database</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.recipes.total}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Total Recipes</p>
                </div>
              </CardContent>
            </Card>

            {/* Ready for Review */}
            <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer" onClick={() => navigate('/cms/pending')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-amber-50 group-hover:bg-amber-100 transition-colors">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      {stats.recipes.pending > 0 ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none animate-pulse">Action Needed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-normal bg-gray-50">Pending</Badge>
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Recipes with generated content waiting for your approval</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.recipes.pending}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Ready to Review</p>
                </div>
              </CardContent>
            </Card>

            {/* Published Recipes */}
            <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Live</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Recipes successfully posted to social media</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.recipes.posted}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Published Recipes</p>
                  {renderPlatformBadges(stats.recipes.by_platform, 'recipe')}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* --- VIDEO PIPELINE SECTION --- */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Video className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Video Pipeline</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Total Clips */}
            <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer" onClick={() => navigate('/cms/clips')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                    <Video className="h-6 w-6 text-purple-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs font-normal bg-gray-50">Total Clips</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of video clips generated</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.clips.total_generated}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Total Clips</p>
                </div>
              </CardContent>
            </Card>

            {/* Processing */}
            <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer" onClick={() => navigate('/cms/clips')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                    <Loader2 className={`h-6 w-6 text-yellow-600 ${stats.clips.processing > 0 ? 'animate-spin' : ''}`} />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      {stats.clips.processing > 0 ? (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none animate-pulse">{stats.clips.processing} Processing</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-normal bg-gray-50">Idle</Badge>
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Videos currently being processed by AI</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.clips.processing}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Processing Now</p>
                </div>
              </CardContent>
            </Card>

            {/* Published Clips */}
            <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Live</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Video clips successfully posted to social media</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.clips.total_posted}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Published Clips</p>
                  {renderPlatformBadges(stats.clips.by_platform, 'video')}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Dual Scheduler Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">

          {/* Recipe Scheduler */}
          <div className={`relative overflow-hidden rounded-2xl p-6 border shadow-sm transition-all ${stats.scheduler.is_running ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.scheduler.is_running ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Recipe Auto-Pilot</h3>
                  <p className="text-sm text-muted-foreground">Automatically generates social posts from recipes</p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant={stats.scheduler.is_running ? "default" : "secondary"} className={stats.scheduler.is_running ? "bg-green-600" : ""}>
                    {stats.scheduler.is_running ? "Active" : "Paused"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.scheduler.is_running ? "System is actively creating content" : "System is waiting for you to start it"}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {stats.scheduler.is_running && (
              <div className="flex items-center justify-between mt-4 bg-white/60 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Next Run: <span className="font-mono">{timeUntilNext}</span>
                </p>
              </div>
            )}

            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full bg-white hover:bg-green-50" onClick={() => navigate('/cms/scheduler')}>
                Configure Recipes <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Video Scheduler */}
          <div className={`relative overflow-hidden rounded-2xl p-6 border shadow-sm transition-all ${stats.videoScheduler.running ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.videoScheduler.running ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'}`}>
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Video Auto-Pilot</h3>
                  <p className="text-sm text-muted-foreground">Automatically creates clips from long videos</p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant={stats.videoScheduler.running ? "default" : "secondary"} className={stats.videoScheduler.running ? "bg-purple-600" : ""}>
                    {stats.videoScheduler.running ? "Active" : "Paused"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.videoScheduler.running ? "System is watching for new videos to clip" : "Video automation is currently off"}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {stats.videoScheduler.running && stats.videoScheduler.next_run && (
              <div className="flex items-center justify-between mt-4 bg-white/60 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-sm font-medium text-purple-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Next Run: <span className="font-mono">{stats.videoScheduler.next_run ? formatDistanceToNow(new Date(stats.videoScheduler.next_run)) + ' remaining' : 'Pending'}</span>
                </p>
              </div>
            )}

            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full bg-white hover:bg-purple-50" onClick={() => navigate('/cms/scheduler')}>
                Configure Videos <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>

        </div>

        {/* Detailed Recent Activity - Tabbed View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Recent Recipes & Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="recipes" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-muted-foreground">Latest updates from your content pipeline</p>
                </div>
                <TabsList className="bg-gray-100/80 p-1">
                  <TabsTrigger value="recipes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Recipes</TabsTrigger>
                  <TabsTrigger value="clips" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Video Clips</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="recipes" className="space-y-4 focus-visible:ring-0 mt-0">
                {recentRecipes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-muted-foreground">No recent recipes found.</p>
                  </div>
                ) : (
                  recentRecipes.map((recipe) => {
                    // Determine status display
                    const status = recipe.content_status?.status || 'not_generated';
                    const isGenerated = status === 'generated' || status === 'pending' || status === 'posted';

                    return (
                      <div key={recipe.id} className="group relative flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:bg-gray-50/50">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {recipe.image_url ? (
                            <img src={recipe.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <BookOpen className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate pr-4">{recipe.title}</h3>
                            <Badge variant="outline" className={`border-none ${getStatusColor(status)} capitalize`}>
                              {status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {recipe.date ? format(new Date(recipe.date), 'MMM d, yyyy') : 'No date'}
                            </span>
                            {/* Add more metadata if available */}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isGenerated ? (
                            <Button size="sm" variant="outline" className="bg-white" onClick={() => navigate(`/cms/review?recipe_id=${recipe.id}`)}>
                              Review <ExternalLink className="ml-2 h-3 w-3" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="default" onClick={() => navigate(`/cms/recipes`)}>
                              Generate <Sparkles className="ml-2 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary mt-2" onClick={() => navigate('/cms/recipes')}>
                  View all recipes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </TabsContent>

              <TabsContent value="clips" className="space-y-4 focus-visible:ring-0 mt-0">
                {recentClips.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-muted-foreground">No recent clips found.</p>
                  </div>
                ) : (
                  recentClips.map((clip) => (
                    <div key={clip.projectId} className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:bg-gray-50/50">
                      <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                        <Play className="h-8 w-8 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{clip.projectName || "Untitled Project"}</h3>
                          <Badge variant="outline" className={`border-none ${getStatusColor(clip.status)} capitalize`}>
                            {clip.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {clip.createdAt ? formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true }) : 'recently'}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="bg-white" onClick={() => navigate('/cms/clips')}>
                          Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary mt-2" onClick={() => navigate('/cms/clips')}>
                  View all clips <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Quick Actions & Status (1/3 width) */}
          <div className="space-y-6">

            {/* Quick Actions Card */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  <button onClick={() => navigate('/cms/recipes')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left group">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Generate New Content</p>
                      <p className="text-xs text-muted-foreground">Create posts from your recipes</p>
                    </div>
                  </button>
                  <button onClick={() => navigate('/cms/clips')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left group">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 group-hover:scale-110 transition-transform">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create Video Clips</p>
                      <p className="text-xs text-muted-foreground">Turn long videos into shorts</p>
                    </div>
                  </button>
                  <button onClick={() => navigate('/cms/scheduler')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left group">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600 group-hover:scale-110 transition-transform">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Manage Schedule</p>
                      <p className="text-xs text-muted-foreground">Configure auto-posting times</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* System Health / Info Card */}
            <Card className="bg-slate-900 text-slate-100 border-none shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <RefreshCw className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative z-10">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  System Status
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400">API Connection</span>
                    <span className="text-green-400 font-medium">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400">Recipe Scheduler</span>
                    <span className={stats.scheduler.is_running ? "text-green-400 font-medium" : "text-yellow-400 font-medium"}>
                      {stats.scheduler.is_running ? "Active" : "Idle"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <span className="text-slate-400">Video Scheduler</span>
                    <span className={stats.videoScheduler.running ? "text-purple-400 font-medium" : "text-yellow-400 font-medium"}>
                      {stats.videoScheduler.running ? "Active" : "Idle"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Last Sync</span>
                    <span className="text-slate-200">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <Button size="sm" variant="secondary" className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-slate-200 border-none" onClick={handleRefresh}>
                  <RefreshCw className="h-3 w-3 mr-2" /> Refresh Data
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
