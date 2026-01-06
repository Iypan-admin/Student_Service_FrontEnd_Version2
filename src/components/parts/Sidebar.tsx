import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentDetails, fetchEliteCard } from '../../services/api';
import { StudentDetails } from '../../types/auth';
import { Menu, X, Home, BookOpen, CreditCard, LogOut } from 'lucide-react';
import logoImage from '../../assets/images/logo.png';

interface SidebarProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView = 'dashboard', onViewChange }) => {
  const navigate = useNavigate();
  const { token, tokenData, setToken } = useAuth();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [eliteCard, setEliteCard] = useState<any>(null);

  const [activeMenu, setActiveMenu] = useState(currentView);

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

  // Fetch elite card
  useEffect(() => {
    const getEliteCard = async () => {
      if (studentDetails?.registration_number) {
        try {
          const data = await fetchEliteCard(studentDetails.registration_number);
          if (data.success) {
            setEliteCard(data.data);
          }
        } catch (err) {
          console.error("Elite Card Fetch Error:", err);
        }
      }
    };

    getEliteCard();
  }, [studentDetails]);

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const handleMenuClick = (view: string) => {
    setActiveMenu(view); // update active menu
    if (onViewChange) onViewChange(view); // callback if parent wants
    setIsOpen(false); // close mobile menu
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-16 right-5 z-50 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 
          rounded-xl text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 
          shadow-lg hover:shadow-xl hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 
          lg:translate-x-0 ${!isOpen ? '-translate-x-full' : 'translate-x-0'}
          w-72 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white 
          flex flex-col shadow-2xl`}
      >
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-white rounded-full blur-2xl"></div>
        </div>

        {/* Header */}
        <div className="relative pt-8 px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src={logoImage} 
                alt="ISML Logo" 
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Student Portal</h2>
              <p className="text-xs text-blue-100 mt-0.5">Your Learning Dashboard</p>
            </div>
          </div>
        </div>

        {/* Main Navigation - Scrollable */}
        <div className="relative flex-1 overflow-y-auto px-4 py-3 min-h-0 sidebar-scroll">
          <ul className="space-y-2">
            {[
              { label: 'Dashboard', view: 'dashboard', icon: Home, description: 'Available batches' },
              { label: 'Your Enrollment', view: 'enrollment', icon: BookOpen, description: 'Enrolled batches' },
              { label: 'Payment', view: 'payment', icon: CreditCard, description: 'Payment history' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.view;

              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleMenuClick(item.view)}
                    className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-left relative
                      transition-all duration-500 ease-in-out group overflow-hidden
                      transform hover:scale-[1.02] active:scale-[0.98]
                      ${isActive 
                        ? 'bg-white/20 backdrop-blur-sm shadow-lg border border-white/30 scale-[1.02]' 
                        : 'hover:bg-white/10 hover:backdrop-blur-sm'
                      }`}
                  >
                    {/* Animated background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
                      transform -skew-x-12 transition-transform duration-700 group-hover:translate-x-full
                      ${isActive ? 'opacity-0' : ''}`} />
                    
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-md
                      transition-all duration-500 ease-in-out ${
                        isActive 
                          ? 'bg-white/30 shadow-md scale-110' 
                          : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-105'
                      }`}>
                      <Icon className={`w-4 h-4 text-white transition-transform duration-500 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`} />
                    </div>
                    
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className={`font-semibold text-sm text-white truncate transition-all duration-500 ${
                        isActive ? 'translate-x-1' : 'group-hover:translate-x-1'
                      }`}>
                        {item.label}
                      </p>
                      <p className={`text-[11px] mt-0.5 transition-all duration-500 truncate ${
                        isActive ? 'text-blue-100 translate-x-1' : 'text-blue-200 group-hover:text-white group-hover:translate-x-1'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                    
                    {isActive && (
                      <div className="relative z-10 w-1.5 h-1.5 bg-white rounded-full shadow-md animate-pulse transition-all duration-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Elite Card Details Section - Pinned to Bottom */}
        <div className="relative mt-auto p-3 lg:p-6 bg-gradient-to-t from-indigo-900/90 to-transparent backdrop-blur-md border-t border-white/10">
          {/* Elite Card Details */}
          <div className="space-y-2 lg:space-y-4">
            <div className="flex items-center gap-1.5 lg:gap-2 mb-2 lg:mb-4">
              <CreditCard className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              <h3 className="text-xs lg:text-sm font-bold text-white tracking-wide">
                Elite Card Details
              </h3>
            </div>

            {loading ? (
              <div className="space-y-2 lg:space-y-3">
                <div className="h-3 lg:h-4 bg-white/10 rounded animate-pulse"></div>
                <div className="h-3 lg:h-4 bg-white/10 rounded animate-pulse w-3/4"></div>
              </div>
            ) : studentDetails ? (
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center gap-1.5 lg:gap-2 p-1.5 lg:p-2.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  <p className="text-[10px] lg:text-xs text-blue-200 font-medium">Card Type:</p>
                  <p className="text-[10px] lg:text-xs font-semibold text-white">
                    {eliteCard?.card_type || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 lg:gap-2 p-1.5 lg:p-2.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  <p className="text-[10px] lg:text-xs text-blue-200 font-medium">Card Number:</p>
                  <p className="text-[10px] lg:text-xs font-semibold text-white">
                    {eliteCard?.card_number || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[10px] lg:text-xs text-red-300 font-medium bg-red-500/20 p-1.5 lg:p-2.5 rounded-lg">
                Unable to load Elite Card details.
              </p>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-3 lg:mt-6 py-2 lg:py-3 px-3 lg:px-4 rounded-xl text-xs lg:text-sm font-bold
              bg-white/10 hover:bg-white/20 text-white
              transition-all duration-300 ease-in-out
              border border-white/20 hover:border-white/30
              flex items-center justify-center gap-1.5 lg:gap-2 group
              shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:rotate-12 transition-transform" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
