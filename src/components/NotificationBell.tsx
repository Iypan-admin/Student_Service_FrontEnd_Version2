import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, CreditCard, GraduationCap, AlertCircle, MessageCircle } from 'lucide-react';
import { getNotifications, markNotificationAsRead } from '../services/api';

interface Notification {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationBellProps {
  token: string | null;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
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
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
          {/* Pulsing ring effect when there are notifications */}
          {unreadCount > 0 && (
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
          
          {/* Enhanced Dropdown Content - Matching Announcements Style */}
          <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-7 h-7 text-white" />
                <h3 className="text-white font-semibold">Notifications</h3>
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-white hover:bg-white/20 rounded-lg px-2 py-1 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="p-4">
              <div className="max-h-64 overflow-y-auto space-y-2">
              {loading ? (
                <div className="p-6 text-center animate-fade-in">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You're all caught up! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => {
                    const category = getNotificationCategory(notification.message);
                    const IconComponent = category.icon;
                    const isRead = notification.is_read;
                    
                    return (
                      <div
                        key={notification.id}
                        className={`bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border ${
                          isRead ? 'border-gray-200 opacity-75' : 'border-gray-200'
                        } hover:shadow-md transition-all duration-300`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 bg-gradient-to-r ${category.gradient} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className={`font-semibold text-sm mb-1 ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                              {notification.message}
                            </h5>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">{getRelativeTime(notification.created_at)}</span>
                              </div>
                              {!isRead && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded px-2 py-1 transition-colors flex items-center gap-1"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Mark read</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
