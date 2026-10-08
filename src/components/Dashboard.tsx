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
  getStudentAttendance,
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
      day: 'numeric',
      year: 'numeric'
    });
  } catch (_) {
    return '';
  }
};

export interface BatchAttendanceSummary {
  batchId: string;
  batchName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  percentage: number;
  sessions: Array<{
    session_id: string;
    session_date: string;
    status: 'present' | 'absent' | 'late' | 'excused' | 'not_marked';
    marked_at: string | null;
    notes: string | null;
  }>;
  todayStatus: 'present' | 'absent' | 'late' | 'excused' | 'not_marked' | 'no_session';
}

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
  const [selectedRecordingBatchId, setSelectedRecordingBatchId] = useState<string>('');

  // Attendance states
  const [attendanceSummaries, setAttendanceSummaries] = useState<Record<string, BatchAttendanceSummary>>({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedAttendanceBatchId, setSelectedAttendanceBatchId] = useState<string>('');

  const activeEnrollments = useMemo(() => {
    return enrollments.filter((e) => e.status && e.batches?.batch_id);
  }, [enrollments]);

  // Ensure current selected batch always points to student's valid enrolled batch
  const currentRecordingBatchId = useMemo(() => {
    if (selectedRecordingBatchId && activeEnrollments.some(e => e.batches.batch_id === selectedRecordingBatchId)) {
      return selectedRecordingBatchId;
    }
    return activeEnrollments[0]?.batches?.batch_id || '';
  }, [selectedRecordingBatchId, activeEnrollments]);

  const currentAttendanceSummary = useMemo(() => {
    if (selectedAttendanceBatchId && attendanceSummaries[selectedAttendanceBatchId]) {
      return attendanceSummaries[selectedAttendanceBatchId];
    }
    if (activeEnrollments.length > 0) {
      return attendanceSummaries[activeEnrollments[0].batches.batch_id] || null;
    }
    return null;
  }, [attendanceSummaries, selectedAttendanceBatchId, activeEnrollments]);

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

  // 🔹 Fetch Attendance for all active enrolled batches
  useEffect(() => {
    if (!token || activeEnrollments.length === 0) {
      setAttendanceSummaries({});
      return;
    }

    const fetchAttendanceForAllBatches = async () => {
      setLoadingAttendance(true);
      try {
        const summaries: Record<string, BatchAttendanceSummary> = {};
        const todayStr = new Date().toISOString().split('T')[0];

        await Promise.all(
          activeEnrollments.map(async (e) => {
            const bId = e.batches.batch_id;
            try {
              const res = await getStudentAttendance(bId, token);
              if (res && res.success && res.data) {
                const s = res.data.summary || {};
                const sessions = (res.data.sessions || []).filter((sess: any) => {
                  const sDate = sess.session_date ? sess.session_date.split('T')[0] : '';
                  return sDate >= '2026-10-07';
                });
                const todaySession = sessions.find((sess: any) => sess.session_date === todayStr);

                summaries[bId] = {
                  batchId: bId,
                  batchName: e.batches.batch_name,
                  totalSessions: s.total_sessions || 0,
                  presentCount: s.present_count || 0,
                  absentCount: s.absent_count || 0,
                  lateCount: s.late_count || 0,
                  excusedCount: s.excused_count || 0,
                  percentage: s.attendance_percentage || 0,
                  sessions: sessions,
                  todayStatus: todaySession ? todaySession.status : 'no_session',
                };
              }
            } catch (err) {
              console.error(`Failed to fetch attendance for batch ${bId}:`, err);
            }
          })
        );

        setAttendanceSummaries(summaries);
        setSelectedAttendanceBatchId((prev) => {
          if (prev && summaries[prev]) return prev;
          return activeEnrollments[0]?.batches?.batch_id || '';
        });
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendanceForAllBatches();
  }, [activeEnrollments, token]);

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

              {/* 📊 STUDENT ATTENDANCE OVERVIEW WIDGET */}
              {activeEnrollments.length > 0 && (
                <div className="mb-10 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Top Bar Header */}
                  <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-blue-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-900">Your Attendance & Participation</h2>
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Live Class Tracker
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Verified instructor attendance across your active enrolled batches
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Batch Switcher (if more than 1 active batch) */}
                      {activeEnrollments.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 font-medium hidden md:inline">Batch:</span>
                          <select
                            value={selectedAttendanceBatchId}
                            onChange={(e) => setSelectedAttendanceBatchId(e.target.value)}
                            className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          >
                            {activeEnrollments.map((e) => (
                              <option key={e.batches.batch_id} value={e.batches.batch_id}>
                                {e.batches.batch_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* View Detailed Log Button */}
                      {(selectedAttendanceBatchId || activeEnrollments[0]?.batches?.batch_id) && (
                        <button
                          onClick={() => navigate(`/class/${selectedAttendanceBatchId || activeEnrollments[0]?.batches?.batch_id}/attendance`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <span>Full Log</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  {loadingAttendance && !currentAttendanceSummary ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mb-2"></div>
                      <p>Loading attendance data...</p>
                    </div>
                  ) : currentAttendanceSummary ? (
                    <div className="p-6">
                      {/* Metric Cards Row */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* 1. Overall Percentage */}
                        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-emerald-800">Attendance Rate</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              currentAttendanceSummary.percentage >= 75
                                ? 'bg-emerald-200/80 text-emerald-900'
                                : currentAttendanceSummary.percentage >= 60
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-red-200 text-red-900'
                            }`}>
                              {currentAttendanceSummary.percentage >= 75 ? 'Good Standing' : 'Low Attendance'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900">
                              {currentAttendanceSummary.percentage}%
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                currentAttendanceSummary.percentage >= 75
                                  ? 'bg-emerald-500'
                                  : currentAttendanceSummary.percentage >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(currentAttendanceSummary.percentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 2. Attended Classes */}
                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-800">Classes Attended</span>
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-gray-900">
                              {currentAttendanceSummary.presentCount}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              / {currentAttendanceSummary.totalSessions} conducted
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-600 mt-3 font-semibold">
                            {currentAttendanceSummary.totalSessions > 0
                              ? `${Math.round((currentAttendanceSummary.presentCount / currentAttendanceSummary.totalSessions) * 100)}% participation`
                              : '0 sessions conducted'}
                          </p>
                        </div>

                        {/* 3. Missed Sessions */}
                        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-amber-800">Missed Sessions</span>
                            <Clock3 className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-gray-900">
                              {currentAttendanceSummary.absentCount}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">sessions</span>
                          </div>
                          <p className="text-[11px] text-amber-600 mt-3 font-semibold">
                            {currentAttendanceSummary.lateCount > 0 ? `${currentAttendanceSummary.lateCount} arrived late` : 'Keep absence minimal'}
                          </p>
                        </div>

                        {/* 4. Today's Status */}
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Today's Class Status</span>
                            <Calendar className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            {currentAttendanceSummary.todayStatus === 'present' && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-xs font-bold shadow-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>Present Today</span>
                              </div>
                            )}
                            {currentAttendanceSummary.todayStatus === 'absent' && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold shadow-xs">
                                <X className="w-4 h-4 text-red-600" />
                                <span>Absent Today</span>
                              </div>
                            )}
                            {currentAttendanceSummary.todayStatus === 'late' && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold shadow-xs">
                                <Clock3 className="w-4 h-4 text-amber-600" />
                                <span>Marked Late</span>
                              </div>
                            )}
                            {currentAttendanceSummary.todayStatus === 'not_marked' && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-800 text-xs font-bold shadow-xs">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span>Pending Marking</span>
                              </div>
                            )}
                            {currentAttendanceSummary.todayStatus === 'no_session' && (
                              <div className="text-xs text-gray-500 font-medium">
                                No session conducted today
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-3 font-medium">
                            {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Recent Session History Preview */}
                      {currentAttendanceSummary.sessions.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Recent Session Logs
                            </span>
                            <span className="text-xs text-gray-500">
                              Batch: <strong className="text-gray-800">{currentAttendanceSummary.batchName}</strong>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {currentAttendanceSummary.sessions.slice(0, 3).map((s) => (
                              <div
                                key={s.session_id}
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="font-bold text-gray-700">{s.session_date}</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  s.status === 'present'
                                    ? 'bg-green-100 text-green-700'
                                    : s.status === 'absent'
                                    ? 'bg-red-100 text-red-700'
                                    : s.status === 'late'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {s.status === 'present' ? '✓ Present' : s.status === 'absent' ? '✗ Absent' : s.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-500">
                      No attendance sessions recorded yet for this batch.
                    </div>
                  )}
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

                            {/* Action Buttons for active */}
                            {enrollment.status && (
                              <div className="mt-4 space-y-2">
                                {attendanceSummaries[enrollment.batches.batch_id] && (
                                  <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs">
                                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Attendance:</span>
                                    </div>
                                    <span className="font-extrabold text-emerald-900">
                                      {attendanceSummaries[enrollment.batches.batch_id].percentage}% ({attendanceSummaries[enrollment.batches.batch_id].presentCount}/{attendanceSummaries[enrollment.batches.batch_id].totalSessions})
                                    </span>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTileClick(enrollment);
                                    }}
                                  >
                                    <span>Join Class</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/class/${enrollment.batches.batch_id}/attendance`);
                                    }}
                                    title="View Attendance History"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Records</span>
                                  </button>
                                </div>
                              </div>
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
                      const isPast = !isLive && currentTimeMs > endMs;
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
                      const isInSlot = currentTimeMs >= startMs - 15 * 60 * 1000 && currentTimeMs <= endMs;
                      const isExpired = !isLive && currentTimeMs > endMs;
                      const canJoin = (isLive || isInSlot) && !isExpired;
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
                              {canJoin ? (item.status === 'LIVE' ? 'LIVE NOW' : item.status === 'COMPLETED' ? 'RE-JOINABLE' : 'IN SESSION') : isExpired ? 'SCHEDULE ENDED' : item.status}
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
              {/* Header Banner - Sleek, Compact & Responsive on Mobile */}
              <div className="relative bg-gradient-to-br from-purple-700 via-indigo-700 to-violet-800 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 shadow-xl overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute transform rotate-45 -top-10 -right-10 w-44 h-44 bg-white rounded-full"></div>
                  <div className="absolute transform -rotate-45 -bottom-10 -left-10 w-36 h-36 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-white/20 backdrop-blur-md p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/20 shadow-inner shrink-0">
                      <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                        Cloud Archive
                      </span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-1 truncate">Recorded Lectures</h2>
                      <p className="text-purple-100 text-xs sm:text-sm mt-0.5 line-clamp-1 sm:line-clamp-none">
                        Watch recorded sessions anytime with secure cloud streaming
                      </p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-200" />
                    <input
                      type="text"
                      placeholder="Search recordings..."
                      value={recordingSearchQuery}
                      onChange={(e) => setRecordingSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white focus:text-gray-900 text-white placeholder-purple-200 focus:placeholder-gray-400 border border-white/20 focus:outline-none transition-all text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Stats Row - 3 Compact Columns for Selected Enrolled Batch */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3.5 border border-white/20 text-center sm:text-left">
                    <p className="text-[10px] sm:text-xs text-purple-100 font-medium truncate">Total Lectures</p>
                    <p className="text-lg sm:text-2xl font-black mt-0.5 sm:mt-1 text-white">
                      {recordings.filter(r => currentRecordingBatchId ? r.batch_id === currentRecordingBatchId : true).length}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3.5 border border-white/20 text-center sm:text-left">
                    <p className="text-[10px] sm:text-xs text-purple-100 font-medium truncate">Available</p>
                    <p className="text-lg sm:text-2xl font-black mt-0.5 sm:mt-1 text-emerald-300">
                      {recordings.filter(r => (currentRecordingBatchId ? r.batch_id === currentRecordingBatchId : true) && r.status === 'READY').length}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3.5 border border-white/20 text-center sm:text-left">
                    <p className="text-[10px] sm:text-xs text-purple-100 font-medium truncate">Processing</p>
                    <p className="text-lg sm:text-2xl font-black mt-0.5 sm:mt-1 text-amber-300">
                      {recordings.filter(r => (currentRecordingBatchId ? r.batch_id === currentRecordingBatchId : true) && (r.status === 'PROCESSING' || r.status === 'RECORDING')).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student's Enrolled Batches Tabs Strip */}
              {activeEnrollments.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Your Enrolled Batch</span>
                    </span>
                    {activeEnrollments.length > 1 && (
                      <span className="text-[11px] text-purple-600 font-semibold">
                        Switch Batch ({activeEnrollments.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                    {activeEnrollments.map((enr) => {
                      const count = recordings.filter(r => r.batch_id === enr.batches.batch_id).length;
                      const isSelected = currentRecordingBatchId === enr.batches.batch_id;
                      return (
                        <button
                          key={enr.enrollment_id}
                          onClick={() => setSelectedRecordingBatchId(enr.batches.batch_id)}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 max-w-[260px] sm:max-w-xs ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/50'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-xs'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4 shrink-0" />
                          <span className="truncate">{enr.batches.batch_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                            isSelected ? 'bg-purple-900/60 text-purple-100' : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Enrolled Batch Info Card */}
              {currentRecordingBatchId && activeEnrollments.some(e => e.batches.batch_id === currentRecordingBatchId) && (
                <div className="mb-6 bg-white border border-purple-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 sm:p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
                      <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 text-base sm:text-lg truncate">
                          {activeEnrollments.find(e => e.batches.batch_id === currentRecordingBatchId)?.batches.batch_name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          {recordings.filter(r => r.batch_id === currentRecordingBatchId).length} Lectures
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Course: <strong className="text-gray-700">{activeEnrollments.find(e => e.batches.batch_id === currentRecordingBatchId)?.batches.courses?.course_name}</strong> • Tutor: <strong className="text-gray-700">{activeEnrollments.find(e => e.batches.batch_id === currentRecordingBatchId)?.batches.teachers?.users?.name || 'Instructor'}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/class/${currentRecordingBatchId}/recordings`)}
                    className="self-start sm:self-auto px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Batch Class Portal</span>
                  </button>
                </div>
              )}

              {/* Recordings Grid - Filtered to Student's Enrolled Batch */}
              {recordings
                .filter(r => {
                  if (currentRecordingBatchId && r.batch_id !== currentRecordingBatchId) {
                    return false;
                  }
                  if (!recordingSearchQuery) return true;
                  const q = recordingSearchQuery.toLowerCase();
                  return (
                    r.live_class?.title?.toLowerCase().includes(q) ||
                    r.live_class?.tutor?.full_name?.toLowerCase().includes(q) ||
                    r.display_title?.toLowerCase().includes(q)
                  );
                }).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {recordings
                    .filter(r => {
                      if (currentRecordingBatchId && r.batch_id !== currentRecordingBatchId) {
                        return false;
                      }
                      if (!recordingSearchQuery) return true;
                      const q = recordingSearchQuery.toLowerCase();
                      return (
                        r.live_class?.title?.toLowerCase().includes(q) ||
                        r.live_class?.tutor?.full_name?.toLowerCase().includes(q) ||
                        r.display_title?.toLowerCase().includes(q)
                      );
                    })
                    .map(rec => {
                      const batchInfo = activeEnrollments.find(e => e.batches.batch_id === rec.batch_id)?.batches;
                      return (
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

                            {/* Ready Badge & Part Badge */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 flex-wrap max-w-[85%]">
                              {rec.part_number && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-sm">
                                  Part {rec.part_number}
                                </span>
                              )}
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
                              {batchInfo && (
                                <div className="mb-2">
                                  <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    {batchInfo.batch_name}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                {rec.part_number && (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 shrink-0">
                                    Part {rec.part_number}
                                  </span>
                                )}
                                <h3 className="font-bold text-gray-900 text-lg line-clamp-2">
                                  {rec.display_title || rec.live_class?.title || rec.live_classes?.title || 'Recorded Live Session'}
                                </h3>
                              </div>

                              <div className="space-y-2 my-4 text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-indigo-500" />
                                  <span>Tutor: <strong className="text-gray-800">{rec.live_class?.tutor?.full_name || rec.live_classes?.teachers?.full_name || rec.live_classes?.teachers?.name || 'Instructor'}</strong></span>
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
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm mb-12">
                  <div className="w-20 h-20 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-4">
                    <FileVideo className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Recordings for this Batch
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    No recorded sessions have been archived for this batch yet. When your tutor conducts and finishes a class session, recordings will automatically appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {/* 🔹 VIEW: ATTENDANCE - Comprehensive Student Attendance View */}
          {currentView === 'attendance' && (
            <>
              {/* Header Banner */}
              <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-4 sm:p-6 md:p-8 mb-6 shadow-xl overflow-hidden text-white">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="bg-white/20 backdrop-blur-sm p-2.5 sm:p-3.5 rounded-2xl shadow-lg shrink-0">
                      <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">Your Attendance History</h2>
                      <p className="text-emerald-100 text-xs sm:text-sm mt-0.5 leading-relaxed">
                        Official live session attendance registry tracked by your course instructors
                      </p>
                    </div>
                  </div>

                  {/* Batch Selector - Mobile Responsive & Overflow Protected */}
                  {activeEnrollments.length > 0 && (
                    <div className="w-full md:w-auto flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-md p-2.5 sm:p-2 rounded-2xl border border-white/20 min-w-0 max-w-full">
                      <span className="text-xs text-emerald-100 font-bold shrink-0">Batch:</span>
                      <select
                        value={selectedAttendanceBatchId}
                        onChange={(e) => setSelectedAttendanceBatchId(e.target.value)}
                        className="w-full md:w-auto max-w-full bg-white text-gray-900 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer shadow-sm truncate"
                      >
                        {activeEnrollments.map((e) => (
                          <option key={e.batches.batch_id} value={e.batches.batch_id}>
                            {e.batches.batch_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Stats row inside banner */}
                {currentAttendanceSummary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-5 sm:mt-8">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-white/20 shadow-xs">
                      <p className="text-emerald-100 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Attendance Rate</p>
                      <p className="text-2xl sm:text-3xl font-black mt-1 text-white">{currentAttendanceSummary.percentage}%</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-white/20 shadow-xs">
                      <p className="text-emerald-100 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Attended Sessions</p>
                      <p className="text-2xl sm:text-3xl font-black mt-1 text-white">{currentAttendanceSummary.presentCount}</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-white/20 shadow-xs">
                      <p className="text-emerald-100 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Missed Sessions</p>
                      <p className="text-2xl sm:text-3xl font-black mt-1 text-white">{currentAttendanceSummary.absentCount}</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-white/20 shadow-xs">
                      <p className="text-emerald-100 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Classes</p>
                      <p className="text-2xl sm:text-3xl font-black mt-1 text-white">{currentAttendanceSummary.totalSessions}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sessions List */}
              {loadingAttendance && !currentAttendanceSummary ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-3"></div>
                    <p className="text-gray-500 font-medium">Loading session history...</p>
                  </div>
                </div>
              ) : currentAttendanceSummary && currentAttendanceSummary.sessions.length > 0 ? (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-12">
                  <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Session Breakdown</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Batch: <span className="font-semibold text-gray-700">{currentAttendanceSummary.batchName}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/class/${currentAttendanceSummary.batchId}/attendance`)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Full Attendance Page</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Mobile Cards View (< 768px) */}
                  <div className="block md:hidden divide-y divide-gray-100 p-2">
                    {currentAttendanceSummary.sessions.map((sess, idx) => (
                      <div key={sess.session_id} className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{sess.session_date}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase shrink-0 ${
                            sess.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : sess.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : sess.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {sess.status === 'present' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {sess.status === 'absent' && <X className="w-3.5 h-3.5" />}
                            {sess.status === 'late' && <Clock3 className="w-3.5 h-3.5" />}
                            <span>{sess.status}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-50">
                          <span className="flex items-center gap-1 text-gray-600 font-medium">
                            <Clock3 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{sess.marked_at ? formatISTTime(sess.marked_at) : 'Class Session'}</span>
                          </span>
                          {sess.notes && (
                            <span className="text-gray-500 truncate max-w-[150px] italic">
                              {sess.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 2. Desktop Table View (>= 768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-6">#</th>
                          <th className="py-3.5 px-6">Session Date</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6">Verification</th>
                          <th className="py-3.5 px-6">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentAttendanceSummary.sessions.map((sess, idx) => (
                          <tr key={sess.session_id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-4 px-6 text-gray-400 font-mono text-xs">{idx + 1}</td>
                            <td className="py-4 px-6 font-semibold text-gray-800">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                <span>{sess.session_date}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                sess.status === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : sess.status === 'absent'
                                  ? 'bg-red-100 text-red-800'
                                  : sess.status === 'late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {sess.status === 'present' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {sess.status === 'absent' && <X className="w-3.5 h-3.5" />}
                                {sess.status === 'late' && <Clock3 className="w-3.5 h-3.5" />}
                                <span>{sess.status}</span>
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-gray-500">
                              {sess.marked_at ? formatISTTime(sess.marked_at) : 'Class Session'}
                            </td>
                            <td className="py-4 px-6 text-xs text-gray-500">
                              {sess.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm mb-12">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Attendance Sessions Yet</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Your tutor has not yet recorded attendance sessions for this batch. Check back after your next live class!
                  </p>
                </div>
              )}
            </>
          )}

          {/* 🎬 Video Playback Modal */}
          {selectedRecording && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
              <div className="relative w-full max-w-5xl lg:max-w-6xl max-h-[96vh] overflow-y-auto bg-slate-950 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col animate-in fade-in zoom-in duration-200">
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
                          vid.volume = 1.0;
                          vid.muted = false;
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
