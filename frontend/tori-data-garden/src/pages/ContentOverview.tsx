import { Sparkles, TrendingUp, Users2, CalendarDays, Zap, UploadCloud, Video, Image, FileText } from "lucide-react";
import { useState, useRef } from "react";

const metrics = [
  {
    title: "Total Posts",
    value: "127",
    delta: "+12%",
    icon: TrendingUp,
    accent: "gradient-primary",
  },
  {
    title: "Total Reach",
    value: "45.2K",
    delta: "+23%",
    icon: Users2,
    accent: "gradient-accent",
  },
  {
    title: "Scheduled",
    value: "34",
    delta: "+8%",
    icon: CalendarDays,
    accent: "gradient-secondary",
  },
  {
    title: "AI Generated",
    value: "89",
    delta: "+45%",
    icon: Zap,
    accent: "gradient-primary",
  },
];

const platforms = ["Instagram", "Facebook", "X", "Pinterest", "YouTube"];
const tones = ["Educational", "Conversational", "Promotional", "Inspirational"];

export default function ContentOverview() {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="glass-card gradient-subtle p-8 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Content Overview</h1>
              <p className="text-lg text-muted-foreground">AI-powered creation and scheduling across every platform</p>
            </div>
          </div>
          <button className="rounded-3xl gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow">
            Launch New Campaign
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ title, value, delta, icon: Icon, accent }) => (
          <article key={title} className="glass-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent} text-white shadow-soft`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-3xl font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-emerald-500">{delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="glass-card p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-soft">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">AI Caption Generator</h2>
              <p className="text-sm text-muted-foreground">Generate engaging captions instantly</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform === selectedPlatform ? "" : platform)}
                    className={
                      platform === selectedPlatform && selectedPlatform !== ""
                        ? "chip-accent"
                        : "chip-muted hover:text-foreground"
                    }
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tone</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {tones.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone === selectedTone ? "" : tone)}
                    className={
                      tone === selectedTone && selectedTone !== ""
                        ? "chip-accent"
                        : "chip-muted hover:text-foreground"
                    }
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content Description</h3>
              <textarea
                className="mt-3 w-full rounded-3xl border border-[#22c55e] bg-white/80 p-4 text-sm text-foreground shadow-sm backdrop-blur-sm placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                placeholder="Describe your content... (e.g., 'A delicious chocolate cake recipe with strawberries')"
                rows={4}
              />
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-3xl gradient-primary py-4 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow">
              <Sparkles className="h-4 w-4" /> Generate Captions
            </button>
          </div>
        </article>

        <article className="glass-card p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-secondary text-white shadow-soft">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Video Repurposing</h2>
              <p className="text-sm text-muted-foreground">Transform your videos into multiple formats</p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border-2 border-dashed border-white/60 bg-white/70 p-8 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#22c55e] shadow-soft">
                <Video className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Drag & drop your video here, or click to browse</p>
            <p className="text-xs text-muted-foreground/80">Supports MP4, MOV, AVI, and other video formats</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.type.startsWith('video/')) {
                  setSelectedVideo(file);
                }
              }}
              accept="video/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 inline-flex items-center justify-center rounded-3xl gradient-secondary px-6 py-3 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow"
            >
              Browse Files
            </button>
          </div>

          {selectedVideo && (
            <div className="mt-6 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#22c55e] shadow-soft">
                    <Video className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{selectedVideo.name}</p>
                    <p className="text-xs text-muted-foreground">Ready for repurposing</p>
                  </div>
                </div>
                <div className="flex w-full items-center gap-3 lg:w-auto">
                  <div className="h-2 flex-1 rounded-full bg-muted/60 lg:w-40">
                    <div className="h-2 rounded-full gradient-primary" style={{ width: "100%" }} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">Ready</span>
                </div>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
