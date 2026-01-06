import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentLSRW, submitLSRWAnswers, getStudentSpeaking, uploadSpeakingAudio, saveSpeakingAttempt, getStudentReading, submitReadingAttempt, getStudentWriting, uploadWritingImage, submitWritingTask } from '../services/api';
import { CheckCircle, XCircle, Loader2, Headphones, LogOut, GraduationCap, Eye, Mic, Book, PenTool, Clock, Pause, Play, ZoomIn, ZoomOut, RotateCcw, ChevronDown, Camera, Upload, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LSRWLesson {
  lsrw_id: string;
  title: string;
  instruction: string;
  audio_url: string | null;
  video_file_path?: string | null;
  external_media_url?: string | null;
  media_type?: 'audio' | 'video' | 'audio_url' | 'video_url' | null;
  session_number?: number | null;
  questions: Array<{
    questionNumber: string;
    question: string;
    options: Array<{ key: string; text: string }>;
    correctAnswer: string;
  }>;
  max_marks: number;
  module_type: string;
  created_at: string;
  attempted?: boolean;
  verified?: boolean;
  score?: number | null;
  studentAnswers?: Record<string, string> | null;
  submission?: {
    score: number | null;
    submitted_at: string;
    verified?: boolean;
    verified_at?: string;
  } | null;
}

interface SpeakingLesson {
  speaking_material_id: string;
  title: string;
  instruction: string;
  content_text: string;
  max_marks?: number;
  session_number?: number | null;
  created_at: string;
  attempted?: boolean;
  submitted?: boolean;
  attempt?: {
    id: string;
    audio_url: string | null;
    session_number?: number | null;
    status: 'draft' | 'submitted';
    submitted_at?: string;
    feedback?: {
      remarks: string;
      audio_url?: string;
      marks?: number;
      created_at: string;
      updated_at?: string;
    } | null;
  } | null;
}

interface ReadingLesson {
  reading_material_id: string;
  title: string;
  instruction: string;
  content_text: string;
  session_number?: number | null;
  questions: Array<{
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correct_answer: string;
  }>;
  created_at: string;
  attempted?: boolean;
  submitted?: boolean;
  attempt?: {
    id: string;
    answers: Record<string, string>;
    score: number;
    max_score: number;
    submitted_at?: string;
    verified?: boolean;
    verified_at?: string;
    feedback?: {
      remarks: string;
      audio_url?: string | null;
      created_at: string;
      updated_at?: string;
    } | null;
  } | null;
}

interface WritingLesson {
  writing_task_id: string;
  title: string;
  instruction: string;
  content_type: 'image' | 'document' | 'text';
  session_number?: number | null;
  max_marks?: number;
  file_url?: string;
  content_text?: string;
  created_at: string;
  attempted?: boolean;
  submitted?: boolean;
  submission?: {
    id: string;
    submission_image_url: string;
    submitted_at?: string;
    feedback?: {
      feedback_text: string;
      marks?: number | null;
      audio_url?: string | null;
      status: 'reviewed' | 'needs_improvement' | 'completed';
      created_at: string;
      updated_at?: string;
    } | null;
  } | null;
}

const StudentLSRWPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token, tokenData } = useAuth();
  const [lessons, setLessons] = useState<LSRWLesson[]>([]);
  const [speakingLessons, setSpeakingLessons] = useState<SpeakingLesson[]>([]);
  const [readingLessons, setReadingLessons] = useState<ReadingLesson[]>([]);
  const [writingLessons, setWritingLessons] = useState<WritingLesson[]>([]);
  const [tabCounts, setTabCounts] = useState({ listening: 0, speaking: 0, reading: 0, writing: 0 }); // Store counts for each tab
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LSRWLesson | null>(null);
  const [selectedSpeakingLesson, setSelectedSpeakingLesson] = useState<SpeakingLesson | null>(null);
  const [selectedReadingLesson, setSelectedReadingLesson] = useState<ReadingLesson | null>(null);
  const [selectedWritingLesson, setSelectedWritingLesson] = useState<WritingLesson | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isReadingQuizOpen, setIsReadingQuizOpen] = useState(false);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [expandedSpeakingLesson, setExpandedSpeakingLesson] = useState<string | null>(null); // Track which speaking lesson is expanded for recording
  const [expandedWritingLesson, setExpandedWritingLesson] = useState<string | null>(null); // Track which writing lesson is expanded for submission
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set()); // Track which lessons are expanded to show full details (all tabs)
  const [isViewAttemptModalOpen, setIsViewAttemptModalOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('listening'); // Track active LSRW module tab
  const [showSubmissionMessage, setShowSubmissionMessage] = useState(false); // Track if quiz was just submitted
  
  // Writing module states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submittingWriting, setSubmittingWriting] = useState(false);
  const [writingImageZoom, setWritingImageZoom] = useState(1); // Zoom level for writing submission image in modal
  const [showCamera, setShowCamera] = useState(false); // Show camera capture interface
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null); // Camera stream
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Captured image as data URL
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingSpeaking, setSubmittingSpeaking] = useState(false);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  // Draggable indicator position (centered initially)
  const [indicatorPosition, setIndicatorPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth / 2 - 100 : 0, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Attach camera stream to video element
  useEffect(() => {
    if (cameraStream && showCamera) {
      const video = document.getElementById('camera-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = cameraStream;
      }
    }
  }, [cameraStream, showCamera]);

  // LSRW Module tabs configuration
  const lsrwTabs = [
    { id: 'listening', name: 'Listening', icon: Headphones, color: 'blue' },
    { id: 'speaking', name: 'Speaking', icon: Mic, color: 'purple' },
    { id: 'reading', name: 'Reading', icon: Book, color: 'green' },
    { id: 'writing', name: 'Writing', icon: PenTool, color: 'orange' },
  ];

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Fetch counts for all tabs
  const fetchAllTabCounts = async () => {
    if (!batchId || !token) return;

    try {
      const tabTypes = ['listening', 'speaking', 'reading', 'writing'];
      
      // Fetch counts for all tabs in parallel
      const countPromises = tabTypes.map(async (moduleType) => {
        try {
          let response;
          if (moduleType === 'speaking') {
            response = await getStudentSpeaking(batchId, token);
          } else if (moduleType === 'reading') {
            response = await getStudentReading(batchId, token);
          } else if (moduleType === 'writing') {
            response = await getStudentWriting(batchId, token);
          } else {
            response = await getStudentLSRW(batchId, token, moduleType);
          }
          
          if (response && response.success) {
            return { moduleType, count: (response.data || []).length };
          }
          return { moduleType, count: 0 };
        } catch (err) {
          console.error(`Error fetching count for ${moduleType}:`, err);
          return { moduleType, count: 0 };
        }
      });

      const counts = await Promise.all(countPromises);
      const countsMap: { [key: string]: number } = {};
      counts.forEach(({ moduleType, count }) => {
        countsMap[moduleType] = count;
      });
      
      setTabCounts(prev => ({
        ...prev,
        ...countsMap
      }));
    } catch (err) {
      console.error('Error fetching all tab counts:', err);
    }
  };

  // Fetch counts for all tabs when batchId changes
  useEffect(() => {
    if (batchId && token) {
      fetchAllTabCounts();
    }
  }, [batchId, token]);

  // Fetch lessons for active tab
  useEffect(() => {
    if (batchId && token) {
      fetchLessons();
    }
  }, [batchId, token, activeTab]);

  const fetchLessons = async () => {
    if (!batchId || !token) return;

    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'speaking') {
        // Fetch speaking materials
        const response = await getStudentSpeaking(batchId, token);
        if (response.success) {
          const speakingData = response.data || [];
          // Transform data - Student service backend returns flattened structure
          const transformedData = speakingData.map((item: any) => ({
            ...item,
            speaking_material_id: item.speaking_material_id || item.id,
            title: item.title || '',
            instruction: item.instruction || '',
            content_text: item.content_text || '',
            max_marks: item.max_marks || 0,
            session_number: item.session_number || null,
            created_at: item.created_at,
            attempted: item.attempted || false,
            submitted: item.submitted || false,
            attempt: item.attempt || null
          }));
          setSpeakingLessons(transformedData);
          // Update count for speaking tab
          setTabCounts(prev => ({
            ...prev,
            speaking: transformedData.length
          }));
        } else {
          setError('Failed to load speaking materials');
        }
      } else if (activeTab === 'reading') {
        // Fetch reading materials
        const response = await getStudentReading(batchId, token);
        if (response.success) {
          const readingData = response.data || [];
          // Transform data to match ReadingLesson interface
          const transformedData = readingData.map((item: any) => ({
            reading_material_id: item.reading_material?.id || item.reading_material_id,
            title: item.reading_material?.title || 'Reading Lesson',
            instruction: item.reading_material?.instruction || '',
            content_text: item.reading_material?.content_text || '',
            questions: item.reading_material?.questions || [],
            // Check both top level and nested (backend now provides at top level, similar to speaking)
            session_number: item.session_number ?? item.reading_material?.session_number ?? null,
            created_at: item.reading_material?.created_at || item.created_at,
            attempted: item.attempted || false,
            submitted: item.submitted || false,
            attempt: item.attempt || null
          }));
          setReadingLessons(transformedData);
          // Update count for reading tab
          setTabCounts(prev => ({
            ...prev,
            reading: transformedData.length
          }));
        } else {
          setError('Failed to load reading materials');
        }
      } else if (activeTab === 'writing') {
        // Fetch writing tasks
        const response = await getStudentWriting(batchId, token);
        if (response.success) {
          const writingData = response.data || [];
          // Transform data to match WritingLesson interface
          // Backend may return data nested under writing_task or directly
          const transformedData = writingData.map((item: any) => {
            // Check if data is nested under writing_task
            const task = item.writing_task || item;
            return {
              writing_task_id: task.writing_task_id || task.id || item.writing_task_id || item.id,
              title: task.title || item.title || 'Writing Task',
              instruction: task.instruction || item.instruction || '',
              content_type: task.content_type || item.content_type || 'text',
              session_number: task.session_number || item.session_number || null,
              max_marks: task.max_marks || item.max_marks || null,
              file_url: task.file_url || item.file_url || null,
              content_text: task.content_text || item.content_text || '',
              created_at: task.created_at || item.created_at,
              attempted: item.attempted || false,
              submitted: item.submitted || false,
              submission: item.submission || null
            };
          });
          setWritingLessons(transformedData);
          // Update count for writing tab
          setTabCounts(prev => ({
            ...prev,
            writing: transformedData.length
          }));
        } else {
          setError('Failed to load writing tasks');
        }
      } else {
        // Fetch regular LSRW content
        const response = await getStudentLSRW(batchId, token, activeTab);
        if (response.success) {
          const rawData = response.data || [];
          
          // Transform nested data structure to flat structure
          const lessonsData = rawData.map((item: any) => {
            const content = item.lsrw_content || item;
            return {
              lsrw_id: content.id || content.lsrw_id || item.lsrw_content_id,
              title: content.title || '',
              instruction: content.instruction || '',
              audio_url: content.audio_url || null,
              video_file_path: content.video_file_path || null,
              external_media_url: content.external_media_url || null,
              media_type: content.media_type || null,
              session_number: content.session_number || null,
              questions: content.questions || [],
              max_marks: content.max_marks || 0,
              module_type: content.module_type || activeTab,
              created_at: content.created_at || item.created_at,
              attempted: item.attempted || false,
              verified: item.verified || false,
              score: item.score || null,
              studentAnswers: item.studentAnswers || null,
              submission: item.submission || null
            };
          });
          
          // Sort by session_number for listening tab (ascending: Session 1, 2, 3...)
          if (activeTab === 'listening') {
            lessonsData.sort((a: LSRWLesson, b: LSRWLesson) => {
              const aSession = a.session_number || 9999; // Put items without session_number at the end
              const bSession = b.session_number || 9999;
              return aSession - bSession;
            });
          }
          
          // Debug: Log verification status for troubleshooting
          lessonsData.forEach((lesson: LSRWLesson) => {
            if (lesson.attempted) {
              console.log(`[LSRW Debug] Lesson ${lesson.title}:`, {
                verified: lesson.verified,
                verifiedType: typeof lesson.verified,
                score: lesson.score,
                scoreType: typeof lesson.score,
                submission: lesson.submission
              });
            }
          });
          setLessons(lessonsData);
          // Update count for current tab
          setTabCounts(prev => ({
            ...prev,
            [activeTab]: lessonsData.length
          }));
        } else {
          setError('Failed to load lessons');
        }
      }
    } catch (err: any) {
      console.error('Error fetching lessons:', err);
      setError(err.response?.data?.error || 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (lesson: LSRWLesson) => {
    setSelectedLesson(lesson);
    setAnswers({});
    setIsQuizOpen(true);
  };

  const handleViewAttempt = (lesson: LSRWLesson) => {
    navigate(`/class/${batchId}/lsrw/review/${lesson.lsrw_id}`);
  };

  // Speaking module handlers
  const handleStartSpeaking = (lesson: SpeakingLesson) => {
    setSelectedSpeakingLesson(lesson);
    // Toggle expansion - if already expanded, collapse it
    if (expandedSpeakingLesson === lesson.speaking_material_id) {
      setExpandedSpeakingLesson(null);
      // Reset recording states when collapsing
      setIsRecording(false);
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
    } else {
      setExpandedSpeakingLesson(lesson.speaking_material_id);
      // Reset recording states
      setIsRecording(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      // If there's a draft attempt, load it
      if (lesson.attempt && lesson.attempt.status === 'draft') {
        setAudioUrl(lesson.attempt.audio_url);
      }
    }
  };

  const handleViewSpeakingAttempt = (lesson: SpeakingLesson) => {
    setSelectedWritingLesson(null); // Clear writing lesson to avoid conflicts
    setSelectedSpeakingLesson(lesson);
    setIsViewAttemptModalOpen(true);
  };

  // Function to extract only the passage from content_text (remove questions)
  const extractPassageOnly = (contentText: string, questions: Array<any>): string => {
    if (!contentText) return '';
    
    // If no questions, return full content
    if (!questions || (Array.isArray(questions) && questions.length === 0)) {
      return contentText;
    }
    
    // Find the first question in the content_text
    // Patterns: Q1., 1., Question 1, MCQ 1, "MCQ Questions:", etc.
    const questionPatterns = [
      /Q(\d+)\./i,                    // Q1.
      /^(\d+)\.\s+[A-Z]/m,            // 1. Question text
      /Question\s+(\d+)[:\.]/i,       // Question 1: or Question 1.
      /MCQ\s+(\d+)[:\.]/i,            // MCQ 1: or MCQ 1.
      /^(\d+)\)/m,                    // 1) Question text
      /MCQ Questions?:/i,              // MCQ Questions: or MCQ Question:
      /Questions?:/i,                  // Questions: or Question:
      /^(\d+)\s+[A-Z]/m               // 1 Question text (space after number)
    ];
    
    let firstQuestionIndex = contentText.length;
    
    // Find the earliest question match
    for (const pattern of questionPatterns) {
      const match = contentText.match(pattern);
      if (match && match.index !== undefined && match.index < firstQuestionIndex) {
        firstQuestionIndex = match.index;
      }
    }
    
    // Also check for common question headers
    const headerPatterns = [
      /MCQ Questions?:/i,
      /Questions?:/i,
      /Question\s+Bank:/i,
      /Multiple\s+Choice\s+Questions?:/i
    ];
    
    for (const pattern of headerPatterns) {
      const match = contentText.match(pattern);
      if (match && match.index !== undefined && match.index < firstQuestionIndex) {
        firstQuestionIndex = match.index;
      }
    }
    
    // Extract only the passage (everything before the first question)
    const passage = contentText.substring(0, firstQuestionIndex).trim();
    
    // If we found a question but passage is too short, might be wrong detection
    // Return at least some content (first 50% if question found too early)
    if (passage.length < contentText.length * 0.1 && firstQuestionIndex < contentText.length) {
      // Question found too early, might be false positive
      // Try to find a better split point
      const midPoint = Math.floor(contentText.length / 2);
      return contentText.substring(0, midPoint).trim();
    }
    
    return passage || contentText; // Fallback to full content if extraction fails
  };

  const handleStartReadingQuiz = (lesson: ReadingLesson) => {
    setSelectedReadingLesson(lesson);
    setIsReadingQuizOpen(true);
    // Load existing answers if attempted
    if (lesson.attempt && lesson.attempt.answers) {
      setReadingAnswers(lesson.attempt.answers);
    } else {
      setReadingAnswers({});
    }
  };

  const handleViewReadingAttempt = (lesson: ReadingLesson) => {
    setSelectedReadingLesson(lesson);
    setIsReadingQuizOpen(true);
    // Load submitted answers
    if (lesson.attempt && lesson.attempt.answers) {
      setReadingAnswers(lesson.attempt.answers);
    }
  };

  const handleSubmitReadingQuiz = async () => {
    if (!selectedReadingLesson || !batchId || !token) return;

    // Validate all questions are answered
    const unanswered = selectedReadingLesson.questions.find((_, idx) => {
      const key = `question${idx + 1}`;
      return !readingAnswers[key];
    });

    if (unanswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitReadingAttempt(
        selectedReadingLesson.reading_material_id,
        batchId,
        readingAnswers,
        token
      );

      if (response.success) {
        toast.success('Reading quiz submitted successfully!');
        setIsReadingQuizOpen(false);
        setSelectedReadingLesson(null);
        setReadingAnswers({});
        // Refresh lessons
        fetchLessons();
      } else {
        toast.error(response.message || 'Failed to submit reading quiz');
      }
    } catch (err: any) {
      console.error('Error submitting reading quiz:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to submit reading quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Writing module handlers
  const handleStartWriting = (lesson: WritingLesson) => {
    // Toggle expansion - if already expanded, collapse it
    if (expandedWritingLesson === lesson.writing_task_id) {
      setExpandedWritingLesson(null);
      setSelectedWritingLesson(null);
      setSelectedImage(null);
      setImagePreview(null);
      // Stop camera if active
      if (showCamera) {
        stopCamera();
      }
    } else {
      setExpandedWritingLesson(lesson.writing_task_id);
      setSelectedWritingLesson(lesson);
      setSelectedImage(null);
      setImagePreview(null);
      // Stop camera if active
      if (showCamera) {
        stopCamera();
      }
    }
  };

  // Toggle lesson expand/collapse for all tabs
  const handleToggleLessonExpand = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (expandedLessons.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Close camera if open
      if (showCamera) {
        stopCamera();
      }
    }
  };

  // Start camera for capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      setCapturedImage(null);
      // Clear any existing selected image
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  // Capture image from camera
  const captureImage = () => {
    if (!cameraStream) return;

    const video = document.getElementById('camera-video') as HTMLVideoElement;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
  };

  // Convert captured image (data URL) to File object
  const convertDataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Use captured image
  const useCapturedImage = () => {
    if (!capturedImage) return;
    
    // Get student ID from tokenData
    const studentId = (tokenData as any)?.student_id || (tokenData as any)?.id || 'unknown';

    try {
      // Generate filename: student_<id>_writing_<timestamp>.jpg
      const timestamp = Date.now();
      const filename = `student_${studentId}_writing_${timestamp}.jpg`;

      // Convert data URL to File
      const file = convertDataUrlToFile(capturedImage, filename);

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Captured image size exceeds 10MB limit');
        return;
      }

      // Set as selected image
      setSelectedImage(file);
      setImagePreview(capturedImage);

      // Stop camera
      stopCamera();

      toast.success('Image captured successfully!');
    } catch (error: any) {
      console.error('Error processing captured image:', error);
      toast.error('Failed to process captured image');
    }
  };

  // Retake image (clear captured image and show camera again)
  const retakeImage = () => {
    setCapturedImage(null);
    if (!cameraStream) {
      startCamera();
    }
  };

  const handleSubmitWriting = async () => {
    if (!selectedWritingLesson || !batchId || !token || !selectedImage) {
      toast.error('Please select an image to submit');
      return;
    }

    try {
      setSubmittingWriting(true);
      
      // Upload image
      const uploadResponse = await uploadWritingImage(selectedImage, token);
      if (!uploadResponse.success || !uploadResponse.image_url) {
        throw new Error('Failed to upload image');
      }

      const imageUrl = uploadResponse.image_url;

      // Submit writing task
      const response = await submitWritingTask(
        selectedWritingLesson.writing_task_id,
        batchId,
        imageUrl,
        token
      );

      if (response.success) {
        toast.success('Writing task submitted successfully!');
        setExpandedWritingLesson(null);
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedWritingLesson(null);
        // Stop camera if active
        if (showCamera) {
          stopCamera();
        }
        // Refresh lessons
        fetchLessons();
      } else {
        throw new Error(response.message || 'Failed to submit writing task');
      }
    } catch (err: any) {
      console.error('Error submitting writing task:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to submit writing task');
    } finally {
      setSubmittingWriting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      let interval: ReturnType<typeof setInterval>;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(interval);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onpause = () => {
        setIsPaused(true);
      };

      recorder.onresume = () => {
        setIsPaused(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && isRecording && !isPaused) {
      mediaRecorder.pause();
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && isRecording && isPaused) {
      mediaRecorder.resume();
      // Restart timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    }
  };

  // Handle dragging for floating indicator (mouse and touch)
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };


  // Handle mouse and touch move for dragging
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const newX = clientX - dragOffset.x;
        const newY = clientY - dragOffset.y;
        // Constrain to viewport
        const maxX = window.innerWidth - 200; // Approximate width of indicator
        const maxY = window.innerHeight - 50;
        setIndicatorPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      // Touch events
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, dragOffset]);

  const handleSaveDraft = async () => {
    if (!selectedSpeakingLesson || !batchId || !token || !tokenData?.student_id) {
      toast.error('Missing required information');
      return;
    }

    if (!audioBlob && !audioUrl) {
      toast.error('Please record audio first');
      return;
    }

    try {
      setSavingDraft(true);
      let finalAudioUrl = audioUrl;

      // If we have a new recording (blob), upload it
      if (audioBlob) {
        const uploadResponse = await uploadSpeakingAudio(audioBlob, token);
        if (uploadResponse.success) {
          finalAudioUrl = uploadResponse.audio_url;
        } else {
          throw new Error('Failed to upload audio');
        }
      }

      // Save as draft
      const response = await saveSpeakingAttempt(
        selectedSpeakingLesson.speaking_material_id,
        batchId,
        finalAudioUrl!,
        'draft',
        token
      );

      if (response.success) {
        toast.success('Draft saved successfully');
        await fetchLessons();
        // Keep the recording interface open after saving draft
      } else {
        toast.error(response.error || 'Failed to save draft');
      }
    } catch (err: any) {
      console.error('Error saving draft:', err);
      toast.error(err.response?.data?.error || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitSpeaking = async () => {
    if (!selectedSpeakingLesson || !batchId || !token || !tokenData?.student_id) {
      toast.error('Missing required information');
      return;
    }

    if (!audioBlob && !audioUrl) {
      toast.error('Please record audio first');
      return;
    }

    try {
      setSubmittingSpeaking(true);
      let finalAudioUrl = audioUrl;

      // If we have a new recording (blob), upload it
      if (audioBlob) {
        const uploadResponse = await uploadSpeakingAudio(audioBlob, token);
        if (uploadResponse.success) {
          finalAudioUrl = uploadResponse.audio_url;
        } else {
          throw new Error('Failed to upload audio');
        }
      }

      // Submit attempt
      const response = await saveSpeakingAttempt(
        selectedSpeakingLesson.speaking_material_id,
        batchId,
        finalAudioUrl!,
        'submitted',
        token
      );

      if (response.success) {
        toast.success('Speaking attempt submitted successfully!');
        setExpandedSpeakingLesson(null);
        setIsRecording(false);
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setShowSubmissionMessage(true);
        await fetchLessons();
        setTimeout(() => {
          setShowSubmissionMessage(false);
        }, 10000);
      } else {
        toast.error(response.error || 'Failed to submit attempt');
      }
    } catch (err: any) {
      console.error('Error submitting speaking attempt:', err);
      toast.error(err.response?.data?.error || 'Failed to submit attempt');
    } finally {
      setSubmittingSpeaking(false);
    }
  };

  const handleAnswerChange = (questionNumber: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedLesson || !batchId || !token || !tokenData?.student_id) {
      toast.error('Missing required information');
      return;
    }

    // Check if all questions are answered
    const totalQuestions = selectedLesson.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    
    if (answeredQuestions < totalQuestions) {
      toast.error(`Please answer all ${totalQuestions} questions`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitLSRWAnswers(
        tokenData.student_id,
        batchId,
        selectedLesson.lsrw_id,
        answers,
        token
      );

      if (response.success) {
        toast.success(`Quiz submitted successfully!`);
        setIsQuizOpen(false);
        setShowSubmissionMessage(true);
        // Refresh lessons to show updated submission status
        await fetchLessons();
        // Hide message after 10 seconds
        setTimeout(() => {
          setShowSubmissionMessage(false);
        }, 10000);
      } else {
        toast.error(response.message || response.error || 'Failed to submit quiz');
      }
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to submit quiz';
      toast.error(errorMessage);
      // If already attempted, close modal and refresh
      if (err.response?.data?.message?.includes('already completed')) {
        setIsQuizOpen(false);
        await fetchLessons();
      }
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
        <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
          <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
              <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                    <Headphones className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      LSRW - Listening
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Complete listening exercises</p>
                  </div>
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
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
        <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
          <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
              <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                    <Headphones className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      LSRW - Listening
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Complete listening exercises</p>
                  </div>
                </div>
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    transition-all duration-200 min-h-[40px] sm:min-h-auto"
                >
                  <LogOut className="h-5 w-5 sm:h-4 sm:w-4 rotate-180" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
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
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Lessons</h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchLessons}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      <div className="flex-1 flex flex-col w-full lg:ml-[calc(68rem/4)]">
        {/* Navigation Bar - Responsive */}
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    LSRW
                  </h1>
                  <p className="text-sm text-gray-500 hidden sm:block">Complete exercises and test your understanding</p>
                </div>
              </div>
              <div className="flex items-center ml-2 sm:ml-4 gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                {/* Quiz Submission Message - Desktop */}
                {showSubmissionMessage && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
                    <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <div className="text-xs sm:text-sm">
                      <span className="font-semibold text-yellow-800">Quiz completed.</span>
                      <span className="text-yellow-700 ml-1">Tutor verify then your mark will be displayed.</span>
                    </div>
                  </div>
                )}
                {/* Refresh Button */}
                <button
                  onClick={fetchLessons}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    transition-all duration-200 min-w-[36px] sm:min-w-auto"
                  title="Refresh to check verification status"
                >
                  <Loader2 className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <div className="px-2 sm:px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                  <span className="text-xs sm:text-sm font-medium text-indigo-700 whitespace-nowrap">
                    {activeTab === 'speaking' ? speakingLessons.length : activeTab === 'reading' ? readingLessons.length : activeTab === 'writing' ? writingLessons.length : lessons.length} <span className="hidden sm:inline">{(activeTab === 'speaking' ? speakingLessons.length : activeTab === 'reading' ? readingLessons.length : activeTab === 'writing' ? writingLessons.length : lessons.length) === 1 ? 'Lesson' : 'Lessons'}</span>
                  </span>
                </div>
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium 
                    text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg 
                    transition-all duration-200 min-w-[36px] sm:min-w-auto"
                >
                  <LogOut className="h-4 w-4 rotate-180 flex-shrink-0" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content - Responsive */}
        <main className="flex-1 w-full mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex overflow-x-auto scrollbar-hide -mx-3 sm:mx-0">
                {lsrwTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  // Define color classes for each tab
                  const getTabClasses = () => {
                    if (isActive) {
                      switch (tab.color) {
                        case 'blue':
                          return 'bg-blue-600 text-white border-blue-600';
                        case 'purple':
                          return 'bg-purple-600 text-white border-purple-600';
                        case 'green':
                          return 'bg-green-600 text-white border-green-600';
                        case 'orange':
                          return 'bg-orange-600 text-white border-orange-600';
                        default:
                          return 'bg-blue-600 text-white border-blue-600';
                      }
                    } else {
                      switch (tab.color) {
                        case 'blue':
                          return 'text-blue-600 hover:bg-blue-50 border-transparent';
                        case 'purple':
                          return 'text-purple-600 hover:bg-purple-50 border-transparent';
                        case 'green':
                          return 'text-green-600 hover:bg-green-50 border-transparent';
                        case 'orange':
                          return 'text-orange-600 hover:bg-orange-50 border-transparent';
                        default:
                          return 'text-blue-600 hover:bg-blue-50 border-transparent';
                      }
                    }
                  };

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-4 font-semibold text-[11px] sm:text-xs md:text-sm transition-all duration-200 whitespace-nowrap border-b-2 min-w-0 ${getTabClasses()}`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span className="truncate">{tab.name}</span>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                        isActive 
                          ? (tab.color === 'blue' ? 'bg-blue-500 text-white' :
                             tab.color === 'purple' ? 'bg-purple-500 text-white' :
                             tab.color === 'green' ? 'bg-green-500 text-white' :
                             'bg-orange-500 text-white')
                          : (tab.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                             tab.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                             tab.color === 'green' ? 'bg-green-100 text-green-600' :
                             'bg-orange-100 text-orange-600')
                      }`}>
                        {tabCounts[tab.id as keyof typeof tabCounts] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                  {React.createElement(lsrwTabs.find(t => t.id === activeTab)?.icon || GraduationCap, {
                    className: "w-5 h-5 sm:w-6 sm:h-6 text-white"
                  })}
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide truncate">
                  {lsrwTabs.find(t => t.id === activeTab)?.name || 'Available'} Lessons
                </h2>
              </div>
            </div>

            {/* Quiz Submission Message Banner - Mobile/Tablet */}
            {showSubmissionMessage && (
              <div className="sm:hidden mx-3 sm:mx-4 mt-3 sm:mt-4">
                <div className="flex items-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm flex-1">
                    <span className="font-semibold text-yellow-800">Quiz completed.</span>
                    <span className="text-yellow-700 block sm:inline sm:ml-1">Tutor verify then your mark will be displayed.</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-3 sm:p-4 md:p-6">

              {/* Lessons List */}
              {activeTab === 'speaking' ? (
                // Speaking Lessons
                speakingLessons.length === 0 ? (
                  <div className="text-center py-12">
                    <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Speaking Lessons Available</h3>
                    <p className="text-gray-600">Your tutor will make lessons visible after completing them.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {speakingLessons.map((lesson) => {
                      const isExpanded = expandedLessons.has(lesson.speaking_material_id);
                      return (
                        <div
                          key={lesson.speaking_material_id}
                          className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-lg sm:rounded-xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          {/* Collapsed View - Title and Basic Info */}
                          <div 
                            onClick={() => handleToggleLessonExpand(lesson.speaking_material_id)}
                            className="p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-purple-100/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 md:space-x-3">
                                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 break-words">
                                    {(() => {
                                      // Get session number from attempt or lesson
                                      const sessionNumber = lesson.attempt?.session_number || lesson.session_number;
                                      return sessionNumber ? (
                                        <>Session {sessionNumber}: {lesson.title}</>
                                      ) : (
                                        lesson.title
                                      );
                                    })()}
                                  </h3>
                                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-1 sm:mt-0">
                                    {lesson.submitted && (
                                      <span className="inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                                        Submitted
                                      </span>
                                    )}
                                    {lesson.attempted && !lesson.submitted && (
                                      <span className="inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 whitespace-nowrap">
                                        Draft
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-3 md:ml-4 flex items-center flex-shrink-0">
                                <ChevronDown 
                                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Expanded View - Full Details */}
                          {isExpanded && (
                            <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 border-t border-purple-200 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                              {lesson.instruction && (
                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                  <p className="text-purple-900 font-semibold mb-2">Instructions:</p>
                                  <p className="text-purple-800">{lesson.instruction}</p>
                                </div>
                              )}

                              {/* Speaking Content Text */}
                              {lesson.content_text && (
                                <div className="p-4 bg-white rounded-lg border border-purple-100">
                                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                                    {lesson.content_text}
                                  </p>
                                </div>
                              )}

                              {/* Submission Status */}
                              {lesson.submitted ? (
                                <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-semibold text-sm sm:text-base">
                                    {lesson.attempt?.feedback 
                                      ? "Submitted - Please go and view your teacher feedback"
                                      : "Submitted - Waiting for teacher feedback"}
                                  </span>
                                </div>
                              ) : lesson.attempted ? (
                                <div className="flex items-center gap-2 text-yellow-600 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                                  <span className="font-semibold text-sm sm:text-base">
                                    Draft saved - Click to continue recording
                                  </span>
                                </div>
                              ) : null}

                              {/* Expanded Recording Section - Inline */}
                              {!lesson.submitted && expandedSpeakingLesson === lesson.speaking_material_id && selectedSpeakingLesson?.speaking_material_id === lesson.speaking_material_id && (
                                <div className="mt-4 pt-4 border-t border-purple-200">
                                  <div className="space-y-4 sm:space-y-6">
                                    {/* Recording Section */}
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                                      <h3 className="font-semibold text-gray-900 mb-4">Your Recording:</h3>
                                      
                                      {/* Recording Controls */}
                                      <div className="flex items-center gap-4 mb-4">
                                        {!isRecording ? (
                                          <button
                                            onClick={startRecording}
                                            disabled={lesson.submitted}
                                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                                          >
                                            <Mic className="w-5 h-5" />
                                            {audioUrl ? 'Re-record' : 'Start Recording'}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={stopRecording}
                                            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all font-semibold flex items-center gap-2"
                                          >
                                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                            Stop Recording
                                          </button>
                                        )}
                                      </div>

                                      {/* Audio Player */}
                                      {audioUrl && (
                                        <div className="mt-4">
                                          <audio
                                            src={audioUrl}
                                            controls
                                            className="w-full"
                                          />
                                        </div>
                                      )}

                                      {!audioUrl && !isRecording && (
                                        <p className="text-gray-500 text-sm mt-2">Click "Start Recording" to begin</p>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                                      <div className="text-gray-600 text-xs sm:text-sm md:text-base w-full sm:w-auto text-center sm:text-left">
                                        {audioUrl ? 'Recording ready' : 'No recording yet'}
                                      </div>
                                      <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                        <button
                                          onClick={handleSaveDraft}
                                          disabled={savingDraft || !audioUrl || isRecording}
                                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold min-h-[44px] sm:min-h-auto"
                                        >
                                          {savingDraft ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              <span className="hidden sm:inline">Saving...</span>
                                            </>
                                          ) : (
                                            'Save Draft'
                                          )}
                                        </button>
                                        <button
                                          onClick={handleSubmitSpeaking}
                                          disabled={submittingSpeaking || !audioUrl || isRecording}
                                          className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold min-h-[44px] sm:min-h-auto"
                                        >
                                          {submittingSpeaking ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              <span className="hidden sm:inline">Submitting...</span>
                                            </>
                                          ) : (
                                            'Submit'
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                                {lesson.submitted ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewSpeakingAttempt(lesson);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-auto"
                                  >
                                    <Eye className="w-4 h-4 flex-shrink-0" />
                                    View Your Attempt
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartSpeaking(lesson);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold min-h-[44px] sm:min-h-auto"
                                  >
                                    {expandedSpeakingLesson === lesson.speaking_material_id ? 'Close Recording' : (lesson.attempted ? 'Continue Recording' : 'Start Recording')}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : activeTab === 'reading' ? (
                // Reading Lessons
                readingLessons.length === 0 ? (
                  <div className="text-center py-12">
                    <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reading Lessons Available</h3>
                    <p className="text-gray-600">Your tutor will make lessons visible after completing them.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {readingLessons.map((lesson) => {
                      const isExpanded = expandedLessons.has(lesson.reading_material_id);
                      return (
                        <div
                          key={lesson.reading_material_id}
                          className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-lg sm:rounded-xl border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          {/* Collapsed View - Title and Basic Info */}
                          <div 
                            onClick={() => handleToggleLessonExpand(lesson.reading_material_id)}
                            className="p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-green-100/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 md:space-x-3">
                                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 break-words">
                                    {(() => {
                                      // Get session number from lesson (same pattern as speaking tab)
                                      const sessionNumber = lesson.session_number;
                                      return sessionNumber ? (
                                        <>Session {sessionNumber}: {lesson.title}</>
                                      ) : (
                                        lesson.title
                                      );
                                    })()}
                                  </h3>
                                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-1 sm:mt-0">
                                    {lesson.submitted && (
                                      <span className="inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                                        {lesson.attempt?.feedback ? 'Verified' : 'Submitted'}
                                      </span>
                                    )}
                                    {lesson.attempted && !lesson.submitted && (
                                      <span className="inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 whitespace-nowrap">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-3 md:ml-4 flex items-center flex-shrink-0">
                                <ChevronDown 
                                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Expanded View - Full Details */}
                          {isExpanded && (
                            <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 border-t border-green-200 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                              {lesson.instruction && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-green-900 font-semibold mb-2">Instructions:</p>
                                  <p className="text-green-800">{lesson.instruction}</p>
                                </div>
                              )}

                              {/* Reading Content Text - Passage Only */}
                              {lesson.content_text && (
                                <div className="p-4 bg-white rounded-lg border border-green-100">
                                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                                    {extractPassageOnly(lesson.content_text, lesson.questions)}
                                  </p>
                                </div>
                              )}

                              {/* Submission Status */}
                              {lesson.submitted ? (
                                <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-semibold text-sm sm:text-base">
                                    {lesson.attempt?.feedback 
                                      ? `Verified - Score: ${lesson.attempt.score}/${lesson.attempt.max_score} - View your attempt to see details`
                                      : "Submitted - Waiting for teacher verification"}
                                  </span>
                                </div>
                              ) : lesson.attempted ? (
                                <div className="flex items-center gap-2 text-yellow-600 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                                  <span className="font-semibold text-sm sm:text-base">
                                    Quiz in progress - Click to continue
                                  </span>
                                </div>
                              ) : null}

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                                {lesson.submitted ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewReadingAttempt(lesson);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-auto"
                                  >
                                    <Eye className="w-4 h-4 flex-shrink-0" />
                                    View Your Attempt
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartReadingQuiz(lesson);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold min-h-[44px] sm:min-h-auto"
                                  >
                                    {lesson.attempted ? 'Continue Quiz' : 'Start Quiz'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : activeTab === 'writing' ? (
                // Writing Lessons
                writingLessons.length === 0 ? (
                  <div className="text-center py-12">
                    <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Writing Tasks Available</h3>
                    <p className="text-gray-600">Your tutor will make tasks visible after completing them.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {writingLessons.map((lesson) => {
                      const isExpanded = expandedLessons.has(lesson.writing_task_id);
                      return (
                        <div
                          key={lesson.writing_task_id}
                          className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-lg sm:rounded-xl border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          {/* Collapsed View - Title and Basic Info */}
                          <div 
                            onClick={() => handleToggleLessonExpand(lesson.writing_task_id)}
                            className="p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-orange-100/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 md:space-x-3">
                                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 break-words">
                                    {lesson.session_number ? (
                                      <>Session {lesson.session_number}: {lesson.title || 'Writing Task'}</>
                                    ) : (
                                      lesson.title || 'Writing Task'
                                    )}
                                  </h3>
                                  {lesson.submitted && (
                                    <span className="inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap mt-1 sm:mt-0">
                                      {lesson.submission?.feedback ? 'Feedback' : 'Submitted'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-3 md:ml-4 flex items-center flex-shrink-0">
                                <ChevronDown 
                                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Expanded View - Full Details */}
                          {isExpanded && (
                            <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 border-t border-orange-200 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                              {lesson.instruction && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                  <p className="text-orange-900 font-semibold mb-2">Instructions:</p>
                                  <p className="text-orange-800">{lesson.instruction}</p>
                                </div>
                              )}

                              {/* Writing Task Content */}
                              {lesson.content_type === 'image' && lesson.file_url && (
                                <div className="p-4 bg-white rounded-lg border border-orange-100">
                                  <img 
                                    src={lesson.file_url} 
                                    alt={lesson.title || 'Writing task image'}
                                    className="max-w-full h-auto rounded-lg"
                                    style={{ maxHeight: '400px' }}
                                  />
                                </div>
                              )}
                              {lesson.content_type === 'document' && lesson.file_url && (
                                <div className="p-4 bg-white rounded-lg border border-orange-100">
                                  <a 
                                    href={lesson.file_url} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                  >
                                    <PenTool className="w-4 h-4" />
                                    <span>View Writing Task Document</span>
                                  </a>
                                </div>
                              )}
                              {lesson.content_type === 'text' && lesson.content_text && (
                                <div className="p-4 bg-white rounded-lg border border-orange-100">
                                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                                    {lesson.content_text}
                                  </p>
                                </div>
                              )}
                              
                              {/* Show message if no content is available */}
                              {!lesson.file_url && !lesson.content_text && (
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <p className="text-yellow-800 text-sm">
                                    No content available for this writing task.
                                  </p>
                                </div>
                              )}

                              {/* Submission Status */}
                              {lesson.submitted ? (
                                <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-semibold text-sm sm:text-base">
                                    {lesson.submission?.feedback 
                                      ? `Feedback Available - ${lesson.submission.feedback.status === 'completed' ? 'Completed' : lesson.submission.feedback.status === 'needs_improvement' ? 'Needs Improvement' : 'Reviewed'} - View your submission to see details`
                                      : "Submitted - Waiting for teacher feedback"}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4 text-gray-600 text-sm sm:text-base p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span>Upload an image of your written answer</span>
                                </div>
                              )}

                              {/* Expanded Writing Submission Section */}
                              {!lesson.submitted && expandedWritingLesson === lesson.writing_task_id && selectedWritingLesson?.writing_task_id === lesson.writing_task_id && (
                                <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                                  <h4 className="font-semibold text-gray-800 mb-3">Upload Your Written Answer:</h4>
                                  
                                  {/* Camera Capture Interface */}
                                  {showCamera && (
                                    <div className="mb-4 p-4 bg-gray-900 rounded-lg">
                                      <div className="relative">
                                        <video
                                          id="camera-video"
                                          autoPlay
                                          playsInline
                                          className="w-full h-auto rounded-lg max-h-96 mx-auto"
                                          style={{ transform: 'scaleX(-1)' }} // Mirror effect
                                        />
                                        {capturedImage && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                            <img 
                                              src={capturedImage} 
                                              alt="Captured" 
                                              className="max-w-full h-auto max-h-96 rounded-lg"
                                              style={{ transform: 'scaleX(-1)' }} // Mirror effect
                                            />
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center justify-center gap-3 mt-4">
                                        {!capturedImage ? (
                                          <>
                                            <button
                                              onClick={captureImage}
                                              className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-2"
                                            >
                                              <Camera className="w-5 h-5" />
                                              Capture
                                            </button>
                                            <button
                                              onClick={stopCamera}
                                              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                              Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              onClick={useCapturedImage}
                                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                            >
                                              <CheckCircle className="w-5 h-5" />
                                              Use This Image
                                            </button>
                                            <button
                                              onClick={retakeImage}
                                              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                            >
                                              <RotateCcw className="w-5 h-5" />
                                              Retake
                                            </button>
                                            <button
                                              onClick={stopCamera}
                                              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                              Cancel
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Upload Options - Only show when camera is not active */}
                                  {!showCamera && (
                                    <div className="mb-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        {/* Upload Image Option */}
                                        <div>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            id={`writing-image-upload-${lesson.writing_task_id}`}
                                          />
                                          <label
                                            htmlFor={`writing-image-upload-${lesson.writing_task_id}`}
                                            className="cursor-pointer block w-full p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 transition-colors text-center bg-orange-50"
                                          >
                                            <Upload className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                            <p className="text-gray-700 font-medium">Upload Image</p>
                                            <p className="text-xs text-gray-500 mt-1">From Device</p>
                                          </label>
                                        </div>

                                        {/* Capture Image Option */}
                                        <button
                                          onClick={startCamera}
                                          className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 transition-colors text-center bg-blue-50"
                                        >
                                          <Camera className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                          <p className="text-gray-700 font-medium">Capture Image</p>
                                          <p className="text-xs text-gray-500 mt-1">Use Camera</p>
                                        </button>
                                      </div>

                                      {/* Image Preview */}
                                      {imagePreview && selectedWritingLesson?.writing_task_id === lesson.writing_task_id && (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-gray-700">Selected Image:</p>
                                            <button
                                              onClick={() => {
                                                setSelectedImage(null);
                                                setImagePreview(null);
                                              }}
                                              className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                          <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="max-w-full h-auto max-h-64 mx-auto rounded-lg"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Submit Button */}
                                  <button
                                    onClick={handleSubmitWriting}
                                    disabled={submittingWriting || !selectedImage || selectedWritingLesson?.writing_task_id !== lesson.writing_task_id || showCamera}
                                    className="w-full px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    {submittingWriting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                      </>
                                    ) : (
                                      'Submit Writing Task'
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                                {lesson.submitted ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSpeakingLesson(null);
                                      setSelectedWritingLesson(lesson);
                                      setIsViewAttemptModalOpen(true);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-auto"
                                  >
                                    <Eye className="w-4 h-4 flex-shrink-0" />
                                    View Your Submission
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartWriting(lesson);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold min-h-[44px] sm:min-h-auto"
                                  >
                                    {expandedWritingLesson === lesson.writing_task_id ? 'Close' : 'Start Writing'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                // Regular LSRW Lessons
                lessons.length === 0 ? (
                  <div className="text-center py-12">
                    {React.createElement(lsrwTabs.find(t => t.id === activeTab)?.icon || GraduationCap, {
                      className: "w-16 h-16 text-gray-400 mx-auto mb-4"
                    })}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No {lsrwTabs.find(t => t.id === activeTab)?.name || 'Lessons'} Available</h3>
                    <p className="text-gray-600">Your tutor will make lessons visible after completing them.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {lessons.map((lesson) => {
                      const isExpanded = expandedLessons.has(lesson.lsrw_id);
                      const lessonVerifiedStr = String(lesson.verified || '');
                      const submissionVerifiedStr = String(lesson.submission?.verified || '');
                      const verifiedFromLesson = lesson.verified === true || 
                                                lessonVerifiedStr.toLowerCase() === 'true' || 
                                                lessonVerifiedStr === '1';
                      const verifiedFromSubmission = lesson.submission?.verified === true || 
                                                  submissionVerifiedStr.toLowerCase() === 'true' || 
                                                  submissionVerifiedStr === '1';
                      const hasVerifiedAt = lesson.submission?.verified_at !== null && lesson.submission?.verified_at !== undefined;
                      const isVerified = verifiedFromLesson || verifiedFromSubmission || hasVerifiedAt;
                      
                      return (
                        <div
                          key={lesson.lsrw_id}
                          className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg sm:rounded-xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          {/* Collapsed View - Title and Basic Info */}
                          <div 
                            onClick={() => handleToggleLessonExpand(lesson.lsrw_id)}
                            className="p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-blue-100/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 md:space-x-3">
                                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 break-words">
                                    {lesson.session_number ? (
                                      <>Session {lesson.session_number}: {lesson.title}</>
                                    ) : (
                                      lesson.title
                                    )}
                                  </h3>
                                  {lesson.attempted && (
                                    <span className={`inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold mt-1 sm:mt-0 ${
                                      isVerified
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    }`}>
                                      {isVerified ? 'Verified' : 'Pending'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-3 md:ml-4 flex items-center flex-shrink-0">
                                <ChevronDown 
                                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Expanded View - Full Details */}
                          {isExpanded && (
                            <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 border-t border-blue-200 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                              {lesson.instruction && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-blue-900 font-semibold mb-2">Instructions:</p>
                                  <p className="text-blue-800">{lesson.instruction}</p>
                                </div>
                              )}

                              {/* Media Player - Supports Audio, Video, and External URLs */}
                              {(() => {
                                const mediaType = lesson.media_type;
                                let mediaUrl = null;
                                let actualMediaType = mediaType;

                                // Determine media URL based on type and priority: Audio > Video > External URL
                                // Priority 1: Audio file
                                if (lesson.audio_url) {
                                  mediaUrl = lesson.audio_url;
                                  if (!actualMediaType) actualMediaType = 'audio';
                                }
                                // Priority 2: Video file
                                if (lesson.video_file_path) {
                                  mediaUrl = lesson.video_file_path;
                                  actualMediaType = 'video';
                                }
                                // Priority 3: External media URL
                                if (lesson.external_media_url) {
                                  mediaUrl = lesson.external_media_url;
                                  // Auto-detect if not set
                                  if (!actualMediaType) {
                                    const urlLower = lesson.external_media_url.toLowerCase();
                                    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || 
                                        urlLower.includes('vimeo.com') || urlLower.includes('dailymotion.com')) {
                                      actualMediaType = 'video_url';
                                    } else if (urlLower.endsWith('.mp3') || urlLower.includes('soundcloud.com') || 
                                               urlLower.includes('audio') || urlLower.includes('mp3')) {
                                      actualMediaType = 'audio_url';
                                    } else {
                                      actualMediaType = 'video_url'; // Default to video for embedding
                                    }
                                  }
                                }

                                if (!mediaUrl) return null;

                                // Helper function to convert YouTube/Vimeo URL to embed format
                                const getEmbedUrl = (url: string) => {
                                  if (url.includes('youtube.com/watch?v=')) {
                                    const videoId = url.split('v=')[1]?.split('&')[0];
                                    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
                                  } else if (url.includes('youtu.be/')) {
                                    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                                    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
                                  } else if (url.includes('vimeo.com/')) {
                                    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
                                    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
                                  }
                                  return url;
                                };

                                // Check if URL is embeddable (YouTube, Vimeo, etc.)
                                const isEmbeddableUrl = (url: string) => {
                                  const urlLower = url.toLowerCase();
                                  return urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || 
                                         urlLower.includes('vimeo.com') || urlLower.includes('dailymotion.com');
                                };

                                return (
                                  <div className="p-4 bg-white rounded-lg border border-blue-200">
                                    <p className="font-semibold text-gray-800 mb-2">
                                      {actualMediaType === 'video' || actualMediaType === 'video_url' ? 'Video:' : 'Audio:'}
                                    </p>
                                    
                                    {/* Audio Player - Uploaded Audio or External Audio URL */}
                                    {(actualMediaType === 'audio' || actualMediaType === 'audio_url') && (
                                      <audio
                                        src={mediaUrl}
                                        controls
                                        className="w-full max-w-md"
                                        onPlay={() => {}}
                                        onPause={() => {}}
                                      />
                                    )}

                                    {/* Video Player - Uploaded Video */}
                                    {actualMediaType === 'video' && (
                                      <video
                                        src={mediaUrl}
                                        controls
                                        className="w-full max-w-2xl rounded-lg"
                                        onPlay={() => {}}
                                        onPause={() => {}}
                                      />
                                    )}

                                    {/* External Video URL - Embed (YouTube, Vimeo, etc.) */}
                                    {actualMediaType === 'video_url' && isEmbeddableUrl(mediaUrl) && (
                                      <div className="w-full max-w-2xl">
                                        <iframe
                                          src={getEmbedUrl(mediaUrl)}
                                          className="w-full aspect-video rounded-lg"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          title={lesson.title}
                                        />
                                        <a
                                          href={mediaUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline inline-block"
                                        >
                                          Open in new tab
                                        </a>
                                      </div>
                                    )}

                                    {/* External Video URL - Direct Video Link (not embeddable) */}
                                    {actualMediaType === 'video_url' && !isEmbeddableUrl(mediaUrl) && (
                                      <div className="w-full max-w-2xl">
                                        <video
                                          src={mediaUrl}
                                          controls
                                          className="w-full rounded-lg"
                                          onPlay={() => {}}
                                          onPause={() => {}}
                                        />
                                        <a
                                          href={mediaUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline inline-block"
                                        >
                                          Open in new tab
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Submission Status */}
                              {lesson.attempted ? (
                                isVerified ? (
                                  <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-semibold text-sm sm:text-base">
                                      Verification completed - Please go and view your attempt to view your mark
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-yellow-600 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                                    <span className="font-semibold text-sm sm:text-base">
                                      Pending Verification - Waiting for tutor to verify
                                    </span>
                                  </div>
                                )
                              ) : null}

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                                {lesson.attempted ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewAttempt(lesson);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-auto"
                                  >
                                    <Eye className="w-4 h-4 flex-shrink-0" />
                                    View Your Attempt
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartQuiz(lesson);
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base font-semibold min-h-[44px] sm:min-h-auto"
                                  >
                                    Start Quiz
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Draggable Recording Indicator */}
      {isRecording && (
        <div
          className="fixed z-50 bg-red-600 text-white px-3 py-2 rounded-full shadow-2xl flex items-center gap-2 cursor-move select-none touch-none"
          style={{
            left: `${indicatorPosition.x}px`,
            top: `${indicatorPosition.y}px`,
            transform: 'none',
            animation: isPaused ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className={`w-2 h-2 bg-white rounded-full ${isPaused ? '' : 'animate-ping'}`}></div>
          <span className="font-semibold text-xs whitespace-nowrap">
            {isPaused ? 'Paused' : 'Recording'} {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
          {isPaused ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                resumeRecording();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                resumeRecording();
              }}
              className="ml-1 p-1 hover:bg-red-700 active:bg-red-800 rounded-full transition-colors touch-manipulation"
              title="Resume recording"
            >
              <Play className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                pauseRecording();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                pauseRecording();
              }}
              className="ml-1 p-1 hover:bg-red-700 active:bg-red-800 rounded-full transition-colors touch-manipulation"
              title="Pause recording"
            >
              <Pause className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* View Writing Submission Modal */}
      {isViewAttemptModalOpen && selectedWritingLesson && selectedWritingLesson.submitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => {
          setIsViewAttemptModalOpen(false);
          setSelectedWritingLesson(null);
          setSelectedSpeakingLesson(null);
          setWritingImageZoom(1); // Reset zoom when closing modal
        }}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 sm:p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PenTool className="w-6 h-6 sm:w-8 sm:h-8" />
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words">{selectedWritingLesson.title}</h2>
                </div>
                <button
                  onClick={() => {
                    setIsViewAttemptModalOpen(false);
                    setSelectedWritingLesson(null);
                    setSelectedSpeakingLesson(null);
                    setWritingImageZoom(1); // Reset zoom when closing modal
                  }}
                  className="p-2 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Instruction */}
              {selectedWritingLesson.instruction && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800">{selectedWritingLesson.instruction}</p>
                </div>
              )}

              {/* Writing Task Content */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Writing Task:</h3>
                {selectedWritingLesson.content_type === 'image' && selectedWritingLesson.file_url && (
                  <img 
                    src={selectedWritingLesson.file_url} 
                    alt={selectedWritingLesson.title}
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '400px' }}
                  />
                )}
                {selectedWritingLesson.content_type === 'document' && selectedWritingLesson.file_url && (
                  <a 
                    href={selectedWritingLesson.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>View Writing Task Document</span>
                  </a>
                )}
                {selectedWritingLesson.content_type === 'text' && selectedWritingLesson.content_text && (
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedWritingLesson.content_text}</p>
                )}
              </div>

              {/* Submission Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Submitted on: {selectedWritingLesson.submission?.submitted_at 
                    ? new Date(selectedWritingLesson.submission.submitted_at).toLocaleString()
                    : selectedWritingLesson.created_at 
                      ? new Date(selectedWritingLesson.created_at).toLocaleString()
                      : 'N/A'}
                </p>
              </div>

              {/* Student Submission Image - Scrollable Container */}
              {selectedWritingLesson.submission?.submission_image_url ? (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 flex flex-col" style={{ height: '60vh', maxHeight: '600px' }}>
                  <div className="flex items-center justify-between p-4 flex-shrink-0 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                    <h3 className="font-semibold text-gray-800">Your Submission:</h3>
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWritingImageZoom(prev => Math.max(0.5, prev - 0.25));
                        }}
                        className="p-2 bg-white rounded-lg border border-orange-300 hover:bg-orange-50 transition-colors shadow-sm"
                        title="Zoom Out (or Ctrl/Cmd + Scroll)"
                      >
                        <ZoomOut className="w-4 h-4 text-orange-600" />
                      </button>
                      <span className="text-sm font-medium text-gray-700 min-w-[70px] text-center bg-white px-2 py-1 rounded border border-orange-200">
                        {Math.round(writingImageZoom * 100)}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWritingImageZoom(prev => Math.min(3, prev + 0.25));
                        }}
                        className="p-2 bg-white rounded-lg border border-orange-300 hover:bg-orange-50 transition-colors shadow-sm"
                        title="Zoom In (or Ctrl/Cmd + Scroll)"
                      >
                        <ZoomIn className="w-4 h-4 text-orange-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWritingImageZoom(1);
                        }}
                        className="p-2 bg-white rounded-lg border border-orange-300 hover:bg-orange-50 transition-colors shadow-sm"
                        title="Reset to 100%"
                      >
                        <RotateCcw className="w-4 h-4 text-orange-600" />
                      </button>
                      <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                        (Ctrl/Cmd + Scroll to zoom)
                      </span>
                    </div>
                  </div>
                  <div 
                    className="bg-white rounded-b-lg overflow-auto flex-1 relative" 
                    style={{ 
                      minHeight: 0
                    }}
                    onWheel={(e) => {
                      e.stopPropagation();
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -0.1 : 0.1;
                        setWritingImageZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
                      }
                    }}
                  >
                    <div className="p-4 flex justify-center items-start" style={{ minHeight: '100%' }}>
                      <img 
                        src={selectedWritingLesson.submission.submission_image_url} 
                        alt="Your submission"
                        className="rounded-lg transition-transform duration-200 select-none"
                        style={{ 
                          maxWidth: '100%',
                          height: 'auto',
                          transform: `scale(${writingImageZoom})`,
                          transformOrigin: 'top center',
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        }}
                        draggable={false}
                        onError={(e) => {
                          console.error('Error loading submission image:', selectedWritingLesson.submission?.submission_image_url);
                          e.currentTarget.style.display = 'none';
                          const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                          if (errorDiv) {
                            errorDiv.style.display = 'block';
                          }
                        }}
                      />
                      <div style={{ display: 'none' }} className="text-red-500 text-sm mt-2 text-center">
                        <p>Failed to load image.</p>
                        <a 
                          href={selectedWritingLesson.submission?.submission_image_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline text-blue-600 hover:text-blue-800"
                        >
                          Click here to view image
                        </a>
                        <p className="text-xs text-gray-500 mt-2">URL: {selectedWritingLesson.submission?.submission_image_url}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">Submission image not available.</p>
                </div>
              )}

              {/* Teacher Feedback */}
              {selectedWritingLesson.submission?.feedback ? (
                <div className="space-y-3">
                  {/* Marks Display with Star Rating Only */}
                  {selectedWritingLesson.submission.feedback?.marks !== null && selectedWritingLesson.submission.feedback?.marks !== undefined && (
                    <div className="p-5 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-lg">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <Star className="w-7 h-7 text-white fill-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-yellow-900 text-lg">Marks Awarded</h4>
                            <p className="text-sm text-yellow-700">Your performance score</p>
                          </div>
                        </div>
                        
                        {/* Star Rating Display Only - No Numbers */}
                        {selectedWritingLesson.max_marks && selectedWritingLesson.max_marks > 0 ? (
                          <div className="flex items-center justify-center gap-2 sm:gap-3 py-3">
                            {Array.from({ length: selectedWritingLesson.max_marks }, (_, index) => {
                              const marksReceived = Number(selectedWritingLesson.submission?.feedback?.marks) || 0;
                              const isFilled = index < marksReceived;
                              return (
                                <div key={`star-wrapper-${index}`} className="relative">
                                  <Star
                                    className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 ${
                                      isFilled
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-500 fill-white'
                                    }`}
                                    style={!isFilled ? {
                                      stroke: '#6b7280',
                                      strokeWidth: 2
                                    } : {}}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Fallback if no max_marks - show stars based on marks only */
                          <div className="flex items-center justify-center gap-2 sm:gap-3 py-3">
                            {Array.from({ length: Number(selectedWritingLesson.submission?.feedback?.marks) || 0 }, (_, index) => (
                              <Star
                                key={`star-filled-${index}`}
                                className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 fill-yellow-500 transition-all duration-300"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Feedback */}
                  {selectedWritingLesson.submission.feedback.feedback_text && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Teacher Feedback (Text)</h4>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">
                          {selectedWritingLesson.submission.feedback.feedback_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audio Feedback */}
                  {selectedWritingLesson.submission.feedback.audio_url && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Mic className="w-5 h-5 text-orange-600" />
                        <h4 className="font-semibold text-orange-900">Teacher Feedback (Audio)</h4>
                      </div>
                      <audio
                        controls
                        className="w-full"
                        src={selectedWritingLesson.submission.feedback.audio_url}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Status Badge */}
                  {selectedWritingLesson.submission.feedback.status && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">Status:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedWritingLesson.submission.feedback.status === 'completed' 
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : selectedWritingLesson.submission.feedback.status === 'needs_improvement'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {selectedWritingLesson.submission.feedback.status === 'completed' ? 'Completed' : 
                           selectedWritingLesson.submission.feedback.status === 'needs_improvement' ? 'Needs Improvement' : 
                           'Reviewed'}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 mt-2">
                    Feedback provided on: {new Date(selectedWritingLesson.submission.feedback.updated_at || selectedWritingLesson.submission.feedback.created_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800 font-medium">Waiting for teacher feedback</p>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">Your teacher will review your submission and provide feedback soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Speaking Attempt Modal */}
      {isViewAttemptModalOpen && selectedSpeakingLesson && selectedSpeakingLesson.attempt && !selectedWritingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => {
          setIsViewAttemptModalOpen(false);
          setSelectedSpeakingLesson(null);
          setSelectedWritingLesson(null);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words">{selectedSpeakingLesson.title}</h2>
                  <p className="text-purple-100 mt-1 text-sm sm:text-base">Your Submitted Recording</p>
                </div>
                <button
                  onClick={() => {
                    setIsViewAttemptModalOpen(false);
                    setSelectedSpeakingLesson(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Instruction */}
                {selectedSpeakingLesson.instruction && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-purple-900 font-semibold mb-2">Instructions:</p>
                    <p className="text-purple-800">{selectedSpeakingLesson.instruction}</p>
                  </div>
                )}

                {/* Content Text */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    {selectedSpeakingLesson.content_text}
                  </p>
                </div>

                {/* Submission Info */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Submitted Successfully</span>
                  </div>
                  <p className="text-sm text-green-800">
                    Submitted on: {selectedSpeakingLesson.attempt.submitted_at 
                      ? new Date(selectedSpeakingLesson.attempt.submitted_at).toLocaleString()
                      : selectedSpeakingLesson.created_at 
                        ? new Date(selectedSpeakingLesson.created_at).toLocaleString()
                        : 'N/A'}
                  </p>
                </div>

                {/* Student Audio Recording */}
                {selectedSpeakingLesson.attempt.audio_url && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Mic className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-800">Your Recording</span>
                      </div>
                    </div>
                    <audio
                      controls
                      className="w-full"
                      src={selectedSpeakingLesson.attempt.audio_url}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Teacher Feedback */}
                {selectedSpeakingLesson.attempt?.feedback ? (
                  <div className="space-y-3">
                    {/* Marks Display with Star Rating Only */}
                    {selectedSpeakingLesson.attempt.feedback?.marks !== null && selectedSpeakingLesson.attempt.feedback?.marks !== undefined && (
                      <div className="p-5 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-lg">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <Star className="w-7 h-7 text-white fill-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-yellow-900 text-lg">Marks Awarded</h4>
                              <p className="text-sm text-yellow-700">Your performance score</p>
                            </div>
                          </div>
                          
                          {/* Star Rating Display Only - No Numbers */}
                          {selectedSpeakingLesson.max_marks && selectedSpeakingLesson.max_marks > 0 ? (
                            <div className="flex items-center justify-center gap-2 sm:gap-3 py-3">
                              {Array.from({ length: selectedSpeakingLesson.max_marks }, (_, index) => {
                                const marksReceived = Number(selectedSpeakingLesson.attempt?.feedback?.marks) || 0;
                                const isFilled = index < marksReceived;
                                return (
                                  <div key={`star-wrapper-${index}`} className="relative">
                                    <Star
                                      className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 ${
                                        isFilled
                                          ? 'text-yellow-500 fill-yellow-500'
                                          : 'text-gray-500 fill-white'
                                      }`}
                                      style={!isFilled ? {
                                        stroke: '#6b7280',
                                        strokeWidth: 2
                                      } : {}}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Fallback if no max_marks - show stars based on marks only */
                            <div className="flex items-center justify-center gap-2 sm:gap-3 py-3">
                              {Array.from({ length: Number(selectedSpeakingLesson.attempt?.feedback?.marks) || 0 }, (_, index) => (
                                <Star
                                  key={`star-filled-${index}`}
                                  className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 fill-yellow-500 transition-all duration-300"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text Feedback */}
                    {selectedSpeakingLesson.attempt.feedback.remarks && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Teacher Feedback (Text)</h4>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">
                            {selectedSpeakingLesson.attempt.feedback.remarks}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Audio Feedback */}
                    {selectedSpeakingLesson.attempt.feedback.audio_url && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Mic className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-purple-900">Teacher Feedback (Audio)</h4>
                        </div>
                        <audio
                          controls
                          className="w-full"
                          src={selectedSpeakingLesson.attempt.feedback.audio_url}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    <p className="text-xs text-gray-600 mt-2">
                      Feedback provided on: {new Date(selectedSpeakingLesson.attempt.feedback.updated_at || selectedSpeakingLesson.attempt.feedback.created_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-800 font-medium">Waiting for teacher feedback</p>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">Your teacher will review your recording and provide feedback soon.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setIsViewAttemptModalOpen(false);
                  setSelectedSpeakingLesson(null);
                  setSelectedWritingLesson(null);
                }}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm sm:text-base font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {isQuizOpen && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words">{selectedLesson.title}</h2>
                  <p className="text-blue-100 mt-1 text-sm sm:text-base">Answer all questions</p>
                </div>
                <button
                  onClick={() => {
                    setIsQuizOpen(false);
                    setAnswers({});
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {selectedLesson.questions.map((question, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0">
                    <div className="mb-3 sm:mb-4">
                      <p className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 break-words">
                        {question.questionNumber}. {question.question}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label
                            key={option.key}
                            className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 cursor-pointer transition-colors bg-white hover:bg-blue-50"
                          >
                            <input
                              type="radio"
                              name={question.questionNumber}
                              value={option.key}
                              checked={answers[question.questionNumber] === option.key}
                              onChange={(e) =>
                                handleAnswerChange(question.questionNumber, e.target.value)
                              }
                              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                            />
                            <span className="text-gray-700 text-sm sm:text-base break-words">
                              {option.key.toUpperCase()}) {option.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
              <div className="text-gray-600 text-sm sm:text-base">
                Answered: {Object.keys(answers).length} / {selectedLesson.questions.length}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsQuizOpen(false);
                    setAnswers({});
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting || Object.keys(answers).length < selectedLesson.questions.length}
                  className="flex-1 sm:flex-none px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reading Quiz Modal */}
      {isReadingQuizOpen && selectedReadingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words">
                    {selectedReadingLesson.session_number ? (
                      <>Session {selectedReadingLesson.session_number}: {selectedReadingLesson.title}</>
                    ) : (
                      selectedReadingLesson.title
                    )}
                  </h2>
                  <p className="text-green-100 mt-1 text-sm sm:text-base">
                    {selectedReadingLesson.submitted ? 'View Your Attempt' : 'Answer all questions'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsReadingQuizOpen(false);
                    setSelectedReadingLesson(null);
                    setReadingAnswers({});
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Teacher Verification Status - Always show at top if submitted */}
                {selectedReadingLesson.submitted && (() => {
                  const verified = selectedReadingLesson.attempt?.verified;
                  const verifiedAt = selectedReadingLesson.attempt?.verified_at;
                  
                  // Check verification: verified field OR verified_at timestamp OR feedback exists (indicates verification)
                  // If teacher has provided feedback, it means they've verified the submission
                  const hasFeedback = !!selectedReadingLesson.attempt?.feedback;
                  const isVerified = (
                    verified === true || 
                    verified === 'true' ||
                    verified === 1 ||
                    verified === '1' ||
                    !!verifiedAt ||
                    hasFeedback // If feedback exists, teacher has reviewed/verified
                  );
                  
                  if (isVerified) {
                    return (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-md">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-green-900">Teacher Verified</h3>
                            <p className="text-green-700 text-sm">
                              Verified on: {verifiedAt ? new Date(verifiedAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 shadow-md">
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-yellow-900">Teacher Verification Pending</h3>
                            <p className="text-yellow-700 text-sm">
                              Waiting for teacher to verify your submission
                            </p>
                            <p className="text-yellow-600 text-xs mt-1">
                              Submitted on: {selectedReadingLesson.attempt?.submitted_at
                                ? new Date(selectedReadingLesson.attempt.submitted_at).toLocaleString()
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Teacher Feedback - Show at top if verified and feedback exists */}
                {selectedReadingLesson.submitted && 
                 selectedReadingLesson.attempt?.feedback && (() => {
                  const verified = selectedReadingLesson.attempt?.verified;
                  const verifiedAt = selectedReadingLesson.attempt?.verified_at;
                  
                  // If feedback exists, consider it verified (teacher has reviewed)
                  const isVerified = (
                    verified === true || 
                    verified === 'true' ||
                    verified === 1 ||
                    verified === '1' ||
                    !!verifiedAt ||
                    true // If feedback exists, always show it (means teacher reviewed)
                  );
                  
                  if (isVerified) {
                    return (
                      <div className="space-y-3">
                        {/* Score Display */}
                        <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl border-2 border-green-600 shadow-lg">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                              <div>
                                <p className="text-white text-sm sm:text-base font-medium">Your Score</p>
                                <p className="text-white text-2xl sm:text-3xl font-bold">
                                  {selectedReadingLesson.attempt.score} / {selectedReadingLesson.attempt.max_score}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-100 text-xs sm:text-sm">Percentage</p>
                              <p className="text-white text-xl sm:text-2xl font-bold">
                                {Math.round((selectedReadingLesson.attempt.score / selectedReadingLesson.attempt.max_score) * 100)}%
                              </p>
                            </div>
                          </div>
                          <p className="text-green-100 text-xs sm:text-sm mt-3">
                            Submitted on: {selectedReadingLesson.attempt.submitted_at
                              ? new Date(selectedReadingLesson.attempt.submitted_at).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>

                        {/* Text Feedback */}
                        {selectedReadingLesson.attempt.feedback.remarks && (
                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Book className="w-5 h-5 text-purple-600" />
                              <span className="font-semibold text-purple-900">Teacher Feedback (Text)</span>
                            </div>
                            <p className="text-purple-800 whitespace-pre-wrap">
                              {selectedReadingLesson.attempt.feedback.remarks}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              Feedback provided on: {new Date(selectedReadingLesson.attempt.feedback.updated_at || selectedReadingLesson.attempt.feedback.created_at).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Audio Feedback */}
                        {selectedReadingLesson.attempt.feedback.audio_url && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <Mic className="w-5 h-5 text-green-600" />
                              <h4 className="font-semibold text-green-900">Teacher Feedback (Audio)</h4>
                            </div>
                            <audio
                              controls
                              className="w-full"
                              src={selectedReadingLesson.attempt.feedback.audio_url}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Instruction */}
                {selectedReadingLesson.instruction && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-900 font-semibold mb-2">Instructions:</p>
                    <p className="text-green-800">{selectedReadingLesson.instruction}</p>
                  </div>
                )}

                {/* Reading Passage - Passage Only */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Book className="w-5 h-5 text-green-600" />
                    Reading Passage:
                  </h3>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    {extractPassageOnly(selectedReadingLesson.content_text, selectedReadingLesson.questions)}
                  </p>
                </div>

                {/* My Quiz Attempt - Show questions and answers (always show if submitted) */}
                {selectedReadingLesson.questions && 
                 selectedReadingLesson.questions.length > 0 && 
                 (!selectedReadingLesson.submitted || (selectedReadingLesson.submitted && selectedReadingLesson.attempt)) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {selectedReadingLesson.submitted 
                          ? 'My Quiz Attempt:' 
                          : 'MCQ Questions:'}
                      </h3>
                      {selectedReadingLesson.attempt && selectedReadingLesson.submitted && (
                        <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          {selectedReadingLesson.attempt.score} / {selectedReadingLesson.attempt.max_score} Correct
                        </span>
                      )}
                    </div>
                    {selectedReadingLesson.questions.map((question, index) => {
                      const questionKey = `question${index + 1}`;
                      // Check verified status (verified field takes priority over feedback)
                      const verified = selectedReadingLesson.attempt?.verified;
                      const verifiedAt = selectedReadingLesson.attempt?.verified_at;
                      const isVerified = !!(selectedReadingLesson.submitted && (
                        verified === true || 
                        (verified && typeof verified === 'string' && String(verified).toLowerCase() === 'true') ||
                        (verified && typeof verified === 'number' && verified === 1) ||
                        !!verifiedAt
                      ));
                      const studentAnswer = readingAnswers[questionKey];
                      const correctAnswer = question.correct_answer?.toUpperCase();
                      const isCorrect = studentAnswer?.toUpperCase() === correctAnswer;

                      return (
                        <div
                          key={index}
                          className={`p-4 border-2 rounded-lg ${
                            isVerified
                              ? isCorrect
                                ? 'border-green-300 bg-green-50'
                                : 'border-red-300 bg-red-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="mb-3">
                            <p className="text-base font-semibold text-gray-900">
                              Q{index + 1}: {question.question}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {['A', 'B', 'C', 'D'].map((option) => {
                              const optionText = question[`option${option}` as keyof typeof question] as string;
                              const isSelected = studentAnswer?.toUpperCase() === option;
                              const isCorrectOption = correctAnswer === option;

                              let bgColor = 'bg-white';
                              let borderColor = 'border-gray-200';
                              let textColor = 'text-gray-700';

                              if (isVerified) {
                                if (isCorrectOption) {
                                  bgColor = 'bg-green-100';
                                  borderColor = 'border-green-500';
                                  textColor = 'text-green-900';
                                } else if (isSelected && !isCorrectOption) {
                                  bgColor = 'bg-red-100';
                                  borderColor = 'border-red-500';
                                  textColor = 'text-red-900';
                                }
                              }

                              return (
                                <div
                                  key={option}
                                  className={`flex items-center gap-3 p-3 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor}`}
                                >
                                  <input
                                    type="radio"
                                    name={questionKey}
                                    value={option}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (!isVerified) {
                                        setReadingAnswers(prev => ({
                                          ...prev,
                                          [questionKey]: e.target.value
                                        }));
                                      }
                                    }}
                                    disabled={isVerified}
                                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                                  />
                                  <span className="text-sm flex-1">
                                    {option}) {optionText}
                                    {isVerified && isCorrectOption && (
                                      <span className="ml-2 text-green-700 font-semibold">✓ Correct Answer</span>
                                    )}
                                    {isVerified && isSelected && !isCorrectOption && (
                                      <span className="ml-2 text-red-700 font-semibold">✗ Your Answer</span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {isVerified && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <div className="flex items-center gap-2">
                                {isCorrect ? (
                                  <>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 font-semibold">Correct!</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700 font-semibold">
                                      Incorrect. Correct answer: {correctAnswer}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}


              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-t border-gray-200 bg-gray-50 flex justify-end">
              {selectedReadingLesson.submitted ? (
                <button
                  onClick={() => {
                    setIsReadingQuizOpen(false);
                    setSelectedReadingLesson(null);
                    setReadingAnswers({});
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm sm:text-base font-semibold"
                >
                  Close
                </button>
              ) : (
                <button
                  onClick={handleSubmitReadingQuiz}
                  disabled={submitting || Object.keys(readingAnswers).length !== selectedReadingLesson.questions.length}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentLSRWPage;

