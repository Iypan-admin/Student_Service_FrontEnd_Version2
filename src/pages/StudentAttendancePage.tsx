import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentAttendance } from '../services/api';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, BookOpen, TrendingUp, LogOut } from 'lucide-react';

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
  const { token } = useAuth();
  const [attendanceData, setAttendanceData] = useState<BatchAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
        <div className="flex-1 flex flex-col lg:ml-[calc(68rem/4)]">
          <nav className="bg-white shadow-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900 tracking-wide">
                    Attendance Report
                  </h1>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
                <h2 className="text-lg font-semibold text-white tracking-wide">Loading...</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
        <div className="flex-1 flex flex-col lg:ml-[calc(68rem/4)]">
          <nav className="bg-white shadow-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900 tracking-wide">
                    Attendance Report
                  </h1>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
                <h2 className="text-lg font-semibold text-white tracking-wide">Error</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Attendance</h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchAttendanceData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
        <div className="flex-1 flex flex-col lg:ml-[calc(68rem/4)]">
          <nav className="bg-white shadow-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900 tracking-wide">
                    Attendance Report
                  </h1>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
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
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
        {/* Navigation Bar - Responsive */}
        <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-10">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
            <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Attendance Report
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Track your learning progress</p>
                </div>
              </div>
              <div className="flex items-center ml-1 sm:ml-2 md:ml-4 gap-2 sm:gap-3 flex-shrink-0">
                <div className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full max-w-[100px] sm:max-w-[150px] md:max-w-none">
                  <span className="text-xs sm:text-sm font-medium text-blue-700 truncate block">
                    {attendanceData.batch_name}
                  </span>
                </div>
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    transition-all duration-200 min-h-[40px] sm:min-h-auto"
                >
                  <LogOut className="h-5 w-5 sm:h-4 sm:w-4 rotate-180" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content - Mobile Optimized */}
        <main className="flex-1 w-full mx-auto py-2 sm:py-4 md:py-6 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <div className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1 sm:p-1.5 md:p-2 bg-white/20 rounded-md sm:rounded-lg flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white tracking-wide">Attendance Summary</h2>
              </div>
            </div>
            
            <div className="p-2 sm:p-4 md:p-6">
              {/* Batch Info Header - Mobile Optimized */}
              <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg sm:rounded-xl md:rounded-2xl border border-blue-200/50 shadow-lg">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 break-words">{attendanceData.batch_name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                      <span className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-md w-fit ${getBatchStatusColor(attendanceData.batch_status)}`}>
                        {attendanceData.batch_status}
                      </span>
                      <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm break-words">
                          {new Date(attendanceData.start_date).toLocaleDateString()} - {attendanceData.end_date ? new Date(attendanceData.end_date).toLocaleDateString() : 'Ongoing'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center lg:text-right flex-shrink-0 mt-2 sm:mt-0">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                      {attendanceData.attendance_percentage}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Overall Attendance</div>
                    <div className="w-24 sm:w-32 md:w-40 bg-gray-200 rounded-full h-2 sm:h-3 shadow-inner mx-auto lg:mx-0">
                      <div 
                        className="bg-gradient-to-r from-green-400 via-blue-500 to-indigo-600 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                        style={{ width: `${attendanceData.attendance_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Summary - Mobile Optimized */}
              <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-green-50 via-blue-50 to-indigo-50 rounded-lg sm:rounded-xl md:rounded-2xl border border-green-200/50 shadow-lg">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                  <div className="p-1 sm:p-1.5 md:p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-md sm:rounded-lg flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span>Key Attendance Metrics</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <div className="group text-center p-3 sm:p-4 md:p-6 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-green-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-600" />
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mb-1 sm:mb-2">{attendanceData.present_count}</div>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Present Days</div>
                    <div className="text-xs sm:text-sm text-gray-500 bg-green-50 px-2 py-1 rounded-full">
                      {attendanceData.total_sessions > 0 
                        ? `${Math.round((attendanceData.present_count / attendanceData.total_sessions) * 100)}% of total`
                        : 'No sessions yet'
                      }
                    </div>
                  </div>
                  <div className="group text-center p-3 sm:p-4 md:p-6 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-red-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-red-100 to-pink-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center">
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-600" />
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 mb-1 sm:mb-2">{attendanceData.absent_count}</div>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Absent Days</div>
                    <div className="text-xs sm:text-sm text-gray-500 bg-red-50 px-2 py-1 rounded-full">
                      {attendanceData.total_sessions > 0 
                        ? `${Math.round((attendanceData.absent_count / attendanceData.total_sessions) * 100)}% of total`
                        : 'No sessions yet'
                      }
                    </div>
                  </div>
                  <div className="group text-center p-3 sm:p-4 md:p-6 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">{attendanceData.total_sessions}</div>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Total Sessions</div>
                    <div className="text-xs sm:text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
                      {attendanceData.present_count + attendanceData.absent_count + attendanceData.late_count + attendanceData.excused_count} marked
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics - Mobile Optimized */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                  <div className="p-1 sm:p-1.5 md:p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md sm:rounded-lg flex-shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span>Detailed Breakdown</span>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                  <div className="group text-center p-2 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-md sm:rounded-lg md:rounded-xl border border-green-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600 mb-1">{attendanceData.present_count}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Present</div>
                    <div className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">
                      {attendanceData.total_sessions > 0 
                        ? `${Math.round((attendanceData.present_count / attendanceData.total_sessions) * 100)}%`
                        : '0%'
                      }
                    </div>
                  </div>
                  <div className="group text-center p-2 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-br from-red-50 to-pink-50 rounded-md sm:rounded-lg md:rounded-xl border border-red-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600 mb-1">{attendanceData.absent_count}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Absent</div>
                    <div className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full font-medium">
                      {attendanceData.total_sessions > 0 
                        ? `${Math.round((attendanceData.absent_count / attendanceData.total_sessions) * 100)}%`
                        : '0%'
                      }
                    </div>
                  </div>
                  <div className="group text-center p-2 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-md sm:rounded-lg md:rounded-xl border border-yellow-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1">{attendanceData.late_count}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Late</div>
                    <div className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full font-medium">
                      {attendanceData.total_sessions > 0 
                        ? `${Math.round((attendanceData.late_count / attendanceData.total_sessions) * 100)}%`
                        : '0%'
                      }
                    </div>
                  </div>
                  <div className="group text-center p-2 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md sm:rounded-lg md:rounded-xl border border-blue-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">{attendanceData.excused_count}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Excused</div>
                    <div className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                      {attendanceData.total_sessions > 0 
                        ? `${Math.round((attendanceData.excused_count / attendanceData.total_sessions) * 100)}%`
                        : '0%'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions List - Mobile Optimized */}
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                  <div className="p-1 sm:p-1.5 md:p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md sm:rounded-lg flex-shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span>Attendance Sessions ({attendanceData.sessions.length})</span>
                </h3>
                
                {attendanceData.sessions.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 md:py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-200/50">
                    <div className="p-2 sm:p-3 md:p-4 bg-white rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-400" />
                    </div>
                    <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">No Sessions Yet</h4>
                    <p className="text-xs sm:text-sm md:text-base text-gray-500 px-2 sm:px-4">Attendance sessions will appear here once your teacher starts marking attendance.</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 md:space-y-4">
                    {attendanceData.sessions.map((session, index) => (
                      <div
                        key={session.session_id}
                        className="group border border-gray-200/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:scale-[1.01] sm:hover:scale-[1.02]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="p-1.5 sm:p-2 md:p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-md sm:rounded-lg md:rounded-xl flex-shrink-0">
                              {getStatusIcon(session.status)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1 break-words">
                                {new Date(session.session_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 sm:gap-2">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="break-words">
                                  {session.marked_at ? `Marked at ${new Date(session.marked_at).toLocaleTimeString()}` : 'Not marked'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center sm:justify-end">
                            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-xs sm:text-sm font-bold shadow-md ${getStatusColor(session.status)}`}>
                              {getStatusText(session.status)}
                            </span>
                          </div>
                        </div>
                        {session.notes && (
                          <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md sm:rounded-lg md:rounded-xl border border-blue-200/50">
                            <div className="flex items-start gap-1 sm:gap-2">
                              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs sm:text-sm text-blue-800 font-medium break-words">{session.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentAttendancePage;