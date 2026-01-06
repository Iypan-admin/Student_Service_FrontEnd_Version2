import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Video, Play, BookOpen, CheckCircle2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClassMeets, getBatchDetails } from '../services/api';
import { ClassMeet } from '../types/auth';
import Classbar from './parts/Classbar';
import GoogleMeetModal from './GoogleMeetModal';

const Class = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [classMeets, setClassMeets] = useState<ClassMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeet, setSelectedMeet] = useState<ClassMeet | null>(null);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);

  // Fetch batch details to get total_sessions
  useEffect(() => {
    if (!batchId || !token) return;

    const fetchBatchDetails = async () => {
      try {
        const batchDetails = await getBatchDetails(batchId, token);
        console.log('Batch details fetched:', batchDetails);
        // Check if batchDetails has total_sessions
        if (batchDetails && batchDetails.total_sessions !== undefined && batchDetails.total_sessions !== null) {
          console.log('Setting total sessions to:', batchDetails.total_sessions);
          setTotalSessions(batchDetails.total_sessions);
        } else {
          console.log('total_sessions not found in batchDetails');
        }
      } catch (error) {
        console.error('Failed to fetch batch details:', error);
      }
    };

    fetchBatchDetails();
  }, [batchId, token]);

  // Fetch Google Meet classes for the batch
  useEffect(() => {
    if (!batchId || !token) return;

    const fetchClassMeets = async (isInitialLoad = false) => {
      if (isInitialLoad) {
          setLoading(true);
      }
      try {
          const meets = await getClassMeets(batchId, token);
        // Sort by session_number if available, otherwise by date
        const sortedMeets = meets.sort((a, b) => {
          if (a.session_number && b.session_number) {
            return a.session_number - b.session_number;
          }
          if (a.date && b.date) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          return 0;
        });
        setClassMeets(sortedMeets);
        } catch (error) {
          console.error('Failed to fetch class meets:', error);
        } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    // Initial load
    fetchClassMeets(true);
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchClassMeets(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [batchId, token]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleOpenMeet = (meet: ClassMeet) => {
    setSelectedMeet(meet);
    setShowMeetModal(true);
  };

  const handleCloseMeet = () => {
    setShowMeetModal(false);
    setSelectedMeet(null);
  };

  // Clean Google Meet URL for direct links
  const cleanMeetUrl = (url: string): string => {
    try {
      let cleanUrl = url.trim();
      
      // Remove mobile app intent URLs
      if (cleanUrl.includes('intent://')) {
        const urlMatch = cleanUrl.match(/url%3D([^&]+)/);
        if (urlMatch) {
          cleanUrl = decodeURIComponent(urlMatch[1]);
        }
      }
      
      // Extract meeting code and create clean URL
      const patterns = [
        /https:\/\/meet\.google\.com\/([a-z0-9-]+)/i,
        /https:\/\/meet\.google\.com\/[a-z0-9-]+\?.*/i,
        /https:\/\/meet\.google\.com\/[a-z0-9-]+\/.*/i
      ];

      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) {
          const meetingCode = match[1];
          return `https://meet.google.com/${meetingCode}`;
        }
      }
      
      return cleanUrl;
    } catch (err) {
      console.error('Error cleaning Meet URL:', err);
      return url;
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds || '0', 10));
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error("Error formatting time:", timeString, e);
      return timeString;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Check if session is today
  const isToday = (dateString: string): boolean => {
    if (!dateString) return false;
    try {
    const today = new Date();
      const sessionDate = new Date(dateString);
      return today.toDateString() === sessionDate.toDateString();
    } catch (e) {
      return false;
    }
  };

  // Check if session is in the future (after today)
  const isFuture = (dateString: string | null | undefined): boolean => {
    if (!dateString) {
      // If no date is set, consider it future (upcoming session)
      return true;
    }
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionDate = new Date(dateString);
      sessionDate.setHours(0, 0, 0, 0);
      // Return true if session date is after today
      return sessionDate.getTime() > today.getTime();
    } catch (e) {
      // If date parsing fails, consider it future
      return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      <Classbar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
        {/* Navigation Bar - Responsive */}
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    Class Schedule
                  </h1>
                  <p className="text-sm text-gray-500 hidden sm:block">View your class sessions</p>
                </div>
              </div>
              <div className="flex items-center ml-4">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    transition-all duration-200 min-h-[40px] sm:min-h-auto"
                >
                  <LogOut className="h-4 w-4 rotate-180" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content - Table Format */}
        <main className="flex-1 w-full mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Stat Cards - Total, Completed, Remaining Sessions */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Sessions Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4 flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalSessions !== null && totalSessions !== undefined ? totalSessions : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Completed Sessions Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 mr-4 flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(() => {
                      if (totalSessions === null || totalSessions === undefined) return '-';
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const now = new Date();
                      
                      const completedCount = classMeets.filter(meet => {
                        if (!meet.date) return false;
                        const meetDate = new Date(meet.date);
                        meetDate.setHours(0, 0, 0, 0);
                        
                        // If date is in the past, it's completed
                        if (meetDate < today) return true;
                        
                        // If date is today, check if time has passed
                        if (meetDate.getTime() === today.getTime() && meet.time) {
                          const [hours, minutes] = meet.time.split(':').map(Number);
                          const meetDateTime = new Date(meetDate);
                          meetDateTime.setHours(hours, minutes, 0, 0);
                          return meetDateTime <= now;
                        }
                        
                        return false;
                      }).length;
                      
                      return completedCount;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Remaining Sessions Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 mr-4 flex-shrink-0">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Remaining Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(() => {
                      if (totalSessions === null || totalSessions === undefined) return '-';
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const now = new Date();
                      
                      const completedCount = classMeets.filter(meet => {
                        if (!meet.date) return false;
                        const meetDate = new Date(meet.date);
                        meetDate.setHours(0, 0, 0, 0);
                        
                        // If date is in the past, it's completed
                        if (meetDate < today) return true;
                        
                        // If date is today, check if time has passed
                        if (meetDate.getTime() === today.getTime() && meet.time) {
                          const [hours, minutes] = meet.time.split(':').map(Number);
                          const meetDateTime = new Date(meetDate);
                          meetDateTime.setHours(hours, minutes, 0, 0);
                          return meetDateTime <= now;
                        }
                        
                        return false;
                      }).length;
                      
                      return Math.max(0, totalSessions - completedCount);
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-lg font-semibold text-white tracking-wide">
                Session Schedule
              </h2>
          </div>

            <div className="p-4 sm:p-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <p className="mt-4 text-gray-600 font-medium">Loading sessions...</p>
                </div>
              ) : classMeets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Found</h4>
                  <p className="text-gray-500">No class sessions scheduled yet.</p>
              </div>
            ) : (
                <>
                  {/* Mobile View - Card Layout */}
                  <div className="block sm:hidden space-y-3">
                    {(() => {
                      // Find the first upcoming session (first future session after today)
                      let firstUpcomingIndex = -1;
                      for (let i = 0; i < classMeets.length; i++) {
                        const meet = classMeets[i];
                        const isTodaySession = isToday(meet.date);
                        const isFutureSession = !isTodaySession && isFuture(meet.date);
                        if (isFutureSession) {
                          firstUpcomingIndex = i;
                          break;
                        }
                      }
                      
                      return classMeets.map((meet, index) => {
                        const todaySession = isToday(meet.date);
                        // Check if future: must be after today AND not today
                        const futureSession = !todaySession && isFuture(meet.date);
                        // First upcoming session should be clear but join disabled
                        const isFirstUpcoming = index === firstUpcomingIndex && futureSession;
                        // Other future sessions should be blurred
                        const shouldBlur = futureSession && !isFirstUpcoming;
                        
                        // Check if session can be joined (today's sessions are always enabled, others must have date/time passed)
                        const canJoin = !futureSession && meet.meet_link && meet.date && (todaySession || (meet.time && (() => {
                          try {
                            const now = new Date();
                            const sessionDate = new Date(meet.date);
                            const [hours, minutes] = meet.time.split(':').map(Number);
                            sessionDate.setHours(hours, minutes, 0, 0);
                            return sessionDate <= now;
                          } catch {
                            return false;
                          }
                        })()));
                        
                        return (
                      <div
                        key={meet.meet_id}
                            className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${shouldBlur ? 'opacity-60 blur-sm' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-400">#{meet.session_number || '-'}</span>
                                  {todaySession && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Today
                                    </span>
                                  )}
                                  {isFirstUpcoming && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                      Upcoming
                                    </span>
                                  )}
                            </div>
                                <h4 className={`text-sm font-semibold ${shouldBlur ? 'text-gray-400' : 'text-gray-900'}`}>
                                  {meet.title || 'Untitled Session'}
                                </h4>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className={shouldBlur ? 'text-gray-400' : 'text-gray-600'}>
                                  {meet.date ? formatDate(meet.date) : '-'}
                                </span>
                          </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className={shouldBlur ? 'text-gray-400' : 'text-gray-600'}>
                                  {meet.time ? formatTime(meet.time) : '-'}
                          </span>
                        </div>
                              {meet.note && (
                                <div className="pt-1">
                                  <span className="text-gray-500 italic">{meet.note}</span>
                                </div>
                              )}
                              <div className="pt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  meet.status === 'Completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : meet.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {meet.status === 'Completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                  {meet.status === 'Cancelled' && <XCircle className="w-3 h-3 inline mr-1" />}
                                  {meet.status || 'Scheduled'}
                                </span>
                                {meet.status === 'Cancelled' && meet.cancellation_reason && (
                                  <div className="mt-1 text-xs text-gray-500 italic">
                                    Reason: {meet.cancellation_reason}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                              {canJoin ? (
                                <>
                                  <a
                                    href={cleanMeetUrl(meet.meet_link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <Video className="w-4 h-4" />
                                    Join Meeting
                                  </a>
                                  <button
                                    onClick={() => handleOpenMeet(meet)}
                                    className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  {futureSession ? (isFirstUpcoming ? `Starts on ${meet.date ? formatDate(meet.date) : 'scheduled date'}` : 'Session not started') : 'No meeting link'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Tablet & Desktop View - Table Layout */}
                  <div className="hidden sm:block overflow-x-auto lg:overflow-x-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full divide-y divide-gray-200 min-w-[800px] md:w-full md:min-w-0 lg:min-w-0 lg:w-full lg:table-auto">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">S.No</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Time</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Meet Link</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        // Find the first upcoming session (first future session after today)
                        let firstUpcomingIndex = -1;
                        for (let i = 0; i < classMeets.length; i++) {
                          const meet = classMeets[i];
                          const isTodaySession = isToday(meet.date);
                          const isFutureSession = !isTodaySession && isFuture(meet.date);
                          if (isFutureSession) {
                            firstUpcomingIndex = i;
                            break;
                          }
                        }
                        
                        return classMeets.map((meet, index) => {
                          const todaySession = isToday(meet.date);
                          // Check if future: must be after today AND not today
                          const futureSession = !todaySession && isFuture(meet.date);
                          // First upcoming session should be clear but join disabled
                          const isFirstUpcoming = index === firstUpcomingIndex && futureSession;
                          // Other future sessions should be blurred
                          const shouldBlur = futureSession && !isFirstUpcoming;
                          
                          // Check if session can be joined (today's sessions are always enabled, others must have date/time passed)
                          const canJoin = !futureSession && meet.meet_link && meet.date && (todaySession || (meet.time && (() => {
                            try {
                              const now = new Date();
                              const sessionDate = new Date(meet.date);
                              const [hours, minutes] = meet.time.split(':').map(Number);
                              sessionDate.setHours(hours, minutes, 0, 0);
                              return sessionDate <= now;
                            } catch {
                              return false;
                            }
                          })()));
                        
                          return (
                            <tr 
                              key={meet.meet_id} 
                              className={`hover:bg-gray-50 transition-colors ${
                                shouldBlur ? 'opacity-60 blur-sm' : ''
                              }`}
                            >
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium ${shouldBlur ? 'text-gray-400' : 'text-gray-900'}`}>
                                {meet.session_number || '-'}
                              </td>
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${shouldBlur ? 'text-gray-400' : todaySession ? 'text-blue-600 font-semibold' : isFirstUpcoming ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                                  <span>{meet.date ? formatDate(meet.date) : '-'}</span>
                                  {todaySession && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                      Today
                                    </span>
                                  )}
                                  {isFirstUpcoming && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 w-fit">
                                      Upcoming
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${shouldBlur ? 'text-gray-400' : 'text-gray-500'}`}>
                                {meet.time ? formatTime(meet.time) : '-'}
                              </td>
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-xs sm:text-sm ${shouldBlur ? 'text-gray-400' : 'text-gray-500'} break-words`}>
                                {meet.title || '-'}
                              </td>
                              <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                                {meet.meet_link ? (
                            <a
                              href={cleanMeetUrl(meet.meet_link)}
                              target="_blank"
                              rel="noopener noreferrer"
                                    className={`inline-flex items-center ${(futureSession || (!todaySession && !canJoin)) ? 'text-gray-400 cursor-not-allowed pointer-events-none' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
                                    onClick={(e) => (futureSession || (!todaySession && !canJoin)) && e.preventDefault()}
                                  >
                                    <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                                    <span className="hidden lg:inline">{(futureSession || (!todaySession && !canJoin)) ? 'Link (Disabled)' : 'Join Meeting'}</span>
                                    <span className="lg:hidden">{(futureSession || (!todaySession && !canJoin)) ? 'Disabled' : 'Join'}</span>
                                  </a>
                                ) : (
                                  <span className={shouldBlur ? 'text-gray-400' : 'text-gray-500'}>-</span>
                                )}
                              </td>
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-xs sm:text-sm ${shouldBlur ? 'text-gray-400' : 'text-gray-500'} break-words`}>
                                {meet.note || '-'}
                              </td>
                              <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  meet.status === 'Completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : meet.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {meet.status === 'Completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                  {meet.status === 'Cancelled' && <XCircle className="w-3 h-3 inline mr-1" />}
                                  {meet.status || 'Scheduled'}
                                </span>
                              </td>
                              <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                {meet.meet_link && canJoin ? (
                                  <button
                                    onClick={() => handleOpenMeet(meet)}
                                    className="inline-flex items-center justify-center px-2 sm:px-2 md:px-3 py-1 sm:py-1 md:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap min-w-[60px]"
                            >
                                    <Play className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="hidden md:inline">Join</span>
                                    <span className="md:hidden">✓</span>
                                  </button>
                                ) : (
                                  <span className={`text-xs ${futureSession ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {futureSession ? (isFirstUpcoming ? 'Starts ' + (meet.date ? formatDate(meet.date) : 'soon') : 'Disabled') : '-'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
              </div>
          </div>
        </main>
      </div>

      {/* Google Meet Modal */}
      {selectedMeet && (
        <GoogleMeetModal
          isOpen={showMeetModal}
          onClose={handleCloseMeet}
          meetLink={selectedMeet.meet_link}
          title={selectedMeet.title}
          date={selectedMeet.date}
          time={selectedMeet.time}
          note={selectedMeet.note}
        />
      )}
    </div>
  );
};

export default Class;
