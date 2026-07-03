import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Instagram, Twitter, Facebook, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { apiPost } from "@/lib/api";

const CMS_BACKEND_URL = import.meta.env.VITE_CMS_BACKEND_URL || "http://localhost:7000";

interface RecipeData {
  title: string;
  description: string;
  url: string;
  image_url: string;
  ingredients: string[];
  instructions: string[];
  prep_time: string;
  cook_time: string;
  servings: string;
  cuisine: string;
  category: string;
  tags: string[];
}

interface GeneratedContent {
  platform: string;
  caption: string;
  hashtags: string[];
  platform_specific: {
    hook: string;
    cta: string;
    key_highlight: string;
  };
  image_suggestions: string[];
  alternative_captions: string[];
  selected_caption_index: number;
}

export default function ContentGeneration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recipeData, setRecipeData] = useState<Partial<RecipeData>>({
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [tone, setTone] = useState("warm and inviting");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);

  const platforms = [
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
    { id: "twitter", name: "Twitter", icon: Twitter, color: "text-blue-400" },
    { id: "threads", name: "Threads", icon: Instagram, color: "text-black" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  ];

  const handleGenerate = async () => {
    if (!recipeData.title) {
      toast({
        title: "Error",
        description: "Please enter at least a recipe title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost<any>("/api/content/generate", {
        recipe_data: {
          title: recipeData.title,
          description: recipeData.description || "",
          url: recipeData.url || "",
          image_url: recipeData.image_url || "",
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          prep_time: recipeData.prep_time || "",
          cook_time: recipeData.cook_time || "",
          servings: recipeData.servings || "",
          cuisine: recipeData.cuisine || "",
          category: recipeData.category || "",
          tags: recipeData.tags || [],
        },
        target_platforms: selectedPlatforms,
        tone: tone,
        include_emojis: includeEmojis,
        max_hashtags: 10,
      });

      setGeneratedContent(data.generated_contents);

      toast({
        title: "Success!",
        description: `Generated content for ${data.total_generated} platform(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const selectAlternativeCaption = (platformIndex: number, captionIndex: number) => {
    const updatedContent = [...generatedContent];
    const platform = updatedContent[platformIndex];
    const allCaptions = [platform.caption, ...platform.alternative_captions];

    if (captionIndex < allCaptions.length) {
      platform.caption = allCaptions[captionIndex];
      platform.selected_caption_index = captionIndex;
      setGeneratedContent(updatedContent);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Content Generation</h1>
        <p className="text-muted-foreground mt-2">
          Generate engaging social media content from your recipes using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Input */}
        <Card>
          <CardHeader>
            <CardTitle>Recipe Information</CardTitle>
            <CardDescription>Enter your recipe details to generate content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Recipe Title *</Label>
              <Input
                id="title"
                placeholder="Classic Chocolate Chip Cookies"
                value={recipeData.title}
                onChange={(e) => setRecipeData({ ...recipeData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="The best chocolate chip cookies with crispy edges and chewy centers..."
                value={recipeData.description}
                onChange={(e) => setRecipeData({ ...recipeData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prep_time">Prep Time</Label>
                <Input
                  id="prep_time"
                  placeholder="15 minutes"
                  value={recipeData.prep_time}
                  onChange={(e) => setRecipeData({ ...recipeData, prep_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cook_time">Cook Time</Label>
                <Input
                  id="cook_time"
                  placeholder="12 minutes"
                  value={recipeData.cook_time}
                  onChange={(e) => setRecipeData({ ...recipeData, cook_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                placeholder="24 cookies"
                value={recipeData.servings}
                onChange={(e) => setRecipeData({ ...recipeData, servings: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Content Settings</CardTitle>
            <CardDescription>Customize your generated content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Platforms</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.includes(platform.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                      }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <platform.icon className={`h-4 w-4 ${platform.color}`} />
                    <Label className="cursor-pointer">{platform.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="tone">Tone</Label>
              <Input
                id="tone"
                placeholder="warm and inviting"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                e.g., warm and inviting, professional, fun and playful
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emojis"
                checked={includeEmojis}
                onCheckedChange={(checked) => setIncludeEmojis(checked as boolean)}
              />
              <Label htmlFor="emojis" className="cursor-pointer">
                Include Emojis
              </Label>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Generated Content</h2>
          {generatedContent.map((content, index) => {
            const platformInfo = platforms.find((p) => p.id === content.platform);
            const allCaptions = [content.caption, ...content.alternative_captions];

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {platformInfo && <platformInfo.icon className={`h-5 w-5 ${platformInfo.color}`} />}
                    <CardTitle className="capitalize">{content.platform}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Caption Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Select Caption:</Label>
                    <div className="space-y-2">
                      {allCaptions.map((caption, captionIndex) => (
                        <div
                          key={captionIndex}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${content.selected_caption_index === captionIndex
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => selectAlternativeCaption(index, captionIndex)}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={content.selected_caption_index === captionIndex}
                              onCheckedChange={() => selectAlternativeCaption(index, captionIndex)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {captionIndex === 0 ? (
                                  <Badge variant="default">Main Caption</Badge>
                                ) : (
                                  <Badge variant="secondary">Alternative {captionIndex}</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {caption.length} chars
                                </span>
                              </div>
                              <p className="text-sm">{caption}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Hashtags:</Label>
                    <div className="flex flex-wrap gap-2">
                      {content.hashtags.map((tag, i) => (
                        <Badge key={i} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Platform Specific Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Hook</p>
                      <p className="text-sm font-medium">{content.platform_specific.hook}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">CTA</p>
                      <p className="text-sm font-medium">{content.platform_specific.cta}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Highlight</p>
                      <p className="text-sm font-medium">{content.platform_specific.key_highlight}</p>
                    </div>
                  </div>

                  {/* Image Suggestions */}
                  {content.image_suggestions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Image Suggestions:</Label>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {content.image_suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
