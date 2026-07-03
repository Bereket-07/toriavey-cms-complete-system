import { Sparkles, Wand2, Heart } from "lucide-react";
import { useState } from "react";

const platforms = ["Instagram", "Facebook", "X", "Pinterest", "YouTube"];
const tones = ["Educational", "Conversational", "Promotional", "Inspirational", "Humorous", "Professional"];

export default function DailySuggestions() {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedTone, setSelectedTone] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [favoritedCaptions, setFavoritedCaptions] = useState<Set<number>>(new Set());
  const [captionHistory, setCaptionHistory] = useState<any[]>([
    {
      id: 1,
      platform: "Instagram",
      tone: "Conversational",
      caption: "Just whipped up this chocolate cake recipe that will blow your mind! 🍫🎂 The secret ingredient? A touch of espresso that takes it to another level. Who's trying this tonight? #ChocolateCake #BakingAdventure #HomeBaker",
      timestamp: "2 hours ago",
      likes: 247,
      comments: 23
    },
    {
      id: 2,
      platform: "YouTube",
      tone: "Educational",
      caption: "Learn how to bake the perfect chocolate cake from scratch! In this tutorial, I'll show you step-by-step how to create moist, decadent chocolate cake that will impress your friends and family. From mixing the batter to frosting the final product! 👩‍🍳 #BakingTutorial #ChocolateCake #DessertRecipe",
      timestamp: "1 day ago",
      views: 1200,
      comments: 89
    },
    {
      id: 3,
      platform: "Facebook",
      tone: "Promotional",
      caption: "🎉 Limited time offer! Get 30% off our premium baking course featuring 50+ recipes including this amazing chocolate cake! Use code CHOCOLATE30 at checkout. Perfect for beginners and experienced bakers alike. Link in bio! 🍰✨ #BakingCourse #ChocolateLovers #LearnToBake",
      timestamp: "3 days ago",
      likes: 156,
      shares: 12
    }
  ]);

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Instagram": return "bg-[#22c55e]/10 text-[#22c55e]";
      case "Facebook": return "bg-blue-100 text-blue-700";
      case "YouTube": return "bg-red-100 text-red-700";
      case "X": return "bg-gray-100 text-gray-700";
      case "Pinterest": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case "Conversational": return "bg-blue-100 text-blue-700";
      case "Educational": return "bg-purple-100 text-purple-700";
      case "Promotional": return "bg-orange-100 text-orange-700";
      case "Inspirational": return "bg-pink-100 text-pink-700";
      case "Humorous": return "bg-yellow-100 text-yellow-700";
      case "Professional": return "bg-indigo-100 text-indigo-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const generateCaptions = async () => {
    if (!contentDescription.trim()) return;

    setIsGenerating(true);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate demo captions based on platform, tone, and content
    const demoCaptions = [
      `🚀 ${contentDescription} - This is absolutely game-changing! The results speak for themselves. Who's ready to try this? #Innovation #MustTry`,
      `✨ Transform your routine with ${contentDescription.toLowerCase()}! I've been amazed by how much of a difference this makes. The before and after is incredible! #LifeChanging #Results`,
      `💫 Just discovered ${contentDescription.toLowerCase()} and I'm obsessed! This is exactly what I needed. The quality and attention to detail is outstanding. Highly recommend! #GameChanger #QualityMatters`
    ];

    setGeneratedCaptions(demoCaptions);
    setIsGenerating(false);
  };

  const addToHistory = (caption: string, optionIndex: number) => {
    // Mark as favorited
    setFavoritedCaptions(prev => new Set([...prev, optionIndex]));

    const newHistoryItem = {
      id: Date.now(),
      platform: selectedPlatform || "Instagram",
      tone: selectedTone || "Conversational",
      caption: caption,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      option: `Option ${optionIndex + 1}`
    };

    setCaptionHistory(prev => [newHistoryItem, ...prev]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-2 sm:px-4 lg:px-8">
      <section className="glass-card gradient-subtle p-4 sm:p-6 lg:p-8 shadow-soft w-full">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow flex-shrink-0">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">AI Caption Generator</h1>
            <p className="text-base sm:text-lg text-muted-foreground">Generate engaging captions in seconds</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="glass-card p-4 sm:p-6 lg:p-8 shadow-soft w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-soft flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold break-words">Configure Your Caption</h2>
              <p className="text-sm text-muted-foreground">Pick your platform, tone, and describe your content.</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target Platform</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform === selectedPlatform ? "" : platform)}
                    className={`px-3 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                      platform === selectedPlatform && selectedPlatform !== ""
                        ? "chip-accent"
                        : "chip-muted hover:text-foreground"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content Tone</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {tones.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone === selectedTone ? "" : tone)}
                    className={`px-3 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                      tone === selectedTone && selectedTone !== ""
                        ? "chip-accent"
                        : "chip-muted hover:text-foreground"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content Description</h3>
              <textarea
                rows={6}
                placeholder="Describe your content in detail... Example: 'A step-by-step chocolate cake recipe video showing baking techniques, ending with a slice reveal'"
                value={contentDescription}
                onChange={(e) => setContentDescription(e.target.value)}
                className="mt-3 w-full rounded-3xl border border-[#22c55e] bg-white/80 p-4 text-sm text-foreground shadow-sm backdrop-blur-sm placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
              />
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Tip: Be specific about what's in your content for better results
              </p>
            </div>

            <button 
              onClick={generateCaptions}
              disabled={isGenerating || !contentDescription.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-3xl gradient-primary py-4 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="h-4 w-4" /> {isGenerating ? "Generating..." : "Generate 3 Captions"}
            </button>
          </div>
        </section>

        <section className="glass-card p-4 sm:p-6 lg:p-8 shadow-soft w-full">
          <h2 className="text-lg sm:text-xl font-semibold">Generated Captions</h2>
          <div className="mt-6 sm:mt-8">
            {isGenerating ? (
              <div className="flex h-[200px] sm:h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/50 bg-white/60 text-center backdrop-blur-sm">
                <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-3xl bg-white text-[#22c55e] shadow-soft">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-muted-foreground">Generating your captions...</p>
                <p className="mt-2 text-xs text-muted-foreground/80">This may take a few seconds</p>
              </div>
            ) : generatedCaptions.length > 0 ? (
              <div className="space-y-4">
                {generatedCaptions.map((caption, index) => (
                  <article key={index} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center rounded-full bg-[#22c55e]/10 px-2.5 py-0.5 text-xs font-medium text-[#22c55e]">
                            Option {index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{caption}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button className="rounded-2xl border border-white/60 bg-white/60 p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => addToHistory(caption, index)}
                          className={`rounded-2xl border border-white/60 p-2 transition-colors ${
                            favoritedCaptions.has(index)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/60 text-muted-foreground hover:text-red-500'
                          }`}
                        >
                          <Heart
                            size={16}
                            className={favoritedCaptions.has(index) ? 'fill-current' : ''}
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/50 bg-white/60 text-center backdrop-blur-sm">
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#22c55e] shadow-soft">
                  <Wand2 className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-medium text-muted-foreground">Your AI-generated captions will appear here</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="glass-card p-4 sm:p-6 lg:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-soft flex-shrink-0">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold break-words">Caption History</h2>
            <p className="text-sm text-muted-foreground">Previously generated captions and their performance</p>
          </div>
        </div>

        <div className="space-y-4">
          {captionHistory.map((item) => (
            <article key={item.id} className="rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getPlatformColor(item.platform)}`}>
                      {item.platform}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getToneColor(item.tone)}`}>
                      {item.tone}
                    </span>
                    {item.option && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                        {item.option}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground mb-3">
                    {item.caption}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {item.likes !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {item.likes} likes
                      </span>
                    )}
                    {item.comments !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {item.comments} comments
                      </span>
                    )}
                    {item.views !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {item.views}K views
                      </span>
                    )}
                    {item.shares !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.shares} shares
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="rounded-2xl border border-white/60 bg-white/60 p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="rounded-2xl border border-white/60 bg-white/60 p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button className="inline-flex items-center gap-2 rounded-3xl border border-white/60 bg-white/60 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Load More History
          </button>
        </div>
      </section>
    </div>
  );
}
