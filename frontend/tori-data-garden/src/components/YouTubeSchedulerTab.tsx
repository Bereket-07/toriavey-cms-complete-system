import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Play, Square, Clock, Zap, Settings2, Youtube, Instagram, Facebook, Video, RefreshCw, Sparkles, AlertCircle, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CMS_BACKEND_URL = import.meta.env.VITE_CMS_BACKEND_URL || "http://127.0.0.1:8000";

interface SchedulerStatus {
    is_running: boolean;
    config?: {
        interval_minutes: number;
        platforms: string[];
        max_videos: number;
        channel_handle: string;
    };
    next_run?: string;
}

export function YouTubeSchedulerTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [intervalMinutes, setIntervalMinutes] = useState(60 * 24); // Default 24 hours
    const [maxVideos, setMaxVideos] = useState(3);
    const [useCron, setUseCron] = useState(false);
    const [cronExpression, setCronExpression] = useState("0 9 * * *"); // Daily at 9 AM
    const [platforms, setPlatforms] = useState({
        instagram_reels: true,
        youtube_shorts: true,
        facebook_reels: true,
    });

    const platformIcons = {
        instagram_reels: { icon: Instagram, color: "text-pink-500", name: "Instagram Reels", bg: "bg-pink-50 border-pink-100" },
        youtube_shorts: { icon: Youtube, color: "text-red-600", name: "YouTube Shorts", bg: "bg-red-50 border-red-100" },
        facebook_reels: { icon: Facebook, color: "text-blue-600", name: "Facebook Reels", bg: "bg-blue-50 border-blue-100" },
    };

    const [timeUntilNext, setTimeUntilNext] = useState<string>("");

    // Fetch Scheduler Status
    const { data: status, isLoading: loading } = useQuery({
        queryKey: ["youtube-scheduler-status"],
        queryFn: async () => {
            const response = await fetch(`${CMS_BACKEND_URL}/api/youtube-scheduler/status`);
            if (!response.ok) throw new Error("Failed to fetch status");
            return response.json();
        },
        refetchInterval: 15000,
        staleTime: 10000,
    });

    const currentStatus: SchedulerStatus = status || { is_running: false };

    // Sync state with fetched config on first load
    useEffect(() => {
        if (currentStatus.config) {
            if (currentStatus.config.interval_minutes) setIntervalMinutes(currentStatus.config.interval_minutes);
            if (currentStatus.config.max_videos) setMaxVideos(currentStatus.config.max_videos);
            if (currentStatus.config.platforms) {
                const newPlatforms = { ...platforms };
                Object.keys(newPlatforms).forEach(k => newPlatforms[k as keyof typeof platforms] = false);
                currentStatus.config.platforms.forEach((p: string) => {
                    if (p in newPlatforms) newPlatforms[p as keyof typeof platforms] = true;
                });
                setPlatforms(newPlatforms);
            }
        }
    }, [currentStatus.config]);

    // Countdown Timer
    useEffect(() => {
        if (currentStatus.next_run) {
            const countdownInterval = window.setInterval(() => {
                const nextRun = new Date(currentStatus.next_run!);
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
            return () => window.clearInterval(countdownInterval);
        } else {
            setTimeUntilNext("");
        }
    }, [currentStatus.next_run]);

    // Mutations
    const startMutation = useMutation({
        mutationFn: async () => {
            const selectedPlatforms = Object.entries(platforms)
                .filter(([_, enabled]) => enabled)
                .map(([platform]) => platform);

            const endpoint = useCron ? "/api/youtube-scheduler/start-cron" : "/api/youtube-scheduler/start";
            const body = useCron ? { cron_expression: cronExpression } : { interval_minutes: intervalMinutes };

            await fetch(`${CMS_BACKEND_URL}${endpoint}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
            await fetch(`${CMS_BACKEND_URL}/api/youtube-scheduler/config`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platforms: selectedPlatforms, max_videos: maxVideos }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["youtube-scheduler-status"] });
            toast({ title: "Started", description: "YouTube monitor active." });
        },
    });

    const stopMutation = useMutation({
        mutationFn: async () => {
            await fetch(`${CMS_BACKEND_URL}/api/youtube-scheduler/stop`, { method: "POST" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["youtube-scheduler-status"] });
            toast({ title: "Stopped", description: "Monitor paused." });
        },
    });

    const runNowMutation = useMutation({
        mutationFn: async () => {
            await fetch(`${CMS_BACKEND_URL}/api/youtube-scheduler/run-now`, { method: "POST" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["youtube-scheduler-status"] });
            toast({ title: "Checking Now", description: "Scanning for new videos..." });
        },
    });

    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>;

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <Card className={`border-none shadow-xl overflow-hidden relative transition-all duration-500 ${currentStatus.is_running
                ? "bg-gradient-to-br from-red-600 to-rose-700 text-white"
                : "bg-white ring-1 ring-gray-200"
                }`}>
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm ${currentStatus.is_running ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                                <Youtube className={`h-10 w-10 ${currentStatus.is_running ? "animate-pulse" : ""}`} />
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold tracking-tight mb-1 ${currentStatus.is_running ? "text-white" : "text-gray-900"}`}>
                                    {currentStatus.is_running ? "Monitor Active" : "Monitor Paused"}
                                </h3>
                                {currentStatus.is_running ? (
                                    <div className="flex items-center gap-2 text-red-50">
                                        <Badge variant="outline" className="border-red-200/30 text-white bg-red-500/20">Next Check</Badge>
                                        <span className="font-mono text-xl font-bold">{timeUntilNext}</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Not checking for new videos. Start to enable.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {currentStatus.is_running ? (
                                <Button
                                    onClick={() => stopMutation.mutate()}
                                    disabled={stopMutation.isPending}
                                    variant="secondary"
                                    className="h-12 px-6 text-red-600 bg-white hover:bg-red-50 font-semibold shadow-lg border border-red-100"
                                >
                                    {stopMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5 fill-current" />}
                                    Stop Monitor
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => startMutation.mutate()}
                                    disabled={startMutation.isPending}
                                    className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg hover:shadow-red-500/25 transition-all"
                                >
                                    {startMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                                    Start Monitor
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <Card className="lg:col-span-2 border-none shadow-lg bg-white/80 backdrop-blur-xl ring-1 ring-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Settings2 className="h-5 w-5 text-gray-500" />
                            Monitor Settings
                        </CardTitle>
                        <CardDescription>Configure how we check your YouTube channel (@ToriAvey).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Time & Batch Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    Check Interval
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={intervalMinutes}
                                        onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                                        className="h-11 bg-white"
                                        disabled={useCron}
                                        min={15}
                                    />
                                    <span className="absolute right-3 top-3 text-sm text-gray-400 font-medium">min</span>
                                </div>
                                <p className="text-xs text-muted-foreground">How often to scan for new uploads.</p>
                            </div>

                            <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <Film className="w-4 h-4 text-red-500" />
                                    Process Limit
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={maxVideos}
                                        onChange={(e) => setMaxVideos(Number(e.target.value))}
                                        className="h-11 bg-white"
                                        min={1} max={10}
                                    />
                                    <span className="absolute right-3 top-3 text-sm text-gray-400 font-medium">videos</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Max new videos to process per run.</p>
                            </div>
                        </div>

                        {/* Platforms */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold text-gray-900">Output Formats</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Object.entries(platforms).map(([platform, enabled]) => {
                                    const info = platformIcons[platform as keyof typeof platformIcons];
                                    if (!info) return null;
                                    const Icon = info.icon;

                                    return (
                                        <div
                                            key={platform}
                                            onClick={() => setPlatforms({ ...platforms, [platform as keyof typeof platforms]: !enabled })}
                                            className={`
                                                relative cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                                                ${enabled ? `${info.bg} ring-1 ring-inset ring-black/5` : "bg-transparent border-gray-200 opacity-60 hover:opacity-100 hover:bg-gray-50"}
                                            `}
                                        >
                                            <div className={`p-2 rounded-lg bg-white shadow-sm ring-1 ring-black/5`}>
                                                <Icon className={`w-4 h-4 ${info.color}`} />
                                            </div>
                                            <span className="font-medium text-sm text-gray-700 capitalize">{info.name}</span>
                                            <div className="absolute top-3 right-3">
                                                <Switch checked={enabled} className="scale-75 data-[state=checked]:bg-green-500" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Panel */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-white ring-1 ring-gray-100 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Manual Override
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                onClick={() => runNowMutation.mutate()}
                                disabled={runNowMutation.isPending}
                                className="w-full h-12 bg-white border-2 border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900 shadow-sm transition-all"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${runNowMutation.isPending ? "animate-spin" : ""}`} />
                                {runNowMutation.isPending ? "Checking..." : "Force Check Now"}
                            </Button>

                            {runNowMutation.isPending && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-400 blur-lg opacity-20 animate-pulse" />
                                        <Sparkles className="w-6 h-6 text-blue-500 relative z-10" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-blue-900">Scanning Channel...</p>
                                        <p className="text-xs text-blue-700">Looking for new videos</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Useful if you just uploaded a video and want to process it immediately without waiting for the timer.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
