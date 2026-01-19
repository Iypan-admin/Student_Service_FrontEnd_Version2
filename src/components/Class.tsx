import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Video, Play, BookOpen, CheckCircle2, Clock, CheckCircle, XCircle, User, Settings, ChevronLeft, ChevronRight, Info, X, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClassMeets, getBatchDetails, getStudentDetails } from '../services/api';
import { ClassMeet, StudentDetails, BatchDetails } from '../types/auth';
import Classbar from './parts/Classbar';
import GoogleMeetModal from './GoogleMeetModal';
import NotificationBell from './NotificationBell';
import StudentProfileModal from './StudentProfileModal';
import ForgetPasswordModal from './ForgetPasswordModal';

const Class = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token, tokenData, setToken } = useAuth();
  const [classMeets, setClassMeets] = useState<ClassMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeet, setSelectedMeet] = useState<ClassMeet | null>(null);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showForgetPasswordModal, setShowForgetPasswordModal] = useState(false);
  const [showBatchDetailsModal, setShowBatchDetailsModal] = useState(false);
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch student details
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (token && tokenData?.student_id) {
        try {
          const details = await getStudentDetails(tokenData.student_id);
          setStudentDetails(details);
        } catch (error) {
          console.error('Failed to fetch student details:', error);
        }
      }
    };

    fetchStudentDetails();
  }, [token, tokenData]);

  // Fetch batch details to get total_sessions
  useEffect(() => {
    if (!batchId || !token) return;

    const fetchBatchDetails = async () => {
      try {
        const details = await getBatchDetails(batchId, token);
        console.log('Batch details fetched:', details);
        setBatchDetails(details);
        // Check if batchDetails has total_sessions
        if (details && details.total_sessions !== undefined && details.total_sessions !== null) {
          console.log('Setting total sessions to:', details.total_sessions);
          setTotalSessions(details.total_sessions);
        } else {
          console.log('total_sessions not found in batchDetails');
        }
      } catch (error) {
        console.error('Failed to fetch batch details:', error);
      }
    };

    fetchBatchDetails();
  }, [batchId, token]);

  // Reset pagination when classMeets changes
  useEffect(() => {
    setCurrentPage(1);
  }, [classMeets.length]);

  // Store all fetched meets (before filtering)
  const [allClassMeets, setAllClassMeets] = useState<ClassMeet[]>([]);

  // Filter classMeets based on current batch_id and totalSessions
  useEffect(() => {
    if (allClassMeets.length === 0 || !batchId) return;
    
    // First, filter to only show sessions from the current batch (not merged batches)
    const currentBatchMeets = allClassMeets.filter(meet => meet.batch_id === batchId);
    console.log('Filtered by batch_id:', allClassMeets.length, '->', currentBatchMeets.length, 'Batch ID:', batchId);
    
        // Sort by session_number if available, otherwise by date
    const sortedMeets = currentBatchMeets.sort((a, b) => {
          if (a.session_number && b.session_number) {
            return a.session_number - b.session_number;
          }
          if (a.date && b.date) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          return 0;
        });
    
    // Limit to totalSessions if available
    let limitedMeets = sortedMeets;
    if (totalSessions !== null && totalSessions !== undefined && totalSessions > 0) {
      // Take only the first totalSessions number of sessions
      limitedMeets = sortedMeets.slice(0, totalSessions);
      console.log('Limited to total_sessions:', sortedMeets.length, '->', limitedMeets.length, 'Total sessions:', totalSessions);
    }
    
    setClassMeets(limitedMeets);
  }, [allClassMeets, batchId, totalSessions]);

  // Fetch Google Meet classes for the batch
  useEffect(() => {
    if (!batchId || !token) return;

    const fetchClassMeets = async (isInitialLoad = false) => {
      if (isInitialLoad) {
          setLoading(true);
      }
      try {
          const meets = await getClassMeets(batchId, token);
          // Store all meets (will be filtered by the other useEffect)
          setAllClassMeets(meets);
          console.log('Class meets fetched from API:', meets.length, 'Batch ID:', batchId);
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
    
    // Set up polling for real-time updates every 5 seconds
    const interval = setInterval(() => {
      fetchClassMeets(false);
    }, 5000);
    
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
    <>
    <div className="min-h-screen bg-gray-50 lg:ml-72">
      <Classbar />
      
      {/* Navbar - BERRY Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 lg:z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 min-h-[4rem]">
            <div className="flex items-center gap-4">
              {/* Title Section - BERRY Style */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                  style={{
                    background:
                      "linear-gradient(to bottom right, #2196f3, #1976d2)",
                  }}
                >
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Class Schedule
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    View your class sessions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationBell token={token} />
              
              {/* Student Profile Dropdown - BERRY Style */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition-all shadow-md border-2 border-white"
                  title="Profile Menu"
                >
                  {studentDetails?.profile_picture ? (
                    <img
                      src={studentDetails.profile_picture}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <>
                    {/* Overlay to close dropdown on outside click */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                      {/* Welcome Section */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-bold text-gray-800">
                          Welcome, {studentDetails?.name?.toUpperCase() || 'STUDENT'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Student</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileModal(true);
                            setShowProfileDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            setShowForgetPasswordModal(true);
                            setShowProfileDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                          Account Settings
                        </button>
                        <button
                          onClick={() => {
                            setShowBatchDetailsModal(true);
                            setShowProfileDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Info className="w-4 h-4 text-gray-500" />
                          Batch Details
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            handleBackToDashboard();
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4 rotate-180 text-gray-500" />
                          Back to Dashboard
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            setToken(null);
                            navigate('/login');
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

        {/* Main Content - Table Format */}
        <main className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Stat Cards - Total, Completed, Pending Sessions - BERRY Style */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Sessions Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-white shadow-sm mr-4 flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700">Total Sessions</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {totalSessions !== null && totalSessions !== undefined ? totalSessions : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Completed Sessions Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-white shadow-sm mr-4 flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-green-700">Completed Sessions</p>
                  <p className="text-3xl font-bold text-green-900">
                    {(() => {
                      if (totalSessions === null || totalSessions === undefined) return '-';
                      // Count sessions with status === 'Completed'
                      const completedCount = classMeets.filter(meet => meet.status === 'Completed').length;
                      return completedCount;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Sessions Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md border border-orange-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-white shadow-sm mr-4 flex-shrink-0">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-orange-700">Pending Sessions</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {(() => {
                      if (totalSessions === null || totalSessions === undefined) return '-';
                      // Count sessions with status === 'Scheduled' or status is null/undefined (defaults to Scheduled)
                      const pendingCount = classMeets.filter(meet => 
                        meet.status === 'Scheduled' || meet.status === null || meet.status === undefined
                      ).length;
                      return pendingCount;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500">
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
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm hover:shadow-md"
                                  >
                                    <Video className="w-4 h-4" />
                                    Join Meeting
                                  </a>
                                  <button
                                    onClick={() => handleOpenMeet(meet)}
                                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm hover:shadow-md"
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
                    <table className="w-full divide-y divide-gray-200 min-w-[800px] md:w-full md:min-w-0 lg:min-w-0 lg:w-full lg:table-auto border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-500 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">S.No</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Date</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Time</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Title</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Meet Link</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Notes</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        // Sort: Completed sessions go to the back, others maintain original order
                        // First, preserve original index for stable sorting
                        const meetsWithIndex = classMeets.map((meet, index) => ({ meet, originalIndex: index }));
                        
                        // Sort: Completed to back, but maintain original order within each group
                        const sortedMeetsWithIndex = meetsWithIndex.sort((a, b) => {
                          const aCompleted = a.meet.status === 'Completed';
                          const bCompleted = b.meet.status === 'Completed';
                          if (aCompleted && !bCompleted) return 1; // completed goes to back
                          if (!aCompleted && bCompleted) return -1; // non-completed stays in front
                          // If both same status, maintain original order
                          return a.originalIndex - b.originalIndex;
                        });
                        
                        // Extract just the meets array
                        const sortedMeets = sortedMeetsWithIndex.map(item => item.meet);

                        // Find the first upcoming session (first future session after today)
                        let firstUpcomingIndex = -1;
                        for (let i = 0; i < sortedMeets.length; i++) {
                          const meet = sortedMeets[i];
                          const isTodaySession = isToday(meet.date);
                          const isFutureSession = !isTodaySession && isFuture(meet.date);
                          if (isFutureSession) {
                            firstUpcomingIndex = i;
                            break;
                          }
                        }

                        // Pagination logic - use totalSessions for pagination if available
                        // This ensures pagination matches expected total (e.g., 10 sessions = 2 pages)
                        const paginationLength = totalSessions !== null && totalSessions !== undefined 
                          ? totalSessions 
                          : sortedMeets.length;
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = Math.min(startIndex + itemsPerPage, paginationLength);
                        // Slice from sortedMeets but limit to paginationLength
                        const paginatedMeets = sortedMeets.slice(startIndex, Math.min(endIndex, sortedMeets.length));
                        
                        return paginatedMeets.map((meet) => {
                          const originalIndex = sortedMeets.indexOf(meet);
                          const todaySession = isToday(meet.date);
                          // Check if future: must be after today AND not today
                          const futureSession = !todaySession && isFuture(meet.date);
                          // First upcoming session should be clear but join disabled
                          const isFirstUpcoming = originalIndex === firstUpcomingIndex && futureSession;
                          // Other future sessions should be blurred
                          const shouldBlur = futureSession && !isFirstUpcoming;
                          // Completed sessions should have reduced opacity
                          const isCompleted = meet.status === 'Completed';
                          
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
                              className={`transition-colors ${
                                isCompleted 
                                  ? 'bg-gray-50' // Completed sessions: visible, no blur, just gray background
                                  : shouldBlur 
                                    ? 'opacity-60 blur-sm' // Future sessions: blurred
                                    : 'hover:bg-blue-50' // Active sessions: normal with hover
                              }`}
                            >
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium ${isCompleted ? 'text-gray-700' : shouldBlur ? 'text-gray-400' : 'text-gray-900'}`}>
                                {meet.session_number || '-'}
                              </td>
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${isCompleted ? 'text-gray-600' : shouldBlur ? 'text-gray-400' : todaySession ? 'text-blue-600 font-semibold' : isFirstUpcoming ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
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
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${isCompleted ? 'text-gray-600' : shouldBlur ? 'text-gray-400' : 'text-gray-500'}`}>
                                {meet.time ? formatTime(meet.time) : '-'}
                              </td>
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-xs sm:text-sm ${isCompleted ? 'text-gray-600' : shouldBlur ? 'text-gray-400' : 'text-gray-500'} break-words`}>
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
                                  <span className={isCompleted ? 'text-gray-600' : shouldBlur ? 'text-gray-400' : 'text-gray-500'}>-</span>
                                )}
                              </td>
                              <td className={`px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-xs sm:text-sm ${isCompleted ? 'text-gray-600' : shouldBlur ? 'text-gray-400' : 'text-gray-500'} break-words`}>
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
                                    className="inline-flex items-center justify-center px-2 sm:px-2 md:px-3 py-1 sm:py-1 md:py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap min-w-[60px]"
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
                  
                  {/* Pagination Controls - Berry Style */}
                  {(() => {
                    // Use totalSessions for pagination calculation if available, otherwise use classMeets.length
                    // This ensures pagination matches the expected total sessions count
                    const paginationLength = totalSessions !== null && totalSessions !== undefined 
                      ? totalSessions 
                      : classMeets.length;
                    const totalPages = Math.ceil(paginationLength / itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, paginationLength);
                    
                    // Use totalSessions for display text
                    const displayTotal = totalSessions !== null && totalSessions !== undefined ? totalSessions : classMeets.length;
                    
                    // Don't show pagination if there's only 1 page or no data
                    if (totalPages <= 1 || paginationLength === 0) return null;
                    
                    // Ensure currentPage doesn't exceed totalPages
                    if (currentPage > totalPages) {
                      setCurrentPage(1);
                      return null;
                    }
                    
                    return (
                      <div className="mt-4 bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing <span className="font-semibold text-blue-600">{startIndex + 1}</span> to <span className="font-semibold text-blue-600">{endIndex}</span> of <span className="font-semibold text-blue-600">{displayTotal}</span> sessions
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-500 flex items-center gap-1 shadow-sm"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                  currentPage === page
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                                    : 'text-gray-600 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-500 flex items-center gap-1 shadow-sm"
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
          meetLink={selectedMeet?.meet_link || ''}
          title={selectedMeet?.title || ''}
          date={selectedMeet?.date || ''}
          time={selectedMeet?.time || ''}
          note={selectedMeet?.note || ''}
        />
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        studentDetails={studentDetails}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdate={(updatedDetails) => {
          setStudentDetails(updatedDetails);
        }}
        token={token || undefined}
      />

      {/* Forget Password Modal */}
      <ForgetPasswordModal
        isOpen={showForgetPasswordModal}
        onClose={() => setShowForgetPasswordModal(false)}
        registrationNumber={studentDetails?.registration_number || ''}
      />

      {/* Batch Details Slide Panel */}
      {showBatchDetailsModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowBatchDetailsModal(false)}
          />

          {/* Right Side Slide Panel - BERRY Style */}
          <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Batch Details</h2>
                <p className="text-sm text-blue-100 mt-1">Complete batch information</p>
              </div>
              <button
                onClick={() => setShowBatchDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              {batchDetails ? (
                <div className="space-y-6">
                  {/* Batch Name & Status */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{batchDetails.batch_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-blue-700 border border-blue-300">
                        {batchDetails.courses?.course_name || 'N/A'}
                      </span>
                      {batchDetails.status && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          batchDetails.status === 'Approved' || batchDetails.status === 'Started'
                            ? 'bg-green-100 text-green-800'
                            : batchDetails.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {batchDetails.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course Type */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Course Type</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{batchDetails.courses?.type || 'N/A'}</p>
                    </div>

                    {/* Mode */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Mode</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{batchDetails.courses?.mode || 'N/A'}</p>
                    </div>

                    {/* Duration */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Duration</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{batchDetails.duration || 'N/A'}</p>
                    </div>

                    {/* Total Sessions */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Total Sessions</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{batchDetails.total_sessions || 'N/A'}</p>
                    </div>

                    {/* Teacher */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Teacher</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {batchDetails.teachers?.users?.name || batchDetails.teachers?.users?.full_name || 'N/A'}
                      </p>
                    </div>

                    {/* Center */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Center</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{batchDetails.centers?.center_name || 'N/A'}</p>
                    </div>

                    {/* Language */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Language</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{batchDetails.courses?.language || 'N/A'}</p>
                    </div>

                    {/* Program */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Program</h4>
                      </div>
                      <p className="text-lg font-medium text-gray-900">{batchDetails.courses?.program || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">
                      Created: {batchDetails.created_at ? new Date(batchDetails.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading batch details...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Class;
