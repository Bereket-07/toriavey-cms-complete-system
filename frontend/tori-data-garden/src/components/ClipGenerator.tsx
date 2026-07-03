import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, Youtube, Instagram, Facebook, Linkedin, Twitter, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CMS_BACKEND_URL = import.meta.env.VITE_CMS_BACKEND_URL || "http://127.0.0.1:8000";

interface ClipGeneratorProps { }

export function ClipGenerator({ }: ClipGeneratorProps) {
    const [videoUrl, setVideoUrl] = useState('');
    const [platform, setPlatform] = useState('youtube');
    const [projectId, setProjectId] = useState<string | null>(null);

    const generateMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${CMS_BACKEND_URL}/api/clips/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_url: videoUrl,
                    platform: platform,
                    lang: 'en',
                    max_clips: 5
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to generate clips');
            }

            return response.json();
        },
        onSuccess: (data) => {
            const pid = data.data?.projectId || data.projectId;
            if (pid) {
                setProjectId(pid);
            }
        }
    });

    const { data: projectData, isLoading: isPolling } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            const response = await fetch(`${CMS_BACKEND_URL}/api/clips/project/${projectId}`);
            if (!response.ok) throw new Error('Failed to fetch project status');
            return response.json();
        },
        enabled: !!projectId,
        refetchInterval: (query) => {
            const data = query.state.data;
            // Stop polling if success (2000) or failed (not 1000)
            if (data && data.code === 2000) return false;
            if (data && data.code && data.code !== 1000) return false;
            return 5000;
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl) return;
        setProjectId(null);
        generateMutation.mutate();
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-6 w-6 text-blue-600" />
                    AI Clip Generator
                </CardTitle>
                <CardDescription>
                    Turn long videos into viral shorts for TikTok, Reels, and Shorts using Vizard AI.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="video-url">Video URL</Label>
                        <Input
                            id="video-url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            disabled={generateMutation.isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="platform">Target Platform</Label>
                        <Select value={platform} onValueChange={setPlatform} disabled={generateMutation.isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="youtube">
                                    <div className="flex items-center gap-2">
                                        <Youtube className="h-4 w-4 text-red-600" /> YouTube Shorts
                                    </div>
                                </SelectItem>
                                <SelectItem value="instagram">
                                    <div className="flex items-center gap-2">
                                        <Instagram className="h-4 w-4 text-pink-600" /> Instagram Reels
                                    </div>
                                </SelectItem>
                                <SelectItem value="tiktok">
                                    <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4 text-black" /> TikTok
                                    </div>
                                </SelectItem>
                                <SelectItem value="facebook">
                                    <div className="flex items-center gap-2">
                                        <Facebook className="h-4 w-4 text-blue-600" /> Facebook Reels
                                    </div>
                                </SelectItem>
                                <SelectItem value="linkedin">
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn
                                    </div>
                                </SelectItem>
                                <SelectItem value="twitter">
                                    <div className="flex items-center gap-2">
                                        <Twitter className="h-4 w-4 text-sky-500" /> Twitter/X
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={generateMutation.isPending || !videoUrl}>
                        {generateMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Project...
                            </>
                        ) : (
                            'Generate Clips'
                        )}
                    </Button>
                </form>

                {generateMutation.isError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{generateMutation.error.message}</AlertDescription>
                    </Alert>
                )}

                {projectId && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Project Created!
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Project ID: <span className="font-mono bg-white px-1 py-0.5 rounded border">{projectId}</span>
                        </p>

                        {projectData ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant={projectData.code === 2000 ? "default" : "secondary"}>
                                        {projectData.code === 2000 ? "Completed" : (projectData.code === 1000 ? "Processing..." : "Failed")}
                                    </Badge>
                                    {projectData.code === 1000 && <Loader2 className="h-3 w-3 animate-spin" />}
                                </div>

                                {projectData.code === 2000 && projectData.data?.videos && (
                                    <div className="grid gap-4">
                                        {projectData.data.videos.map((video: any, index: number) => (
                                            <div key={video.videoId || index} className="bg-white p-3 rounded border shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-sm line-clamp-2">{video.title || `Clip #${index + 1}`}</h4>
                                                    <Badge variant="outline">{video.videoMsDuration ? `${Math.round(video.videoMsDuration / 1000)}s` : 'N/A'}</Badge>
                                                </div>
                                                {video.videoUrl && (
                                                    <video
                                                        src={video.videoUrl}
                                                        controls
                                                        className="w-full rounded bg-black aspect-[9/16] max-h-64 object-contain"
                                                        poster={video.coverUrl}
                                                    />
                                                )}
                                                <div className="mt-2 flex justify-end">
                                                    <Button size="sm" variant="outline" asChild>
                                                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" download>
                                                            Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground mt-2">
                                    * Check Vizard dashboard for full results if clips are not listed here yet.
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Fetching project status...
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
