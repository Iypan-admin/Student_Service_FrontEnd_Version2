import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getUpcomingEvents } from '../services/api';

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  event_start_date: string;
  event_end_date?: string;
  event_start_time?: string;
  event_end_time?: string;
  status: string;
}

const StudentEventCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getUpcomingEvents(50);
      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateKey(date);
    return events.filter(event => {
      const startDate = event.event_start_date;
      const endDate = event.event_end_date || event.event_start_date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'meeting': return 'from-blue-500 to-blue-600';
      case 'exam': return 'from-red-500 to-red-600';
      case 'holiday': return 'from-green-500 to-green-600';
      case 'training': return 'from-purple-500 to-purple-600';
      case 'workshop': return 'from-orange-500 to-orange-600';
      case 'conference': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'exam': return <BookOpen className="w-4 h-4" />;
      case 'holiday': return <CheckCircle className="w-4 h-4" />;
      case 'training': return <AlertCircle className="w-4 h-4" />;
      case 'workshop': return <XCircle className="w-4 h-4" />;
      case 'conference': return <Users className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // Format time
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayEvents = getEventsForDate(date);
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // const upcomingEvents = events.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Event Calendar</h2>
              <p className="text-blue-100 text-sm font-medium">Stay updated with upcoming events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'calendar' 
                  ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30' 
                  : 'text-blue-100 hover:bg-white/15 hover:text-white'
              }`}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30' 
                  : 'text-blue-100 hover:bg-white/15 hover:text-white'
              }`}
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 ml-3">Loading events...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          /* Enhanced Mini Calendar View */
          <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <p className="text-sm text-gray-500">Click on dates to view events</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-2.5 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-2.5 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-100">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-bold text-gray-600 bg-white/50 rounded-lg">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[60px] p-2 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                      day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100'
                    } ${day.isToday ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300 shadow-lg' : ''} ${
                      selectedDate?.toDateString() === day.date.toDateString() ? 'bg-blue-100 border-blue-400 shadow-md' : ''
                    }`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className={`text-sm font-bold mb-1 ${
                      day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${day.isToday ? 'text-blue-600' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {day.events.slice(0, 1).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`text-xs p-1 rounded-lg text-white truncate bg-gradient-to-r ${getEventTypeColor(event.event_type)} shadow-sm`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 1 && (
                        <div className="text-xs text-gray-500 font-medium bg-gray-200 rounded px-1">
                          +{day.events.length - 1}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Date Events */}
            {selectedDate && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    Events for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                </div>
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-2">
                    {getEventsForDate(selectedDate).map((event) => (
                      <div key={event.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 bg-gradient-to-r ${getEventTypeColor(event.event_type)} rounded-lg flex items-center justify-center text-white`}>
                            {getEventTypeIcon(event.event_type)}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 text-sm">{event.title}</h5>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                            {event.event_start_time && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">{formatTime(event.event_start_time)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No events on this date</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Enhanced List View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
                  <p className="text-sm text-gray-500">All your upcoming events and activities</p>
                </div>
              </div>
              <button
                onClick={fetchEvents}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                🔄 Refresh
              </button>
            </div>

            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${getEventTypeColor(event.event_type)} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                        {getEventTypeIcon(event.event_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2 text-lg">{event.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {formatDate(event.event_start_date)}
                              {event.event_end_date && event.event_end_date !== event.event_start_date && (
                                <span> - {formatDate(event.event_end_date)}</span>
                              )}
                            </span>
                          </div>
                          {event.event_start_time && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {formatTime(event.event_start_time)}
                                {event.event_end_time && (
                                  <span> - {formatTime(event.event_end_time)}</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getEventTypeColor(event.event_type)} text-white`}>
                        {event.event_type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
                <p className="text-gray-500 mb-4">Check back later for new events and activities</p>
                <button
                  onClick={fetchEvents}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  🔄 Refresh Events
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Event Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">Event Types Legend</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['meeting', 'exam', 'holiday', 'training', 'workshop', 'conference'].map(type => (
              <div key={type} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                <div className={`w-4 h-4 rounded-lg bg-gradient-to-r ${getEventTypeColor(type)} shadow-sm`}></div>
                <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEventCalendar;
