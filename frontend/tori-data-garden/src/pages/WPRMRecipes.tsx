import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  X,
  Utensils,
  Flame,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { PageHero } from "@/components/studio";

interface WPRMRecipe {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: string;
  date: string;
  modified: string;
  image_url?: string;
  servings: string;
  servings_unit: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  ingredients: string[];
  instructions: string[];
  nutrition: any;
  rating: string;
  rating_count: string;
  content_status?: {
    status: string;
    content_generated: boolean;
    posted: boolean;
    retry_count: number;
    last_error: string | null;
  };
}

const StatusBadge = ({
  content_status,
}: {
  content_status?: WPRMRecipe["content_status"];
}) => {
  const status = content_status?.status || "not_generated";
  const statusMap = {
    not_generated: {
      label: "Not Generated",
      icon: Sparkles,
      cls: "bg-[#6B7280] text-white",
    },
    generating: {
      label: "Processing...",
      icon: Loader2,
      cls: "bg-[#2563EB] text-white",
    },
    generated: {
      label: "Generated",
      icon: CheckCircle2,
      cls: "bg-[#7C3AED] text-white",
    },
    pending: {
      label: "Ready to Post",
      icon: Send,
      cls: "bg-[#F59E0B] text-white",
    },
    posted: {
      label: "Posted",
      icon: CheckCircle2,
      cls: "bg-[#16A34A] text-white",
    },
    declined: {
      label: "Declined",
      icon: XCircle,
      cls: "bg-[#DC2626] text-white",
    },
  };
  const statusInfo =
    statusMap[status as keyof typeof statusMap] || statusMap.not_generated;
  const Icon = statusInfo.icon;
  const isSpinning = status === "generating";
  return (
    <Badge
      className={`${statusInfo.cls} border-none flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold shadow-sm`}
    >
      <Icon className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
      {statusInfo.label}
    </Badge>
  );
};

export default function WPRMRecipes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [isSearchMode, setIsSearchMode] = useState(false);

  const fetchRecipesData = async () => {
    let url = `/api/content/wprm-recipes?limit=${limit}&offset=${offset}`;
    if (isSearchMode && searchQuery.trim()) {
      url = `/api/content/wprm-recipes/search/${encodeURIComponent(searchQuery)}?limit=${limit}&offset=${offset}`;
    }
    return apiGet(url);
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["wprm-recipes", limit, offset, isSearchMode ? searchQuery : ""],
    queryFn: fetchRecipesData,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const recipes: WPRMRecipe[] = (data?.recipes || []).map((recipe: any) => ({
    ...recipe,
    recipe_name: recipe.title,
    post_title: recipe.title,
    summary: recipe.description?.replace(/<[^>]*>/g, "") || "",
  }));
  const totalCount =
    data?.total_count || data?.total || data?.total_needing_generation || 0;

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setOffset(0);
      return;
    }
    setIsSearchMode(true);
    setOffset(0);
  };
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setOffset(0);
  };

  const generateContent = async (recipeId: number) => {
    setGeneratingIds((prev) => new Set(prev).add(recipeId));
    queryClient.setQueryData(
      ["wprm-recipes", limit, offset, isSearchMode ? searchQuery : ""],
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          recipes: oldData.recipes.map((recipe: any) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  content_status: {
                    status: "generating",
                    content_generated: false,
                    posted: false,
                  },
                }
              : recipe,
          ),
        };
      },
    );
    try {
      await apiPost("/api/wprm-scheduler/generate-single", {
        recipe_id: recipeId,
        target_platforms: [
          "instagram",
          "twitter",
          "facebook",
          "tiktok",
          "pinterest",
        ],
        tone: "warm and inviting",
        include_emojis: true,
        max_hashtags: 10,
      });
      toast({
        title: "✨ Magic in progress!",
        description: "Our AI chef is cooking up some content for you.",
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["wprm-recipes"] });
        queryClient.invalidateQueries({ queryKey: ["wprm-review"] });
        setGeneratingIds((prev) => {
          const s = new Set(prev);
          s.delete(recipeId);
          return s;
        });
      }, 2000);
    } catch (error) {
      setGeneratingIds((prev) => {
        const s = new Set(prev);
        s.delete(recipeId);
        return s;
      });
      queryClient.invalidateQueries({ queryKey: ["wprm-recipes"] });
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 text-primary/50 animate-spin" />
        <p className="mt-4 text-muted-foreground animate-pulse">
          Loading your cookbook…
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
          Failed to load recipes. Please try again.
        </p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <PageHero
        eyebrow="Content"
        title="Recipe Library"
        subtitle="Search your recipes, generate social content, and share your culinary creations with the world."
        icon={BookOpen}
      >
        {/* Integrated search */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-1.5 rounded-full bg-white p-1.5 shadow-lg">
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <input
              className="flex-1 border-none bg-transparent px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 sm:text-sm"
              placeholder="Search by title, ingredients, or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {isSearchMode && (
              <button
                onClick={clearSearch}
                className="mr-1 rounded-full p-2 transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <Button
              onClick={handleSearch}
              className="rounded-full bg-[#7C3AED] px-6 text-white shadow-md transition-all hover:bg-[#6D28D9] active:scale-95"
            >
              Search
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[hsl(40_40%_90%)]">
            <span>Try:</span>
            {["Chicken", "Vegan", "Dessert"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSearchQuery(t);
                  setIsSearchMode(true);
                  setOffset(0);
                }}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </PageHero>

      {/* Toolbar */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-muted-foreground">
          {isSearchMode ? (
            <>
              Found{" "}
              <span className="font-bold text-foreground">{totalCount}</span>{" "}
              results for “<span className="italic">{searchQuery}</span>”
              (showing {recipes.length})
            </>
          ) : (
            <>
              Showing{" "}
              <span className="font-bold text-foreground">
                {recipes.length}
              </span>{" "}
              of <span className="font-bold text-foreground">{totalCount}</span>{" "}
              recipes
            </>
          )}
        </p>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0 || isFetching}
          >
            Previous
          </Button>
          <span className="flex min-w-[3rem] items-center justify-center gap-1 px-2 text-xs font-medium tabular-nums">
            {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= totalCount || isFetching}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {recipes.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
          >
            {recipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group"
              >
                <Card className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {recipe.image_url ? (
                      <>
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Utensils className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute right-4 top-4 z-10">
                      <StatusBadge content_status={recipe.content_status} />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                      <h3 className="mb-1 line-clamp-2 font-display text-xl font-semibold leading-tight">
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                        {recipe.prep_time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {recipe.prep_time}m
                          </span>
                        )}
                        {recipe.nutrition?.calories && (
                          <span className="flex items-center gap-1.5">
                            <Flame className="h-4 w-4" />
                            {recipe.nutrition.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex scale-90 gap-3 transition-transform duration-300 group-hover:scale-100">
                        {(!recipe.content_status ||
                          recipe.content_status?.status ===
                            "not_generated") && (
                          <Button
                            onClick={() => generateContent(recipe.id)}
                            size="lg"
                            className="border-none bg-card text-foreground shadow-xl hover:bg-muted"
                          >
                            <Sparkles className="mr-2 h-4 w-4 text-primary" />{" "}
                            Generate
                          </Button>
                        )}
                        {recipe.content_status?.status === "generated" && (
                          <Button
                            onClick={() =>
                              (window.location.href = `/cms/review?recipe_id=${recipe.id}`)
                            }
                            size="lg"
                            className="border-none bg-card text-foreground shadow-xl hover:bg-muted"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-secondary" />{" "}
                            Review
                          </Button>
                        )}
                        {recipe.content_status?.status === "pending" && (
                          <span className="flex items-center gap-2 rounded-full bg-[hsl(var(--success))] px-4 py-2 font-medium text-white shadow-lg">
                            <CheckCircle2 className="h-4 w-4" /> Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {recipe.summary ||
                        "No description available for this recipe."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground hover:bg-muted/70"
                      >
                        {recipe.servings || "?"}{" "}
                        {recipe.servings_unit || "servings"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-4 rounded-full bg-muted/50 p-6">
              <Search className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              No recipes found
            </h3>
            <p className="mx-auto max-w-md text-muted-foreground">
              We couldn't find any recipes matching your search. Try different
              keywords or browse the full collection.
            </p>
            <Button onClick={clearSearch} variant="outline" className="mt-6">
              Clear search
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
