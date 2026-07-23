import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Video,
  Youtube,
  ExternalLink,
  Download,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  RefreshCcw,
  Sparkles,
  Trash2,
  Filter,
  Info,
  Play,
  AlertCircle,
  Pause,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHero } from "@/components/studio";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CMS_BACKEND_URL =
  import.meta.env.VITE_CMS_BACKEND_URL || "http://127.0.0.1:8000";

interface VideoClip {
  id: string; // Database ID
  projectId?: string; // Vizard Project ID
  video_url: string;
  clip_url?: string;
  thumbnail_url?: string;
  platform: string;
  status: string; // "processing", "completed", "failed", "posted"
  duration?: number;
  created_at: string;
  message?: string;
  generated_clips?: any[];
}

// Inline Video Player Component
const InlinePlayer = ({
  url,
  poster,
  title,
}: {
  url: string;
  poster?: string;
  title?: string;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative aspect-[9/16] bg-black group overflow-hidden">
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        loop
        onClick={togglePlay}
        onEnded={() => setIsPlaying(false)}
        controls={isPlaying}
      />

      {!isPlaying && (
        <div
          className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer transition-all hover:bg-black/30"
          onClick={togglePlay}
        >
          <div className="p-4 bg-card/20 backdrop-blur-md rounded-full text-white shadow-lg transform transition-transform group-hover:scale-110 border border-white/30">
            <Play className="h-8 w-8 fill-current ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default function VideoClips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "youtube_shorts",
  ]);
  const [activeTab, setActiveTab] = useState("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [authDialog, setAuthDialog] = useState<{
    isOpen: boolean;
    platform: string;
    authUrl: string;
    clipId: string;
    videoUrl?: string;
    coverUrl?: string;
    caption?: string;
    index?: number;
  }>({
    isOpen: false,
    platform: "",
    authUrl: "",
    clipId: "",
  });

  const platforms = [
    {
      id: "youtube_shorts",
      name: "YouTube Shorts",
      icon: Youtube,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    },
    {
      id: "instagram_reels",
      name: "Instagram Reels",
      icon: Instagram,
      color: "text-pink-600",
      bg: "bg-pink-50 border-pink-200",
    },
    {
      id: "facebook_reels",
      name: "Facebook Reels",
      icon: Facebook,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
    },
  ];

  // Fetch existing clips with caching and auto-refresh
  const {
    data: clips = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<VideoClip[]>({
    queryKey: ["clips"],
    queryFn: () => apiGet("/api/clips/list"),
    refetchInterval: 30000,
    staleTime: 60000,
  });

  // Generate Clips Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      let sourceType = "youtube";
      if (videoUrl.includes("tiktok.com")) sourceType = "tiktok";
      else if (videoUrl.includes("vimeo.com")) sourceType = "vimeo";
      else if (videoUrl.includes("facebook.com")) sourceType = "facebook";

      return apiPost("/api/clips/generate", {
        video_url: videoUrl,
        source_type: sourceType,
        target_platforms: selectedPlatforms,
        language: "en",
      });
    },
    onSuccess: () => {
      toast({
        title: "🚀 Generation Started!",
        description: `Magic is happening! Generating clips for ${selectedPlatforms.length} platforms.`,
      });
      setVideoUrl("");
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate clips: " + error,
        variant: "destructive",
      });
    },
  });

  // Delete Project Mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      setIsDeleting(projectId);
      return apiDelete(`/api/clips/project/${projectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Project and clips removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: "Failed to delete: " + err,
        variant: "destructive",
      });
    },
    onSettled: () => setIsDeleting(null),
  });

  const handlePostClip = async (
    clipId: string,
    platform: string,
    videoUrl: string,
    coverUrl?: string,
    caption?: string,
    index?: number,
  ) => {
    if (!clipId) return;
    const btnId =
      index !== undefined
        ? `post-btn-${clipId}-${index}`
        : `post-btn-${clipId}`;
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.innerText = "Posting...";
      btn.setAttribute("disabled", "true");
    }

    try {
      const result = await apiPost<any>("/api/clips/post", {
        clip_id: clipId,
        platforms: [platform],
        clip_url: videoUrl,
        cover_url: coverUrl,
        custom_caption: caption || "Check out this reel! #viral #trending",
      });

      if (result.success) {
        toast({
          title: "🎉 Posted!",
          description: "Clip is live on social media!",
        });
        if (btn) {
          btn.innerText = "Posted!";
          btn.classList.replace("bg-secondary", "bg-green-600");
        }
        queryClient.invalidateQueries({ queryKey: ["clips"] });
      } else {
        if (result.auth_url) {
          setAuthDialog({
            isOpen: true,
            platform: platform,
            authUrl: result.auth_url,
            clipId: clipId,
            videoUrl: videoUrl,
            coverUrl: coverUrl,
            caption: caption,
            index: index,
          });
          if (btn) {
            btn.innerText = "Post";
            btn.removeAttribute("disabled");
          }
        } else {
          throw new Error(result.error || "Unknown error");
        }
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to post: " + e,
        variant: "destructive",
      });
      if (btn) {
        btn.innerText = "Post";
        btn.removeAttribute("disabled");
      }
    }
  };

  const filteredClips = clips.filter((clip) => {
    if (activeTab === "all") return true;
    if (activeTab === "processing") return clip.status === "processing";
    if (activeTab === "completed")
      return clip.status === "completed" || clip.status === "posted";
    if (activeTab === "failed") return clip.status === "failed";
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <PageHero
        eyebrow="Media"
        title="Viral Clips Studio"
        subtitle="Transform long-form videos into engaging shorts automatically with AI. Manage, review, and post to your channels."
        icon={Video}
        actions={
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* Generator Section */}
      <Card className="rounded-2xl border border-border bg-card overflow-hidden relative group z-10 shadow-[var(--shadow-sm)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#B85C3C]/5 to-[#B85C3C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-[#7C3AED]" />
            Generate New Content
          </CardTitle>
          <CardDescription className="text-base">
            Paste a YouTube or video URL below. Our AI will identify the best
            moments and create vertical clips.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Video className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                placeholder="Paste Video URL here (YouTube, TikTok, etc.)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="h-14 pl-10 text-lg bg-muted/40 border-border focus:bg-card transition-all shadow-sm"
              />
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !videoUrl.trim()}
              className="h-14 px-8 bg-gradient-to-r from-[#7C3AED] to-[#7C3AED] hover:from-[#6D28D9] hover:to-[#6D28D9] text-lg font-semibold shadow-lg hover:shadow-md transition-all"
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Generate Magic
            </Button>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Target Platforms
            </span>
            <div className="flex flex-wrap gap-3">
              {platforms.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                const Icon = p.icon;
                return (
                  <div
                    key={p.id}
                    onClick={() =>
                      setSelectedPlatforms((prev) =>
                        prev.includes(p.id)
                          ? prev.filter((x) => x !== p.id)
                          : [...prev, p.id],
                      )
                    }
                    className={`
                            cursor-pointer group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 select-none
                            ${
                              isSelected
                                ? `${p.bg} border-transparent ring-2 ring-offset-2 ring-offset-white ring-${p.color.split("-")[1]}-400 shadow-sm`
                                : "bg-card border-border hover:border-border hover:bg-muted/40 text-muted-foreground grayscale hover:grayscale-0"
                            }
                        `}
                  >
                    <Icon
                      className={`h-5 w-5 ${isSelected ? p.color : "text-current"}`}
                    />
                    <span
                      className={`font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Gallery */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/80 p-1 h-12 rounded-xl">
            <TabsTrigger
              value="all"
              className="rounded-lg h-10 px-6 transition-colors data-[state=inactive]:hover:bg-[#7C3AED]/10 data-[state=inactive]:hover:text-[#7C3AED] data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              All Projects
            </TabsTrigger>
            <TabsTrigger
              value="processing"
              className="rounded-lg h-10 px-6 transition-colors data-[state=inactive]:hover:bg-[#7C3AED]/10 data-[state=inactive]:hover:text-[#7C3AED] data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Processing
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-lg h-10 px-6 transition-colors data-[state=inactive]:hover:bg-[#7C3AED]/10 data-[state=inactive]:hover:text-[#7C3AED] data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="failed"
              className="rounded-lg h-10 px-6 transition-colors data-[state=inactive]:hover:bg-[#7C3AED]/10 data-[state=inactive]:hover:text-[#7C3AED] data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Failed
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border">
            <Filter className="h-4 w-4" />
            <span>Showing {filteredClips.length} projects</span>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin h-12 w-12 text-[#7C3AED]/30" />
              <p className="text-muted-foreground animate-pulse">
                Loading your studio...
              </p>
            </div>
          ) : filteredClips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/40 border-2 border-dashed border-border rounded-3xl">
              <Video className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-medium text-foreground">
                No clips found
              </h3>
              <p className="text-muted-foreground">
                Generate your first batch of clips above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              <AnimatePresence>
                {filteredClips.map((clip) => (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                      <CardHeader className="bg-gradient-to-r from-muted/40 to-white border-b px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-card rounded-lg shadow-sm border">
                              {clip.platform.includes("youtube") ? (
                                <Youtube className="h-5 w-5 text-red-600" />
                              ) : clip.platform.includes("instagram") ? (
                                <Instagram className="h-5 w-5 text-pink-600" />
                              ) : clip.platform.includes("facebook") ? (
                                <Facebook className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Video className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                  Project #{clip.projectId}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal text-muted-foreground"
                                >
                                  {new Date(
                                    clip.created_at,
                                  ).toLocaleDateString()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                                {clip.video_url}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`${
                                clip.status === "completed" ||
                                clip.status === "posted"
                                  ? "bg-[#16A34A] text-white border-transparent"
                                  : clip.status === "processing"
                                    ? "bg-[#2563EB] text-white border-transparent animate-pulse"
                                    : "bg-[#DC2626] text-white border-transparent"
                              } px-3 py-1 text-xs uppercase tracking-wide`}
                            >
                              {clip.status === "processing" ? (
                                <span className="flex items-center gap-1.5">
                                  <Loader2 className="h-3 w-3 animate-spin" />{" "}
                                  Processing
                                </span>
                              ) : (
                                clip.status
                              )}
                            </Badge>

                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Delete Project
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Project?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove this project
                                    and all {clip.generated_clips?.length || 0}{" "}
                                    generated clips. This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      clip.projectId &&
                                      deleteMutation.mutate(clip.projectId)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {isDeleting === clip.projectId ? (
                                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {/* Clips Grid */}
                        {clip.generated_clips &&
                        clip.generated_clips.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {clip.generated_clips.map(
                              (video: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                                >
                                  <InlinePlayer
                                    url={video.videoUrl}
                                    poster={video.coverUrl}
                                    title={video.title}
                                  />
                                  <div className="p-4 flex flex-col flex-1 gap-3">
                                    <h4
                                      className="text-sm font-semibold text-foreground line-clamp-2 leading-snug"
                                      title={video.title}
                                    >
                                      {video.title || `Viral Clip #${idx + 1}`}
                                    </h4>
                                    <div className="mt-auto grid grid-cols-2 gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs"
                                        asChild
                                      >
                                        <a
                                          href={video.videoUrl}
                                          download
                                          target="_blank"
                                        >
                                          <Download className="h-3 w-3 mr-1.5" />{" "}
                                          Save
                                        </a>
                                      </Button>
                                      {clip.platform !== "tiktok" && (
                                        <Button
                                          size="sm"
                                          className={`h-9 text-xs transition-colors ${video.status === "posted" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-secondary hover:bg-secondary-hover text-secondary-foreground"}`}
                                          disabled={video.status === "posted"}
                                          id={`post-btn-${video.videoId}-${idx}`}
                                          onClick={() =>
                                            handlePostClip(
                                              video.videoId || "0",
                                              clip.platform,
                                              video.videoUrl,
                                              video.coverUrl,
                                              video.title,
                                              idx,
                                            )
                                          }
                                        >
                                          <Share2 className="w-3 h-3 mr-1.5" />
                                          {video.status === "posted"
                                            ? "Posted"
                                            : "Post"}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            {clip.status === "processing" ? (
                              <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-[#B85C3C] blur-xl opacity-20 animate-pulse" />
                                  <Loader2 className="animate-spin h-10 w-10 text-[#7C3AED] relative z-10" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground">
                                    AI is analyzing your video
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    This usually takes 2-5 minutes. We'll update
                                    automatically.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <AlertCircle className="h-8 w-8 text-red-400" />
                                <p className="text-muted-foreground">
                                  {clip.message || "Failed to generate clips."}
                                </p>
                              </div>
                            )}
                            {clip.projectId && (
                              <Button
                                variant="link"
                                size="sm"
                                className="mt-4 text-[#7C3AED]"
                                asChild
                              >
                                <a
                                  href={`https://vizard.ai/workspace/project/${clip.projectId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" /> View
                                  in Producer Settings
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Authentication Dialog */}
      <AlertDialog
        open={authDialog.isOpen}
        onOpenChange={(open) =>
          !open && setAuthDialog((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect {authDialog.platform}</AlertDialogTitle>
            <AlertDialogDescription>
              We need your permission to post to {authDialog.platform}. A popup
              will open to authorize this app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setAuthDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="default"
              onClick={() => window.open(authDialog.authUrl, "_blank")}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              Connect Account
            </Button>
            <AlertDialogAction
              onClick={() => {
                setAuthDialog((prev) => ({ ...prev, isOpen: false }));
                if (authDialog.videoUrl)
                  handlePostClip(
                    authDialog.clipId,
                    authDialog.platform,
                    authDialog.videoUrl,
                    authDialog.coverUrl,
                    authDialog.caption,
                    authDialog.index,
                  );
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              I've Connected, Retry Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
