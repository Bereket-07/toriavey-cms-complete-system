import { CheckCircle2, Calendar, Clock, Play, Video, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ApprovedVideos() {
  const navigate = useNavigate();
  const [approvedVideos, setApprovedVideos] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    platform: 'Instagram'
  });

  useEffect(() => {
    // Load approved videos from localStorage
    const stored = JSON.parse(localStorage.getItem('approvedVideos') || '[]');
    setApprovedVideos(stored);
  }, []);

  const handleScheduleVideo = (video: any) => {
    setSelectedVideo(video);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = () => {
    if (!selectedVideo || !scheduleData.time) return;

    const scheduledEvent = {
      title: selectedVideo.title,
      description: `Scheduled video: ${selectedVideo.title}`,
      platform: scheduleData.platform,
      type: 'video',
      startTime: new Date(`${scheduleData.date}T${scheduleData.time}`),
      endTime: new Date(new Date(`${scheduleData.date}T${scheduleData.time}`).getTime() + 30 * 60 * 1000), // 30 minutes
      status: 'scheduled',
      color: getPlatformColor(scheduleData.platform),
      id: Date.now(),
      videoData: selectedVideo
    };

    // Save to localStorage for calendar
    const existingEvents = JSON.parse(localStorage.getItem('scheduledEvents') || '[]');
    const updatedEvents = [...existingEvents, scheduledEvent];
    localStorage.setItem('scheduledEvents', JSON.stringify(updatedEvents));

    setShowScheduleModal(false);
    setSelectedVideo(null);

    // Reset form
    setScheduleData({
      date: new Date().toISOString().split('T')[0],
      time: '',
      platform: 'Instagram'
    });

    alert(`${selectedVideo.title} has been scheduled for ${scheduleData.date} at ${scheduleData.time}!`);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Instagram': return 'bg-pink-500';
      case 'YouTube': return 'bg-red-500';
      case 'Facebook': return 'bg-blue-500';
      case 'TikTok': return 'bg-black';
      case 'Pinterest': return 'bg-red-600';
      default: return 'bg-purple-500';
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Approved Videos</h1>
            <p className="text-muted-foreground">Manage and schedule your approved video content</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {approvedVideos.length} approved video{approvedVideos.length !== 1 ? 's' : ''} ready for scheduling
            </p>
          </div>
        </div>
      </section>

      {/* Approved Videos Grid */}
      <section className="glass-card p-8 shadow-soft">
        {approvedVideos.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Approved Videos</h3>
            <p className="text-muted-foreground">
              Videos that you approve after repurposing will appear here for scheduling.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedVideos.map((video) => (
              <div key={video.id} className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
                <div className="relative mb-4">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-32 rounded-xl object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                      <Play size={18} />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                    Approved
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                    {video.duration}
                  </div>
                </div>

                <h3 className="font-semibold text-sm mb-2">{video.title}</h3>

                <div className="flex flex-wrap gap-1 mb-4">
                  {video.platforms?.slice(0, 3).map((platform: string) => (
                    <span key={platform} className="chip-muted text-xs px-2 py-0.5">
                      {platform}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground mb-4">
                  Approved on {new Date(video.approvedAt).toLocaleDateString()}
                </div>

                <button
                  onClick={() => handleScheduleVideo(video)}
                  className="w-full rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-soft hover:shadow-glow transition-smooth flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Schedule Video
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Schedule Modal */}
      {showScheduleModal && selectedVideo && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Schedule Video</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">{selectedVideo.title}</h4>
                <img
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-full h-24 rounded-xl object-cover mb-4"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={scheduleData.platform}
                    onChange={(e) => setScheduleData({...scheduleData, platform: e.target.value})}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Pinterest">Pinterest</option>
                    <option value="Twitter">Twitter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleData.date}
                    onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSchedule}
                    className="flex-1 rounded-xl gradient-primary py-3 text-sm font-medium text-white shadow-soft hover:shadow-glow transition-smooth"
                  >
                    Schedule Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}