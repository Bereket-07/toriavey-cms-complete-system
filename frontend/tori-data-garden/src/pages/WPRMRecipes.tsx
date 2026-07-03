import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles, CheckCircle2, Clock, XCircle, Send, BookOpen, X, ChevronRight, Utensils, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const CMS_BACKEND_URL = import.meta.env.VITE_CMS_BACKEND_URL || "http://127.0.0.1:8000";

// --- Interfaces ---
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

// --- Components ---

const StatusBadge = ({ content_status }: { content_status?: WPRMRecipe['content_status'] }) => {
  const status = content_status?.status || 'not_generated';
  const statusMap = {
    not_generated: {
      label: "Not Generated",
      icon: Sparkles,
      gradient: "bg-gradient-to-r from-slate-500 to-gray-600",
      textColor: "text-white",
      shadow: "shadow-lg shadow-slate-500/50"
    },
    generating: {
      label: "Processing...",
      icon: Loader2,
      gradient: "bg-gradient-to-r from-yellow-500 to-orange-500",
      textColor: "text-white",
      shadow: "shadow-lg shadow-orange-500/50 animate-pulse"
    },
    generated: {
      label: "Generated",
      icon: CheckCircle2,
      gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
      textColor: "text-white",
      shadow: "shadow-lg shadow-green-500/50"
    },
    pending: {
      label: "Ready to Post",
      icon: Send,
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-500",
      textColor: "text-white",
      shadow: "shadow-lg shadow-blue-500/50"
    },
    posted: {
      label: "Posted",
      icon: CheckCircle2,
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
      textColor: "text-white",
      shadow: "shadow-lg shadow-purple-500/50"
    },
    declined: {
      label: "Declined",
      icon: XCircle,
      gradient: "bg-gradient-to-r from-red-500 to-rose-600",
      textColor: "text-white",
      shadow: "shadow-lg shadow-red-500/50"
    },
  };

  const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.not_generated;
  const Icon = statusInfo.icon;
  const isSpinning = status === 'generating';

  return (
    <Badge className={`${statusInfo.gradient} ${statusInfo.textColor} ${statusInfo.shadow} border-none flex items-center gap-2 px-4 py-2 text-sm font-bold`}>
      <Icon className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
      {statusInfo.label}
    </Badge>
  );
};

export default function WPRMRecipes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [limit] = useState(24); // Increased limit for grid layout
  const [offset, setOffset] = useState(0);
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Fetch function for React Query
  const fetchRecipesData = async () => {
    let url = `/api/content/wprm-recipes?limit=${limit}&offset=${offset}`;

    if (isSearchMode && searchQuery.trim()) {
      url = `/api/content/wprm-recipes/search/${encodeURIComponent(searchQuery)}?limit=${limit}&offset=${offset}`;
    }

    return apiGet(url);
  };

  // Use React Query
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['wprm-recipes', limit, offset, isSearchMode ? searchQuery : ''],
    queryFn: fetchRecipesData,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  // Process data
  const recipes: WPRMRecipe[] = (data?.recipes || []).map((recipe: any) => ({
    ...recipe,
    recipe_name: recipe.title,
    post_title: recipe.title,
    summary: recipe.description?.replace(/<[^>]*>/g, '') || '',
  }));

  const totalCount = data?.total_count || data?.total || data?.total_needing_generation || 0;

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setOffset(0);
      return;
    }
    setIsSearchMode(true);
    setOffset(0); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setOffset(0);
  };

  const generateContent = async (recipeId: number) => {
    setGeneratingIds(prev => new Set(prev).add(recipeId));

    // Optimistic Update
    queryClient.setQueryData(['wprm-recipes', limit, offset, isSearchMode ? searchQuery : ''], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        recipes: oldData.recipes.map((recipe: any) =>
          recipe.id === recipeId
            ? { ...recipe, content_status: { status: 'generating', content_generated: false, posted: false } }
            : recipe
        )
      };
    });

    try {
      await apiPost("/api/wprm-scheduler/generate-single", {
        recipe_id: recipeId,
        target_platforms: ["instagram", "twitter", "facebook", "tiktok", "pinterest"],
        tone: "warm and inviting",
        include_emojis: true,
        max_hashtags: 10,
      });

      toast({
        title: "✨ Magic in progress!",
        description: "Our AI chef is cooking up some content for you.",
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['wprm-recipes'] });
        queryClient.invalidateQueries({ queryKey: ['wprm-review'] });
        setGeneratingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipeId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      setGeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipeId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['wprm-recipes'] });
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    }
  };

  // --- Render ---

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-primary/50" />
        </motion.div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading your cookbook...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-red-500">
        <XCircle className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold">Something went wrong</h3>
        <p className="text-muted-foreground mt-2">Failed to load recipes. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 mb-12 shadow-sm border border-white/20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl mix-blend-multiply filter pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl mix-blend-multiply filter pointer-events-none" />

        <div className="relative z-10 px-8 py-16 md:py-24 text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4 font-serif">
              Tori's Kitchen <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Assistant</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Manage your recipes, generate social content, and share your culinary creations with the world.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-xl group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500" />
              <div className="relative flex items-center bg-white rounded-full shadow-lg overflow-hidden p-1.5 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all">
                <Search className="h-5 w-5 text-gray-400 ml-3" />
                <input
                  className="flex-1 w-full border-none bg-transparent px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                  placeholder="Search by title, ingredients, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {isSearchMode && (
                  <button onClick={clearSearch} className="p-2 hover:bg-gray-100 rounded-full mr-1 transition-colors">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
                <Button
                  onClick={handleSearch}
                  className="rounded-full px-6 bg-gray-900 hover:bg-gray-800 text-white shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  Search
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Try searching:</span>
            <Badge variant="secondary" className="cursor-pointer hover:bg-white/80 transition-colors" onClick={() => { setSearchQuery("Chicken"); handleSearch(); }}>Chicken</Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-white/80 transition-colors" onClick={() => { setSearchQuery("Vegan"); handleSearch(); }}>Vegan</Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-white/80 transition-colors" onClick={() => { setSearchQuery("Dessert"); handleSearch(); }}>Dessert</Badge>
          </div>
        </div>
      </div>

      {/* Results Count & Pagination */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground font-medium">
            {isSearchMode ? (
              <>Found <span className="text-foreground font-bold">{totalCount}</span> results for "<span className="italic">{searchQuery}</span>" (showing {recipes.length})</>
            ) : (
              <>Displaying <span className="text-foreground font-bold">{recipes.length}</span> of <span className="text-foreground font-bold">{totalCount}</span> recipes</>
            )}
          </p>

          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-full border shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 px-3"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0 || isFetching}
            >
              Previous
            </Button>
            <span className="text-xs font-medium px-2 min-w-[3rem] text-center flex items-center gap-1">
              {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
              {Math.floor(offset / limit) + 1} / {Math.ceil(totalCount / limit)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 px-3"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= totalCount || isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {recipes.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {recipes.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  layoutId={`recipe-${recipe.id}`}
                  className="group"
                >
                  <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-sm">
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {recipe.image_url ? (
                        <div className="w-full h-full relative">
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <Utensils className="h-16 w-16 text-slate-300" />
                        </div>
                      )}

                      {/* Floating Status Badge */}
                      <div className="absolute top-4 right-4 z-10 shadow-lg">
                        <StatusBadge content_status={recipe.content_status} />
                      </div>

                      {/* Bottom Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                        <h3 className="text-xl font-bold font-serif leading-tight line-clamp-2 mb-2 text-shadow-sm">
                          {recipe.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                          {recipe.prep_time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span>{recipe.prep_time}m</span>
                            </div>
                          )}
                          {recipe.nutrition?.calories && (
                            <div className="flex items-center gap-1.5">
                              <Flame className="h-4 w-4" />
                              <span>{recipe.nutrition.calories} kcal</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover Action Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="flex gap-3 scale-90 group-hover:scale-100 transition-transform duration-300 delay-75">
                          {(!recipe.content_status || recipe.content_status?.status === "not_generated") && (
                            <Button
                              onClick={() => generateContent(recipe.id)}
                              className="bg-white text-black hover:bg-purple-50 shadow-xl border-none"
                              size="lg"
                            >
                              <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                              Generate Magic
                            </Button>
                          )}
                          {recipe.content_status?.status === "generated" && (
                            <Button
                              onClick={() => window.location.href = `/cms/review?recipe_id=${recipe.id}`}
                              className="bg-white text-black hover:bg-blue-50 shadow-xl border-none"
                              size="lg"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                              Review Content
                            </Button>
                          )}
                          {recipe.content_status?.status === "pending" && (
                            <span className="bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Ready
                            </span>
                          )}
                          <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full shadow-lg"
                            onClick={() => { }} // Could be a quick preview
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-5 pt-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {recipe.summary || "No description available for this recipe."}
                      </p>

                      {/* Tags/Pills */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                          {recipe.servings || "?"} {recipe.servings_unit || "Servings"}
                        </Badge>
                        {/* We could add more tags here if available */}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Search className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No recipes found</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                We couldn't find any recipes matching your search. Try different keywords or browse the full collection.
              </p>
              <Button onClick={clearSearch} variant="outline" className="mt-6">
                Clear Search
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
