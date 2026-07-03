import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Play, Square, Clock, Zap, Settings2, Calendar, Instagram, Twitter, Facebook, RefreshCw, Video, Pin, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "@/components/icons/XIcon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CMS_BACKEND_URL = import.meta.env.VITE_CMS_BACKEND_URL || "http://127.0.0.1:8000";

interface SchedulerStatus {
    is_running: boolean;
    interval_minutes?: number;
    batch_size?: number;
    next_run?: string;
    last_run?: string;
}

export function WPRMSchedulerTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [intervalMinutes, setIntervalMinutes] = useState(60);
    const [batchSize, setBatchSize] = useState(10);
    const [useCron, setUseCron] = useState(false);
    const [cronExpression, setCronExpression] = useState("0 9 * * *");
    const [platforms, setPlatforms] = useState({
        instagram: true,
        twitter: true,
        facebook: true,
        tiktok: true,
        pinterest: true,
    });

    const platformIcons = {
        instagram: { icon: Instagram, color: "text-pink-500", name: "Instagram", bg: "bg-pink-50 border-pink-100" },
        twitter: { icon: XIcon, color: "text-black", name: "X", bg: "bg-gray-50 border-gray-200" },
        facebook: { icon: Facebook, color: "text-blue-600", name: "Facebook", bg: "bg-blue-50 border-blue-100" },
        tiktok: { icon: Video, color: "text-black", name: "TikTok", bg: "bg-gray-50 border-gray-200" },
        pinterest: { icon: Pin, color: "text-red-600", name: "Pinterest", bg: "bg-red-50 border-red-100" },
    };
    const [timeUntilNext, setTimeUntilNext] = useState<string>("");

    // Fetch Scheduler Status
    const { data: status, isLoading: loading } = useQuery({
        queryKey: ["wprm-scheduler-status"],
        queryFn: async () => {
            const response = await fetch(`${CMS_BACKEND_URL}/api/wprm-scheduler/status`);
            if (!response.ok) throw new Error("Failed to fetch status");
            return response.json();
        },
        refetchInterval: 15000,
        staleTime: 10000,
    });

    const currentStatus: SchedulerStatus = status || { is_running: false };

    // Countdown Timer logic (same as before)
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

    // Mutations (Keep existing logic, updating styles in render)
    const startMutation = useMutation({
        mutationFn: async () => {
            const selectedPlatforms = Object.entries(platforms)
                .filter(([_, enabled]) => enabled)
                .map(([platform]) => platform);

            const endpoint = useCron ? "/api/wprm-scheduler/start-cron" : "/api/wprm-scheduler/start";
            const body = useCron
                ? { cron_expression: cronExpression, recipes_per_run: batchSize }
                : { interval_minutes: intervalMinutes, recipes_per_run: batchSize };

            await fetch(`${CMS_BACKEND_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            await fetch(`${CMS_BACKEND_URL}/api/wprm-scheduler/config`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platforms: selectedPlatforms }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wprm-scheduler-status"] });
            toast({ title: "Scheduler Started", description: "Automation is now active." });
        },
    });

    const stopMutation = useMutation({
        mutationFn: async () => {
            await fetch(`${CMS_BACKEND_URL}/api/wprm-scheduler/stop`, { method: "POST" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wprm-scheduler-status"] });
            toast({ title: "Stopped", description: "Automation paused." });
        },
    });

    const runNowMutation = useMutation({
        mutationFn: async () => {
            await fetch(`${CMS_BACKEND_URL}/api/wprm-scheduler/run-now`, { method: "POST" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wprm-scheduler-status"] });
            toast({ title: "Running Now", description: "Started a manual generation batch." });
        },
    });

    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <Card className={`border-none shadow-xl overflow-hidden relative transition-all duration-500 ${currentStatus.is_running
                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                : "bg-white ring-1 ring-gray-200"
                }`}>
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm ${currentStatus.is_running ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                                <Clock className={`h-10 w-10 ${currentStatus.is_running ? "animate-pulse" : ""}`} />
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold tracking-tight mb-1 ${currentStatus.is_running ? "text-white" : "text-gray-900"}`}>
                                    {currentStatus.is_running ? "Automation Active" : "Scheduler Paused"}
                                </h3>
                                {currentStatus.is_running ? (
                                    <div className="flex items-center gap-2 text-green-50">
                                        <Badge variant="outline" className="border-green-200/30 text-white bg-green-500/20">Next Run</Badge>
                                        <span className="font-mono text-xl font-bold">{timeUntilNext}</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">System is idle. Start the scheduler to begin processing.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {/* Start/Stop Button */}
                            {currentStatus.is_running ? (
                                <Button
                                    onClick={() => stopMutation.mutate()}
                                    disabled={stopMutation.isPending}
                                    variant="secondary"
                                    className="h-12 px-6 text-red-600 bg-white hover:bg-red-50 font-semibold shadow-lg border border-red-100"
                                >
                                    {stopMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5 fill-current" />}
                                    Stop Automation
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => startMutation.mutate()}
                                    disabled={startMutation.isPending}
                                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-blue-500/25 transition-all"
                                >
                                    {startMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                                    Start Automation
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
                            Run Configuration
                        </CardTitle>
                        <CardDescription>Define how frequently the scheduler runs and how much content it processes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Time & Batch Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    Run Interval
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={intervalMinutes}
                                        onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                                        className="h-11 bg-white"
                                        disabled={useCron}
                                    />
                                    <span className="absolute right-3 top-3 text-sm text-gray-400 font-medium">min</span>
                                </div>
                                <p className="text-xs text-muted-foreground">How many minutes to wait between runs.</p>
                            </div>

                            <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    Batch Size
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={batchSize}
                                        onChange={(e) => setBatchSize(Number(e.target.value))}
                                        className="h-11 bg-white"
                                    />
                                    <span className="absolute right-3 top-3 text-sm text-gray-400 font-medium">recipes</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Recipes to process per run (Max: 50).</p>
                            </div>
                        </div>

                        {/* Platforms */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold text-gray-900">Distribution Channels</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Object.entries(platforms).map(([platform, enabled]) => {
                                    const info = platformIcons[platform as keyof typeof platformIcons];
                                    if (!info) return null;
                                    const Icon = info.icon;

                                    return (
                                        <div
                                            key={platform}
                                            onClick={() => setPlatforms({ ...platforms, [platform]: !enabled })}
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
                                {runNowMutation.isPending ? "Generating..." : "Run Once Now"}
                            </Button>

                            {runNowMutation.isPending && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-400 blur-lg opacity-20 animate-pulse" />
                                        <Sparkles className="w-6 h-6 text-blue-500 relative z-10" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-blue-900">Processing...</p>
                                        <p className="text-xs text-blue-700">AI is generating content</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Manual runs function independently of the scheduler. Use this to test your configuration immediately.
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
