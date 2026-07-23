import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Instagram,
  Facebook,
  Video,
  Pin,
  Eye,
  ChevronRight,
  Info,
  ClipboardCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "@/components/icons/XIcon";
import { SocialMediaPreview } from "@/components/social/SocialMediaPreview";
import { apiGet, apiPost } from "@/lib/api";
import { PageHero } from "@/components/studio";

interface GeneratedContentItem {
  recipe_id: number;
  recipe_name: string;
  post_title: string;
  image_url?: string;
  generated_content: {
    [platform: string]: {
      caption?: string;
      post?: string;
      tweet?: string;
      description?: string;
      title?: string;
      hashtags?: string[];
      keywords?: string[];
      platform_specific?: {
        hook?: string;
        cta?: string;
        key_highlight?: string;
      };
      alternative_captions?: string[];
    };
  };
  status: string;
  created_at: string;
}

const platformConfig = {
  instagram: { icon: Instagram, color: "text-pink-500", name: "Instagram" },
  twitter: { icon: XIcon, color: "text-black", name: "X" },
  facebook: { icon: Facebook, color: "text-blue-600", name: "Facebook" },
  tiktok: { icon: Video, color: "text-black", name: "TikTok" },
  pinterest: { icon: Pin, color: "text-red-600", name: "Pinterest" },
};

export default function WPRMReview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Record<number, string>
  >({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wprm-review"],
    queryFn: () =>
      apiGet("/api/content/wprm-recipes-generated-not-posted?limit=20"),
    staleTime: 5 * 60 * 1000,
  });

  const recipes: GeneratedContentItem[] = (data?.recipes || []).map(
    (recipe: any) => ({
      ...recipe,
      recipe_id: recipe.id || recipe.recipe_id,
      recipe_name: recipe.title || recipe.recipe_name,
    }),
  );

  const approveContent = async (recipeId: number) => {
    try {
      queryClient.setQueryData(["wprm-review"], (old: any) =>
        old
          ? {
              ...old,
              recipes: old.recipes.filter(
                (r: any) => (r.id || r.recipe_id) !== recipeId,
              ),
            }
          : old,
      );
      await apiPost(`/api/content/wprm-approve-content/${recipeId}`, {});
      toast({
        title: "✅ Content Approved!",
        description: "This content is now ready to post on social media",
      });
      queryClient.invalidateQueries({ queryKey: ["wprm-review"] });
      queryClient.invalidateQueries({ queryKey: ["wprm-pending"] });
      queryClient.invalidateQueries({ queryKey: ["wprm-recipes"] });
    } catch {
      queryClient.invalidateQueries({ queryKey: ["wprm-review"] });
      toast({
        title: "Error",
        description: "Failed to approve content",
        variant: "destructive",
      });
    }
  };

  const declineContent = async (recipeId: number) => {
    try {
      queryClient.setQueryData(["wprm-review"], (old: any) =>
        old
          ? {
              ...old,
              recipes: old.recipes.filter(
                (r: any) => (r.id || r.recipe_id) !== recipeId,
              ),
            }
          : old,
      );
      await apiPost(
        `/api/content/wprm-decline-content/${recipeId}?reason=User declined`,
        {},
      );
      toast({
        title: "🔄 Content Declined",
        description: "AI will regenerate new content for this recipe",
      });
      queryClient.invalidateQueries({ queryKey: ["wprm-review"] });
      queryClient.invalidateQueries({ queryKey: ["wprm-recipes"] });
    } catch {
      queryClient.invalidateQueries({ queryKey: ["wprm-review"] });
      toast({
        title: "Error",
        description: "Failed to decline content",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 text-primary/50 animate-spin" />
        <p className="mt-4 text-muted-foreground animate-pulse">
          Loading content for review…
        </p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-destructive">
        <XCircle className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold">Something went wrong</h3>
        <p className="text-muted-foreground mt-2">
          Failed to load content. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <PageHero
        eyebrow="Approvals"
        title="Content Review"
        subtitle="Review AI-generated social content and approve it for publishing."
        icon={ClipboardCheck}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <Eye className="h-4 w-4" /> {recipes.length} awaiting review
          </span>
        }
      />

      <AnimatePresence mode="wait">
        {recipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center"
          >
            <div className="mb-4 rounded-full bg-[hsl(var(--success)/0.12)] p-6">
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              All caught up!
            </h3>
            <p className="mx-auto max-w-md text-muted-foreground">
              No content waiting for review. Great job staying on top of things.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
          >
            {recipes.map((recipe) => {
              const currentPlatform =
                selectedPlatforms[recipe.recipe_id] ||
                Object.keys(recipe.generated_content)[0];
              const content = recipe.generated_content[currentPlatform];
              const displayText =
                content?.caption ||
                content?.post ||
                content?.tweet ||
                content?.description ||
                "";
              const displayHashtags =
                content?.hashtags || content?.keywords || [];
              return (
                <motion.div
                  key={recipe.recipe_id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <Card className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)]">
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 flex-1 font-display text-base">
                          {recipe.recipe_name}
                        </CardTitle>
                        <Badge className="shrink-0 border-none bg-[hsl(var(--terracotta)/0.15)] text-[hsl(var(--terracotta-dark))]">
                          <Eye className="mr-1 h-3 w-3" />
                          Review
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(recipe.generated_content).map(
                          (platform) => {
                            const config =
                              platformConfig[
                                platform as keyof typeof platformConfig
                              ];
                            if (!config) return null;
                            const Icon = config.icon;
                            const isActive = currentPlatform === platform;
                            return (
                              <button
                                key={platform}
                                onClick={() =>
                                  setSelectedPlatforms((prev) => ({
                                    ...prev,
                                    [recipe.recipe_id]: platform,
                                  }))
                                }
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${isActive ? "border-primary bg-[hsl(var(--olive)/0.1)] text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
                              >
                                <Icon
                                  className={`h-3.5 w-3.5 ${config.color}`}
                                />
                                {config.name}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="scale-[0.97] origin-top">
                        <SocialMediaPreview
                          platform={currentPlatform}
                          content={displayText}
                          image={recipe.image_url}
                          hashtags={displayHashtags}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => approveContent(recipe.recipe_id)}
                                size="sm"
                                className="w-full bg-primary text-white hover:bg-primary-hover"
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />{" "}
                                Approve
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="mb-1 font-semibold">✅ Approve</p>
                              <p className="text-xs">
                                Move this content to the posting queue.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => declineContent(recipe.recipe_id)}
                                variant="outline"
                                size="sm"
                                className="w-full border-destructive bg-destructive text-white hover:bg-destructive/90"
                              >
                                <XCircle className="mr-1 h-4 w-4" /> Decline
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="mb-1 font-semibold">
                                🔄 Decline & Regenerate
                              </p>
                              <p className="text-xs">
                                Have the AI create new content for this recipe.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="col-span-2 w-full"
                          onClick={() =>
                            navigate(`/cms/review-detail/${recipe.recipe_id}`)
                          }
                        >
                          <Info className="mr-1 h-4 w-4" /> View full details{" "}
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
