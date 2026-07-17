import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Download, TrendingUp, Calendar, BookOpen, FileText, AlertCircle, CheckCircle, Award, User, Settings, LogOut } from 'lucide-react';
import { 
  getStudentAssessmentMarks, 
  getStudentCertificates, 
  downloadCertificate,
  getStudentDetails
} from '../services/api';
import { StudentDetails } from '../types/auth';
import NotificationBell from './NotificationBell';
import StudentProfileModal from './StudentProfileModal';
import ForgetPasswordModal from './ForgetPasswordModal';

interface AssessmentMarks {
  id: string;
  batch_id: string;
  student_id: string;
  course_language: string;
  french_comprehension_orale_marks: number;
  french_comprehension_ecrite_marks: number;
  french_production_orale_marks: number;
  french_production_ecrite_marks: number;
  french_total_marks: number;
  german_lesen_marks: number;
  german_schreiben_marks: number;
  german_horen_marks: number;
  german_sprechen_marks: number;
  german_total_marks: number;
  japanese_vocabulary_grammar_marks: number;
  japanese_reading_marks: number;
  japanese_listening_marks: number;
  japanese_total_marks: number;
  assessment_date: string;
  batches: {
    batch_name: string;
    courses: {
      course_name: string;
      language: string;
    };
  };
}

interface Certificate {
  certificate_id: string;
  student_id: string;
  batch_id: string;
  certificate_url: string;
  generated_at: string;
  generated_by: string;
  status: string;
}

interface Mark {
  category: string;
  marks: number;
  maxMarks: number;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const ResultsAndCertificate: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const { tokenData, token, setToken } = useAuth();
    const studentId = tokenData?.student_id || '';
    const [loading, setLoading] = useState(false);
    const [assessmentMarks, setAssessmentMarks] = useState<AssessmentMarks | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    // Header state variables
    const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showForgetPasswordModal, setShowForgetPasswordModal] = useState(false);

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Debug logging
    console.log('ResultsAndCertificate - studentId:', studentId);
    console.log('ResultsAndCertificate - batchId:', batchId);
    console.log('ResultsAndCertificate - current URL:', window.location.href);

    // Toast notification system
    const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
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

    // Fetch assessment marks and certificates when component mounts or batchId changes
    useEffect(() => {
        if (batchId && studentId) {
            fetchAssessmentMarks();
            fetchCertificates();
        }
    }, [batchId, studentId]);

    const fetchAssessmentMarks = async () => {
        try {
            setLoading(true);
            const response = await getStudentAssessmentMarks(studentId, batchId!, token!);
            console.log('Assessment marks response:', response);
            if (response.success) {
                console.log('Assessment marks data:', response.data);
                setAssessmentMarks(response.data);
            }
        } catch (error: any) {
            if (error.error !== 'Assessment marks not found') {
                showToast('error', 'Failed to fetch assessment marks');
            }
            setAssessmentMarks(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await getStudentCertificates(studentId, batchId!, token!);
            if (response.success) {
                setCertificates(response.data);
            }
        } catch (error: any) {
            showToast('error', 'Failed to fetch certificates');
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCertificate = async (certificateId: string) => {
        try {
            setLoading(true);
            console.log('Downloading certificate:', certificateId);
            
            // Clear any existing blob URLs
            if (window.URL && window.URL.revokeObjectURL) {
                // Clear all existing blob URLs to force fresh download
                const links = document.querySelectorAll('a[download]') as NodeListOf<HTMLAnchorElement>;
                links.forEach(link => {
                    if (link.href && link.href.startsWith('blob:')) {
                        window.URL.revokeObjectURL(link.href);
                    }
                });
            }
            
            const blob = await downloadCertificate(certificateId, token!);
            
            // Check if the response is an error (JSON)
            if (blob.type === 'application/json') {
                const errorText = await blob.text();
                const errorData = JSON.parse(errorText);
                console.error('Download error:', errorData);
                showToast('error', errorData.error || 'Failed to download certificate');
                return;
            }
            
            // Create download link with random parameter to force fresh download
            const url = window.URL.createObjectURL(blob);
            const randomParam = Math.random().toString(36).substring(7);
            const link = document.createElement('a');
            link.href = `${url}#${randomParam}`;
            link.download = ''; // Let browser use the filename from Content-Disposition
            link.style.display = 'none';
            
            // Remove any existing download links
            const existingLinks = document.querySelectorAll('a[download]') as NodeListOf<HTMLAnchorElement>;
            existingLinks.forEach(existingLink => existingLink.remove());
            
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            showToast('success', 'Certificate downloaded successfully');
        } catch (error: any) {
            console.error('Error downloading certificate:', error);
            showToast('error', 'Failed to download certificate');
        } finally {
            setLoading(false);
        }
    };

    const getLanguageSpecificMarks = (marks: AssessmentMarks, language: string): Mark[] => {
        const languageUpper = language?.toUpperCase();
        console.log('getLanguageSpecificMarks - language:', language, 'languageUpper:', languageUpper);
        
        switch (languageUpper) {
            case 'FRENCH':
                return [
                    { category: 'Compréhension Orale', marks: marks.french_comprehension_orale_marks, maxMarks: 25 },
                    { category: 'Compréhension Écrite', marks: marks.french_comprehension_ecrite_marks, maxMarks: 25 },
                    { category: 'Production Orale', marks: marks.french_production_orale_marks, maxMarks: 25 },
                    { category: 'Production Écrite', marks: marks.french_production_ecrite_marks, maxMarks: 25 },
                ];
            case 'GERMAN':
                return [
                    { category: 'Lesen', marks: marks.german_lesen_marks, maxMarks: 25 },
                    { category: 'Schreiben', marks: marks.german_schreiben_marks, maxMarks: 25 },
                    { category: 'Hören', marks: marks.german_horen_marks, maxMarks: 25 },
                    { category: 'Sprechen', marks: marks.german_sprechen_marks, maxMarks: 25 },
                ];
            case 'JAPANESE':
                return [
                    { category: '語彙・文法', marks: marks.japanese_vocabulary_grammar_marks, maxMarks: 60 },
                    { category: '読解', marks: marks.japanese_reading_marks, maxMarks: 60 },
                    { category: '聴解', marks: marks.japanese_listening_marks, maxMarks: 60 },
                ];
            default:
                console.log('Unknown language, returning empty array');
                return [];
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-red-100 text-red-800 border-red-200';
        }
    };

    return (
        <>
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${
                            toast.type === 'success' 
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : toast.type === 'error'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                ))}
            </div>

            <div className="min-h-screen bg-gray-50 lg:ml-72">
                {/* Header - Like Chat Page */}
                <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 lg:z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-3 sm:py-4 min-h-[4rem]">
                            <div className="flex items-center gap-4">
                                {/* Title Section - Like Chat Page */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md bg-blue-600">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                            Results & Certificate
                                        </h1>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                            View your assessment marks and download certificates
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <NotificationBell token={token} />
                                
                                {/* Student Profile Dropdown - Like Chat Page */}
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

                {/* Main Content Area - Like Chat Page */}
                <div className="flex flex-col relative overflow-hidden bg-gray-50">
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading...</p>
                        </div>
                    </div>
                )}

                {batchId && !loading && (
                    <>
                        {!studentId ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                                <div className="text-center py-8">
                                    <div className="p-3 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <AlertCircle className="w-8 h-8 text-red-400" />
                                    </div>
                                    <p className="text-red-500">Student ID not found. Please log in again.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Assessment Marks */}
                                {assessmentMarks ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                                </div>
                                                <h2 className="text-xl font-semibold text-gray-800">Assessment Marks</h2>
                                            </div>
                                            {assessmentMarks.assessment_date && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(assessmentMarks.assessment_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Marks</th>
                                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Percentage</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getLanguageSpecificMarks(assessmentMarks, assessmentMarks.course_language).map((mark) => (
                                                        <tr key={mark.category} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-3 px-4 text-gray-800">{mark.category}</td>
                                                            <td className="py-3 px-4">
                                                                <span className="font-medium">{mark.marks}/{mark.maxMarks}</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {((mark.marks / mark.maxMarks) * 100).toFixed(1)}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-gray-50 font-semibold">
                                                        <td className="py-3 px-4 text-gray-800">Total</td>
                                                        <td className="py-3 px-4">
                                                            {(() => {
                                                                const totalMarks = assessmentMarks.course_language?.toUpperCase() === 'JAPANESE' 
                                                                    ? assessmentMarks.japanese_total_marks 
                                                                    : assessmentMarks.course_language?.toUpperCase() === 'FRENCH'
                                                                    ? assessmentMarks.french_total_marks
                                                                    : assessmentMarks.german_total_marks;
                                                                const maxTotalMarks = assessmentMarks.course_language?.toUpperCase() === 'JAPANESE' ? 180 : 100;
                                                                return `${totalMarks || 0}/${maxTotalMarks}`;
                                                            })()}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {(() => {
                                                                    const totalMarks = assessmentMarks.course_language?.toUpperCase() === 'JAPANESE' 
                                                                        ? assessmentMarks.japanese_total_marks 
                                                                        : assessmentMarks.course_language?.toUpperCase() === 'FRENCH'
                                                                        ? assessmentMarks.french_total_marks
                                                                        : assessmentMarks.german_total_marks;
                                                                    const maxTotalMarks = assessmentMarks.course_language?.toUpperCase() === 'JAPANESE' ? 180 : 100;
                                                                    return ((totalMarks || 0) / maxTotalMarks * 100).toFixed(1);
                                                                })()}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                                        <div className="text-center py-8">
                                            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500">No assessment marks available for this batch</p>
                                        </div>
                                    </div>
                                )}

                                {/* Certificates */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Award className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-800">Certificates</h2>
                                    </div>
                                    
                                    {certificates.length > 0 ? (
                                        <div className="space-y-4">
                                            {certificates.map((certificate) => (
                                                <div key={certificate.certificate_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-gray-800 mb-1">Completion Certificate</h3>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(certificate.status)}`}>
                                                                    {certificate.status?.toUpperCase()}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {new Date(certificate.generated_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleDownloadCertificate(certificate.certificate_id)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Download Certificate"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                                <Award className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500">No certificates available for this batch</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
                    </div>
                </div>
            </div>

            {/* Student Profile Modal */}
            {showProfileModal && (
                <StudentProfileModal
                    studentDetails={studentDetails}
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    token={token || undefined}
                />
            )}

            {/* Forget Password Modal */}
            {showForgetPasswordModal && (
                <ForgetPasswordModal
                    isOpen={showForgetPasswordModal}
                    onClose={() => setShowForgetPasswordModal(false)}
                    registrationNumber={studentDetails?.registration_number}
                />
            )}
        </>
    );
};

export default ResultsAndCertificate;
