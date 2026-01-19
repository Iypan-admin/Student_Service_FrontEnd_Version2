import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Users, BookOpen, Clock, GraduationCap, Filter, ArrowUpDown, CheckCircle2, Clock3, ArrowRight, Calendar, Video, User, Menu, X, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./parts/Sidebar";
import BatchCard from "./BatchCard";
import BatchDetailsModal from "./BatchDetailsModal";
import StudentProfileModal from "./StudentProfileModal";
import ForgetPasswordModal from "./ForgetPasswordModal";
import Payments from "./Payments";
import NotificationBell from "./NotificationBell";
import {
  getStudentDetails,
  getEnrolledBatches,
  getBatches,
} from "../services/api";
import { Enrollment, Batch } from "../types/auth";

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
