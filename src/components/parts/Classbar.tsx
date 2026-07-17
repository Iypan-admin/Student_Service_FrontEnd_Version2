import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentDetails } from '../../services/api';
import { StudentDetails } from '../../types/auth';
import { Menu, X, LogOut, Calendar, BookOpen, MessageCircle, BarChart3, GraduationCap, User, TrendingUp } from 'lucide-react';

const Classbar = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, tokenData } = useAuth();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <>
      {/* Hamburger Button - Berry Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-lg shadow-md hover:shadow-lg 
          text-gray-700 hover:bg-gray-50 transition-all duration-200 border border-gray-200"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Classbar - Berry Style */}
      <div
        className={`fixed inset-y-0 left-0 z-40 lg:z-30 w-72 bg-white flex flex-col shadow-xl transition-all duration-300 
          ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          border-r border-gray-200`}
      >
        {/* Header - BERRY Style */}
        <div className="pt-6 px-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
              style={{
                background:
                  "linear-gradient(to bottom right, #2196f3, #1976d2)",
              }}
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Class Portal
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Learning Management
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation - Scrollable - BERRY Style */}
        <div className="relative flex-1 overflow-y-auto px-4 py-4 min-h-0">
          <ul className="space-y-1">
            {[
              { 
                label: 'Class Schedule', 
                href: `/class/${batchId}`, 
                icon: Calendar,
                description: 'View schedule'
              },
              { 
                label: 'Resources', 
                href: `/class/${batchId}/resources`, 
                icon: BookOpen,
                description: 'Study materials'
              },
              { 
                label: 'Chat', 
                href: `/class/${batchId}/chat`, 
                icon: MessageCircle,
                description: 'Class discussion'
              },
              { 
                label: 'Attendance', 
                href: `/class/${batchId}/attendance`, 
                icon: BarChart3,
                description: 'Attendance records'
              },
              { 
                label: 'LSRW', 
                href: `/class/${batchId}/lsrw`, 
                icon: GraduationCap,
                description: 'Learning tasks'
              },
              { 
                label: 'Results & Certificate', 
                href: `/class/${batchId}/results-certificate`, 
                icon: TrendingUp,
                description: 'Assessment marks & certificates'
              },
            ].map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                      transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? "bg-blue-100"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors duration-200 ${
                          isActive ? "text-blue-600" : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm truncate ${
                          isActive ? "text-blue-700" : "text-gray-800"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Student Profile Section - Pinned to Bottom - BERRY Style */}
        <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
          {/* Student Profile */}
          <div className="flex items-center gap-3 mb-4">
            {/* Student Avatar with Online Status */}
            <div className="relative">
              {studentDetails?.profile_picture ? (
                <img
                  src={studentDetails.profile_picture}
                  alt={studentDetails.name || 'Student'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white">
                  <User className="w-6 h-6" />
                </div>
              )}
              {/* Online Status Indicator */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            
            {/* Student Name and Role */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-800 truncate">
                {studentDetails?.name || 'Student'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Student
              </p>
            </div>
          </div>

          {/* Back to Dashboard Button - BERRY Style */}
          <button
            onClick={handleBackToDashboard}
            className="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg 
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200
              flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </button>
        </div>

      </div>

      {/* Overlay for mobile when sidebar is open - Berry Style */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Classbar;