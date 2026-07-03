import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Settings, Filter, Search, ArrowLeft, RefreshCw, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const calendarEvents = [
  {
    id: 1,
    title: "Morning Recipe Reel",
    time: "09:00 AM",
    platform: "Instagram",
    type: "reel",
    status: "scheduled",
    color: "bg-pink-500"
  },
  {
    id: 2,
    title: "Lunch Ideas Tutorial",
    time: "12:30 PM",
    platform: "YouTube",
    type: "video",
    status: "scheduled",
    color: "bg-red-500"
  },
  {
    id: 3,
    title: "Cooking Tips Post",
    time: "03:00 PM",
    platform: "Facebook",
    type: "post",
    status: "scheduled",
    color: "bg-blue-500"
  },
  {
    id: 4,
    title: "Dinner Recipe Short",
    time: "06:00 PM",
    platform: "Instagram",
    type: "reel",
    status: "scheduled",
    color: "bg-pink-500"
  },
  {
    id: 5,
    title: "Recipe Planning Session",
    time: "10:00 AM",
    platform: "Internal",
    type: "meeting",
    status: "scheduled",
    color: "bg-green-500"
  },
  {
    id: 6,
    title: "Content Review",
    time: "02:00 PM",
    platform: "Internal",
    type: "meeting",
    status: "scheduled",
    color: "bg-purple-500"
  }
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FullCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    platform: 'Instagram',
    type: 'reel',
    startTime: '',
    endTime: '',
    date: new Date().toISOString().split('T')[0]
  });

  const CAL_API_KEY = import.meta.env.VITE_CAL_KEY || 'cal_live_b6362ba6ba028a86cc982773ef7e71ce';

  // Fetch events from Cal.com (using embed approach for CORS-free integration)
  const fetchCalEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // For frontend applications, we'll use a mock/demo approach
      // In production, you'd want to set up a backend proxy for Cal.com API
      // For now, let's simulate the API call with demo data

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful response with demo events
      const mockEvents = [
        {
          id: 'demo-1',
          title: "Morning Recipe Content",
          time: "09:00 AM",
          platform: "Instagram",
          type: "reel",
          status: "scheduled",
          color: "bg-pink-500",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 9, 0),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 10, 0),
          attendees: 0
        },
        {
          id: 'demo-2',
          title: "YouTube Cooking Tutorial",
          time: "02:00 PM",
          platform: "YouTube",
          type: "video",
          status: "scheduled",
          color: "bg-red-500",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 14, 0),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 15, 0),
          attendees: 0
        },
        {
          id: 'demo-3',
          title: "Team Content Review",
          time: "04:00 PM",
          platform: "Internal",
          type: "meeting",
          status: "scheduled",
          color: "bg-green-500",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20, 16, 0),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20, 17, 0),
          attendees: 0
        }
      ];

      // Load scheduled videos from localStorage
      const scheduledVideos = JSON.parse(localStorage.getItem('scheduledVideos') || '[]');
      const scheduledEvents = scheduledVideos.map((video: any) => {
        const scheduledDateTime = new Date(`${video.scheduledDate}T${video.scheduledTime}`);
        return {
          id: `scheduled-${video.id}`,
          title: video.title || 'Scheduled Video',
          time: scheduledDateTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          platform: video.platform,
          type: "video",
          status: "scheduled",
          color: getEventColor(video.platform?.toLowerCase()),
          startTime: scheduledDateTime,
          endTime: new Date(scheduledDateTime.getTime() + 60 * 60 * 1000), // 1 hour duration
          attendees: 0,
          description: video.description || '',
          isScheduledVideo: true
        };
      });

      // Combine mock events with scheduled events
      const allEvents = [...mockEvents, ...scheduledEvents];
      setCalEvents(allEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Unable to load calendar events. Using demo data.');

      // Fallback to basic demo events
      setCalEvents([
        {
          id: 1,
          title: "Morning Recipe Reel",
          time: "09:00 AM",
          platform: "Instagram",
          type: "reel",
          status: "scheduled",
          color: "bg-pink-500",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 9, 0),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 10, 0),
          attendees: 0
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get color based on event type
  const getEventColor = (eventType?: string) => {
    switch (eventType) {
      case 'instagram-post':
      case 'reel':
        return 'bg-pink-500';
      case 'youtube-video':
      case 'video':
        return 'bg-red-500';
      case 'facebook-post':
      case 'post':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-green-500';
      default:
        return 'bg-purple-500';
    }
  };

  // Create new event (mock implementation for frontend)
  const createCalEvent = async (eventData: any) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a mock event
      const newEvent = {
        id: `mock-${Date.now()}`,
        title: eventData.title,
        time: new Date(eventData.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        platform: eventData.platform,
        type: eventData.type,
        status: 'scheduled',
        color: getEventColor(eventData.type),
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        attendees: 0
      };

      // Add to local events
      setCalEvents(prev => [...prev, newEvent]);

      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    }
  };

  // Handle event creation from form
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
      const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}`);

      await createCalEvent({
        title: newEvent.title,
        description: newEvent.description,
        platform: newEvent.platform,
        type: newEvent.type,
        startTime: startDateTime,
        endTime: endDateTime
      });

      setShowEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        platform: 'Instagram',
        type: 'reel',
        startTime: '',
        endTime: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    }
  };

  useEffect(() => {
    fetchCalEvents();
  }, [currentDate]); // Refetch when month changes

  // Listen for localStorage changes to refresh scheduled events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'scheduledVideos') {
        fetchCalEvents();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    return calEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const days = getDaysInMonth(currentDate);

  // Get week view data
  const getWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  // Get day view data
  const getDayView = () => {
    return [currentDate];
  };

  // Render month view
  const renderMonthView = () => (
    <>
      {/* Week Header */}
      <div className="grid grid-cols-7 gap-px mb-4">
        {weekDays.map((day) => (
          <div key={day} className="p-2 sm:p-4 text-center">
            <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">{day}</h3>
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-px bg-white/20 rounded-2xl overflow-hidden">
        {days.map((date, index) => {
          const eventsForDay = date ? getEventsForDate(date) : [];
          const isToday = date && date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();

          return (
            <div
              key={index}
              onClick={() => date && setSelectedDate(date)}
              className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] bg-white/60 p-2 sm:p-3 lg:p-4 backdrop-blur-sm transition-all cursor-pointer hover:bg-white/80 ${
                isToday ? 'ring-2 ring-[#22c55e]' : ''
              } ${isSelected ? 'bg-[#22c55e]/10' : ''}`}
            >
              {date && (
                <>
                  <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${isToday ? 'text-[#22c55e]' : 'text-foreground'}`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    {eventsForDay.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-0.5 sm:p-1 rounded text-white ${event.color} truncate`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {eventsForDay.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{eventsForDay.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  // Render week view
  const renderWeekView = () => {
    const weekDays = getWeekView();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-2">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-2">
          <div className="p-2"></div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center">
              <div className="text-sm font-semibold text-muted-foreground">
                {weekDays[index].toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${day.toDateString() === new Date().toDateString() ? 'text-[#22c55e]' : 'text-foreground'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-96 overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2 border-t border-white/20">
              <div className="p-2 text-xs text-muted-foreground text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const eventsForSlot = calEvents.filter(event => {
                  const eventDate = new Date(event.startTime);
                  return eventDate.toDateString() === day.toDateString() &&
                         eventDate.getHours() === hour;
                });

                return (
                  <div
                    key={dayIndex}
                    className="min-h-[40px] bg-white/60 p-1 backdrop-blur-sm rounded"
                  >
                    {eventsForSlot.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded text-white ${event.color} truncate mb-1`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
        </div>

        <div className="space-y-2">
          {hours.map((hour) => {
            const eventsForHour = dayEvents.filter(event => {
              const eventHour = new Date(event.startTime).getHours();
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex gap-4 p-3 bg-white/60 backdrop-blur-sm rounded-2xl">
                <div className="w-16 text-sm text-muted-foreground font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2">
                  {eventsForHour.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-xl text-white ${event.color}`}
                    >
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-sm opacity-90">
                        {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {event.description && (
                        <div className="text-sm opacity-80 mt-1">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-2 sm:px-4 lg:px-8">
      {/* Header */}
      <section className="glass-card gradient-subtle p-4 sm:p-6 lg:p-8 shadow-soft w-full">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">Content Calendar</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Plan and schedule your content across all platforms</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 w-full lg:w-auto">
            <div className="flex rounded-2xl border border-white/60 bg-white/60 p-1 flex-shrink-0">
              <button
                onClick={() => setView('month')}
                className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  view === 'month' ? 'bg-[#22c55e] text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  view === 'week' ? 'bg-[#22c55e] text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  view === 'day' ? 'bg-[#22c55e] text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Day
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchCalEvents}
                disabled={isLoading}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowEventModal(true)}
                className="inline-flex items-center gap-2 rounded-3xl gradient-primary px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-white shadow-soft transition-smooth hover:shadow-glow whitespace-nowrap"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">New Event</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Navigation */}
      <section className="glass-card p-4 sm:p-6 shadow-soft w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-center min-w-0">
              {view === 'month' && `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {view === 'week' && `Week of ${getWeekView()[0].toLocaleDateString()} - ${getWeekView()[6].toLocaleDateString()}`}
              {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>

            <button
              onClick={() => navigateMonth('next')}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
            <div className="relative flex-1 sm:flex-initial max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full rounded-2xl border border-white/60 bg-white/80 pl-10 pr-4 py-2 text-sm shadow-sm backdrop-blur-sm placeholder:text-muted-foreground focus:border-[#22c55e] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-muted-foreground hover:text-foreground transition-colors">
                <Filter size={16} />
              </button>

              <button className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-muted-foreground hover:text-foreground transition-colors">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Grid */}
      <section className="glass-card p-4 sm:p-6 shadow-soft overflow-hidden w-full">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </section>

      {/* Upcoming Events Sidebar */}
      <section className="glass-card p-4 sm:p-6 shadow-soft w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Upcoming Events</h3>
          <button
            onClick={fetchCalEvents}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-xl bg-gray-100 hover:bg-gray-200 px-2 sm:px-3 py-1 text-xs font-medium text-gray-700 transition-smooth disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="space-y-3">
          {calEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {error ? 'Unable to load events' : 'No upcoming events'}
              </p>
            </div>
          ) : (
            calEvents.slice(0, 5).map((event) => (
              <div key={event.id || event.title} className="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-smooth">
                <div className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${getEventColor(event.type)} flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm break-words">{event.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startTime).toLocaleDateString()} • {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {event.status || 'scheduled'}
                </Badge>
              </div>
            ))
          )}
        </div>

        {calEvents.length > 5 && (
          <div className="text-center mt-4">
            <button className="inline-flex items-center gap-1 rounded-xl gradient-primary px-3 sm:px-4 py-2 text-xs font-semibold text-white shadow-soft transition-smooth hover:shadow-glow">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">View All ({calEvents.length})</span>
              <span className="sm:hidden">All ({calEvents.length})</span>
            </button>
          </div>
        )}
      </section>

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Create New Event</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none resize-none"
                    rows={3}
                    placeholder="Event description (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select
                      value={newEvent.platform}
                      onChange={(e) => setNewEvent({...newEvent, platform: e.target.value})}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Pinterest">Pinterest</option>
                      <option value="Twitter">Twitter</option>
                      <option value="Internal">Internal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                    >
                      <option value="reel">Reel</option>
                      <option value="video">Video</option>
                      <option value="post">Post</option>
                      <option value="story">Story</option>
                      <option value="meeting">Meeting</option>
                      <option value="live">Live Stream</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#22c55e] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl gradient-primary py-3 text-sm font-medium text-white shadow-soft hover:shadow-glow transition-smooth"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}