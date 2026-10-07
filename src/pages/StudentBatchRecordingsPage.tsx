import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Clock,
  Calendar,
  Search,
  Video,
  FileVideo,
  User,
  Radio,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  HardDrive,
  CheckCircle,
  PlayCircle,
  BookOpen
} from 'lucide-react';
import Classbar from '../components/parts/Classbar';
import { getBatchRecordings, getRecordingStreamUrl, LiveClassRecording } from '../services/liveClassApi';
import toast from 'react-hot-toast';

export const StudentBatchRecordingsPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const [recordings, setRecordings] = useState<LiveClassRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<LiveClassRecording | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);

  // Video Player Controls State
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRecordings = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const data = await getBatchRecordings(batchId);
      setRecordings(data || []);
    } catch (err: any) {
      console.error('Failed to load recordings', err);
      toast.error('Could not load batch recordings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [batchId]);

  // Helper to reliably compute duration even for WebM streams
  const getEffectiveDuration = (): number => {
    if (duration > 0 && isFinite(duration)) return duration;
    if (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
      return videoRef.current.duration;
    }
    if (selectedRecording?.duration_seconds && Number(selectedRecording.duration_seconds) > 0) {
      return Number(selectedRecording.duration_seconds);
    }
    return 0;
  };

  // Open Video Player Modal & Fetch Secure Signed URL
  const handleWatchRecording = async (rec: LiveClassRecording) => {
    const hasVideo = Boolean(rec.storage_object_path || rec.raw_egress_url || (rec.file_size_bytes && rec.file_size_bytes > 0));

    if (rec.status === 'RECORDING') {
      toast('This live class is currently in progress. The recorded video will be available once the session ends.', {
        icon: '🔴',
        duration: 4000
      });
      return;
    }

    if (!hasVideo) {
      toast('Lecture video recording is not available in storage yet or is processing.', {
        icon: '⏳',
        duration: 4000
      });
      return;
    }

    setSelectedRecording(rec);
    setLoadingStream(true);
    setStreamUrl(null);
    setCurrentTime(0);
    setSeekValue(0);
    setIsSeeking(false);
    setIsPlaying(false);
    if (rec.duration_seconds && Number(rec.duration_seconds) > 0) {
      setDuration(Number(rec.duration_seconds));
    } else {
      setDuration(0);
    }
    try {
      const data = await getRecordingStreamUrl(rec.id);
      setStreamUrl(data.streamUrl);
    } catch (err: any) {
      console.error('Failed to get signed playback URL', err);
      toast.error(err.message || 'Could not load secure video stream');
    } finally {
      setLoadingStream(false);
    }
  };

  const handleClosePlayer = () => {
    setSelectedRecording(null);
    setStreamUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setSeekValue(0);
    setIsSeeking(false);
    setHoverTime(null);
  };

  // Video Event Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    if (!isSeeking) {
      setCurrentTime(cur);
    }
    const vidDur = videoRef.current.duration;
    if (isFinite(vidDur) && vidDur > 0 && Math.abs(vidDur - duration) > 1) {
      setDuration(vidDur);
    } else if ((duration === 0 || !isFinite(duration)) && selectedRecording?.duration_seconds) {
      setDuration(Number(selectedRecording.duration_seconds));
    }
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const vidDur = vid.duration;
    if (isFinite(vidDur) && !isNaN(vidDur) && vidDur > 0) {
      setDuration(vidDur);
    } else if (selectedRecording?.duration_seconds) {
      setDuration(Number(selectedRecording.duration_seconds));
    }
  };

  const commitSeek = (targetTime: number) => {
    if (videoRef.current && isFinite(targetTime)) {
      const effDur = getEffectiveDuration();
      let clamped = Math.max(0, targetTime);
      if (effDur > 0) clamped = Math.min(clamped, effDur);
      videoRef.current.currentTime = clamped;
      setCurrentTime(clamped);
      setSeekValue(clamped);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekValue(val);
    setCurrentTime(val);
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    const targetTime = parseFloat((e.currentTarget as HTMLInputElement).value);
    commitSeek(targetTime);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const effDur = getEffectiveDuration();
    if (effDur <= 0) return;
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = clickX / rect.width;
    setHoverX(clickX);
    setHoverTime(percent * effDur);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const effDur = getEffectiveDuration();
    if (effDur <= 0) return;
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetTime = (clickX / rect.width) * effDur;
    commitSeek(targetTime);
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const effDur = getEffectiveDuration();
      const cur = videoRef.current.currentTime;
      let nextTime = cur + seconds;
      if (nextTime < 0) nextTime = 0;
      if (effDur > 0 && nextTime > effDur) nextTime = effDur;
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
      setSeekValue(nextTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Auto-hide controls when playing
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const filteredRecordings = recordings.filter((r) => {
    const titleMatch = r.live_class?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const tutorMatch = r.live_class?.tutor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || tutorMatch;
  });

  // Keyboard navigation for playback
  useEffect(() => {
    if (!selectedRecording) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(5);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleClosePlayer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecording, isPlaying, duration]);

  const effectiveDuration = getEffectiveDuration();
  const displayTime = isSeeking ? seekValue : currentTime;
  const progressPercent = effectiveDuration > 0
    ? Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100))
    : 0;

  const getBufferedPercent = () => {
    if (!videoRef.current || effectiveDuration <= 0) return 0;
    try {
      const b = videoRef.current.buffered;
      if (b && b.length > 0) {
        return Math.min(100, Math.max(0, (b.end(b.length - 1) / effectiveDuration) * 100));
      }
    } catch (e) { }
    return 0;
  };
  const bufferedPercent = getBufferedPercent();

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-72 flex flex-col">
      <Classbar />

      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pl-14 sm:pl-16 lg:pl-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate(`/class/${batchId}`)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors shrink-0"
                title="Back to Schedule"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2 truncate">
                  <FileVideo className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                  <span className="truncate">Recorded Lectures</span>
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Access past live classes & auto-recorded video archives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => navigate(`/class/${batchId}/live`)}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 shadow-md shadow-red-500/20 transition-all shrink-0"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">Live Classroom</span>
                <span className="sm:hidden font-bold">Live</span>
              </button>
              <button
                onClick={fetchRecordings}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="Refresh recordings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex-1">
        {/* Search & Stats Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lectures by topic or tutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600 self-end sm:self-auto">
            <span className="font-semibold text-gray-900">{filteredRecordings.length}</span>{' '}
            Recorded Session{filteredRecordings.length === 1 ? '' : 's'} available
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-600">Loading lecture recordings...</p>
          </div>
        ) : filteredRecordings.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Recordings Available Yet</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              When a tutor completes a live session, the auto-recorded video will appear here within 2–3 minutes for anytime playback.
            </p>
            <button
              onClick={() => navigate(`/class/${batchId}/live`)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              Go to Live Class
            </button>
          </div>
        ) : (
          /* Recordings Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
              >
                {/* Video Card Thumbnail Preview */}
                <div
                  onClick={() => handleWatchRecording(rec)}
                  className="h-44 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 relative flex items-center justify-center cursor-pointer overflow-hidden group"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-blue-500 transition-all">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>

                  {/* Duration Tag */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/75 backdrop-blur-sm rounded-md text-[11px] font-semibold text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{rec.duration_seconds && rec.duration_seconds > 0 ? formatTime(rec.duration_seconds) : 'Video'}</span>
                  </div>

                  {/* Status Badge & Part Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    {rec.part_number && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-sm">
                        Part {rec.part_number}
                      </span>
                    )}
                    {rec.status === 'RECORDING' ? (
                      <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>RECORDING IN PROGRESS</span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 backdrop-blur-sm">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>READY FOR PLAYBACK</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {rec.display_title || rec.live_class?.title || 'Interactive Live Class Session'}
                    </h3>

                    <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Tutor: {rec.live_class?.tutor?.full_name || 'Faculty Member'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(rec.created_at).toLocaleDateString([], {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {rec.live_class?.description && (
                      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 mb-3 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">
                          <BookOpen className="w-3 h-3 text-blue-600" />
                          <span>Topics Covered</span>
                        </div>
                        <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed font-medium">
                          {rec.live_class.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(rec.file_size_bytes)}
                    </span>

                    <button
                      onClick={() => handleWatchRecording(rec)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Watch</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Custom Video Player Modal (NEET Platform standard) */}
      {selectedRecording && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
          <div
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            className="w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative group"
          >
            {/* Player Top Bar Overlay */}
            <div
              className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-lg">
                    {selectedRecording.display_title || selectedRecording.live_class?.title || 'Recorded Lecture'}
                  </h3>
                  {selectedRecording.part_number && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-sm shrink-0">
                      Part {selectedRecording.part_number}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Tutor: {selectedRecording.live_class?.tutor?.full_name || 'Academic Faculty'}
                </p>
                {selectedRecording.live_class?.description && (
                  <p className="text-xs text-blue-300 mt-1 flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>Topics: {selectedRecording.live_class.description}</span>
                  </p>
                )}
              </div>

              <button
                onClick={handleClosePlayer}
                className="p-2 hover:bg-white/10 text-white rounded-full transition-colors"
                title="Close player (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Stage */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {loadingStream ? (
                <div className="flex flex-col items-center justify-center text-white">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                  <p className="text-xs text-slate-400">Generating secure 2-hour signed stream URL...</p>
                </div>
              ) : streamUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={streamUrl}
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(e) => {
                      handleLoadedMetadata();
                      e.currentTarget.volume = volume;
                      e.currentTarget.muted = isMuted;
                    }}
                    onPlay={(e) => {
                      e.currentTarget.volume = volume;
                      e.currentTarget.muted = isMuted;
                    }}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => {
                      console.error("Recording video stream playback error:", e);
                      toast.error("Video stream playback error. Please check your connection.");
                    }}
                    className="w-full h-full object-contain cursor-pointer"
                    playsInline
                  />

                  {/* Big Play Button Overlay when Paused */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlay}
                      className="absolute w-20 h-20 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                    >
                      <Play className="w-8 h-8 fill-white ml-1" />
                    </button>
                  )}
                </>
              ) : (
                <div className="text-red-400 text-sm">Failed to load video stream.</div>
              )}
            </div>

            {/* Bottom Controls Bar Overlay */}
            {streamUrl && (
              <div
                className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
              >
                {/* Interactive Progress / Seek Bar */}
                <div
                  ref={progressBarRef}
                  className="mb-3 relative group/bar cursor-pointer select-none py-2"
                  onMouseMove={handleProgressMouseMove}
                  onMouseLeave={() => setHoverTime(null)}
                  onClick={handleProgressClick}
                >
                  {/* Hover Time Tooltip */}
                  {hoverTime !== null && (
                    <div
                      className="absolute -top-7 px-2 py-0.5 bg-slate-900/95 text-white text-[11px] font-mono rounded-md shadow-lg border border-slate-700 pointer-events-none transform -translate-x-1/2 transition-opacity z-30"
                      style={{ left: `${hoverX}px` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}

                  {/* Track Background */}
                  <div className="w-full h-1.5 group-hover/bar:h-2.5 bg-slate-700/80 rounded-full overflow-hidden transition-all duration-150 relative">
                    {/* Buffered bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-500/40 rounded-full pointer-events-none"
                      style={{ width: `${bufferedPercent}%` }}
                    />
                    {/* Played progress fill */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full pointer-events-none transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Scrubber Knob Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-blue-500 pointer-events-none transition-all duration-75 group-hover/bar:scale-125 z-20"
                    style={{ left: `calc(${progressPercent}% - 7px)` }}
                  />

                  {/* Transparent Range Input Overlay for Drag / Touch Accessibility */}
                  <input
                    type="range"
                    min={0}
                    max={effectiveDuration > 0 ? effectiveDuration : 100}
                    step="any"
                    value={effectiveDuration > 0 ? displayTime : 0}
                    onMouseDown={() => setIsSeeking(true)}
                    onTouchStart={() => setIsSeeking(true)}
                    onChange={handleSeekChange}
                    onMouseUp={handleSeekEnd}
                    onTouchEnd={handleSeekEnd}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                </div>

                <div className="flex items-center justify-between text-white text-xs">
                  {/* Left Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                    </button>

                    {/* 10s Skip Backward */}
                    <button
                      onClick={() => skipTime(-10)}
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Rewind 10 seconds"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* 10s Skip Forward */}
                    <button
                      onClick={() => skipTime(10)}
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Forward 10 seconds"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    {/* Time Counter */}
                    <div className="text-slate-300 font-mono text-[11px] ml-1 select-none">
                      <span className="text-white font-semibold">{formatTime(displayTime)}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-slate-400">{formatTime(effectiveDuration)}</span>
                    </div>

                    {/* Volume Slider - Desktop only */}
                    <div className="hidden sm:flex items-center gap-1.5 ml-2">
                      <button onClick={toggleMute} className="p-1 hover:text-blue-400 transition-colors">
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-slate-700 accent-blue-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Right Controls: Speed & Fullscreen */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Mobile Speed Select */}
                    <select
                      value={playbackSpeed}
                      onChange={(e) => changePlaybackSpeed(parseFloat(e.target.value))}
                      aria-label="Playback Speed"
                      className="sm:hidden bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700 rounded-lg px-1.5 py-1 focus:outline-none"
                    >
                      {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <option key={s} value={s}>{s}x</option>
                      ))}
                    </select>

                    {/* Desktop Speed Selector */}
                    <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
                      {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => changePlaybackSpeed(s)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${playbackSpeed === s
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white'
                            }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBatchRecordingsPage;
