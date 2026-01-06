import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBatchDetails } from '../../services/api';
import { BatchDetails } from '../../types/auth';
import { Menu, X, LogOut, Calendar, BookOpen, MessageCircle, BarChart3, GraduationCap, User, Clock, Award } from 'lucide-react';

const Classbar = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      if (batchId && token) {
        try {
          setLoading(true);
          const details = await getBatchDetails(batchId, token);
          setBatchDetails(details);
        } catch (error) {
          console.error('Failed to fetch batch details:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBatchDetails();
  }, [batchId, token]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <>
      {/* Hamburger Button - Enhanced styling */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-12 right-4 z-50 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 
          backdrop-blur-sm rounded-full text-white hover:from-blue-700 hover:to-indigo-700 
          transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 
          border border-white/20"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Classbar - Enhanced gradient and styling */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 
          text-white flex flex-col shadow-2xl transition-all duration-500 
          ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          border-r border-white/10 backdrop-blur-sm`}
      >
        {/* Header - Enhanced with better icon and styling */}
        <div className="pt-8 px-6 pb-4">
          <div className="flex items-center gap-4 mb-8">
            {/* Enhanced icon with gradient */}
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                Class Portal
              </h2>
              <p className="text-sm text-blue-300/70">Learning Management</p>
            </div>
          </div>
        </div>

        {/* Main Content - Enhanced menu with icons */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-2">
          <ul className="space-y-2">
            {[
              { 
                label: 'Class Schedule', 
                href: `/class/${batchId}`, 
                icon: Calendar,
                color: 'from-blue-500 to-cyan-500'
              },
              { 
                label: 'Resources', 
                href: `/class/${batchId}/resources`, 
                icon: BookOpen,
                color: 'from-green-500 to-emerald-500'
              },
              { 
                label: 'Chat', 
                href: `/class/${batchId}/chat`, 
                icon: MessageCircle,
                color: 'from-purple-500 to-pink-500'
              },
              { 
                label: 'Attendance', 
                href: `/class/${batchId}/attendance`, 
                icon: BarChart3,
                color: 'from-orange-500 to-red-500'
              },
              { 
                label: 'LSRW', 
                href: `/class/${batchId}/lsrw`, 
                icon: GraduationCap,
                color: 'from-indigo-500 to-purple-500'
              },
            ].map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`group flex items-center gap-4 py-3.5 px-4 rounded-xl text-sm font-semibold 
                      transition-all duration-300 ease-out
                      ${isActive 
                        ? 'bg-white/20 text-white shadow-lg scale-105 border border-white/30' 
                        : 'hover:bg-white/10 hover:text-white hover:scale-105 hover:shadow-lg'
                      }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} shadow-md group-hover:shadow-lg transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className={`${isActive ? 'text-white font-bold' : 'text-blue-100 group-hover:text-white'} transition-colors duration-300`}>
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Batch Info with Back to Dashboard Button - Responsive */}
        <div className="sticky bottom-0 p-2 sm:p-2.5 md:p-3 bg-gradient-to-t from-blue-950/90 to-indigo-950/50 backdrop-blur-sm border-t border-white/10 max-h-[40vh] sm:max-h-[35vh] md:max-h-[32vh] lg:max-h-[30vh] overflow-y-auto">
          <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2 md:mb-2.5">
            <div className="p-1 sm:p-1 md:p-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Award className="h-3 w-3 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-white" />
            </div>
            <h3 className="text-[10px] sm:text-[11px] md:text-xs font-bold text-blue-100 tracking-wide">
              Batch Info
            </h3>
          </div>
          
          {loading ? (
            <div className="space-y-1 sm:space-y-1.5 md:space-y-1.5">
              <div className="animate-pulse">
                <div className="h-2.5 sm:h-3 md:h-3 bg-blue-800/30 rounded w-3/4 mb-0.5"></div>
                <div className="h-2.5 sm:h-3 md:h-3 bg-blue-800/30 rounded w-1/2 mb-0.5"></div>
                <div className="h-2.5 sm:h-3 md:h-3 bg-blue-800/30 rounded w-2/3"></div>
              </div>
            </div>
          ) : batchDetails ? (
            <div className="space-y-1 sm:space-y-1.5 md:space-y-1.5 text-[9px] sm:text-[10px] md:text-[11px]">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 p-1 sm:p-1.5 md:p-1.5 bg-white/5 rounded-lg border border-white/10 min-h-[24px] sm:min-h-[28px] md:min-h-[30px]">
                <User className="h-2.5 w-2.5 sm:h-3 w-3 md:h-3 w-3 text-blue-300 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-blue-300 font-medium block sm:inline md:inline">Batch:</span>
                  <span className="text-blue-100 sm:ml-1 font-semibold block sm:inline md:inline break-words">{batchDetails.batch_name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 p-1 sm:p-1.5 md:p-1.5 bg-white/5 rounded-lg border border-white/10 min-h-[24px] sm:min-h-[28px] md:min-h-[30px]">
                <GraduationCap className="h-2.5 w-2.5 sm:h-3 w-3 md:h-3 w-3 text-green-300 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-blue-300 font-medium block sm:inline md:inline">Teacher:</span>
                  <span className="text-blue-100 sm:ml-1 font-semibold block sm:inline md:inline break-words">
                    {batchDetails.teachers?.users?.name || 'Not assigned'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 p-1 sm:p-1.5 md:p-1.5 bg-white/5 rounded-lg border border-white/10 min-h-[24px] sm:min-h-[28px] md:min-h-[30px]">
                <BookOpen className="h-2.5 w-2.5 sm:h-3 w-3 md:h-3 w-3 text-purple-300 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-blue-300 font-medium block sm:inline md:inline">Course:</span>
                  <span className="text-blue-100 sm:ml-1 font-semibold block sm:inline md:inline break-words">{batchDetails.courses.course_name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-1.5 p-1 sm:p-1.5 md:p-1.5 bg-white/5 rounded-lg border border-white/10 min-h-[24px] sm:min-h-[28px] md:min-h-[30px]">
                <Clock className="h-2.5 w-2.5 sm:h-3 w-3 md:h-3 w-3 text-orange-300 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-blue-300 font-medium block sm:inline md:inline">Program:</span>
                  <span className="text-blue-100 sm:ml-1 font-semibold block sm:inline md:inline break-words">{batchDetails.courses.program}</span>
                </div>
              </div>

              {/* Back to Dashboard Button - Responsive */}
              <button
                onClick={handleBackToDashboard}
                className="w-full mt-2 sm:mt-2.5 md:mt-3 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 md:py-2.5 px-2 sm:px-3 md:px-3 
                  bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/40 hover:to-indigo-600/40 
                  rounded-lg text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-blue-100 hover:text-white transition-all duration-300 ease-out
                  border border-blue-500/30 hover:border-blue-400/50 active:scale-95 sm:hover:scale-105 hover:shadow-lg
                  backdrop-blur-sm touch-manipulation min-h-[28px] sm:min-h-[32px] md:min-h-[36px]"
              >
                <LogOut className="h-3 w-3 sm:h-3 w-3 md:h-3.5 md:w-3.5 rotate-180 flex-shrink-0" />
                <span className="whitespace-nowrap">Back to Dashboard</span>
              </button>
            </div>
          ) : (
            <div className="p-1.5 sm:p-2 md:p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-red-300 font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2">
                <X className="h-2.5 w-2.5 sm:h-3 w-3 md:h-3 w-3 flex-shrink-0" />
                <span>Unable to load details.</span>
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Overlay for mobile when sidebar is open - Enhanced */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/40 to-black/60 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Classbar;