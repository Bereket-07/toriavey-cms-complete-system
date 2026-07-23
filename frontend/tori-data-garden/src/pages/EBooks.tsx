import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Download,
  Loader2,
  CalendarDays,
  Wand2,
  FileText,
  CheckCircle2,
  RefreshCw,
  Search,
  History,
  Check,
} from "lucide-react";

import { PageHero } from "@/components/studio";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  fetchEbookTopics,
  generateEbook,
  downloadEbook,
  fetchRecipeChoices,
  type GenerateEbookResponse,
  type EbookTopicSuggestion,
  type RecipeChoice,
} from "@/lib/ebooks";

const TONE_PRESETS = [
  { value: "warm, personal, and story-driven", label: "Warm & story-driven" },
  { value: "elegant and refined", label: "Elegant & refined" },
  { value: "playful and casual", label: "Playful & casual" },
  {
    value: "professional and informative",
    label: "Professional & informative",
  },
];

const COVER_THEMES: Record<
  string,
  { label: string; bg: string; fg: string; accent: string; swatch: string }
> = {
  olive: {
    label: "Olive",
    bg: "linear-gradient(160deg,#6E7F4A 0%,#46532E 100%)",
    fg: "#F3EEE2",
    accent: "#E0A76A",
    swatch: "#6E7F4A",
  },
  terracotta: {
    label: "Terracotta",
    bg: "linear-gradient(160deg,#C46B4A 0%,#8A3F26 100%)",
    fg: "#FBEFE6",
    accent: "#D6DFB8",
    swatch: "#C46B4A",
  },
  cream: {
    label: "Cream",
    bg: "linear-gradient(160deg,#F3EDE1 0%,#E4D6C0 100%)",
    fg: "#3E4A2A",
    accent: "#C46B4A",
    swatch: "#E8DCC4",
  },
  midnight: {
    label: "Midnight",
    bg: "linear-gradient(160deg,#28241E 0%,#151310 100%)",
    fg: "#EDE6D6",
    accent: "#9BB068",
    swatch: "#28241E",
  },
};

type HistoryItem = {
  title: string;
  filename: string;
  recipe_count: number;
  file_size_bytes: number;
  created_at: string;
  cover_style: string;
};
const HISTORY_KEY = "toriavey_ebook_history";

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    /* ignore */
  }
}
function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------------- Live book-cover preview ---------------- */
function CoverPreview({
  title,
  subtitle,
  author,
  recipeCount,
  themeKey,
  label,
}: {
  title: string;
  subtitle: string;
  author: string;
  recipeCount: number;
  themeKey: string;
  label: string;
}) {
  const theme = COVER_THEMES[themeKey] || COVER_THEMES.olive;
  return (
    <div
      className="relative mx-auto w-full max-w-[260px] aspect-[3/4] rounded-r-lg rounded-l-sm overflow-hidden select-none"
      style={{
        background: theme.bg,
        color: theme.fg,
        boxShadow:
          "0 24px 48px -12px rgba(40,36,30,0.45), 0 8px 16px -8px rgba(40,36,30,0.3)",
      }}
    >
      {/* spine */}
      <div
        className="absolute inset-y-0 left-0 w-3"
        style={{
          background: "rgba(0,0,0,0.18)",
          boxShadow: "inset -3px 0 6px rgba(0,0,0,0.15)",
        }}
      />
      {/* decorative ring */}
      <div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
        style={{ border: `1px solid ${theme.accent}`, opacity: 0.35 }}
      />
      <div
        className="absolute -right-6 -top-6 h-28 w-28 rounded-full"
        style={{ border: `1px solid ${theme.accent}`, opacity: 0.25 }}
      />

      <div className="relative z-10 flex h-full flex-col p-6 pl-7">
        <div
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: theme.accent }}
        >
          {label || "A Recipe Collection"}
        </div>
        <div className="mt-auto">
          <h3
            className="font-display font-semibold leading-[1.08] tracking-tight"
            style={{ fontSize: title.length > 22 ? 24 : 30 }}
          >
            {title || "Untitled Collection"}
          </h3>
          {subtitle && (
            <p className="mt-2 text-sm opacity-85 leading-snug">{subtitle}</p>
          )}
          <div
            className="mt-4 h-px w-14"
            style={{ background: theme.accent }}
          />
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest opacity-70">
                By
              </div>
              <div className="font-display text-base">
                {author || "Tori Avey"}
              </div>
            </div>
            <div className="text-right text-[11px] uppercase tracking-widest opacity-70">
              {recipeCount} recipes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function EBooks() {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("Tori Avey");
  const [tone, setTone] = useState(TONE_PRESETS[0].value);
  const [mode, setMode] = useState<"topic" | "pick">("topic");
  const [topic, setTopic] = useState("");
  const [maxRecipes, setMaxRecipes] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [includeNutrition, setIncludeNutrition] = useState(true);
  const [coverStyle, setCoverStyle] = useState("olive");
  const [result, setResult] = useState<GenerateEbookResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const topicsQuery = useQuery({
    queryKey: ["ebook-topics"],
    queryFn: () => fetchEbookTopics(60),
    staleTime: 1000 * 60 * 30,
  });

  const recipesQuery = useQuery({
    queryKey: ["ebook-recipe-choices"],
    queryFn: () => fetchRecipeChoices(40),
    staleTime: 1000 * 60 * 10,
  });

  const filteredRecipes = useMemo<RecipeChoice[]>(() => {
    const all = recipesQuery.data || [];
    const q = recipeSearch.trim().toLowerCase();
    return q ? all.filter((r) => r.title.toLowerCase().includes(q)) : all;
  }, [recipesQuery.data, recipeSearch]);

  const recipeCount = mode === "pick" ? selected.length || 0 : maxRecipes;

  const toggleRecipe = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const generateMutation = useMutation({
    mutationFn: () =>
      generateEbook({
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        topic: mode === "topic" ? topic.trim() || undefined : undefined,
        recipe_ids: mode === "pick" && selected.length ? selected : undefined,
        max_recipes: mode === "topic" ? maxRecipes : undefined,
        author: author.trim() || "Tori Avey",
        tone,
        include_nutrition: includeNutrition,
        cover_style: coverStyle,
        format: "pdf",
      }),
    onSuccess: (data) => {
      setResult(data);
      const item: HistoryItem = {
        title: data.title,
        filename: data.filename,
        recipe_count: data.recipe_count,
        file_size_bytes: data.file_size_bytes,
        created_at: new Date().toISOString(),
        cover_style: coverStyle,
      };
      const next = [item, ...history].slice(0, 12);
      setHistory(next);
      saveHistory(next);
      toast({
        title: "E-book ready",
        description: `“${data.title}” — ${data.recipe_count} recipes.`,
      });
    },
    onError: (err: unknown) =>
      toast({
        title: "Generation failed",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      }),
  });

  const downloadMutation = useMutation({
    mutationFn: (filename: string) => downloadEbook(filename),
    onError: (err: unknown) =>
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Could not download.",
        variant: "destructive",
      }),
  });

  const isGenerating = generateMutation.isPending;
  const applyTopic = (s: EbookTopicSuggestion) => {
    setTopic(s.topic);
    if (!title) setTitle(s.topic);
  };
  const canGenerate =
    mode === "topic" ? topic.trim().length > 0 || true : selected.length > 0;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHero
        eyebrow="Publishing"
        title="E-Books"
        subtitle="Turn your recipe library into a beautifully typeset PDF e-book, with AI-drafted forewords and headnotes."
        icon={BookOpen}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* -------- Builder -------- */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-2xl">
                <Wand2 className="h-5 w-5 text-[#7C3AED]" /> Build a new e-book
              </CardTitle>
              <CardDescription>
                Set the details, choose recipes by topic or hand-pick them, then
                pick a cover.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="eb-title">Title</Label>
                  <Input
                    id="eb-title"
                    placeholder="A Hanukkah Table"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eb-sub">Subtitle</Label>
                  <Input
                    id="eb-sub"
                    placeholder="Recipes for the Festival of Lights"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eb-author">Author</Label>
                  <Input
                    id="eb-author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Editorial tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_PRESETS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Recipe selection */}
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as "topic" | "pick")}
              >
                <TabsList className="grid grid-cols-2 w-full max-w-sm">
                  <TabsTrigger
                    value="topic"
                    className="transition-colors data-[state=inactive]:hover:bg-[#7C3AED]/10 data-[state=inactive]:hover:text-[#7C3AED] data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
                  >
                    By topic
                  </TabsTrigger>
                  <TabsTrigger
                    value="pick"
                    className="transition-colors data-[state=inactive]:hover:bg-[#7C3AED]/10 data-[state=inactive]:hover:text-[#7C3AED] data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white"
                  >
                    Choose recipes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="topic" className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="eb-topic">Topic</Label>
                    <Input
                      id="eb-topic"
                      placeholder="Passover, Comfort Soups, Summer Grilling…"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topicsQuery.isLoading &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-7 w-28 rounded-full" />
                      ))}
                    {topicsQuery.data?.suggestions?.map((s) => (
                      <button
                        key={`${s.topic}-${s.holiday_date ?? ""}`}
                        onClick={() => applyTopic(s)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-smooth",
                          topic === s.topic
                            ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        {s.topic}
                        {s.estimated_recipe_matches != null
                          ? ` · ~${s.estimated_recipe_matches}`
                          : ""}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 pt-1">
                    <div className="flex items-center justify-between">
                      <Label>Max recipes</Label>
                      <span className="text-sm font-semibold text-[#7C3AED] tabular-nums">
                        {maxRecipes}
                      </span>
                    </div>
                    <Slider
                      value={[maxRecipes]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(v) => setMaxRecipes(v[0])}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="pick" className="space-y-3 pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your recipes…"
                      className="pl-9"
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selected.length} selected
                    </span>
                    {selected.length > 0 && (
                      <button
                        className="text-[#7C3AED] font-medium hover:underline"
                        onClick={() => setSelected([])}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <ScrollArea className="h-72 rounded-xl border border-border">
                    <div className="grid sm:grid-cols-2 gap-2 p-2">
                      {recipesQuery.isLoading &&
                        Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className="h-16 w-full rounded-lg"
                          />
                        ))}
                      {filteredRecipes.map((r) => {
                        const on = selected.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            onClick={() => toggleRecipe(r.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-2 text-left transition-smooth",
                              on
                                ? "border-[#7C3AED] ring-1 ring-[#7C3AED] bg-[#7C3AED]/[0.06]"
                                : "border-border bg-card hover:bg-muted",
                            )}
                          >
                            <img
                              src={r.image_url}
                              alt=""
                              className="h-11 w-11 rounded-md object-cover bg-muted shrink-0"
                              loading="lazy"
                            />
                            <span className="flex-1 text-sm font-medium text-foreground line-clamp-2 leading-snug">
                              {r.title}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 h-5 w-5 rounded-full border flex items-center justify-center",
                                on
                                  ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                                  : "border-border",
                              )}
                            >
                              {on && <Check className="h-3.5 w-3.5" />}
                            </span>
                          </button>
                        );
                      })}
                      {!recipesQuery.isLoading &&
                        filteredRecipes.length === 0 && (
                          <p className="col-span-full text-sm text-muted-foreground p-4 text-center">
                            No recipes match “{recipeSearch}”.
                          </p>
                        )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Style & options */}
              <div className="space-y-3">
                <Label>Cover style</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(COVER_THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setCoverStyle(key)}
                      className={cn(
                        "group rounded-lg border p-1.5 transition-smooth",
                        coverStyle === key
                          ? "border-[#7C3AED] ring-1 ring-[#7C3AED]"
                          : "border-border hover:border-[#7C3AED]/50",
                      )}
                    >
                      <div
                        className="h-10 w-full rounded-md"
                        style={{ background: t.bg }}
                      />
                      <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                        {t.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div>
                  <Label htmlFor="eb-nutrition" className="cursor-pointer">
                    Include nutrition summary
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Shown per recipe when data is available.
                  </p>
                </div>
                <Switch
                  id="eb-nutrition"
                  checked={includeNutrition}
                  onCheckedChange={setIncludeNutrition}
                />
              </div>

              <Button
                size="lg"
                className="w-full gap-2 text-base bg-[#7C3AED] hover:bg-[#6D28D9]"
                disabled={isGenerating || !canGenerate}
                onClick={() => generateMutation.mutate()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Generating your
                    e-book…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" /> Generate e-book
                  </>
                )}
              </Button>
              {mode === "pick" && selected.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Select at least one recipe, or switch to “By topic”.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* -------- Preview / result / history -------- */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24">
          <Card className="border-border overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Sparkles className="h-4 w-4 text-[#7C3AED]" /> Live preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-2">
                <CoverPreview
                  title={title}
                  subtitle={subtitle}
                  author={author}
                  recipeCount={recipeCount}
                  themeKey={coverStyle}
                  label={mode === "topic" ? topic : "A Recipe Collection"}
                />
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                <Card className="border-[#7C3AED]/30 bg-gradient-to-br from-card to-muted/40">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-[hsl(var(--success))] text-sm font-semibold mb-1">
                      <CheckCircle2 className="h-4 w-4" /> E-book generated
                    </div>
                    <h3 className="text-xl font-display font-semibold text-foreground leading-tight">
                      {result.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">
                        {result.recipe_count} recipes
                      </Badge>
                      <Badge variant="secondary">
                        {result.format.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">
                        {formatBytes(result.file_size_bytes)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9]"
                        disabled={downloadMutation.isPending}
                        onClick={() => downloadMutation.mutate(result.filename)}
                      >
                        {downloadMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}{" "}
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setResult(null)}
                      >
                        <RefreshCw className="h-4 w-4" /> New
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {history.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <History className="h-4 w-4 text-[#7C3AED]" /> Recent e-books
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={`${h.filename}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
                  >
                    <div
                      className="h-9 w-7 rounded-sm shrink-0"
                      style={{
                        background: (
                          COVER_THEMES[h.cover_style] || COVER_THEMES.olive
                        ).bg,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {h.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {h.recipe_count} recipes ·{" "}
                        {new Date(h.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-8 w-8"
                      title="Download"
                      onClick={() => downloadMutation.mutate(h.filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
