import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBatchDetails, getStudentDetails, getChatMessages } from '../services/api';
import { Clock, MessageCircle, LogOut, User, Settings, Info, X, MapPin, Globe, BookOpen } from 'lucide-react';
import { StudentDetails, BatchDetails, ChatMessage } from '../types/auth';
import NotificationBell from './NotificationBell';
import StudentProfileModal from './StudentProfileModal';
import ForgetPasswordModal from './ForgetPasswordModal';

const Chat: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token, tokenData, setToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Note: Students can only view messages, not send them
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

  // Fetch batch details to get teacher name
  const fetchBatchDetails = async () => {
    if (!batchId || !token) return;
    
    try {
      const details = await getBatchDetails(batchId, token);
      setBatchDetails(details);
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  };

  // Fetch messages for the batch
  const fetchMessages = async (isInitialLoad = false) => {
    if (!batchId) {
      setError('Invalid batch ID');
      setLoading(false);
      return;
    }

    try {
      if (isInitialLoad) {
        setError(null);
      }
      const data = await getChatMessages(batchId);
      setMessages(data);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      let errorMessage = 'Failed to load messages. Please try again.';
      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to the chat server. Please try again later.';
      }
      if (isInitialLoad) {
        setError(errorMessage);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Note: Students can only view messages, not send them

  // Fetch messages on mount and when batchId changes
  useEffect(() => {
    if (!batchId || !token) return;

    fetchBatchDetails();
    
    // Initial load with loading state
    fetchMessages(true);
    
    // Set up polling for real-time updates every 5 seconds
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [batchId, token]);

  if (!batchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h1 className="text-2xl font-semibold text-gray-900">Error</h1>
            <p className="mt-2 text-gray-600">No batch ID provided.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 lg:ml-72">
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
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Class Chat
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Connect with your batch
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

        {/* Main Chat Layout - BERRY Style */}
        <div className="flex flex-col h-[calc(100vh-80px)] relative overflow-hidden bg-gray-50">
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {loading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#e3f2fd' }}>
                  <MessageCircle className="w-10 h-10" style={{ color: '#2196f3' }} />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">No Messages Yet</h4>
                <p className="text-gray-500 text-sm text-center max-w-md">
                  No messages from your teacher yet. Messages will appear here when your teacher sends them.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.sender === 'teacher' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[75%] rounded-xl p-4 shadow-sm ${
                      msg.sender === 'teacher' 
                        ? 'text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`} style={msg.sender === 'teacher' ? { backgroundColor: '#2196f3' } : {}}>
                      <div className="flex items-start space-x-2">
                        <div className={`p-1.5 rounded-lg ${
                          msg.sender === 'teacher' 
                            ? 'bg-white/20' 
                            : 'bg-blue-50'
                        }`}>
                          <User className={`w-4 h-4 ${msg.sender === 'teacher' ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1">
                          {msg.sender === 'teacher' && msg.sender_name && (
                            <p className="text-xs text-white/80 mb-1 font-medium">
                              {msg.sender_name} {msg.sender === 'teacher' ? '(Teacher)' : ''}
                            </p>
                          )}
                          <p className="text-sm sm:text-base leading-relaxed break-words">{msg.text}</p>
                          <div className="flex items-center mt-2">
                            <span className={`text-xs flex items-center space-x-1 ${
                              msg.sender === 'teacher' 
                                ? 'text-white/70' 
                                : 'text-gray-500'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>{new Date(msg.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Only Notice - Students cannot send messages */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <MessageCircle className="w-4 h-4 mr-2" />
              <span>View only - Teachers can send messages to the batch</span>
            </div>
          </div>
        </div>
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
                        <MessageCircle className="w-5 h-5 text-blue-600" />
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
                        <Clock className="w-5 h-5 text-blue-600" />
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

export default Chat;