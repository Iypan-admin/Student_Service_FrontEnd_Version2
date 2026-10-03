import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Users, BookOpen, Clock, GraduationCap, Filter, ArrowUpDown, CheckCircle2, Clock3, ArrowRight, Calendar, Video, User, Menu, X, Settings, LogOut, Radio, PlayCircle, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, FileVideo, HardDrive, Search, RefreshCw, AlertCircle, ExternalLink, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./parts/Sidebar";
import BatchCard from "./BatchCard";
import BatchDetailsModal from "./BatchDetailsModal";
import StudentProfileModal from "./StudentProfileModal";
import ForgetPasswordModal from "./ForgetPasswordModal";
import Payments from "./Payments";
import NotificationBell from "./NotificationBell";
import SecureMediaProtection from "./security/SecureMediaProtection";
import {
  getStudentDetails,
  getEnrolledBatches,
  getBatches,
} from "../services/api";
import { getLiveClasses, getBatchRecordings, getRecordingStreamUrl, LiveClass, LiveClassRecording } from "../services/liveClassApi";
import { Enrollment, Batch } from "../types/auth";
import toast from "react-hot-toast";

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

// Asia/Kolkata (IST) Time and Date Formatters
const formatISTTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (_) {
    return '';
  }
};

const formatISTDate = (isoString?: string) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (_) {
    return '';
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, tokenData, studentDetails, setStudentDetails, setToken } =
    useAuth();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Batch selection states
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showForgetPasswordModal, setShowForgetPasswordModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // View state management - check location state for view
  const [currentView, setCurrentView] = useState<string>(() => {
    // Check if view is passed via navigation state
    const state = location.state as { view?: string } | null;
    return state?.view || 'dashboard';
  });

  // Update view when location state changes
  useEffect(() => {
    const state = location.state as { view?: string } | null;
    if (state?.view) {
      setCurrentView(state.view);
    }
  }, [location.state]);

  // Enrollment view filters
  const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [enrollmentSort, setEnrollmentSort] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Live Classes & Cloud Recordings States
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [recordings, setRecordings] = useState<LiveClassRecording[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<LiveClassRecording | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [liveClassFilter, setLiveClassFilter] = useState<'all' | 'LIVE' | 'SCHEDULED' | 'COMPLETED'>('all');
  const [recordingSearchQuery, setRecordingSearchQuery] = useState('');

  // Real-time ticker to auto-disable live class buttons exactly on schedule expiry (Asia/Kolkata)
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // 🔹 Fetch student details
  useEffect(() => {
    if (!tokenData?.student_id) return;
    // console.log("Fetching student details for:", tokenData.student_id);

    getStudentDetails(tokenData.student_id)
      .then((details) => {
        
        setStudentDetails(details);
      })
      .catch((err) =>
        console.error("❌ Failed to fetch student details:", err)
      );
  }, [tokenData, setStudentDetails]);

  // 🔹 Fetch enrolled batches
  useEffect(() => {
    if (!token) return;
    
    const fetchEnrollments = async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoading(true);
      }
      try {
        const res = await getEnrolledBatches(token);
        setEnrollments(res.enrollments || []);
      } catch (err) {
        console.error("❌ Failed to fetch enrolled batches:", err);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    // Initial load
    fetchEnrollments(true);
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchEnrollments(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [token]);

  // 🔹 Fetch available batches after student center is loaded
  useEffect(() => {
    if (!studentDetails) return;

    // Extract center UUID properly
    const centerId =
      typeof studentDetails.center === "object" && studentDetails.center?.center_id
        ? studentDetails.center.center_id
        : null;

    // console.log("🧩 Checking studentDetails:", studentDetails);

    if (!centerId) {
      console.log(
        "⏳ Center ID not yet available or invalid format:",
        studentDetails.center
      );
      return;
    }

    

    // Pass student_id for smart filtering (show enrolled batches even if full)
    getBatches(centerId, studentDetails.student_id)
      .then((res) => {
        console.log("✅ Batches response from API:", res);
        const batches = res?.batches || res?.data || [];
        console.log("📊 Available batches:", batches);
        console.log("📊 Enrollments:", enrollments);
        setAvailableBatches(batches);
        
      })
      .catch((err) => {
        console.error("❌ Failed to fetch available batches:", err);
      });
  }, [studentDetails?.center, studentDetails?.student_id]);

  // 🔹 Fetch live classes & recordings for all active enrolled batches
  useEffect(() => {
    const activeBatchIds = enrollments
      .filter((e) => e.status && e.batches?.batch_id)
      .map((e) => e.batches.batch_id);

    if (activeBatchIds.length === 0) {
      setLiveClasses([]);
      setRecordings([]);
      return;
    }

    const fetchLiveAndRecordings = async () => {
      try {
        // Fetch live classes across all batches
        const livePromises = activeBatchIds.map((batchId) =>
          getLiveClasses({ batch_id: batchId }).catch(() => [] as LiveClass[])
        );
        const liveResults = await Promise.all(livePromises);
        const allLive = liveResults.flat();
        allLive.sort((a, b) => {
          if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
          if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
          return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime();
        });
        setLiveClasses(allLive);

        // Fetch recordings across all batches
        const recPromises = activeBatchIds.map((batchId) =>
          getBatchRecordings(batchId).catch(() => [] as LiveClassRecording[])
        );
        const recResults = await Promise.all(recPromises);
        const allRec = recResults.flat();
        allRec.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecordings(allRec);
      } catch (err) {
        console.error("Failed to load live sessions or recordings:", err);
      }
    };

    fetchLiveAndRecordings();
    const interval = setInterval(fetchLiveAndRecordings, 5000);
    const handleFocus = () => fetchLiveAndRecordings();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enrollments]);

  // 🔹 Play Recording Stream Modal
  const handleWatchRecording = async (rec: LiveClassRecording) => {
    setSelectedRecording(rec);
    setLoadingStream(true);
    try {
      const res = await getRecordingStreamUrl(rec.id);
      setStreamUrl(res.streamUrl);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load video stream');
      setSelectedRecording(null);
    } finally {
      setLoadingStream(false);
    }
  };

  const handleClosePlayer = () => {
    setSelectedRecording(null);
    setStreamUrl(null);
  };


  // 🔹 Open class if active
  const handleTileClick = (enrollment: Enrollment) => {
    if (enrollment.status) {
      navigate(`/class/${enrollment.batches.batch_id}`);
    }
  };

  // 🔹 Handle batch card click (open modal)
  const handleBatchClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowModal(true);
  };

  // 🔹 Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBatch(null);
  };

  // 🔹 Handle enrollment success
  const handleEnrollmentSuccess = () => {
    // Refresh enrolled batches
    if (!token) return;
    getEnrolledBatches(token)
      .then((res) => {
        setEnrollments(res.enrollments || []);
      })
      .catch((err) => console.error("❌ Failed to refresh enrollments:", err));
    
    // Refresh available batches to update seat counts
    if (studentDetails?.center?.center_id && studentDetails?.student_id) {
      const centerId = studentDetails.center?.center_id || null;
      
      if (centerId) {
        // Pass student_id to show their enrolled batches even if full
        getBatches(centerId, studentDetails.student_id)
          .then((res) => {
            const batches = res?.batches || res?.data || [];
            setAvailableBatches(batches);
          })
          .catch((err) => console.error("❌ Failed to refresh batches:", err));
      }
    }
  };

  // Check if batch is already enrolled
  const isBatchEnrolled = (batchId: string) => {
    const isEnrolled = enrollments.some((e) => e.batches.batch_id === batchId);
    console.log(`🔍 Checking if batch ${batchId} is enrolled:`, isEnrolled);
    return isEnrolled;
  };


  // 🔹 Debug logs for render
  

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-72">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Navbar - BERRY Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 lg:z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 min-h-[4rem]">
            <div className="flex items-center gap-4">
              {/* Hamburger Button - Mobile/Tablet Only */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </button>
              
              {/* Title Section - BERRY Style */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Welcome back, {studentDetails?.name || 'Student'}!
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Manage your academic journey efficiently
                </p>
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
                            setShowProfileDropdown(false);
                            // Handle logout
                            setToken(null);
                            navigate('/login');
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-gray-500" />
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

      {/* Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* 🔹 VIEW: DASHBOARD - Available Batches for Enrollment */}
          {currentView === 'dashboard' && (
            <>
              {/* 🔴 Active Live Sessions Alert Banner (LIVE status or in-session scheduled slot) */}
              {liveClasses.filter((c) => {
                const startMs = new Date(c.scheduled_start).getTime();
                const endMs = new Date(c.scheduled_end).getTime();
                const isExpired = currentTimeMs > endMs;
                const inSlot = currentTimeMs >= startMs && !isExpired;
                return (c.status === 'LIVE' || inSlot) && !isExpired;
              }).length > 0 && (
                <div className="mb-8 space-y-4">
                  {liveClasses.filter((c) => {
                    const startMs = new Date(c.scheduled_start).getTime();
                    const endMs = new Date(c.scheduled_end).getTime();
                    const isExpired = currentTimeMs > endMs;
                    const inSlot = currentTimeMs >= startMs && !isExpired;
                    return (c.status === 'LIVE' || inSlot) && !isExpired;
                  }).map((activeClass) => (
                    <div
                      key={activeClass.id}
                      className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl border border-red-400/40 flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                          <Radio className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white text-red-600 shadow-sm animate-pulse">
                              {activeClass.status === 'LIVE' ? '🔴 LIVE NOW' : '🔴 CLASS IN SESSION'}
                            </span>
                            <span className="text-xs text-red-100 font-semibold px-2 py-0.5 rounded-full bg-white/10">
                              {activeClass.batch?.batch_name || 'Your Batch'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white tracking-tight">
                            {activeClass.title}
                          </h3>
                          <p className="text-sm text-red-100 flex items-center gap-2 mt-1">
                            <span>Tutor: <strong>{activeClass.tutor?.full_name || 'Instructor'}</strong></span>
                            <span>•</span>
                            <span>100% Online Interactive Studio</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/class/${activeClass.batch_id}/live?roomId=${activeClass.room_name || activeClass.livekit_room_name}`)}
                        className="shrink-0 px-6 py-3 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:bg-red-50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 group cursor-pointer"
                      >
                        <span>🚀 Join Live Classroom</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {availableBatches.length > 0 ? (
            <div className="mb-12">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-3 rounded-xl shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      All Batches
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      View all batches - enroll in available ones or check your enrolled batches
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {availableBatches.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Available:</span>
                    <span className="text-lg font-bold text-green-600">
                      {availableBatches.filter(b => !isBatchEnrolled(b.batch_id)).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Enrolled:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {availableBatches.filter(b => isBatchEnrolled(b.batch_id)).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batch Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {availableBatches.map((batch) => (
                  <BatchCard
                    key={batch.batch_id}
                    batch={batch}
                    isSelected={false}
                    isEnrolled={isBatchEnrolled(batch.batch_id)}
                    onSelect={() => {}} // Not used when onClick is provided
                    onClick={() => handleBatchClick(batch)}
                    showDetails={false}
                  />
                ))}
              </div>

              {/* Batch Details Modal */}
              <BatchDetailsModal
                batch={selectedBatch}
                isOpen={showModal}
                onClose={handleCloseModal}
                studentId={studentDetails?.student_id || ""}
                onEnrollSuccess={handleEnrollmentSuccess}
                isAlreadyEnrolled={selectedBatch ? isBatchEnrolled(selectedBatch.batch_id) : false}
              />
            </div>
          ) : (
            /* Empty State - No Available Batches */
            <div className="text-center py-16 px-4 mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6 shadow-inner">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Batches Available
              </h3>
              <p className="text-gray-600 mb-2 max-w-md mx-auto">
                There are currently no batches at your center.
              </p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                New batches may be created soon. Please check back later or contact your center administrator for more information.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <span className="font-medium">💡 Tip:</span>
                <span>Ask your center about upcoming batch schedules</span>
              </div>
            </div>
          )}

            </>
          )}

          {/* 🔹 VIEW: YOUR ENROLLMENT - Enrolled Batches */}
          {currentView === 'enrollment' && (
            <>
              {/* Enhanced Header with Gradient */}
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-8 shadow-2xl overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute transform rotate-45 -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
                  <div className="absolute transform -rotate-45 -bottom-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">
                        Your Enrollments
                      </h2>
                      <p className="text-indigo-100">
                        Track and manage your enrolled courses
                      </p>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-indigo-100 text-sm font-medium">Total Enrolled</p>
                          <p className="text-3xl font-bold text-white mt-1">
                            {enrollments.length}
                          </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-indigo-100 text-sm font-medium">Active Classes</p>
                          <p className="text-3xl font-bold text-white mt-1">
                            {enrollments.filter(e => e.status).length}
                          </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-indigo-100 text-sm font-medium">Pending</p>
                          <p className="text-3xl font-bold text-white mt-1">
                            {enrollments.filter(e => !e.status).length}
                          </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                          <Clock3 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-500 text-lg">Loading your enrollments...</p>
                  </div>
                </div>
              ) : enrollments.length === 0 ? (
                /* Enhanced Empty State */
                <div className="text-center py-16 px-4">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 shadow-xl">
                      <GraduationCap className="w-16 h-16 text-indigo-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    Start Your Learning Journey
                  </h3>
                  <p className="text-gray-600 mb-2 max-w-md mx-auto text-lg">
                    You haven't enrolled in any batches yet.
                  </p>
                  <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                    Browse available batches and enroll in courses that match your interests.
                  </p>
                  
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-600 transform hover:scale-105 transition-all duration-300"
                  >
                    <Sparkles className="w-5 h-5" />
                    Explore Available Batches
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Filter and Sort Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Filter Buttons */}
                    <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                      <Filter className="w-4 h-4 text-gray-500 ml-2" />
                      <button
                        onClick={() => setEnrollmentFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          enrollmentFilter === 'all'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        All ({enrollments.length})
                      </button>
                      <button
                        onClick={() => setEnrollmentFilter('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          enrollmentFilter === 'active'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Active ({enrollments.filter(e => e.status).length})
                      </button>
                      <button
                        onClick={() => setEnrollmentFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          enrollmentFilter === 'pending'
                            ? 'bg-yellow-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Pending ({enrollments.filter(e => !e.status).length})
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                      <ArrowUpDown className="w-4 h-4 text-gray-500 ml-2" />
                      <select
                        value={enrollmentSort}
                        onChange={(e) => setEnrollmentSort(e.target.value as any)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Batch Name (A-Z)</option>
                      </select>
                    </div>
                  </div>

                  {/* Enhanced Enrollment Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments
                      .filter(enrollment => {
                        if (enrollmentFilter === 'all') return true;
                        if (enrollmentFilter === 'active') return enrollment.status;
                        if (enrollmentFilter === 'pending') return !enrollment.status;
                        return true;
                      })
                      .sort((a, b) => {
                        if (enrollmentSort === 'newest') {
                          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        }
                        if (enrollmentSort === 'oldest') {
                          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        }
                        if (enrollmentSort === 'name') {
                          return a.batches.batch_name.localeCompare(b.batches.batch_name);
                        }
                        return 0;
                      })
                      .map((enrollment, index) => (
                        <div
                          key={enrollment.enrollment_id}
                          className={`group relative bg-white border-2 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                            enrollment.status
                              ? "border-green-200 hover:border-green-400 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
                              : "border-yellow-200 hover:border-yellow-400 hover:shadow-xl"
                          }`}
                          onClick={() => handleTileClick(enrollment)}
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards',
                          }}
                        >
                          {/* Colored Top Bar */}
                          <div
                            className={`h-2 ${
                              enrollment.status
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : "bg-gradient-to-r from-yellow-400 to-orange-500"
                            }`}
                          />

                          {/* Card Content */}
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                  {enrollment.batches.batch_name}
                                </h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  {enrollment.batches.courses.course_name}
                                </p>
                              </div>
                              
                              {/* Status Badges */}
                              <div className="flex flex-col gap-2">
                                {/* Enrollment Status */}
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                                    enrollment.status
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {enrollment.status ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <Clock3 className="w-3 h-3" />
                                      Pending
                                    </>
                                  )}
                                </span>
                                
                                {/* Batch Status */}
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                                    (enrollment.batches as any).status === 'Approved'
                                      ? "bg-blue-100 text-blue-700"
                                      : (enrollment.batches as any).status === 'Started'
                                      ? "bg-green-100 text-green-700"
                                      : (enrollment.batches as any).status === 'Completed'
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {(enrollment.batches as any).status === 'Approved' && (
                                    <>
                                      <Clock3 className="w-3 h-3" />
                                      Ready
                                    </>
                                  )}
                                  {(enrollment.batches as any).status === 'Started' && (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      In Progress
                                    </>
                                  )}
                                  {(enrollment.batches as any).status === 'Completed' && (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Completed
                                    </>
                                  )}
                                  {!['Approved', 'Started', 'Completed'].includes((enrollment.batches as any).status) && (
                                    <>
                                      <Clock3 className="w-3 h-3" />
                                      {(enrollment.batches as any).status}
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-3 text-sm">
                                <div className="bg-indigo-50 p-2 rounded-lg">
                                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Teacher</p>
                                  <p className="font-medium text-gray-900">
                                    {enrollment.batches.teachers?.users?.name || "Not assigned"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-sm">
                                <div className="bg-purple-50 p-2 rounded-lg">
                                  <Video className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Mode</p>
                                  <p className="font-medium text-gray-900 capitalize">
                                    {enrollment.batches.courses.mode}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-sm">
                                <div className="bg-pink-50 p-2 rounded-lg">
                                  <Clock className="w-4 h-4 text-pink-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Duration</p>
                                  <p className="font-medium text-gray-900">
                                    {enrollment.batches.duration} {Number(enrollment.batches.duration) === 1 ? 'month' : 'months'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-sm">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Program</p>
                                  <p className="font-medium text-gray-900">
                                    {enrollment.batches.courses.program}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Button (visible on hover for active) */}
                            {enrollment.status && (
                              <button
                                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTileClick(enrollment);
                                }}
                              >
                                Join Class
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}

                            {!enrollment.status && (
                              <div className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-yellow-50 text-yellow-700 font-medium rounded-xl border border-yellow-200">
                                <Clock3 className="w-4 h-4" />
                                Awaiting Activation
                              </div>
                            )}
                          </div>

                          {/* Hover Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-1000 pointer-events-none" />
                        </div>
                      ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* 🔹 VIEW: LIVE CLASSES - 100% Online Live Class Hub */}
          {currentView === 'live-classes' && (
            <>
              {/* Header Banner */}
              <div className="relative bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 rounded-2xl p-8 mb-8 shadow-xl overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute transform rotate-45 -top-10 -right-10 w-44 h-44 bg-white rounded-full"></div>
                  <div className="absolute transform -rotate-45 -bottom-10 -left-10 w-36 h-36 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-inner">
                      <Radio className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                          100% Online Learning
                        </span>
                        {liveClasses.some(c => {
                          const startMs = new Date(c.scheduled_start).getTime();
                          const endMs = new Date(c.scheduled_end).getTime();
                          const isExpired = currentTimeMs > endMs;
                          const inSlot = currentTimeMs >= startMs && !isExpired;
                          return (c.status === 'LIVE' || inSlot) && !isExpired;
                        }) && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-500 text-white shadow-sm animate-pulse">
                            🔴 Live Now
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl font-extrabold tracking-tight">Live Classes Hub</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Attend live lectures, collaborate in real time with tutors and peers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const activeBatchIds = enrollments.filter(e => e.status && e.batches?.batch_id).map(e => e.batches.batch_id);
                        if (activeBatchIds.length > 0) {
                          Promise.all(activeBatchIds.map(bId => getLiveClasses({ batch_id: bId })))
                            .then(res => setLiveClasses(res.flat()))
                            .catch(() => {});
                          toast.success('Live classes refreshed');
                        }
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
                    <p className="text-xs text-blue-100 font-medium">Live Right Now</p>
                    <p className="text-2xl font-bold mt-1 text-red-300">
                      {liveClasses.filter(c => {
                        const startMs = new Date(c.scheduled_start).getTime();
                        const endMs = new Date(c.scheduled_end).getTime();
                        const isExpired = currentTimeMs > endMs;
                        const inSlot = currentTimeMs >= startMs && !isExpired;
                        return (c.status === 'LIVE' || inSlot) && !isExpired;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
                    <p className="text-xs text-blue-100 font-medium">Upcoming Scheduled</p>
                    <p className="text-2xl font-bold mt-1 text-white">
                      {liveClasses.filter(c => {
                        const startMs = new Date(c.scheduled_start).getTime();
                        const endMs = new Date(c.scheduled_end).getTime();
                        return c.status === 'SCHEDULED' && currentTimeMs < startMs && currentTimeMs <= endMs;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
                    <p className="text-xs text-blue-100 font-medium">Completed Classes</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-300">
                      {liveClasses.filter(c => c.status === 'COMPLETED' || currentTimeMs > new Date(c.scheduled_end).getTime()).length}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
                    <p className="text-xs text-blue-100 font-medium">Enrolled Batches</p>
                    <p className="text-2xl font-bold mt-1 text-white">
                      {enrollments.filter(e => e.status).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {[
                  { id: 'all', label: 'All Sessions', count: liveClasses.length },
                  {
                    id: 'LIVE',
                    label: '🔴 Live / In Session',
                    count: liveClasses.filter(c => {
                      const startMs = new Date(c.scheduled_start).getTime();
                      const endMs = new Date(c.scheduled_end).getTime();
                      const isExpired = currentTimeMs > endMs;
                      const inSlot = currentTimeMs >= startMs && !isExpired;
                      return (c.status === 'LIVE' || inSlot) && !isExpired;
                    }).length
                  },
                  {
                    id: 'SCHEDULED',
                    label: '📅 Scheduled',
                    count: liveClasses.filter(c => {
                      const startMs = new Date(c.scheduled_start).getTime();
                      const endMs = new Date(c.scheduled_end).getTime();
                      return c.status === 'SCHEDULED' && currentTimeMs < startMs && currentTimeMs <= endMs;
                    }).length
                  },
                  {
                    id: 'COMPLETED',
                    label: '✅ Completed',
                    count: liveClasses.filter(c => c.status === 'COMPLETED' || currentTimeMs > new Date(c.scheduled_end).getTime()).length
                  }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setLiveClassFilter(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      liveClassFilter === tab.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      liveClassFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Classes List */}
              {liveClasses.filter(c => {
                const startMs = new Date(c.scheduled_start).getTime();
                const endMs = new Date(c.scheduled_end).getTime();
                const isPast = currentTimeMs > endMs;
                const inSlot = currentTimeMs >= startMs && !isPast;
                if (liveClassFilter === 'all') return true;
                if (liveClassFilter === 'LIVE') return (c.status === 'LIVE' || inSlot) && !isPast;
                if (liveClassFilter === 'SCHEDULED') return c.status === 'SCHEDULED' && !inSlot && !isPast;
                if (liveClassFilter === 'COMPLETED') return c.status === 'COMPLETED' || isPast;
                return true;
              }).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {liveClasses
                    .filter(c => {
                      const startMs = new Date(c.scheduled_start).getTime();
                      const endMs = new Date(c.scheduled_end).getTime();
                      const isLive = c.status === 'LIVE';
                      const isPast = !isLive && (c.status === 'COMPLETED' || currentTimeMs > endMs + 60 * 60 * 1000);
                      const inSlot = isLive || (currentTimeMs >= startMs - 15 * 60 * 1000 && !isPast);
                      if (liveClassFilter === 'all') return true;
                      if (liveClassFilter === 'LIVE') return isLive || inSlot;
                      if (liveClassFilter === 'SCHEDULED') return c.status === 'SCHEDULED' && !isPast;
                      if (liveClassFilter === 'COMPLETED') return c.status === 'COMPLETED' || isPast;
                      return true;
                    })
                    .map(item => {
                      const startMs = new Date(item.scheduled_start).getTime();
                      const endMs = new Date(item.scheduled_end).getTime();
                      const isLive = item.status === 'LIVE';
                      const isInSlot = currentTimeMs >= startMs - 15 * 60 * 1000 && currentTimeMs <= endMs + 60 * 60 * 1000;
                      const isExpired = !isLive && (item.status === 'COMPLETED' || currentTimeMs > endMs + 60 * 60 * 1000);
                      const canJoin = isLive || (item.status === 'SCHEDULED' && isInSlot);
                      const isCompleted = item.status === 'COMPLETED' && !isLive;

                      return (
                        <div
                          key={item.id}
                          className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl ${
                            canJoin ? 'border-red-400 ring-2 ring-red-400/30' : 'border-gray-200'
                          }`}
                        >
                          {/* Card Top Banner / Status */}
                          <div className={`p-4 border-b flex items-center justify-between ${
                            canJoin ? 'bg-red-50 border-red-100' : isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'
                          }`}>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              canJoin
                                ? 'bg-red-600 text-white animate-pulse'
                                : isCompleted
                                ? 'bg-slate-700 text-white'
                                : 'bg-blue-600 text-white'
                            }`}>
                              {canJoin && <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
                              {canJoin ? (item.status === 'LIVE' ? 'LIVE NOW' : 'IN SESSION') : isExpired && item.status !== 'COMPLETED' ? 'SCHEDULE ENDED' : item.status}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 truncate max-w-[150px]">
                              {item.batch?.batch_name || 'Enrolled Batch'}
                            </span>
                          </div>

                          {/* Body */}
                          <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                {item.title}
                              </h3>
                              {item.description && (
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="space-y-2.5 my-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span className="text-xs text-gray-500">Tutor:</span>
                                  <span className="font-semibold text-gray-800">
                                    {item.tutor?.full_name || 'Assigned Tutor'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                                  <span className="text-xs text-gray-500">Date:</span>
                                  <span className="font-medium text-gray-800">
                                    {formatISTDate(item.scheduled_start)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                                  <span className="text-xs text-gray-500">Time:</span>
                                  <span className="font-medium text-gray-800">
                                    {formatISTTime(item.scheduled_start)} - {formatISTTime(item.scheduled_end)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              {canJoin ? (
                                <button
                                  onClick={() => navigate(`/class/${item.batch_id}/live?roomId=${item.room_name || item.livekit_room_name}`)}
                                  className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-sm"
                                >
                                  <Radio className="w-4 h-4 animate-pulse" />
                                  <span>🚀 Join Live Classroom</span>
                                </button>
                              ) : isExpired ? (
                                <div className="space-y-2">
                                  <button
                                    disabled
                                    className="w-full py-2.5 bg-gray-100 text-gray-400 font-semibold rounded-xl border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed text-xs sm:text-sm"
                                    title={`Live session ended at ${formatISTTime(item.scheduled_end)}`}
                                  >
                                    <Lock className="w-4 h-4 text-gray-400" />
                                    <span>Class Ended ({formatISTTime(item.scheduled_end)})</span>
                                  </button>
                                  <button
                                    onClick={() => setCurrentView('recordings')}
                                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Watch Lecture Recording</span>
                                  </button>
                                </div>
                              ) : isCompleted ? (
                                <button
                                  onClick={() => setCurrentView('recordings')}
                                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl border border-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span>Watch Lecture Recording</span>
                                </button>
                              ) : (
                                <div className="w-full py-2.5 bg-gray-50 text-gray-500 font-medium rounded-xl border border-gray-200 text-center flex items-center justify-center gap-2 text-xs sm:text-sm">
                                  <Clock3 className="w-4 h-4 text-gray-400" />
                                  <span>Opens at {formatISTTime(item.scheduled_start)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm mb-12">
                  <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4">
                    <Radio className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Live Classes Found</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    {liveClassFilter === 'all'
                      ? 'No live classes are currently scheduled for your batches. When your academic coordinator or tutor schedules a class, it will appear here.'
                      : `No classes currently marked as ${liveClassFilter}.`}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 🔹 VIEW: RECORDINGS - 100% Online Recorded Lectures Library */}
          {currentView === 'recordings' && (
            <>
              {/* Header Banner */}
              <div className="relative bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 rounded-2xl p-8 mb-8 shadow-xl overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute transform rotate-45 -top-10 -right-10 w-44 h-44 bg-white rounded-full"></div>
                  <div className="absolute transform -rotate-45 -bottom-10 -left-10 w-36 h-36 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-inner">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                        Master Cloud Archive
                      </span>
                      <h2 className="text-3xl font-extrabold tracking-tight mt-1">Recorded Lectures</h2>
                      <p className="text-purple-100 text-sm mt-1">
                        Watch recorded sessions anytime with secure high-speed cloud streaming
                      </p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search recordings..."
                      value={recordingSearchQuery}
                      onChange={(e) => setRecordingSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 focus:bg-white focus:text-gray-900 text-white placeholder-purple-200 focus:placeholder-gray-400 border border-white/20 focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
                    <p className="text-xs text-purple-100 font-medium">Total Recordings</p>
                    <p className="text-2xl font-bold mt-1 text-white">{recordings.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
                    <p className="text-xs text-purple-100 font-medium">Available for Stream</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-300">
                      {recordings.filter(r => r.status === 'READY').length}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
                    <p className="text-xs text-purple-100 font-medium">Processing</p>
                    <p className="text-2xl font-bold mt-1 text-amber-300">
                      {recordings.filter(r => r.status === 'PROCESSING' || r.status === 'RECORDING').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recordings Grid */}
              {recordings.filter(r => {
                if (!recordingSearchQuery) return true;
                const q = recordingSearchQuery.toLowerCase();
                return (
                  r.live_class?.title?.toLowerCase().includes(q) ||
                  r.live_class?.tutor?.full_name?.toLowerCase().includes(q)
                );
              }).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {recordings
                    .filter(r => {
                      if (!recordingSearchQuery) return true;
                      const q = recordingSearchQuery.toLowerCase();
                      return (
                        r.live_class?.title?.toLowerCase().includes(q) ||
                        r.live_class?.tutor?.full_name?.toLowerCase().includes(q)
                      );
                    })
                    .map(rec => (
                      <div
                        key={rec.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                      >
                        {/* Video Thumbnail Mock / Header */}
                        <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-6 flex flex-col items-center justify-center min-h-[160px] text-white">
                          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all border border-white/20 shadow-lg cursor-pointer" onClick={() => handleWatchRecording(rec)}>
                            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                          </div>

                          {/* Duration Badge */}
                          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-xs font-mono text-white flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-300" />
                            {formatDuration(rec.duration_seconds)}
                          </div>

                          {/* Ready Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              rec.status === 'READY' ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'
                            }`}>
                              {rec.status}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                              {rec.live_class?.title || 'Recorded Live Session'}
                            </h3>

                            <div className="space-y-2 my-4 text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" />
                                <span>Tutor: <strong className="text-gray-800">{rec.live_class?.tutor?.full_name || 'Instructor'}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>Date: <strong className="text-gray-800">{new Date(rec.created_at).toLocaleDateString()}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <HardDrive className="w-4 h-4 text-purple-500" />
                                <span>Size: <strong className="text-gray-800">{formatFileSize(rec.file_size_bytes)}</strong></span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleWatchRecording(rec)}
                            disabled={rec.status !== 'READY'}
                            className={`w-full mt-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              rec.status === 'READY'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 active:scale-95'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>{rec.status === 'READY' ? 'Watch Lecture' : 'Processing Video...'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm mb-12">
                  <div className="w-20 h-20 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-4">
                    <FileVideo className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Recorded Lectures Available</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Live class recordings will be processed and automatically archived here after each session concludes.
                  </p>
                </div>
              )}
            </>
          )}

          {/* 🎬 Video Playback Modal */}
          {selectedRecording && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="relative w-full max-w-4xl bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between p-4 px-6 bg-slate-900/80 border-b border-white/10 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base truncate max-w-md">
                        {selectedRecording.live_class?.title || 'Recorded Lecture'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Tutor: {selectedRecording.live_class?.tutor?.full_name || 'Instructor'} • Duration: {formatDuration(selectedRecording.duration_seconds)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>DRM Protected</span>
                    </span>
                    <button
                      onClick={handleClosePlayer}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Player Area with Anti-Capture & Dynamic Watermark */}
                <div className="relative aspect-video w-full bg-black flex items-center justify-center select-none overflow-hidden">
                  <SecureMediaProtection
                    isActive={!!selectedRecording && !!streamUrl}
                    studentInfo={{
                      name: studentDetails?.name,
                      studentId: tokenData?.student_id,
                      email: studentDetails?.email,
                      phone: studentDetails?.phone,
                    }}
                    enableMovingWatermark={true}
                    enableBlurShield={true}
                  >
                    {loadingStream ? (
                      <div className="flex flex-col items-center justify-center gap-3 text-white h-full">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-purple-300">Retrieving secure cloud stream...</p>
                      </div>
                    ) : streamUrl ? (
                      <video
                        src={streamUrl}
                        controls
                        autoPlay
                        playsInline
                        controlsList="nodownload noremoteplayback"
                        disablePictureInPicture
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        onDragStart={(e) => {
                          e.preventDefault();
                          return false;
                        }}
                        onLoadedMetadata={(e) => {
                          const vid = e.currentTarget;
                          if (!isFinite(vid.duration) || isNaN(vid.duration) || vid.duration <= 0) {
                            vid.currentTime = 1e101;
                            vid.ontimeupdate = function() {
                              this.ontimeupdate = null;
                              vid.currentTime = 0;
                            };
                          }
                        }}
                        onError={(e) => {
                          console.error("Recording video stream playback error:", e);
                          toast.error("Video stream playback error. Please check your connection.");
                        }}
                        className="w-full h-full object-contain select-none"
                      />
                    ) : (
                      <div className="text-red-400 text-sm">Failed to load video stream URL.</div>
                    )}
                  </SecureMediaProtection>
                </div>

                {/* Footer */}
                <div className="p-3 px-6 bg-slate-900/60 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Protected stream • Recording & Downloads Prohibited</span>
                  </span>
                  <button
                    onClick={handleClosePlayer}
                    className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all cursor-pointer"
                  >
                    Close Player
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🔹 VIEW: PAYMENT - Payment Page */}
          {currentView === 'payment' && (
            <Payments isEmbedded={true} />
          )}

        </div>
      </main>

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
    </div>
  );
};

export default Dashboard;
