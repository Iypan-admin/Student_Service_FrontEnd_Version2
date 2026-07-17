import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Clock, CreditCard, GraduationCap, AlertCircle, MessageCircle, Calendar } from 'lucide-react';
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

interface NotificationBellProps {
  token: string | null;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!token) return;
    
    const fetchNotifications = async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoading(true);
      }
      try {
        const res = await getNotifications(token);
        if (res.success) setNotifications(res.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    // Initial load
    fetchNotifications(true);
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [token]);

  // Fetch announcements/events
  useEffect(() => {
    const fetchEvents = async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoadingEvents(true);
      }
      try {
        const response = await getUpcomingEventsForAnnouncements(10);
        if (response.success) {
          setEvents(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching events for announcements:', error);
      } finally {
        if (isInitialLoad) {
          setLoadingEvents(false);
        }
      }
    };

    // Initial load
    fetchEvents(true);
    
    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchEvents, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Get notification category and icon based on message content
  const getNotificationCategory = (message: string) => {
    if (message.toLowerCase().includes('payment') || message.toLowerCase().includes('expire')) {
      return { 
        icon: CreditCard, 
        color: 'text-red-500', 
        bgColor: 'bg-red-50', 
        borderColor: 'border-red-200',
        gradient: 'from-red-500 to-red-600'
      };
    }
    if (message.toLowerCase().includes('course') || message.toLowerCase().includes('batch')) {
      return { 
        icon: GraduationCap, 
        color: 'text-blue-500', 
        bgColor: 'bg-blue-50', 
        borderColor: 'border-blue-200',
        gradient: 'from-blue-500 to-blue-600'
      };
    }
    if (message.toLowerCase().includes('class') || message.toLowerCase().includes('meeting')) {
      return { 
        icon: MessageCircle, 
        color: 'text-green-500', 
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-200',
        gradient: 'from-green-500 to-green-600'
      };
    }
    return { 
      icon: AlertCircle, 
      color: 'text-gray-500', 
      bgColor: 'bg-gray-50', 
      borderColor: 'border-gray-200',
      gradient: 'from-gray-500 to-gray-600'
    };
  };

  // Format relative timestamp
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  // Handle mark as read for individual notification
  const handleMarkAsRead = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click
    if (!token) return;
    try {
      const res = await markNotificationAsRead(notifId, token);
      if (res.success) {
        // Update notification status to read instead of removing
        setNotifications((prev) => 
          prev.map((n) => n.id === notifId ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!token || notifications.length === 0) return;
    
    try {
      // Mark each notification as read
      const promises = notifications.map(notif => markNotificationAsRead(notif.id, token));
      await Promise.all(promises);
      // Update all notifications to read status instead of removing
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Count only unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalCount = unreadCount + events.length;

  // Combine notifications and events into one sorted list
  const combinedItems = useMemo(() => {
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

  return (
    <div className="relative">
      {/* Enhanced Bell Icon Button - Round Circle Style */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all duration-200 group"
        title="View Notifications"
      >
        <div className="relative">
          <div className={`${unreadCount > 0 ? 'animate-pulse' : ''}`}>
            <Bell className="w-5 h-5" />
          </div>
          {totalCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce shadow-lg">
              {totalCount > 9 ? '9+' : totalCount}
            </div>
          )}
          {/* Pulsing ring effect when there are notifications */}
          {totalCount > 0 && (
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75"></div>
          )}
        </div>
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Enhanced Dropdown Content - Academic Style */}
          <div className="absolute top-12 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Header - Academic Style */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                {/* Left: Title */}
                <h3 className="text-base font-semibold text-gray-800">
                  Notification
                </h3>
                
                {/* Middle: Badge */}
                {totalCount > 0 && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full text-white bg-blue-600">
                    {totalCount} New
                  </span>
                )}
                
                {/* Right: View All Button & Close */}
                <div className="flex items-center gap-2">
                  {combinedItems.length > 0 && (
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/notifications');
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
                      title="View All Notifications"
                    >
                      View All
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Combined Notifications and Announcements List - Academic Style */}
            <div className="max-h-96 overflow-y-auto">
              {(loading || loadingEvents) ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin border-blue-200 border-t-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : combinedItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-50">
                    <Bell className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">No notifications</h3>
                  <p className="text-xs text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div>
                  {combinedItems.map((item) => {
                    if (item.type === 'notification') {
                      const notification = item.data as Notification;
                      const category = getNotificationCategory(notification.message);
                      const IconComponent = category.icon;
                      const isRead = notification.is_read;
                      
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-3 border-b border-gray-100 transition-colors hover:bg-gray-50 relative group"
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar - Circular with colored background */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-lg bg-gradient-to-r ${category.gradient}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm mb-1 leading-tight break-words ${isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {getRelativeTime(notification.created_at)}
                              </p>
                            </div>
                            
                            {/* Right side: Unread dot or X icon */}
                            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                              {!isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:hidden"></div>
                              )}
                              {!isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id, e);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Mark as read"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const event = item.data as Event;
                      
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-3 border-b border-gray-100 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar - Circular with event type color */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm shadow-lg bg-gradient-to-r ${getEventTypeColor(event.event_type)}`}>
                              {getEventTypeIcon(event.event_type)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 mb-1 leading-tight break-words">
                                {event.title}
                              </p>
                              <p className="text-sm text-gray-600 mb-1 leading-tight break-words line-clamp-2">
                                {event.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
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
                      );
                    }
                  })}
                </div>
              )}
            </div>
            
            {/* Footer - Mark All as Read (only for notifications) */}
            {unreadCount > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark all notifications as read</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
