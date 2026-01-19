import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentDetails } from '../../services/api';
import { StudentDetails } from '../../types/auth';
import { Home, BookOpen, LogOut, Calendar, User, CreditCard } from 'lucide-react';
import logoImage from '../../assets/images/logo.png';

interface SidebarProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView = 'dashboard', onViewChange, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, tokenData, setToken } = useAuth();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  // Determine active menu based on route
  const [activeMenu, setActiveMenu] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/event-calendar') return 'calendar';
      if (path === '/dashboard') return currentView || 'dashboard';
    }
    return currentView || 'dashboard';
  });

  useEffect(() => {
    if (location.pathname === '/event-calendar') {
      setActiveMenu('calendar');
    } else if (location.pathname === '/dashboard') {
      setActiveMenu(currentView || 'dashboard');
    }
  }, [location.pathname, currentView]);

  // Fetch student details
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (token && tokenData?.student_id) {
        try {
          setLoading(true);
          const details = await getStudentDetails(tokenData.student_id);
          setStudentDetails(details);
        } catch (error) {
          console.error('Failed to fetch student details:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStudentDetails();
  }, [token, tokenData]);


  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const handleMenuClick = (view: string) => {
    setActiveMenu(view); // update active menu
    
    // Always close sidebar when menu item is clicked (especially for mobile/tablet)
    setIsOpen(false);
    
    // Navigate to routes for specific views
    if (view === 'calendar') {
      navigate('/event-calendar');
    } else if (view === 'dashboard') {
      navigate('/dashboard', { state: { view: 'dashboard' } });
      // Use view change callback if available (for Dashboard component)
      if (onViewChange) {
        setTimeout(() => onViewChange('dashboard'), 100);
      }
    } else if (view === 'enrollment') {
      navigate('/dashboard', { state: { view: 'enrollment' } });
      // Use view change callback if available (for Dashboard component)
      if (onViewChange) {
        setTimeout(() => onViewChange('enrollment'), 100);
      }
    } else if (view === 'payment') {
      navigate('/dashboard', { state: { view: 'payment' } });
      // Use view change callback if available (for Dashboard component)
      if (onViewChange) {
        setTimeout(() => onViewChange('payment'), 100);
      }
    } else {
      // For other views, use callback if available
      if (onViewChange) onViewChange(view);
    }
  };

  return (
    <>
      {/* Overlay - Close sidebar when clicking outside (mobile/tablet only) */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - BERRY Style */}
      <div
        className={`fixed inset-y-0 left-0 z-40 lg:z-30 transition-transform duration-300 
          lg:translate-x-0 ${!isOpen ? "-translate-x-full" : "translate-x-0"}
          w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm`}
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
              <img
                src={logoImage}
                alt="ISML Logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Student Portal
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Your Learning Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation - Scrollable - BERRY Style */}
        <div className="relative flex-1 overflow-y-auto px-4 py-4 min-h-0">
          <ul className="space-y-1">
            {[
              {
                label: "Dashboard",
                view: "dashboard",
                icon: Home,
                description: "Available batches",
              },
              {
                label: "Your Enrollment",
                view: "enrollment",
                icon: BookOpen,
                description: "Enrolled batches",
              },
              {
                label: "Payment",
                view: "payment",
                icon: CreditCard,
                description: "Payment history",
              },
              {
                label: "Event Calendar",
                view: "calendar",
                icon: Calendar,
                description: "View events",
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.view;

              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleMenuClick(item.view)}
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
                  </button>
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

          {/* Logout Button - BERRY Style */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg 
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200
              flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
