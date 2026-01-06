import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, Calendar, Clock, X, ChevronDown } from 'lucide-react';
import { getUpcomingEventsForAnnouncements } from '../services/api';

interface Event {
  id: number;
  title: string;
  description: string;
  event_start_date: string;
  event_end_date?: string;
  event_start_time?: string;
  event_end_time?: string;
  event_type: string;
  status: string;
}

const StudentAnnouncements: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getUpcomingEventsForAnnouncements(10);
      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching events for announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (autoScroll && !isPaused && events.length > 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      if (scrollHeight > clientHeight) {
        scrollIntervalRef.current = setInterval(() => {
          if (container.scrollTop >= scrollHeight - clientHeight - 10) {
            // Reset to top when reaching bottom
            container.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            // Scroll down
            container.scrollBy({ top: 1, behavior: 'smooth' });
          }
        }, 50);
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [autoScroll, isPaused, events]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
    
    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchEvents, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Event type colors
  const getEventTypeColor = (eventType: string) => {
    const colors: { [key: string]: string } = {
      meeting: 'from-blue-500 to-blue-600',
      exam: 'from-red-500 to-red-600',
      holiday: 'from-green-500 to-green-600',
      training: 'from-purple-500 to-purple-600',
      workshop: 'from-orange-500 to-orange-600',
      conference: 'from-indigo-500 to-indigo-600',
      general: 'from-gray-500 to-gray-600'
    };
    return colors[eventType] || colors.general;
  };

  // Event type icons
  const getEventTypeIcon = (eventType: string) => {
    const icons: { [key: string]: string } = {
      meeting: '📅',
      exam: '📝',
      holiday: '🎉',
      training: '🎓',
      workshop: '🔧',
      conference: '🎤',
      general: '📢'
    };
    return icons[eventType] || icons.general;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get notification count
  const notificationCount = events.length;

  return (
    <div className="relative">
      {/* Enhanced Announcement Icon - Round Circle Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all duration-200 group"
        title="View Announcements"
      >
        <div className="relative">
          <div className={`${notificationCount > 0 ? 'animate-pulse' : ''}`}>
            <Megaphone className="w-5 h-5" />
          </div>
          {notificationCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce shadow-lg">
              {notificationCount > 9 ? '9+' : notificationCount}
            </div>
          )}
          {/* Pulsing ring effect when there are notifications */}
          {notificationCount > 0 && (
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75"></div>
          )}
        </div>
      </button>

      {/* Announcement Modal */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-white" />
              <h3 className="text-white font-semibold">Announcements</h3>
              <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                {notificationCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-3">
                {/* Refresh Button */}
                <div className="flex items-center justify-end mb-3">
                  <button
                    onClick={fetchEvents}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {/* Events List */}
                <div
                  ref={scrollContainerRef}
                  className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 bg-gradient-to-r ${getEventTypeColor(event.event_type)} rounded-lg flex items-center justify-center text-white text-sm`}>
                          {getEventTypeIcon(event.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {formatDate(event.event_start_date)}
                                {event.event_end_date && event.event_end_date !== event.event_start_date && (
                                  <span> - {formatDate(event.event_end_date)}</span>
                                )}
                              </span>
                            </div>
                            {event.event_start_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(event.event_start_time)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-scroll Indicator */}
                {autoScroll && !isPaused && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-bounce">
                    <ChevronDown className="w-3 h-3" />
                    Auto-scroll
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No announcements available</p>
                <button
                  onClick={fetchEvents}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
