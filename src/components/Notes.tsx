import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Calendar, ExternalLink, Download, Eye, Tag, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotes } from '../services/api';
import { Note } from '../types/auth';
import Classbar from './parts/Classbar';
import toast from 'react-hot-toast';

const Notes = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{ noteId: string; fileUrl: string; fileName: string } | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  // Check if file is PDF
  const isPdfFile = (fileUrl: string) => {
    return fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('.pdf');
  };

  // Fetch notes for the batch
  useEffect(() => {
    if (!batchId || !token) {
      setError('Missing batch ID or authentication token.');
      setLoading(false);
      return;
    }

    const fetchNotes = async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoading(true);
        setError(null);
      }
      try {
        const fetchedNotes = await getNotes(batchId, token);
        console.log('Fetched notes:', fetchedNotes); // Debug: Log the API response
        setNotes(fetchedNotes || []); // Ensure notes is always an array
      } catch (error: any) {
        console.error('Failed to fetch notes:', error);
        if (isInitialLoad) {
          const errorMessage =
            error.response?.data?.message || 'Failed to load notes. Please try again later.';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    // Initial load
    fetchNotes(true);
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchNotes(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [batchId, token]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Disable copy and paste when viewing PDF (but allow scrolling)
  useEffect(() => {
    if (viewingFile) {
      // Prevent copy, cut, and paste globally when PDF is open
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', '');
          e.clipboardData.setData('text/html', '');
          e.clipboardData.clearData();
        }
        return false;
      };
      const handleCut = (e: ClipboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', '');
          e.clipboardData.setData('text/html', '');
          e.clipboardData.clearData();
        }
        return false;
      };
      const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      };

      // Block keyboard shortcuts for copy, cut, and paste
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
          // Also prevent select all
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      };

      // Prevent text selection
      const handleSelectStart = (e: Event) => {
        e.preventDefault();
        return false;
      };
      const handleMouseDown = (e: MouseEvent) => {
        // Allow mouse down for scrolling, but prevent text selection
        if (e.detail > 1) {
          // Double click - prevent
          e.preventDefault();
          return false;
        }
      };

      // Block copy, cut, and paste events with capture phase
      document.addEventListener('copy', handleCopy, true);
      document.addEventListener('cut', handleCut, true);
      document.addEventListener('paste', handlePaste, true);
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('selectstart', handleSelectStart, true);
      document.addEventListener('mousedown', handleMouseDown, true);

      // Also add to window for better coverage
      window.addEventListener('copy', handleCopy, true);
      window.addEventListener('cut', handleCut, true);
      window.addEventListener('paste', handlePaste, true);
      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('selectstart', handleSelectStart, true);
      window.addEventListener('mousedown', handleMouseDown, true);

      // Add CSS to prevent selection
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      (document.body.style as any).MozUserSelect = 'none';
      (document.body.style as any).msUserSelect = 'none';

      return () => {
        document.removeEventListener('copy', handleCopy, true);
        document.removeEventListener('cut', handleCut, true);
        document.removeEventListener('paste', handlePaste, true);
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('selectstart', handleSelectStart, true);
        document.removeEventListener('mousedown', handleMouseDown, true);
        window.removeEventListener('copy', handleCopy, true);
        window.removeEventListener('cut', handleCut, true);
        window.removeEventListener('paste', handlePaste, true);
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('selectstart', handleSelectStart, true);
        window.removeEventListener('mousedown', handleMouseDown, true);
        
        // Restore user select
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        (document.body.style as any).MozUserSelect = '';
        (document.body.style as any).msUserSelect = '';
      };
    }
  }, [viewingFile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      <style>{`
        /* Prevent text selection but allow scrolling */
        .pdf-content-container iframe {
          pointer-events: auto;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        /* Allow iframe to be interactive for scrolling */
        .pdf-content-container {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        /* Ensure iframe can still receive scroll events */
        .pdf-content-container iframe {
          pointer-events: auto !important;
        }
      `}</style>
      <Classbar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
        {/* Navigation Bar - Responsive */}
        <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-10">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
            <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Class Notes & Resources
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Access your learning materials</p>
                </div>
              </div>
              <div className="flex items-center ml-2 sm:ml-4 gap-2 sm:gap-3">
                <div className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                  <span className="text-xs sm:text-sm font-medium text-green-700">
                    {notes.length} Resources
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

        {/* Main Content - Responsive */}
        <main className="flex-1 w-full mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-white/20 relative" style={{ minHeight: viewingFile ? '600px' : 'auto' }}>
            {/* Front of container (Available Resources) */}
            <div className={`transition-opacity duration-300 ${viewingFile ? 'hidden' : 'block'}`}>
              <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-wide">Available Resources</h2>
                    <p className="text-blue-100 text-xs sm:text-sm">Learning materials and notes</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 md:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12"    >
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <p className="mt-3 sm:mt-4 text-gray-600 font-medium text-sm sm:text-base">Loading resources...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Error Loading Resources</h3>
                  <p className="text-red-600 font-medium text-sm sm:text-base px-4">{error}</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Resources Available</h3>
                  <p className="text-gray-500 max-w-sm mx-auto text-sm sm:text-base px-4">No notes or resources have been uploaded for this batch yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {notes.map((note, index) => (
                    <div
                      key={note.notes_id}
                      className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-xl 
                        transition-all duration-300 transform hover:scale-[1.02] bg-white/80 backdrop-blur-sm border border-white/20
                        hover:border-blue-200/50"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <div className="p-2 sm:p-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex-shrink-0">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">
                                {note.title || 'Untitled Note'}
                              </h3>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Tag className="w-3 h-3" />
                                <span>Resource</span>
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                            <span>
                              {note.created_at
                                ? new Date(note.created_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'Date not available'}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed break-words">
                              {note.note || 'No description available.'}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100 space-y-2">
                          {note.link && (
                            <a
                              href={note.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/link inline-flex items-center justify-center w-full px-3 py-2 sm:px-4 sm:py-2.5 
                                bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm 
                                font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 
                                transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              <span>View Resource</span>
                              <Download className="w-3 h-3 sm:w-4 sm:h-4 ml-2 opacity-0 group-hover/link:opacity-100 transition-opacity duration-200" />
                            </a>
                          )}
                          
                          {note.files && Array.isArray(note.files) && note.files.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {note.files.map((fileUrl, idx) => {
                                const fileName = fileUrl.split('/').pop() || `File ${idx + 1}`;
                                const isPdf = isPdfFile(fileUrl);
                                
                                if (isPdf) {
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setViewingFile({ noteId: note.notes_id, fileUrl, fileName })}
                                      className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 
                                        bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs sm:text-sm 
                                        font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 
                                        transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                    >
                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                      <span className="max-w-[120px] truncate">View PDF</span>
                                    </button>
                                  );
                                } else {
                                  return (
                                    <a
                                      key={idx}
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 
                                        bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm 
                                        font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 
                                        transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                    >
                                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                      <span className="max-w-[120px] truncate">{fileName}</span>
                                    </a>
                                  );
                                }
                              })}
                            </div>
                          )}
                        </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>

            {/* Back of container (PDF Viewer) */}
            {viewingFile && (
              <div className="h-full flex flex-col absolute inset-0 pdf-viewer-container">
                <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 flex-shrink-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={() => {
                        setViewingFile(null);
                        setPdfLoadError(false);
                      }}
                      className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-wide truncate">
                        {viewingFile.fileName}
                      </h2>
                      <p className="text-purple-100 text-xs sm:text-sm truncate">
                        {notes.find(n => n.notes_id === viewingFile.noteId)?.title || 'Untitled Note'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-3 sm:p-4 md:p-6 bg-gray-100">
                  <div className="h-full bg-white rounded-lg overflow-hidden shadow-inner relative pdf-content-container" style={{ minHeight: 'calc(100vh - 250px)' }}>
                    {pdfLoadError ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="mb-4">
                          <FileText className="w-16 h-16 text-gray-400 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Cannot Be Displayed</h3>
                        <p className="text-gray-600 mb-4 max-w-md">
                          The PDF cannot be displayed in this browser due to security restrictions. Please try opening it directly.
                        </p>
                        <a
                          href={viewingFile.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    ) : (
                      <iframe
                        src={`${viewingFile.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                        className="w-full h-full border-0"
                        title={viewingFile.fileName}
                        style={{ pointerEvents: 'auto' } as React.CSSProperties}
                        allow="fullscreen"
                        allowFullScreen
                        onLoad={() => {
                          // Try to add event listeners to iframe content to prevent copy-paste
                          // Note: This may not work for cross-origin PDFs
                          try {
                            const iframe = document.querySelector('iframe[title="' + viewingFile.fileName + '"]') as HTMLIFrameElement;
                            if (iframe && iframe.contentWindow) {
                              try {
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                if (iframeDoc) {
                                  // Prevent copy, cut, and paste in iframe
                                  iframeDoc.addEventListener('copy', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    e.clipboardData?.setData('text/plain', '');
                                    e.clipboardData?.clearData();
                                    return false;
                                  }, true);
                                  iframeDoc.addEventListener('cut', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    e.clipboardData?.setData('text/plain', '');
                                    e.clipboardData?.clearData();
                                    return false;
                                  }, true);
                                  iframeDoc.addEventListener('paste', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    return false;
                                  }, true);
                                  iframeDoc.addEventListener('selectstart', (e) => {
                                    e.preventDefault();
                                    return false;
                                  }, true);
                                  
                                  // Disable text selection in iframe
                                  if (iframeDoc.body) {
                                    iframeDoc.body.style.userSelect = 'none';
                                    iframeDoc.body.style.webkitUserSelect = 'none';
                                    (iframeDoc.body.style as any).MozUserSelect = 'none';
                                    (iframeDoc.body.style as any).msUserSelect = 'none';
                                  }
                                  
                                  // Block keyboard shortcuts in iframe
                                  iframeDoc.addEventListener('keydown', (e: KeyboardEvent) => {
                                    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X' || e.key === 'a' || e.key === 'A')) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      e.stopImmediatePropagation();
                                      return false;
                                    }
                                  }, true);
                                }
                              } catch (e) {
                                // Cross-origin - can't access iframe content directly
                                // Global event listeners will handle this
                              }
                            }
                          } catch (e) {
                            // Error accessing iframe
                          }
                          
                          // Check if iframe loaded successfully
                          setTimeout(() => {
                            try {
                              const iframe = document.querySelector('iframe[title="' + viewingFile.fileName + '"]') as HTMLIFrameElement;
                              if (iframe && iframe.contentDocument === null && iframe.contentWindow === null) {
                                setPdfLoadError(true);
                              }
                            } catch (e) {
                              // Cross-origin or blocked - show error
                              setPdfLoadError(true);
                            }
                          }, 2000);
                        }}
                        onError={() => {
                          setPdfLoadError(true);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notes;