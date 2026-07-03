import { Video, Play, Scissors, Upload, Settings, Eye, Heart, Share2, Download, ArrowLeft, Wand2, Clock, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const mockClips = [
  {
    id: 1,
    title: "Recipe Introduction",
    duration: "0:15",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=120&fit=crop",
    status: "ready",
    platforms: ["Instagram", "TikTok", "YouTube"]
  },
  {
    id: 2,
    title: "Ingredient Preparation",
    duration: "0:22",
    thumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=120&fit=crop",
    status: "processing",
    platforms: ["Instagram", "Facebook"]
  },
  {
    id: 3,
    title: "Cooking Process",
    duration: "0:18",
    thumbnail: "https://images.unsplash.com/photo-1556909114-4c36e03f6b8f?w=200&h=120&fit=crop",
    status: "ready",
    platforms: ["TikTok", "Instagram"]
  },
  {
    id: 4,
    title: "Final Presentation",
    duration: "0:12",
    thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=120&fit=crop",
    status: "ready",
    platforms: ["YouTube", "Instagram"]
  }
];

export default function VideoRepurposing() {
  const navigate = useNavigate();
  const location = useLocation();
  const videoData = location.state?.video;

  const [isProcessing, setIsProcessing] = useState(false);
  const [clips, setClips] = useState(mockClips);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [approvedVideos, setApprovedVideos] = useState<any[]>([]);

  const handleGenerateClips = () => {
    setIsProcessing(true);
    // Simulate Vizard.io processing
    setTimeout(() => {
      setIsProcessing(false);
      setClips(clips.map(clip => ({ ...clip, status: "ready" })));
    }, 3000);
  };

  const handleClipClick = (clip: any) => {
    setSelectedClip(clip);
  };

  const handleApproveClip = (clip: any) => {
    const approvedVideo = {
      ...clip,
      originalVideo: videoData,
      approvedAt: new Date().toISOString(),
      status: 'approved'
    };

    // Save to localStorage for persistence
    const existingApproved = JSON.parse(localStorage.getItem('approvedVideos') || '[]');
    const updatedApproved = [...existingApproved, approvedVideo];
    localStorage.setItem('approvedVideos', JSON.stringify(updatedApproved));

    setApprovedVideos(updatedApproved);

    // Remove from clips list
    setClips(clips.filter(c => c.id !== clip.id));

    // Show success message (you could add a toast here)
    alert(`${clip.title} has been approved and moved to Approved Videos!`);
  };

  const handleRejectClip = (clip: any) => {
    // Remove from clips list
    setClips(clips.filter(c => c.id !== clip.id));

    // Show rejection message
    alert(`${clip.title} has been rejected.`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <section className="glass-card gradient-subtle p-8 shadow-soft">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Repurposing Studio</h1>
            <p className="text-muted-foreground">Transform your video into engaging clips with Vizard.io</p>
          </div>
        </div>

        {/* Video Preview */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
          <div className="flex items-start gap-6">
            <div className="relative">
              <img
                src={videoData?.thumbnail || "https://images.unsplash.com/photo-1551782450-17144efb5723?w=320&h=180&fit=crop"}
                alt="Video thumbnail"
                className="h-32 w-48 rounded-2xl object-cover shadow-soft"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                  <Play size={20} />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{videoData?.title || "Selected Video"}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {videoData?.duration || "15:32"}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {videoData?.views || "1.2K"} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={14} />
                  {videoData?.likes || "247"} likes
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  videoData?.source === 'WordPress'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {videoData?.source || "Source"}
                </span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Ready for Repurposing
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Vizard.io Integration Panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* Processing Controls */}
          <section className="glass-card p-6 shadow-soft">
            <h2 className="text-xl font-semibold mb-4">AI-Powered Repurposing</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clip Duration</label>
                  <select className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 p-3 text-sm shadow-sm backdrop-blur-sm focus:border-[#22c55e] focus:outline-none">
                    <option>15 seconds</option>
                    <option>30 seconds</option>
                    <option>60 seconds</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Target Platforms</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Instagram", "TikTok", "YouTube", "Facebook"].map((platform) => (
                      <button
                        key={platform}
                        className="chip-accent"
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">AI Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Describe how you want the video to be repurposed... e.g., 'Create engaging hooks for social media, focus on the cooking process, add text overlays'"
                  className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 p-3 text-sm shadow-sm backdrop-blur-sm placeholder:text-muted-foreground focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateClips}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-3xl gradient-primary py-4 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing with Vizard.io...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Clips with AI
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Generated Clips */}
          <section className="glass-card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Generated Clips</h2>
              <span className="chip-accent px-3">{clips.filter(c => c.status === 'ready').length} Ready</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => handleClipClick(clip)}
                  className="group cursor-pointer rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur-sm transition-all hover:shadow-glow hover:border-[#22c55e]/50"
                >
                  <div className="relative mb-3">
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="w-full h-24 rounded-xl object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                        <Play size={14} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                      {clip.duration}
                    </div>
                  </div>

                  <h4 className="font-medium text-sm mb-2">{clip.title}</h4>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {clip.platforms.slice(0, 2).map((platform: string) => (
                        <span key={platform} className="chip-muted text-xs px-2 py-0.5">
                          {platform}
                        </span>
                      ))}
                      {clip.platforms.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{clip.platforms.length - 2}</span>
                      )}
                    </div>

                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      clip.status === 'ready'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {clip.status === 'ready' ? 'Ready' : 'Processing'}
                    </span>
                  </div>

                  {clip.status === 'ready' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveClip(clip);
                        }}
                        className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 px-3 py-2 text-xs font-medium text-white transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClip(clip);
                        }}
                        className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Preview & Actions Panel */}
        <div className="space-y-6">
          {/* Clip Preview */}
          <section className="glass-card p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            {selectedClip ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={selectedClip.thumbnail}
                    alt={selectedClip.title}
                    className="w-full h-32 rounded-xl object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                      <Play size={18} />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{selectedClip.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedClip.duration}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-white/60 bg-white/60 text-center backdrop-blur-sm">
                <div className="text-muted-foreground">
                  <Eye size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Select a clip to preview</p>
                </div>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="glass-card p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Download size={16} />
                Download All Clips
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Share2 size={16} />
                Share to Social Media
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Settings size={16} />
                Advanced Settings
              </button>
            </div>
          </section>

          {/* Analytics Preview */}
          <section className="glass-card p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Expected Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Est. Views</span>
                <span className="text-sm font-medium">2.4K - 5.8K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Est. Engagement</span>
                <span className="text-sm font-medium">8.2% - 12.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Best Platform</span>
                <span className="text-sm font-medium text-[#22c55e]">Instagram</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}