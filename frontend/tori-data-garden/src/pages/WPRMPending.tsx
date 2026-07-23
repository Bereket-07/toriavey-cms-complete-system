import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Send,
  Instagram,
  Facebook,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Pin,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SocialMediaPreview } from "@/components/social/SocialMediaPreview";
import { motion, AnimatePresence } from "framer-motion";

import { XIcon } from "@/components/icons/XIcon";
import { apiGet, apiPost } from "@/lib/api";
import { PageHero } from "@/components/studio";

const CMS_BACKEND_URL =
  import.meta.env.VITE_CMS_BACKEND_URL || "http://127.0.0.1:8000";

interface PendingContent {
  recipe_id: number;
  recipe_name: string;
  post_title: string;
  image_url?: string;
  pinterest_image_url?: string;
  generated_content: {
    [platform: string]: {
      caption?: string;
      post?: string;
      tweet?: string;
      description?: string;
      title?: string;
      hashtags?: string[];
      keywords?: string[];
    };
  };
  status: string;
  approved_at: string;
  posted_platforms?: string[];
  content_status?: {
    updated_at?: string;
  };
}

export default function WPRMPending() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Record<number, string>
  >({});
  const [postingStates, setPostingStates] = useState<Record<string, boolean>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlatformFilter, setActivePlatformFilter] =
    useState<string>("all");

  const platforms = {
    instagram: {
      icon: Instagram,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      hoverColor: "hover:bg-pink-100",
      name: "Instagram",
    },
    twitter: {
      icon: XIcon,
      color: "text-black",
      bgColor: "bg-muted/40",
      hoverColor: "hover:bg-muted",
      name: "X",
    },
    facebook: {
      icon: Facebook,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      name: "Facebook",
    },
    tiktok: {
      icon: Video,
      color: "text-black",
      bgColor: "bg-zinc-50",
      hoverColor: "hover:bg-zinc-100",
      name: "TikTok",
    },
    pinterest: {
      icon: Pin,
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverColor: "hover:bg-red-100",
      name: "Pinterest",
    },
  };

  const [authDialog, setAuthDialog] = useState<{
    isOpen: boolean;
    platform: string;
    authUrl: string;
    recipeId: number;
  }>({
    isOpen: false,
    platform: "",
    authUrl: "",
    recipeId: 0,
  });

  // Fetch function for React Query
  const fetchPendingData = () => {
    return apiGet("/api/content/wprm-recipes-pending?limit=50");
  };

  // Use React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["wprm-pending"],
    queryFn: fetchPendingData,
    staleTime: 5 * 60 * 1000,
  });

  // Process data
  const rawContent: PendingContent[] = (data?.recipes || []).map(
    (recipe: any) => ({
      ...recipe,
      recipe_id: recipe.id || recipe.recipe_id,
      recipe_name: recipe.title || recipe.recipe_name,
      posted_platforms: recipe.posted_platforms || [],
      approved_at: recipe.content_status?.updated_at || recipe.approved_at,
    }),
  );

  // Filter Content
  const content = rawContent.filter((item) => {
    // Search Filter
    const matchesSearch = item.recipe_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Platform Filter
    const matchesPlatform =
      activePlatformFilter === "all"
        ? true
        : item.generated_content &&
          Object.keys(item.generated_content).includes(activePlatformFilter);

    return matchesSearch && matchesPlatform;
  });

  const postContent = async (recipeId: number, platform: string) => {
    const postKey = `${recipeId} -${platform} `;

    try {
      // Set loading state
      setPostingStates((prev) => ({ ...prev, [postKey]: true }));

      toast({
        title: "🚀 Posting content...",
        description: `Sending to ${platform}...`,
      });

      // Get the recipe content
      const recipe = rawContent.find((c) => c.recipe_id === recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }

      // Get platform-specific content
      const platformContent = recipe.generated_content[platform];
      if (!platformContent) {
        throw new Error(`No content generated for ${platform}`);
      }

      // Prepare caption with hashtags
      const caption =
        platformContent.caption ||
        platformContent.post ||
        platformContent.tweet ||
        platformContent.description ||
        "";
      const hashtags =
        platformContent.hashtags || platformContent.keywords || [];
      const fullCaption =
        hashtags.length > 0
          ? `${caption} \n\n${hashtags.map((tag) => `#${tag}`).join(" ")} `
          : caption;

      // Call backend API to post content
      const result = await apiPost("/api/content/post", {
        content_id: recipeId,
        platforms: [platform],
        content_data: {
          caption: fullCaption,
          image_url: recipe.image_url,
          recipe_id: recipeId,
          recipe_name: recipe.recipe_name,
          posted_platforms: recipe.posted_platforms, // Send current posted platforms to backend
        },
      });

      console.log("Post result:", result);

      // Check if posting was successful
      if (result.success && result.posted_platforms?.includes(platform)) {
        toast({
          title: "✅ Posted Successfully!",
          description: `Content is now live on ${platform} `,
        });

        // Optimistically update cache
        queryClient.setQueryData(["wprm-pending"], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            recipes: oldData.recipes.map((c: any) => {
              const cId = c.id || c.recipe_id;
              if (cId === recipeId) {
                const updatedPostedPlatforms = [
                  ...(c.posted_platforms || []),
                  platform,
                ];
                return { ...c, posted_platforms: updatedPostedPlatforms };
              }
              return c;
            }),
          };
        });

        // Invalidate to refresh data properly
        queryClient.invalidateQueries({ queryKey: ["wprm-pending"] });
        queryClient.invalidateQueries({ queryKey: ["wprm-recipes"] });
      } else if (result.failed_platforms?.length > 0) {
        // Case-insensitive match for platform
        const error = result.failed_platforms.find(
          (f: any) => f.platform.toLowerCase() === platform.toLowerCase(),
        );

        // Check if auth URL is provided
        if (error?.auth_url) {
          console.log(`🔐 Authentication required for ${platform}`);
          // Open the Auth Dialog
          setAuthDialog({
            isOpen: true,
            platform: platform,
            authUrl: error.auth_url,
            recipeId: recipeId,
          });
          return;
        }

        // Check if skipped because already posted
        const skipped = result.skipped_platforms?.find(
          (s: any) => s.platform.toLowerCase() === platform.toLowerCase(),
        );
        if (skipped) {
          toast({
            title: "Already Posted",
            description: `Content was already posted to ${platform} `,
            variant: "default",
          });
          queryClient.invalidateQueries({ queryKey: ["wprm-pending"] });
          return;
        }

        throw new Error(error?.error || "Failed to post content");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error: any) {
      console.error("Post error:", error);
      const msg = error.message || "";

      if (msg.includes("authentication") || msg.includes("OAuth")) {
        toast({
          title: "Authentication Required",
          description: `Please authenticate your ${platform} account.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: msg || "Failed to post content",
          variant: "destructive",
        });
      }
    } finally {
      // Clear loading state
      setPostingStates((prev) => ({ ...prev, [postKey]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-[#B85C3C]/50" />
        </motion.div>
        <p className="mt-4 text-muted-foreground animate-pulse">
          Loading approved content...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Failed to load pending content.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <PageHero
        eyebrow="Publishing"
        title="Ready to Post"
        subtitle="Finalize and publish your approved content to your social channels with one click."
        icon={Send}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <Send className="h-4 w-4" /> {content.length} ready for publishing
          </span>
        }
      />

      {/* Search & Stats Section */}
      <div>
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-border/60 sticky top-4 z-20 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Search Bar */}
            <div className="relative w-full md:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-[#B85C3C] transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Search recipes..."
                className="pl-10 h-12 bg-card/50 border-border focus:border-[#B85C3C] focus:ring-4 focus:ring-[#B85C3C]/10 rounded-xl transition-all shadow-sm group-hover:shadow-md group-hover:bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Platform Filters */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-end">
              <Button
                variant={activePlatformFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePlatformFilter("all")}
                className={`rounded-full px-4 h-9 font-medium transition-all duration-300 ${
                  activePlatformFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover scale-105"
                    : "bg-card hover:bg-muted/40 text-muted-foreground border-border hover:border-border"
                }`}
              >
                All Platforms
              </Button>
              {Object.entries(platforms).map(([key, info]) => {
                const Icon = info.icon;
                const isActive = activePlatformFilter === key;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setActivePlatformFilter(isActive ? "all" : key)
                    }
                    className={`rounded-full px-3 h-9 transition-all duration-300 border ${
                      isActive
                        ? `${info.bgColor} ${info.color.replace("text-", "border-").replace("-600", "-200")} shadow-md scale-105 ring-1 ring-offset-1 ring-${info.color.split("-")[1]}-400`
                        : "bg-card hover:bg-muted/40 text-muted-foreground border-border hover:border-border"
                    } `}
                  >
                    <Icon
                      className={`h-4 w-4 mr-1.5 ${isActive ? info.color : "text-muted-foreground"} `}
                    />
                    <span
                      className={
                        isActive ? "font-semibold text-foreground" : ""
                      }
                    >
                      {info.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <AnimatePresence mode="popLayout">
          {content.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="bg-[#FBF1EA] p-6 rounded-full mb-4 animate-bounce">
                <CheckCircle2 className="h-12 w-12 text-[#B85C3C]" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                {searchQuery || activePlatformFilter !== "all"
                  ? "No matches found"
                  : "All Clear!"}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                {searchQuery || activePlatformFilter !== "all"
                  ? "Try adjusting your search or filters to find what you are looking for."
                  : "You've posted everything! Head over to the Review page to approve more content."}
              </p>
              {!(searchQuery || activePlatformFilter !== "all") && (
                <Button
                  onClick={() => (window.location.href = "/cms/review")}
                  variant="default"
                  size="lg"
                  className="gap-2 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Go to Review
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              {/* Clear Filter Button if searching */}
              {(searchQuery || activePlatformFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setActivePlatformFilter("all");
                  }}
                  variant="outline"
                  className="gap-2 mt-4 hover:bg-muted"
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {content.map((item, index) => (
                <motion.div
                  key={item.recipe_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className="group h-full"
                >
                  <Card className="overflow-hidden border border-border shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] h-full flex flex-col rounded-2xl bg-card">
                    {/* Header Image Area */}
                    <div className="relative h-56 overflow-hidden bg-muted group">
                      {item.image_url ? (
                        <>
                          <img
                            src={item.image_url}
                            alt={item.recipe_name || item.post_title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                      )}

                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-card/95 text-[#8A3F26] backdrop-blur-md shadow-sm border-none hover:bg-card px-3 py-1">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          {new Date(item.approved_at).toLocaleDateString()}
                        </Badge>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                        <h3 className="font-bold text-xl leading-snug line-clamp-2 text-shadow-md drop-shadow-md">
                          {item.recipe_name || item.post_title}
                        </h3>
                      </div>
                    </div>

                    <CardContent className="flex-1 p-5 flex flex-col gap-5">
                      {/* Platform Selectors */}
                      <div className="flex flex-wrap gap-2">
                        {item.generated_content &&
                          Object.keys(item.generated_content).map(
                            (platform) => {
                              const platformInfo =
                                platforms[platform as keyof typeof platforms];
                              if (!platformInfo) return null;
                              const Icon = platformInfo.icon;
                              const currentPlatform =
                                selectedPlatforms[item.recipe_id] ||
                                Object.keys(item.generated_content)[0];
                              const isActive = currentPlatform === platform;
                              const isPosted =
                                item.posted_platforms?.includes(platform);

                              // Hide platforms not matching filter if active
                              if (
                                activePlatformFilter !== "all" &&
                                platform !== activePlatformFilter
                              )
                                return null;

                              return (
                                <div
                                  key={platform}
                                  className={`
                                 relative cursor-pointer group/badge transition-all duration-300 transform
                                 ${isActive ? "scale-110 z-10" : "opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0"}
                              `}
                                  onClick={() =>
                                    setSelectedPlatforms((prev) => ({
                                      ...prev,
                                      [item.recipe_id]: platform,
                                    }))
                                  }
                                >
                                  <div
                                    className={`
                                rounded-full p-2.5 transition-all border-2 shadow-sm
                                ${
                                  isActive
                                    ? `${platformInfo.bgColor} border-${platformInfo.color.split("-")[1]}-200 shadow-md`
                                    : "bg-muted/40 border-transparent hover:border-border hover:bg-card"
                                }
                              `}
                                  >
                                    <Icon
                                      className={`h-4 w-4 ${isPosted ? "text-green-600" : isActive ? platformInfo.color : "text-muted-foreground"} `}
                                    />
                                  </div>
                                  {isPosted && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm scale-90">
                                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                      </div>

                      {/* Preview Area */}
                      <div className="flex-1 bg-muted/40 rounded-xl border border-border p-3 shadow-inner">
                        {item.generated_content &&
                          (() => {
                            const currentPlatform =
                              selectedPlatforms[item.recipe_id] ||
                              Object.keys(item.generated_content)[0];

                            // If filter is active and current platform isn't the filtered one, select the filtered one
                            const effectivePlatform =
                              activePlatformFilter !== "all" &&
                              Object.keys(item.generated_content).includes(
                                activePlatformFilter,
                              )
                                ? activePlatformFilter
                                : currentPlatform;

                            const content =
                              item.generated_content[effectivePlatform];
                            if (!content) return null;

                            const displayText =
                              content.caption ||
                              content.post ||
                              content.tweet ||
                              content.description ||
                              "";
                            const displayHashtags =
                              content.hashtags || content.keywords || [];

                            return (
                              <SocialMediaPreview
                                platform={effectivePlatform}
                                content={displayText}
                                image={
                                  effectivePlatform === "pinterest" &&
                                  item.pinterest_image_url
                                    ? item.pinterest_image_url
                                    : item.image_url
                                }
                                hashtags={displayHashtags}
                              />
                            );
                          })()}
                      </div>

                      {/* Global Actions */}
                      <div className="pt-2 mt-auto">
                        {item.generated_content &&
                          (() => {
                            const currentPlatform =
                              selectedPlatforms[item.recipe_id] ||
                              Object.keys(item.generated_content)[0];
                            // If filter is active, force action for that platform
                            const effectivePlatform =
                              activePlatformFilter !== "all" &&
                              Object.keys(item.generated_content).includes(
                                activePlatformFilter,
                              )
                                ? activePlatformFilter
                                : currentPlatform;

                            const platformInfo =
                              platforms[
                                effectivePlatform as keyof typeof platforms
                              ];
                            const isPosted =
                              item.posted_platforms?.includes(
                                effectivePlatform,
                              );
                            const postKey = `${item.recipe_id}-${effectivePlatform}`;
                            const isPosting = postingStates[postKey];

                            if (!platformInfo) return null;
                            const Icon = platformInfo.icon;

                            return (
                              <Button
                                className={`
                                w-full font-bold shadow-md transition-all duration-300 relative overflow-hidden group/btn
                                ${
                                  isPosted
                                    ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                                    : "bg-gradient-to-r from-[#A9542F] to-[#A9542F] text-white hover:shadow-lg hover:shadow-md hover:scale-[1.02]"
                                }
                              `}
                                size="lg"
                                disabled={isPosting || isPosted}
                                onClick={() =>
                                  postContent(item.recipe_id, effectivePlatform)
                                }
                              >
                                {/* Shimmer Effect */}
                                {!isPosted && !isPosting && (
                                  <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent z-10" />
                                )}

                                <div className="relative z-20 flex items-center justify-center">
                                  {isPosting ? (
                                    <>
                                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                      Publishing...
                                    </>
                                  ) : isPosted ? (
                                    <>
                                      <CheckCircle2 className="h-5 w-5 mr-2" />
                                      Published to {platformInfo.name}
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-5 w-5 mr-2 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                                      Post to {platformInfo.name}
                                    </>
                                  )}
                                </div>
                              </Button>
                            );
                          })()}
                      </div>

                      {/* Post Remaining Button - Only show if not filtering or if filtered platform is posted */}
                      {activePlatformFilter === "all" &&
                        item.generated_content &&
                        Object.keys(item.generated_content).some(
                          (p) => !item.posted_platforms?.includes(p),
                        ) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground hover:text-[#A9542F] hover:bg-[#FBF1EA] transition-colors"
                            onClick={() => {
                              Object.keys(item.generated_content).forEach(
                                (platform) => {
                                  if (
                                    !item.posted_platforms?.includes(platform)
                                  ) {
                                    postContent(item.recipe_id, platform);
                                  }
                                },
                              );
                            }}
                          >
                            Post to All Remaining
                          </Button>
                        )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Authentication Dialog */}
      <AlertDialog
        open={authDialog.isOpen}
        onOpenChange={(open) =>
          !open && setAuthDialog((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Authentication Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              To post to{" "}
              <span className="font-semibold text-foreground">
                {authDialog.platform}
              </span>
              , you need to connect your account first.
              <br />
              <br />
              <div className="bg-muted/40 p-4 rounded-xl border border-border text-sm">
                1. Click "Connect {authDialog.platform}" to open the login page.
                <br />
                2. Complete the authentication.
                <br />
                3. Come back here and click "I've Connected, Retry".
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted/50 p-3 rounded-xl text-xs break-all font-mono mb-4 border border-border/50 text-muted-foreground">
            {authDialog.authUrl}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setAuthDialog((prev) => ({ ...prev, isOpen: false }))
              }
              className="rounded-full"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => window.open(authDialog.authUrl, "_blank")}
              className="rounded-full border-[#E8C4B2] text-[#8A3F26] hover:bg-[#FBF1EA]"
            >
              Connect {authDialog.platform}
            </Button>
            <AlertDialogAction
              onClick={() => {
                setAuthDialog((prev) => ({ ...prev, isOpen: false }));
                postContent(authDialog.recipeId, authDialog.platform);
              }}
              className="rounded-full bg-[#A9542F] hover:bg-[#8A3F26]"
            >
              I've Connected, Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
