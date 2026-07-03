import { Upload, Video, Globe, Clock3, Scissors, Sparkles, Play, CheckCircle2, Heart, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const videoHistory = [
  {
    id: 1,
    title: "Chocolate Cake Recipe - Full Tutorial",
    source: "WordPress",
    duration: "15:32",
    clipsGenerated: 8,
    timestamp: "2 hours ago",
    thumbnail: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=320&h=180&fit=crop",
    likes: 247,
    views: 1200
  },
  {
    id: 2,
    title: "Quick Pasta Carbonara",
    source: "Uploaded",
    duration: "12:45",
    clipsGenerated: 6,
    timestamp: "1 day ago",
    thumbnail: "https://images.unsplash.com/photo-1551892376-c73ba8b86727?w=320&h=180&fit=crop",
    likes: 189,
    views: 890
  },
  {
    id: 3,
    title: "Homemade Pizza Dough",
    source: "WordPress",
    duration: "18:20",
    clipsGenerated: 10,
    timestamp: "3 days ago",
    thumbnail: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=320&h=180&fit=crop",
    likes: 312,
    views: 2100
  }
];

export default function ContentUpload() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [wordpressUrl, setWordpressUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [favoritedVideos, setFavoritedVideos] = useState<Set<number>>(new Set());

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const videoFiles = files.filter(file => file.type.startsWith('video/'));

      videoFiles.forEach(file => {
        const newVideo = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type: 'uploaded',
          status: 'processing'
        };
        setUploadedVideos(prev => [...prev, newVideo]);
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const videoFiles = files.filter(file => file.type.startsWith('video/'));

      videoFiles.forEach(file => {
        const newVideo = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type: 'uploaded',
          status: 'processing'
        };
        setUploadedVideos(prev => [...prev, newVideo]);
      });
    }
  };

  const fetchWordpressVideos = async () => {
    if (!wordpressUrl.trim()) return;

    setIsFetching(true);
    // Simulate API call
    setTimeout(() => {
      setIsFetching(false);
      // Add mock fetched videos
      const mockVideos = [
        {
          id: Date.now() + 1,
          name: "Fetched: Tori's Famous Chocolate Cake",
          size: "45.2 MB",
          type: 'wordpress',
          status: 'ready',
          url: wordpressUrl,
          title: "Imported Video from Tori Avey",
          source: 'WordPress',
          thumbnail: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=320&h=180&fit=crop",
          duration: "15:32"
        }
      ];
      setUploadedVideos(prev => [...prev, ...mockVideos]);

      // Navigate to repurposing page with the fetched video
      handleVideoClick(mockVideos[0]);
    }, 2000);
  };

  const addToFavorites = (videoId: number) => {
    setFavoritedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleVideoClick = (video: any) => {
    navigate('/dashboard/content/repurpose', { state: { video } });
  };
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-2 sm:px-4 lg:px-8">
      <section className="glass-card gradient-subtle p-4 sm:p-6 lg:p-8 shadow-soft w-full">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl gradient-secondary text-white shadow-glow flex-shrink-0">
            <Video className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">Content Upload</h1>
            <p className="text-base sm:text-lg text-muted-foreground">Upload videos or import from Tori Avey for repurposing</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Video Upload Section */}
        <section className="glass-card p-4 sm:p-6 lg:p-8 shadow-soft w-full">
          <h2 className="text-lg sm:text-xl font-semibold">Upload Videos</h2>
          <p className="text-sm text-muted-foreground mt-2">Upload your videos or drag & drop them here</p>

          <div
            className={`mt-6 rounded-[20px] sm:rounded-[28px] border-2 border-dashed transition-all duration-200 ${
              dragActive
                ? 'border-[#22c55e] bg-[#22c55e]/10 shadow-glow'
                : 'border-white/60 bg-white/70 hover:shadow-soft'
            } p-6 sm:p-8 lg:p-10 text-center backdrop-blur-sm`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-center">
              <span className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-3xl bg-white text-[#22c55e] shadow-soft">
                <Video className="h-6 w-6 sm:h-8 sm:w-8" />
              </span>
            </div>
            <p className="mt-4 sm:mt-6 text-sm text-muted-foreground">
              {dragActive ? 'Drop your videos here!' : 'Drag & drop your videos here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-2">Supports MP4, MOV, AVI formats up to 500MB</p>

            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload">
              <button className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-3xl gradient-secondary px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow">
                <Upload className="h-4 w-4" /> Browse Videos
              </button>
            </label>
          </div>

          {/* Uploaded Videos */}
          {uploadedVideos.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Uploaded Videos</h3>
              {uploadedVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => video.status === 'ready' && handleVideoClick(video)}
                  className={`flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur-sm transition-all ${
                    video.status === 'ready' ? 'cursor-pointer hover:shadow-glow hover:border-[#22c55e]/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white shadow-soft">
                      <Video className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{video.name}</p>
                      <p className="text-xs text-muted-foreground">{video.size} • {video.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {video.status === 'processing' && (
                      <span className="text-xs text-[#22c55e] font-medium">Processing...</span>
                    )}
                    {video.status === 'ready' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-[#22c55e] font-medium ml-1">Click to Repurpose</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* WordPress Integration Section */}
      <section className="glass-card p-4 sm:p-6 lg:p-8 shadow-soft w-full">
        <h2 className="text-lg sm:text-xl font-semibold">Import from Tori Avey</h2>
        <p className="text-sm text-muted-foreground mt-2">Import specific videos or browse recent content from Tori Avey's website</p>

        <div className="mt-6 space-y-6">
          {/* Direct Video URL Import */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video URL from Tori Avey</label>
              <input
                type="url"
                placeholder="https://toriavey.com/vegan-moussaka/"
                value={wordpressUrl}
                onChange={(e) => setWordpressUrl(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/60 bg-white/80 p-4 text-sm shadow-sm backdrop-blur-sm placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
              />
              <p className="mt-2 text-xs text-muted-foreground">Paste the URL of any video page from Tori Avey's website</p>
            </div>

            <button
              onClick={fetchWordpressVideos}
              disabled={isFetching || !wordpressUrl.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-3xl gradient-primary py-4 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Importing Video...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" /> Import This Video
                </>
              )}
            </button>
          </div>

          {/* Recent Videos from Tori Avey */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Mediterranean Recipes</h3>
              <span className="chip-accent px-3">6 Available</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Mock recent videos - using images with play buttons for demo */}
              {[
                { title: "Authentic Greek Moussaka", url: "https://toriavey.com/greek-moussaka/", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=120&fit=crop" },
                { title: "Homemade Hummus Recipe", url: "https://toriavey.com/hummus/", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=120&fit=crop" },
                { title: "Falafel with Tahini Sauce", url: "https://toriavey.com/falafel/", image: "https://images.unsplash.com/photo-1593001872095-9d6b5bb8c4f4?w=200&h=120&fit=crop" },
                { title: "Spanakopita (Spinach Pie)", url: "https://toriavey.com/spanakopita/", image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&h=120&fit=crop" },
                { title: "Baklava Dessert Recipe", url: "https://toriavey.com/baklava/", image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=120&fit=crop" },
                { title: "Greek Salad with Feta", url: "https://toriavey.com/greek-salad/", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=120&fit=crop" }
              ].map((recipe, index) => (
                <div key={index} className="group relative rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur-sm transition-all hover:shadow-glow">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleVideoClick({
                          id: Date.now() + index,
                          title: recipe.title,
                          source: 'WordPress',
                          url: recipe.url,
                          thumbnail: recipe.image,
                          duration: '12:45',
                          status: 'ready'
                        })}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-lg transition-transform hover:scale-110"
                      >
                        <Play className="h-5 w-5 ml-0.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                      12:45
                    </div>
                  </div>
                  <h4 className="mt-3 text-sm font-medium text-foreground line-clamp-2">{recipe.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Mediterranean • Recipe Video</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white/60 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-[#22c55e] mb-2">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• Click the play button on any recipe to auto-fill the URL</li>
                <li>• Or paste any Tori Avey video URL directly</li>
                <li>• Videos are automatically processed for repurposing</li>
                <li>• Generate clips optimized for multiple platforms</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="glass-card p-4 sm:p-6 lg:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold break-words">Repurposing History</h2>
            <p className="text-sm text-muted-foreground">Your previously processed videos and generated clips</p>
          </div>
          <span className="chip-accent px-3 sm:px-4 text-sm whitespace-nowrap flex-shrink-0">{videoHistory.length} Videos</span>
        </div>

        <div className="mt-8 space-y-4">
          {videoHistory.map((video) => (
            <article
              key={video.id}
              onClick={() => handleVideoClick(video)}
              className="cursor-pointer rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur-sm transition-all hover:shadow-glow hover:border-[#22c55e]/50"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-16 w-24 sm:h-20 sm:w-32 rounded-2xl object-cover shadow-soft"
                  />
                  <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 rounded-full bg-black/60 px-1.5 py-0.5 sm:px-2 text-xs text-white backdrop-blur-sm">
                    {video.duration}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-sm sm:text-base font-semibold break-words">{video.title}</h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          video.source === 'WordPress'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {video.source}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          {video.clipsGenerated} clips generated
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {video.timestamp}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                        {video.likes && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {video.likes} likes
                          </span>
                        )}
                        {video.views && (
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {video.views}K views
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => addToFavorites(video.id)}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          favoritedVideos.has(video.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-red-400'
                        }`}
                      >
                        <Heart
                          size={16}
                          className={favoritedVideos.has(video.id) ? 'fill-current' : ''}
                        />
                      </button>

                      <button className="p-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-foreground transition-colors">
                        <Download size={16} />
                      </button>

                      <button className="p-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-foreground transition-colors">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button className="inline-flex items-center gap-2 rounded-3xl border border-white/60 bg-white/60 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Sparkles className="h-4 w-4" />
            Load More History
          </button>
        </div>
      </section>
    </div>
  );
}
