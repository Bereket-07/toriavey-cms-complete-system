import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Instagram,
  Facebook,
  ArrowLeft,
  Video,
  Pin,
  Sparkles,
  Eye,
  Edit3,
  Save,
  X as XIcon2,
  RefreshCw,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, apiPost } from "@/lib/api";
import { XIcon } from "@/components/icons/XIcon";
import { SocialMediaPreview } from "@/components/social/SocialMediaPreview";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GeneratedContentItem {
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
  instagram: {
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-gradient-to-br from-pink-50 to-[#FBF1EA]",
    name: "Instagram",
    charLimit: 2200,
    tagLimit: 30,
    tagLabel: "Hashtags",
  },
  twitter: {
    icon: XIcon,
    color: "text-black",
    bgColor: "bg-gradient-to-br from-muted/40 to-muted/40",
    name: "X (Twitter)",
    charLimit: 280,
    tagLimit: 10,
    tagLabel: "Hashtags",
  },
  facebook: {
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    name: "Facebook",
    charLimit: 63206,
    tagLimit: 30,
    tagLabel: "Hashtags",
  },
  tiktok: {
    icon: Video,
    color: "text-black",
    bgColor: "bg-gradient-to-br from-muted/40 to-zinc-50",
    name: "TikTok",
    charLimit: 2200,
    tagLimit: 30,
    tagLabel: "Hashtags",
  },
  pinterest: {
    icon: Pin,
    color: "text-red-600",
    bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
    name: "Pinterest",
    charLimit: 500,
    tagLimit: 20,
    tagLabel: "Keywords", // Pinterest uses keywords, not hashtags!
  },
};

export default function WPRMReviewDetail() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);

  // Fetch Recipe Details with Caching
  const { data: recipe, isLoading } = useQuery({
    queryKey: ["wprm-recipe", recipeId],
    queryFn: async () => {
      // We fetch the list because there isn't a direct "get by id generated not posted" endpoint that returns exactly this structure easily
      // But actually, we can use the specific endpoint for better performance if available, or just filter from the list as before
      // For consistency with previous implementation, we'll fetch the list and filter, but Cache it!
      const data = await apiGet<any>(
        "/api/content/wprm-recipes-generated-not-posted?limit=100",
      );
      const recipes = (data.recipes || []).map((recipe: any) => ({
        ...recipe,
        recipe_id: recipe.id || recipe.recipe_id,
        recipe_name: recipe.title || recipe.recipe_name,
      }));
      const found = recipes.find(
        (r: GeneratedContentItem) => r.recipe_id === Number(recipeId),
      );
      if (!found) throw new Error("Recipe not found");
      return found as GeneratedContentItem;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      platform,
      caption,
      title,
      tags,
    }: {
      platform: string;
      caption: string;
      title?: string;
      tags: string[];
    }) => {
      if (!recipe) return;

      const params = new URLSearchParams({
        platform,
        caption,
      });

      if (title) {
        params.append("title", title);
      }

      // Add tags as array
      if (platform === "pinterest") {
        tags.forEach((tag) => params.append("keywords", tag));
      } else {
        tags.forEach((tag) => params.append("hashtags", tag));
      }

      await apiPost(
        `/api/content/wprm-update-generated-content/${recipe.recipe_id}?${params.toString()}`,
        {},
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wprm-recipe", recipeId] });
      toast({
        title: "✅ Saved!",
        description: `Content updated for ${platformConfig[variables.platform as keyof typeof platformConfig]?.name}`,
      });
      cancelEditing();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!recipe) return;
      await apiPost(
        `/api/content/wprm-approve-content/${recipe.recipe_id}`,
        {},
      );
    },
    onSuccess: () => {
      toast({
        title: "✅ Content Approved!",
        description: "Moved to posting queue - ready to publish!",
      });
      navigate("/cms/review");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve content",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!recipe) return;
      await apiPost(
        `/api/content/wprm-decline-content/${recipe.recipe_id}?reason=User declined`,
        {},
      );
    },
    onSuccess: () => {
      toast({
        title: "🔄 Content Declined",
        description: "AI will create fresh content for this recipe",
      });
      navigate("/cms/review");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to decline content",
        variant: "destructive",
      });
    },
  });

  const startEditing = (platform: string, content: any) => {
    setEditingPlatform(platform);
    const caption =
      content.caption ||
      content.post ||
      content.tweet ||
      content.description ||
      "";
    setEditedCaption(caption);
    setEditedTitle(content.title || "");

    // Use keywords for Pinterest, hashtags for others
    const tags =
      platform === "pinterest"
        ? content.keywords || []
        : content.hashtags || [];
    setEditedTags(tags);
  };

  const cancelEditing = () => {
    setEditingPlatform(null);
    setEditedCaption("");
    setEditedTitle("");
    setEditedTags([]);
  };

  const saveEdits = (platform: string) => {
    updateMutation.mutate({
      platform,
      caption: editedCaption,
      title: editedTitle,
      tags: editedTags,
    });
  };

  const addTag = (newTag: string) => {
    if (newTag && !editedTags.includes(newTag)) {
      setEditedTags([...editedTags, newTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter((tag) => tag !== tagToRemove));
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
        <p className="mt-4 text-muted-foreground animate-pulse">
          Loading recipe details...
        </p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold">Recipe not found</h3>
        <Button onClick={() => navigate("/cms/review")} className="mt-4">
          Back to Review
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-white to-muted/40 pb-12">
      {/* Header */}
      <div className="bg-card border-b shadow-sm sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/cms/review")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif truncate">
                {recipe.recipe_name || recipe.post_title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Recipe ID: {recipe.recipe_id} • Generated{" "}
                {new Date(recipe.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge className="bg-[#7C9A4E] text-white border-none shrink-0">
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => approveMutation.mutate()}
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                    )}
                    <Sparkles className="h-4 w-4 mr-2" />
                    Approve & Move to Posting Queue
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">✅ Approve Content</p>
                  <p className="text-xs">
                    This content will be moved to the pending queue and ready to
                    publish on all selected platforms. You can schedule or post
                    it immediately from the Pending page.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => declineMutation.mutate()}
                    variant="outline"
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-600 hover:from-red-100 hover:to-orange-100"
                    disabled={declineMutation.isPending}
                  >
                    {declineMutation.isPending ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Decline & Request Regeneration
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">🔄 Decline & Regenerate</p>
                  <p className="text-xs">
                    AI will create fresh content for this recipe with different
                    captions, hashtags, and creative angles. The current content
                    will be discarded.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Tabs
          defaultValue={Object.keys(recipe.generated_content)[0]}
          className="w-full"
        >
          <TabsList
            className="grid w-full mb-8 bg-card shadow-sm"
            style={{
              gridTemplateColumns: `repeat(${Object.keys(recipe.generated_content).length}, 1fr)`,
            }}
          >
            {Object.keys(recipe.generated_content).map((platform) => {
              const config =
                platformConfig[platform as keyof typeof platformConfig];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5"
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className="hidden sm:inline font-semibold">
                    {config.name}
                  </span>
                  <span className="sm:hidden font-semibold">
                    {platform === "twitter"
                      ? "X"
                      : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(recipe.generated_content).map(
            ([platform, content]) => {
              const config =
                platformConfig[platform as keyof typeof platformConfig];
              if (!config) return null;

              const displayText =
                content.caption ||
                content.post ||
                content.tweet ||
                content.description ||
                "";
              const displayTags =
                platform === "pinterest"
                  ? content.keywords || []
                  : content.hashtags || [];
              const hasTags = displayTags && displayTags.length > 0;
              const isEditing = editingPlatform === platform;

              return (
                <TabsContent
                  key={platform}
                  value={platform}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Special Layout for Pinterest */}
                    {platform === "pinterest" ? (
                      <div className="flex justify-center w-full">
                        <div className="bg-card rounded-[32px] shadow-2xl flex flex-col md:flex-row w-full max-w-[880px] overflow-hidden min-h-[600px] border border-border">
                          {/* LEFT: Image Section */}
                          <div className="md:w-1/2 p-10 bg-muted/40 flex items-center justify-center relative group">
                            <div className="relative w-full aspect-[2/3] rounded-[24px] overflow-hidden shadow-sm ring-1 ring-black/5">
                              {recipe.pinterest_image_url ||
                              recipe.image_url ? (
                                <img
                                  src={
                                    recipe.pinterest_image_url ||
                                    recipe.image_url
                                  }
                                  alt="Pin Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                  No Image
                                </div>
                              )}
                              {/* Hover Actions */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Button
                                  variant="secondary"
                                  className="rounded-full font-semibold"
                                >
                                  Change
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT: Form Section */}
                          <div className="md:w-1/2 p-10 md:pt-16 flex flex-col gap-6">
                            {/* Top Actions */}
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-2 text-muted-foreground hover:bg-muted px-3 py-2 rounded-full cursor-pointer transition-colors">
                                <div className="h-4 w-4 rounded-full bg-muted-foreground/40"></div>
                                <span className="font-semibold text-sm">
                                  boards
                                </span>
                                <span className="text-xs">▼</span>
                              </div>
                              <Button
                                onClick={() => saveEdits(platform)}
                                className="bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full px-6 font-bold"
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            </div>

                            {/* Title Input */}
                            <div className="relative group">
                              <Textarea
                                value={
                                  isEditing ? editedTitle : content.title || ""
                                }
                                onChange={(e) => {
                                  if (!isEditing)
                                    startEditing(platform, content);
                                  setEditedTitle(e.target.value);
                                }}
                                placeholder="Add your title"
                                className="text-4xl font-bold border-none shadow-none resize-none p-0 placeholder:text-muted-foreground focus-visible:ring-0 min-h-[80px] leading-tight"
                              />
                              <div className="h-[1px] bg-muted w-full mt-2 group-focus-within:bg-[#7C9A4E] transition-colors"></div>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                TA
                              </div>
                              <span className="text-sm font-semibold">
                                Tori Avey
                              </span>
                            </div>

                            {/* Description Section - Restored to 'Content' Style */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-muted-foreground">
                                  Pin Description
                                </label>
                              </div>

                              {isEditing ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editedCaption}
                                    onChange={(e) =>
                                      setEditedCaption(e.target.value)
                                    }
                                    rows={8}
                                    className="resize-none font-mono text-sm bg-card"
                                    placeholder="Tell everyone what your Pin is about..."
                                  />
                                  <div className="flex items-center justify-between text-xs">
                                    <span
                                      className={
                                        editedCaption.length > config.charLimit
                                          ? "text-red-500 font-bold"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {editedCaption.length} /{" "}
                                      {config.charLimit} characters
                                    </span>
                                    {editedCaption.length >
                                      config.charLimit && (
                                      <span className="text-red-500 font-semibold">
                                        ⚠️ Over limit!
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="bg-muted/40 rounded-lg p-4 border cursor-pointer hover:bg-muted transition-colors group relative"
                                  onClick={() =>
                                    startEditing(platform, content)
                                  }
                                >
                                  <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground">
                                    {displayText || (
                                      <span className="text-muted-foreground italic">
                                        No description generated...
                                      </span>
                                    )}
                                  </p>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Alt Text Button (Visual Only for now) */}
                            <div>
                              <Button
                                variant="ghost"
                                className="pl-0 font-semibold text-foreground hover:bg-transparent"
                              >
                                Add alt text
                              </Button>
                            </div>

                            {/* Link Display (Read Only) */}
                            <div className="mt-auto">
                              <div className="flex items-center w-full px-4 py-3 bg-muted rounded-full text-foreground font-medium truncate">
                                <Sparkles className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="truncate text-sm">
                                  {recipe.recipe_id
                                    ? `toriavey.com/recipe/${recipe.recipe_id}`
                                    : "toriavey.com"}
                                </span>
                              </div>
                            </div>

                            {/* Keywords Tag Input */}
                            <div className="mt-2">
                              <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                                Keywords (Internal)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(isEditing ? editedTags : displayTags).map(
                                  (tag, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs gap-1 pr-1 bg-muted hover:bg-muted text-muted-foreground"
                                    >
                                      {tag}
                                      {isEditing && (
                                        <button
                                          onClick={() => removeTag(tag)}
                                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                                        >
                                          <XIcon2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </Badge>
                                  ),
                                )}
                                <div className="flex-1 min-w-[100px]">
                                  <Input
                                    placeholder="Add keyword..."
                                    className="border-none shadow-none h-6 text-sm p-0 placeholder:text-muted-foreground focus-visible:ring-0"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        // Auto-start editing mode if adding a tag
                                        if (!isEditing)
                                          startEditing(platform, content);

                                        const input = e.currentTarget;
                                        if (input.value.trim()) {
                                          addTag(input.value.trim()); // We need to modify addTag to support adding to state directly or ensure startEditing is called first
                                          input.value = "";
                                        }
                                      }
                                    }}
                                    // Simple fix: onFocus triggers edit mode
                                    onFocus={() => {
                                      if (!isEditing)
                                        startEditing(platform, content);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* GENERIC LAYOUT FOR OTHER PLATFORMS */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Platform Preview */}
                        <div className="space-y-4">
                          <div
                            className={`${config.bgColor} rounded-2xl p-6 shadow-lg border border-white/50`}
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div
                                className={`p-3 rounded-xl bg-card shadow-sm`}
                              >
                                <config.icon
                                  className={`h-6 w-6 ${config.color}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">
                                  {config.name} Preview
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Live platform mockup
                                </p>
                              </div>
                            </div>

                            <div className="bg-card rounded-xl p-4 shadow-md">
                              <SocialMediaPreview
                                platform={platform}
                                content={
                                  isEditing ? editedCaption : displayText
                                }
                                title={isEditing ? editedTitle : content.title}
                                image={recipe.image_url}
                                hashtags={isEditing ? editedTags : displayTags}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right: Content Editor */}
                        <div className="space-y-6">
                          {/* Main Content Card */}
                          <Card className="shadow-lg border-2">
                            <CardContent className="p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-lg flex items-center gap-2">
                                  <Edit3 className="h-5 w-5 text-primary" />
                                  {platform === "twitter"
                                    ? "Tweet Text"
                                    : platform === "facebook"
                                      ? "Post Content"
                                      : "Caption"}
                                </h4>
                                {!isEditing ? (
                                  <Button
                                    onClick={() =>
                                      startEditing(platform, content)
                                    }
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                  </Button>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => saveEdits(platform)}
                                      size="sm"
                                      disabled={updateMutation.isPending}
                                      className="gap-2 bg-green-600 hover:bg-green-700"
                                    >
                                      {updateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4" />
                                      )}
                                      Save
                                    </Button>
                                    <Button
                                      onClick={cancelEditing}
                                      size="sm"
                                      variant="outline"
                                      disabled={updateMutation.isPending}
                                    >
                                      <XIcon2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Tags Editor */}
                              {(hasTags || isEditing) && (
                                <div>
                                  <div className="flex items-center justify-between mb-2 mt-4">
                                    <h4 className="font-semibold text-sm">
                                      {config.tagLabel}
                                    </h4>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {isEditing
                                        ? editedTags.length
                                        : displayTags.length}{" "}
                                      / {config.tagLimit}
                                    </Badge>
                                  </div>

                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder={`Add ${config.tagLabel.toLowerCase()}...`}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              const input = e.currentTarget;
                                              addTag(input.value.trim());
                                              input.value = "";
                                            }
                                          }}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {editedTags.map((tag, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-sm gap-1 pr-1"
                                          >
                                            #{tag}
                                            <button
                                              onClick={() => removeTag(tag)}
                                              className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                            >
                                              <XIcon2 className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {displayTags.map((tag, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="text-sm"
                                        >
                                          #{tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {isEditing ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editedCaption}
                                    onChange={(e) =>
                                      setEditedCaption(e.target.value)
                                    }
                                    rows={8}
                                    className="resize-none font-mono text-sm"
                                    placeholder="Enter your caption..."
                                  />
                                  <div className="flex items-center justify-between text-xs">
                                    <span
                                      className={
                                        editedCaption.length > config.charLimit
                                          ? "text-red-500 font-bold"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {editedCaption.length} /{" "}
                                      {config.charLimit} characters
                                    </span>
                                    {editedCaption.length >
                                      config.charLimit && (
                                      <span className="text-red-500 font-semibold">
                                        ⚠️ Over limit!
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="bg-muted/40 rounded-lg p-4 border">
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                                      {displayText}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {displayText.length} / {config.charLimit}{" "}
                                      chars
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Platform Specific Elements */}
                          {content.platform_specific &&
                            (content.platform_specific.hook ||
                              content.platform_specific.cta ||
                              content.platform_specific.key_highlight) && (
                              <Card className="shadow-md">
                                <CardContent className="p-6 space-y-4">
                                  <h4 className="font-bold text-base flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-yellow-500" />
                                    Platform-Specific Elements
                                  </h4>

                                  {content.platform_specific.hook && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                                        Hook
                                      </p>
                                      <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
                                        <p className="text-sm">
                                          {content.platform_specific.hook}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {content.platform_specific.key_highlight && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                                        Key Highlight
                                      </p>
                                      <div className="bg-[#F2F5E6] rounded p-3 border border-[#D6DFB8]">
                                        <p className="text-sm">
                                          {
                                            content.platform_specific
                                              .key_highlight
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {content.platform_specific.cta && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                                        Call to Action
                                      </p>
                                      <div className="bg-green-50 rounded p-3 border border-green-200">
                                        <p className="text-sm font-semibold">
                                          {content.platform_specific.cta}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                          {/* Alternative Captions */}
                          {content.alternative_captions &&
                            content.alternative_captions.length > 0 && (
                              <Card className="shadow-md">
                                <CardContent className="p-6 space-y-3">
                                  <h4 className="font-bold text-base flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-[#B85C3C]" />
                                    Alternative Caption Options
                                  </h4>
                                  {content.alternative_captions.map(
                                    (altCaption, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-[#FBF1EA] rounded-lg p-4 border border-[#E8C4B2]"
                                      >
                                        <p className="text-xs font-semibold text-[#A9542F] mb-2">
                                          Option {idx + 1}
                                        </p>
                                        <p className="text-sm leading-relaxed">
                                          {altCaption}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </CardContent>
                              </Card>
                            )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              );
            },
          )}
        </Tabs>
      </div>
    </div>
  );
}
