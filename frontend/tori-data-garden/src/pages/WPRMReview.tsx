import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Instagram,
  Facebook,
  Video,
  Pin,
  Sparkles,
  Eye,
  ChevronRight,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "@/components/icons/XIcon";
import { SocialMediaPreview } from "@/components/social/SocialMediaPreview";
import { apiGet, apiPost } from "@/lib/api";

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
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<number, string>>({});

  const fetchReviewData = () => {
    return apiGet("/api/content/wprm-recipes-generated-not-posted?limit=20");
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['wprm-review'],
    queryFn: fetchReviewData,
    staleTime: 5 * 60 * 1000,
  });

  const recipes: GeneratedContentItem[] = (data?.recipes || []).map((recipe: any) => ({
    ...recipe,
    recipe_id: recipe.id || recipe.recipe_id,
    recipe_name: recipe.title || recipe.recipe_name,
  }));

  const approveContent = async (recipeId: number) => {
    try {
      queryClient.setQueryData(['wprm-review'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          recipes: oldData.recipes.filter((r: any) => (r.id || r.recipe_id) !== recipeId)
        };
      });

      await apiPost(`/api/content/wprm-approve-content/${recipeId}`, {});

      toast({
        title: "✅ Content Approved!",
        description: "This content is now ready to post on social media",
      });

      queryClient.invalidateQueries({ queryKey: ['wprm-review'] });
      queryClient.invalidateQueries({ queryKey: ['wprm-pending'] });
      queryClient.invalidateQueries({ queryKey: ['wprm-recipes'] });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ['wprm-review'] });
      toast({
        title: "Error",
        description: "Failed to approve content",
        variant: "destructive",
      });
    }
  };

  const declineContent = async (recipeId: number) => {
    try {
      queryClient.setQueryData(['wprm-review'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          recipes: oldData.recipes.filter((r: any) => (r.id || r.recipe_id) !== recipeId)
        };
      });

      await apiPost(`/api/content/wprm-decline-content/${recipeId}?reason=User declined`, {});

      toast({
        title: "🔄 Content Declined",
        description: "AI will regenerate new content for this recipe",
      });

      queryClient.invalidateQueries({ queryKey: ['wprm-review'] });
      queryClient.invalidateQueries({ queryKey: ['wprm-recipes'] });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ['wprm-review'] });
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-primary/50" />
        </motion.div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading content for review...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-red-500">
        <XCircle className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold">Something went wrong</h3>
        <p className="text-muted-foreground mt-2">Failed to load content. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 mb-12 shadow-sm border border-white/20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-green-200/30 rounded-full blur-3xl mix-blend-multiply filter pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl mix-blend-multiply filter pointer-events-none" />

        <div className="relative z-10 px-8 py-16 md:py-20 text-center max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4 font-serif">
              Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">Review</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Review AI-generated social media content and approve it for publishing
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge className="text-base px-5 py-2 bg-green-600 text-white border-none shadow-md">
              <Sparkles className="h-4 w-4 mr-2" />
              {recipes.length} Awaiting Review
            </Badge>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {recipes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="bg-green-50 p-6 rounded-full mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">All caught up!</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                No content waiting for review. Great job staying on top of things!
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
            >
              {recipes.map((recipe) => {
                const currentPlatform = selectedPlatforms[recipe.recipe_id] || Object.keys(recipe.generated_content)[0];
                const content = recipe.generated_content[currentPlatform];
                const displayText = content?.caption || content?.post || content?.tweet || content?.description || '';
                const displayHashtags = content?.hashtags || content?.keywords || [];

                return (
                  <motion.div
                    key={recipe.recipe_id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <Card className="h-full border-none shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden bg-white">
                      <CardHeader className="pb-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base line-clamp-2 flex-1">{recipe.recipe_name}</CardTitle>
                          <Badge className="bg-blue-500 text-white border-none shrink-0">
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        </div>

                        {/* Platform Selector */}
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(recipe.generated_content).map((platform) => {
                            const config = platformConfig[platform as keyof typeof platformConfig];
                            if (!config) return null;
                            const Icon = config.icon;
                            const isActive = currentPlatform === platform;
                            return (
                              <Badge
                                key={platform}
                                variant={isActive ? "default" : "outline"}
                                className={`flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${isActive ? 'ring-2 ring-offset-1' : ''
                                  }`}
                                onClick={() => setSelectedPlatforms(prev => ({ ...prev, [recipe.recipe_id]: platform }))}
                              >
                                <Icon className={`h-3 w-3 ${config.color}`} />
                                <span className="text-xs">{config.name}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Platform Preview */}
                        <div className="transform scale-95">
                          <SocialMediaPreview
                            platform={currentPlatform}
                            content={displayText}
                            image={recipe.image_url}
                            hashtags={displayHashtags}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => approveContent(recipe.recipe_id)}
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-semibold mb-1">✅ Approve Content</p>
                                <p className="text-xs">Move this content to the posting queue. It will be ready to publish on social media platforms.</p>
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
                                  className="w-full bg-red-600 hover:bg-red-700 text-white border-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-semibold mb-1">🔄 Decline & Regenerate</p>
                                <p className="text-xs">Decline this content and have the AI create new content for this recipe.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Button
                            variant="secondary"
                            size="sm"
                            className="col-span-2 w-full"
                            onClick={() => navigate(`/cms/review-detail/${recipe.recipe_id}`)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            View Full Details
                            <ChevronRight className="h-4 w-4 ml-auto" />
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
    </div>
  );
}
