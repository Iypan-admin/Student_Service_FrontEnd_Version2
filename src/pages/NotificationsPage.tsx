import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Clock, Calendar, Menu } from 'lucide-react';
import Sidebar from '../components/parts/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationAsRead, getUpcomingEventsForAnnouncements } from '../services/api';

interface Notification {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

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

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch all notifications (both read and unread)
  useEffect(() => {
    if (!token) return;
    
    const fetchNotifications = async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoading(true);
      }
      try {
        const res = await getNotifications(token, true); // Pass true to get all notifications
        if (res.success) {
          // Show ALL notifications (both read and unread)
          setNotifications(res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    // Initial load with loading indicator
    fetchNotifications(true);
    
    // Set up background polling for real-time updates every 5 seconds (no loading indicator)
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [token]);

  // Fetch announcements/events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getUpcomingEventsForAnnouncements(50);
        if (response.success) {
          setEvents(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching events for announcements:', error);
      }
    };

    fetchEvents();
    
    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchEvents, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Get notification category
  const getNotificationCategory = (message: string) => {
    if (message.toLowerCase().includes('welcome') || message.toLowerCase().includes('registration')) {
      return { 
        icon: Bell, 
        gradient: 'from-blue-500 to-blue-600',
        color: 'bg-blue-100 text-blue-800',
        label: 'Welcome'
      };
    }
    if (message.toLowerCase().includes('payment') || message.toLowerCase().includes('expire')) {
      return { 
        icon: Clock, 
        gradient: 'from-red-500 to-red-600',
        color: 'bg-red-100 text-red-800',
        label: 'Payment'
      };
    }
    if (message.toLowerCase().includes('batch') || message.toLowerCase().includes('course')) {
      return { 
        icon: Calendar, 
        gradient: 'from-green-500 to-green-600',
        color: 'bg-green-100 text-green-800',
        label: 'Course'
      };
    }
    return { 
      icon: Bell, 
      gradient: 'from-gray-500 to-gray-600',
      color: 'bg-gray-100 text-gray-800',
      label: 'General'
    };
  };

  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    const colors: { [key: string]: string } = {
      meeting: 'bg-blue-100 text-blue-800',
      exam: 'bg-red-100 text-red-800',
      holiday: 'bg-green-100 text-green-800',
      training: 'bg-purple-100 text-purple-800',
      workshop: 'bg-orange-100 text-orange-800',
      conference: 'bg-indigo-100 text-indigo-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[eventType] || colors.general;
  };

  // Get event type icon
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

  // Mark notification as read (keep it in the list, just update status)
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId, token);
      // Update notification status to read (don't remove from list)
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Combine notifications and events into one sorted list
  const combinedItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      type: 'notification' | 'announcement';
      data: Notification | Event;
      created_at: string;
    }> = [];

    // Add notifications
    notifications.forEach(notif => {
      items.push({
        id: notif.id,
        type: 'notification',
        data: notif,
        created_at: notif.created_at
      });
    });

    // Add events as announcements
    events.forEach(event => {
      items.push({
        id: `event-${event.id}`,
        type: 'announcement',
        data: event,
        created_at: event.event_start_date
      });
    });

    // Sort by date (newest first)
    return items.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [notifications, events]);

  // Pagination
  const totalPages = Math.ceil(combinedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = combinedItems.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentView="notifications"
        onViewChange={(view) => {
          if (view === 'dashboard') {
            navigate('/dashboard');
          } else if (view === 'payment') {
            navigate('/payments');
          } else if (view === 'calendar') {
            navigate('/event-calendar');
          }
        }}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto lg:ml-72">
        {/* Top Header Bar - Berry Style */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 lg:z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 min-h-[4rem]">
            <div className="flex items-center justify-between">
              {/* Left: Hamburger Menu & Title */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all duration-200"
                  title={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                  {isSidebarOpen ? (
                    <X className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-blue-600" />
                  )}
                </button>
                
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Notifications
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                  </p>
                </div>
              </div>

              {/* Right: Notifications, Profile */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {token && <NotificationBell token={token} />}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Table Container - Berry Style */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin border-blue-200 border-t-blue-600"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : combinedItems.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-50">
                    <Bell className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No notifications</h3>
                  <p className="text-sm text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">S.No</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Content</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedItems.map((item, index) => {
                          if (item.type === 'notification') {
                            const notif = item.data as Notification;
                            const category = getNotificationCategory(notif.message);
                            const IconComponent = category.icon;
                            const fullMessage = notif.message || '';
                            const messageParts = fullMessage.split('\n');
                            const hasTitle = messageParts.length > 1;
                            const title = hasTitle ? messageParts[0] : '';
                            const message = hasTitle ? messageParts.slice(1).join(' ') : fullMessage;
                            
                            return (
                              <tr key={item.id} className={`hover:bg-gray-50 transition-colors duration-200 ${!notif.is_read ? 'bg-blue-50/30' : 'bg-white'}`}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {startIndex + index + 1}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r ${category.gradient} text-white`}>
                                      <IconComponent className="w-4 h-4" />
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                                      {category.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-900">
                                    {title && (
                                      <p className="font-semibold mb-1">{title}</p>
                                    )}
                                    <p className="text-gray-600 whitespace-pre-line">{message}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(notif.created_at)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  {notif.is_read ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      Read
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Unread
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                  {!notif.is_read ? (
                                    <button
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>Mark as Read</span>
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Already read</span>
                                  )}
                                </td>
                              </tr>
                            );
                          } else {
                            const event = item.data as Event;
                            
                            return (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200 bg-white">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {startIndex + index + 1}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm bg-gradient-to-r ${getEventTypeColor(event.event_type).includes('blue') ? 'from-blue-500 to-blue-600' : getEventTypeColor(event.event_type).includes('red') ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'}`}>
                                      {getEventTypeIcon(event.event_type)}
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                                      Announcement
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-900">
                                    <p className="font-semibold mb-1">{event.title}</p>
                                    <p className="text-gray-600 mb-2">{event.description}</p>
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
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(event.event_start_date)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Announcement
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                  <span className="text-gray-400 text-sm">-</span>
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(endIndex, combinedItems.length)}</span> of{' '}
                          <span className="font-medium">{combinedItems.length}</span> entries
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <div className="flex items-center space-x-1">
                            {getPageNumbers().map((page, idx) => (
                              <button
                                key={idx}
                                onClick={() => typeof page === 'number' && goToPage(page)}
                                disabled={page === '...'}
                                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                  page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : page === '...'
                                    ? 'text-gray-500 cursor-default'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

