import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentAttendance, getStudentDetails, getBatchDetails } from '../services/api';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, BookOpen, TrendingUp, LogOut, User, Settings, Info, X, MapPin, Globe } from 'lucide-react';
import { StudentDetails, BatchDetails } from '../types/auth';
import NotificationBell from '../components/NotificationBell';
import StudentProfileModal from '../components/StudentProfileModal';
import ForgetPasswordModal from '../components/ForgetPasswordModal';
import Classbar from '../components/parts/Classbar';

interface AttendanceSession {
  session_id: string;
  session_date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'not_marked';
  marked_at: string | null;
  notes: string | null;
}

interface BatchAttendance {
  batch_id: string;
  batch_name: string;
  batch_status: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
  sessions: AttendanceSession[];
}

const StudentAttendancePage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token, tokenData, setToken } = useAuth();
  const [attendanceData, setAttendanceData] = useState<BatchAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showForgetPasswordModal, setShowForgetPasswordModal] = useState(false);
  const [showBatchDetailsModal, setShowBatchDetailsModal] = useState(false);
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

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

  // Fetch batch details
  useEffect(() => {
    if (!batchId || !token) return;

    const fetchBatchDetails = async () => {
      try {
        const details = await getBatchDetails(batchId, token);
        setBatchDetails(details);
      } catch (error) {
        console.error('Error fetching batch details:', error);
      }
    };

    fetchBatchDetails();
  }, [batchId, token]);

  useEffect(() => {
    if (!batchId || !token) return;

    // Initial load
    fetchAttendanceData();
    
    // Set up polling for real-time updates every 60 seconds
    const interval = setInterval(() => {
      fetchAttendanceData();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [batchId, token]);

  const fetchAttendanceData = async () => {
    if (!batchId) {
      setError('Batch ID is required');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Authentication token is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await getStudentAttendance(batchId, token);
      console.log('🔍 Raw backend response:', data);
      
      if (data.success) {
        // Transform the backend response to match frontend interface
        const transformedData = {
          batch_id: data.data.batch?.batch_id || '',
          batch_name: data.data.batch?.batch_name || 'Unknown Batch',
          batch_status: data.data.batch?.status || 'Unknown',
          start_date: data.data.batch?.start_date || '',
          end_date: data.data.batch?.end_date || '',
          total_sessions: data.data.summary?.total_sessions || 0,
          present_count: data.data.summary?.present_count || 0,
          absent_count: data.data.summary?.absent_count || 0,
          late_count: data.data.summary?.late_count || 0,
          excused_count: data.data.summary?.excused_count || 0,
          attendance_percentage: data.data.summary?.attendance_percentage || 0,
          sessions: data.data.sessions || []
        };
        console.log('🔍 Transformed data:', transformedData);
        setAttendanceData(transformedData);
      } else {
        throw new Error(data.error || 'Failed to fetch attendance data');
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'excused':
        return 'Excused';
      default:
        return 'Not Marked';
    }
  };

  const getBatchStatusColor = (status: string) => {
    switch (status) {
      case 'Started':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Approved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

    return (
    <>
    <div className="min-h-screen bg-gray-50 lg:ml-72">
      <Classbar />
      
      {/* Navbar - BERRY Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 lg:z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 min-h-[4rem]">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
              {/* Title Section - BERRY Style */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(to bottom right, #2196f3, #1976d2)",
                  }}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                    Attendance Report
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
                    Track your learning progress
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
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

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          {loading ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500">
                <h2 className="text-lg font-semibold text-white tracking-wide">Loading...</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500">
                <h2 className="text-lg font-semibold text-white tracking-wide">Error</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Attendance</h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchAttendanceData}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : !attendanceData ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500">
                <h2 className="text-lg font-semibold text-white tracking-wide">No Data</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-6">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">No Attendance Data</h2>
                  <p className="text-gray-600">No attendance data found for this batch.</p>
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-6">
              {/* Batch Info Header - BERRY Style */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 break-words">{attendanceData.batch_name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <span className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm w-fit ${getBatchStatusColor(attendanceData.batch_status)}`}>
                        {attendanceData.batch_status}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm break-words">
                          {new Date(attendanceData.start_date).toLocaleDateString()} - {attendanceData.end_date ? new Date(attendanceData.end_date).toLocaleDateString() : 'Ongoing'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-2 border-t border-blue-200 sm:border-t-0 sm:pt-0">
                    <div className="text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 mb-1">
                        {attendanceData.attendance_percentage}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">Overall Attendance</div>
                    </div>
                    <div className="flex-1 sm:flex-initial sm:w-32 md:w-40 bg-gray-200 rounded-full h-2.5 sm:h-3 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-500 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                        style={{ width: `${attendanceData.attendance_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Summary - BERRY Style */}
              <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Present Sessions Card - BERRY Style */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 p-4 sm:p-5 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-white shadow-sm mr-3 sm:mr-4 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-green-700">Present Sessions</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">{attendanceData.present_count}</p>
                      {attendanceData.total_sessions > 0 && (
                        <p className="text-xs text-green-600 mt-0.5 sm:mt-1">
                          {Math.round((attendanceData.present_count / attendanceData.total_sessions) * 100)}% of total
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Absent Sessions Card - BERRY Style */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md border border-red-200 p-4 sm:p-5 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-white shadow-sm mr-3 sm:mr-4 flex-shrink-0">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-red-700">Absent Sessions</p>
                      <p className="text-2xl sm:text-3xl font-bold text-red-900">{attendanceData.absent_count}</p>
                      {attendanceData.total_sessions > 0 && (
                        <p className="text-xs text-red-600 mt-0.5 sm:mt-1">
                          {Math.round((attendanceData.absent_count / attendanceData.total_sessions) * 100)}% of total
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Sessions Card - BERRY Style */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-white shadow-sm mr-3 sm:mr-4 flex-shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-blue-700">Total Sessions</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">{attendanceData.total_sessions}</p>
                      <p className="text-xs text-blue-600 mt-0.5 sm:mt-1">
                        {attendanceData.present_count + attendanceData.absent_count + attendanceData.late_count + attendanceData.excused_count} marked
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics - BERRY Style */}
              <div className="mb-4 sm:mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-200">
                  <div className="text-xl sm:text-2xl font-bold text-green-900 mb-1">{attendanceData.present_count}</div>
                  <div className="text-xs sm:text-sm font-medium text-green-700 mb-1">Present</div>
                  <div className="text-xs text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                    {attendanceData.total_sessions > 0 
                      ? `${Math.round((attendanceData.present_count / attendanceData.total_sessions) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md border border-red-200 p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-200">
                  <div className="text-xl sm:text-2xl font-bold text-red-900 mb-1">{attendanceData.absent_count}</div>
                  <div className="text-xs sm:text-sm font-medium text-red-700 mb-1">Absent</div>
                  <div className="text-xs text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                    {attendanceData.total_sessions > 0 
                      ? `${Math.round((attendanceData.absent_count / attendanceData.total_sessions) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md border border-yellow-200 p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-200">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-900 mb-1">{attendanceData.late_count}</div>
                  <div className="text-xs sm:text-sm font-medium text-yellow-700 mb-1">Late</div>
                  <div className="text-xs text-yellow-600 bg-yellow-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                    {attendanceData.total_sessions > 0 
                      ? `${Math.round((attendanceData.late_count / attendanceData.total_sessions) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-200">
                  <div className="text-xl sm:text-2xl font-bold text-blue-900 mb-1">{attendanceData.excused_count}</div>
                  <div className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Excused</div>
                  <div className="text-xs text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                    {attendanceData.total_sessions > 0 
                      ? `${Math.round((attendanceData.excused_count / attendanceData.total_sessions) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>

              {/* Attendance Sessions Table - BERRY Style */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500">
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-wide">
                    Attendance Sessions ({attendanceData.sessions.length})
                  </h2>
                </div>
                
                <div className="p-3 sm:p-4 md:p-6">
                  {attendanceData.sessions.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                        <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Sessions Yet</h4>
                      <p className="text-sm sm:text-base text-gray-500 px-4">Attendance sessions will appear here once your teacher starts marking attendance.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-blue-600 to-blue-500">
                            <tr>
                              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">S.No</th>
                              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider hidden sm:table-cell">Marked At</th>
                              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceData.sessions.map((session, index) => (
                              <tr key={session.session_id} className="hover:bg-blue-50 transition-colors duration-150">
                                <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {new Date(session.session_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                    <span className="text-xs text-gray-400 hidden sm:inline">
                                      {new Date(session.session_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        weekday: 'short'
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm">
                                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${getStatusColor(session.status)}`}>
                                    <span className="hidden sm:inline">{getStatusIcon(session.status)}</span>
                                    {getStatusText(session.status)}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                                  {session.marked_at ? (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 flex-shrink-0" />
                                      <span>{new Date(session.marked_at).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">Not marked</span>
                                  )}
                                </td>
                                <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-500 break-words max-w-xs hidden md:table-cell">
                                  {session.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
          <div className="fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">Batch Details</h2>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5 hidden sm:block">Complete batch information</p>
              </div>
              <button
                onClick={() => setShowBatchDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {batchDetails ? (
                <div className="space-y-6">
                  {/* Batch Name & Status */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{batchDetails.batch_name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 sm:px-3 py-1 bg-white rounded-full text-xs sm:text-sm font-medium text-blue-700 border border-blue-300">
                        {batchDetails.courses?.course_name || 'N/A'}
                      </span>
                      {batchDetails.status && (
                        <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Course Type */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Course Type</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900 break-words">{batchDetails.courses?.type || 'N/A'}</p>
                    </div>

                    {/* Mode */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Mode</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900 break-words">{batchDetails.courses?.mode || 'N/A'}</p>
                    </div>

                    {/* Duration */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Duration</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900 break-words">{batchDetails.duration || 'N/A'}</p>
                    </div>

                    {/* Total Sessions */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Total Sessions</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900">{batchDetails.total_sessions || 'N/A'}</p>
                    </div>

                    {/* Teacher */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Teacher</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900 break-words">
                        {batchDetails.teachers?.users?.name || batchDetails.teachers?.users?.full_name || 'N/A'}
                      </p>
                    </div>

                    {/* Center */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Center</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900 break-words">{batchDetails.centers?.center_name || 'N/A'}</p>
                    </div>

                    {/* Language */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Language</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900 break-words">{batchDetails.courses?.language || 'N/A'}</p>
                    </div>

                    {/* Program */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Program</h4>
                      </div>
                      <p className="text-base sm:text-lg font-medium text-gray-900 break-words">{batchDetails.courses?.program || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600">
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

export default StudentAttendancePage;