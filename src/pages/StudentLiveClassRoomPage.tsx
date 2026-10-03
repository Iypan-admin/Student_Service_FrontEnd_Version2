import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  useRoomContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Users,
  Hand,
  Maximize2,
  Minimize2,
  PenTool,
  LayoutGrid,
  Radio,
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  PlayCircle,
  GraduationCap,
  ShieldCheck,
  XCircle,
  CheckCircle,
  Volume2,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getLiveClasses,
  joinLiveClass,
  requestJoinLiveClass,
  getJoinStatus,
  LiveClass,
  JoinLiveClassResponse
} from '../services/liveClassApi';

// Format time in Asia/Kolkata (IST)
const formatISTTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (_) {
    return '';
  }
};

// Helper to accurately resolve participant role from LiveKit metadata, identity, or names
const getParticipantRole = (p: any): string => {
  if (!p) return 'Student';
  try {
    if (p.metadata) {
      const meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
      if (meta.roleLabel) return meta.roleLabel;
      if (meta.role === 'academic' || meta.isAcademic) return 'Academic Manager';
      if (meta.role === 'admin' || meta.isAdmin) return 'Administrator';
      if (meta.role === 'teacher' || meta.isTeacher) return 'Instructor (Host)';
      if (meta.role === 'student') return 'Student';
    }
  } catch (_) {}

  const id = (p.identity || '').toLowerCase();
  if (id.startsWith('academic_')) return 'Academic Manager';
  if (id.startsWith('admin_')) return 'Administrator';
  if (id.startsWith('tutor_') || id.startsWith('teacher_')) return 'Instructor (Host)';

  const name = (p.name || '').toLowerCase();
  if (name.includes('academic') || name.includes('manager')) return 'Academic Manager';
  if (name.includes('admin')) return 'Administrator';
  if (name.includes('instructor') || name.includes('tutor')) return 'Instructor (Host)';

  return 'Student';
};

// Inner Classroom Stage Component
interface ClassroomStageProps {
  liveClass: LiveClass;
  onLeave: () => void;
}

const ClassroomStage: React.FC<ClassroomStageProps> = ({ liveClass, onLeave }) => {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  // View & UI State
  const [activeView, setActiveView] = useState<'stage' | 'whiteboard'>('stage');
  const [tutorActiveTab, setTutorActiveTab] = useState<'stage' | 'whiteboard'>('stage');
  const [remoteWhiteboardUrl, setRemoteWhiteboardUrl] = useState<string | null>(null);
  const [remoteBoardTheme, setRemoteBoardTheme] = useState<'dark' | 'light'>('dark');

  const [showAttendees, setShowAttendees] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (liveClass?.actual_start) {
      const diff = Math.floor((Date.now() - new Date(liveClass.actual_start).getTime()) / 1000);
      return Math.max(0, diff);
    }
    const saved = liveClass?.id && sessionStorage.getItem(`isml_student_start_${liveClass.id}`);
    if (saved) {
      const diff = Math.floor((Date.now() - parseInt(saved, 10)) / 1000);
      return Math.max(0, diff);
    }
    return 0;
  });

  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  const stageContainerRef = useRef<HTMLDivElement>(null);

  // Resilient Timer - Continues seamlessly from actual start across refreshes
  useEffect(() => {
    let startMs = liveClass?.actual_start ? new Date(liveClass.actual_start).getTime() : null;
    if (!startMs && liveClass?.id) {
      const saved = sessionStorage.getItem(`isml_student_start_${liveClass.id}`);
      if (saved) {
        startMs = parseInt(saved, 10);
      } else {
        startMs = Date.now();
        sessionStorage.setItem(`isml_student_start_${liveClass.id}`, startMs.toString());
      }
    }

    const calcElapsed = () => {
      if (startMs) {
        const secs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setElapsedSeconds(secs);
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }
    };

    calcElapsed();
    const timer = setInterval(calcElapsed, 1000);
    return () => clearInterval(timer);
  }, [liveClass?.id, liveClass?.actual_start]);

  // Suppress harmless WebRTC teardown errors on page reload/navigation
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = event?.reason?.message || String(event?.reason || '');
      if (
        reasonStr.includes('PC manager is closed') ||
        reasonStr.includes('UnexpectedConnectionState') ||
        reasonStr.includes('could not establish data channel') ||
        reasonStr.includes('data transport is not ready') ||
        reasonStr.includes('closed')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Request Whiteboard sync upon joining
  useEffect(() => {
    if (!room || room.state !== 'connected' || !room.localParticipant) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({ type: 'REQUEST_SYNC' }));
      room.localParticipant.publishData(payload, { reliable: true }).catch(() => { });
    } catch (e) { }
  }, [room]);

  // Speaking state detection for animated aura rings
  useEffect(() => {
    if (!localParticipant) return;
    const handleLocalSpeaking = (speaking: boolean) => setIsLocalSpeaking(speaking);
    localParticipant.on('isSpeakingChanged', handleLocalSpeaking);
    return () => {
      localParticipant.off('isSpeakingChanged', handleLocalSpeaking);
    };
  }, [localParticipant]);

  // Listen for data messages (Whiteboard sync, Chat & Hand raises)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: { name?: string; identity?: string }) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const data = JSON.parse(decoded);

        if (data.type === 'WHITEBOARD_SYNC') {
          if (data.dataUrl) {
            setRemoteWhiteboardUrl(data.dataUrl);
          }
          if (data.boardTheme) {
            setRemoteBoardTheme(data.boardTheme);
          }
          if (data.activeTab) {
            setTutorActiveTab(data.activeTab);
            // Auto switch student view to whiteboard when tutor switches to whiteboard
            if (data.activeTab === 'whiteboard') {
              setActiveView('whiteboard');
            } else if (data.activeTab === 'stage') {
              setActiveView('stage');
            }
          }
        } else if (data.type === 'CLASS_ENDED') {
          toast('The instructor has ended this live class session.', { icon: '👋', duration: 4000 });
          onLeave();
          return;
        } else if (data.type === 'CHAT') {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: data.sender || participant?.name || participant?.identity || 'Classmate',
              text: data.text || data.message,
              time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: false
            }
          ]);
        } else if (data.type === 'HAND_RAISE') {
          if (data.studentId !== localParticipant.identity) {
            toast(`${data.studentName || participant?.name || 'A classmate'} raised their hand ✋`, {
              icon: '✋',
              style: { background: '#1e293b', color: '#fff' }
            });
          }
        } else if (data.type === 'LOWER_HAND_BY_TUTOR') {
          if (data.targetStudentId === localParticipant.identity || data.targetStudentId === 'ALL') {
            setIsHandRaised(false);
            toast('Your hand was acknowledged by the instructor ✋');
          }
        }
      } catch (err) {
        console.error('Error parsing room data message', err);
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => {
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, localParticipant.identity]);



  const toggleRaiseHand = async () => {
    if (!room) return;
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);

    const sId = localParticipant.identity;
    const sName = localParticipant.name || 'Student';

    if (nextState) {
      const payload = JSON.stringify({
        type: 'HAND_RAISE',
        studentId: sId,
        studentName: sName,
        isHandRaised: true
      });
      try {
        if (room && room.state === 'connected' && room.localParticipant) {
          await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }).catch(() => { });
        }
        toast.success('Hand raised! The tutor has been notified.');
      } catch (err) {
        console.error(err);
      }
    } else {
      const payload = JSON.stringify({
        type: 'HAND_LOWER',
        studentId: sId,
        studentName: sName,
        isHandRaised: false
      });
      try {
        if (room && room.state === 'connected' && room.localParticipant) {
          await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }).catch(() => { });
        }
      } catch (err) {
        console.error(err);
      }
      toast('Hand lowered');
    }
  };

  const toggleFullscreen = () => {
    if (!stageContainerRef.current) return;
    if (!document.fullscreenElement) {
      stageContainerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Tracks query
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);

  // Find remote tutor participant accurately
  const tutorParticipant = remoteParticipants.find(
    (p) => getParticipantRole(p) === 'Instructor (Host)' || p.identity.startsWith('tutor_') || p.identity.includes('teacher')
  ) || remoteParticipants.find((p) => getParticipantRole(p) !== 'Academic Manager') || remoteParticipants[0];

  const otherRemoteParticipants = remoteParticipants.filter(
    (p) => p.identity !== tutorParticipant?.identity
  );

  // Find remote tutor track (prefer tutor screen/camera track)
  const tutorTrack = screenShareTracks.find((t) => t.participant.identity === tutorParticipant?.identity)
    || cameraTracks.find((t) => t.participant.identity === tutorParticipant?.identity)
    || screenShareTracks[0]
    || cameraTracks.find((t) => !t.participant.isLocal);
  const localTrack = cameraTracks.find((t) => t.participant.isLocal);

  // Monitor remote tutor speaking
  useEffect(() => {
    if (!tutorParticipant) return;
    const handleSpeaking = (speaking: boolean) => setIsTutorSpeaking(speaking);
    tutorParticipant.on('isSpeakingChanged', handleSpeaking);
    return () => {
      tutorParticipant.off('isSpeakingChanged', handleSpeaking);
    };
  }, [tutorParticipant]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const tutorDisplayName = liveClass.tutor?.full_name || 'Academic Faculty';

  return (
    <div
      ref={stageContainerRef}
      className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden select-none font-sans"
    >
      {/* Top Navbar */}
      <header className="h-13 sm:h-16 px-2.5 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
          <button
            onClick={onLeave}
            className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer shrink-0"
            title="Leave classroom"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-5 sm:h-6 w-px bg-slate-800 shrink-0" />

          {/* Live indicator & Title */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] sm:text-xs font-bold tracking-wider shrink-0 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              LIVE
            </span>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[100px] xs:max-w-[140px] sm:max-w-xs md:max-w-md">
                {liveClass.title}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs hidden xs:block">
                <span className="text-blue-400 font-medium">{tutorDisplayName}</span> • <span className="text-slate-300">{liveClass.batch?.batch_name || 'Class'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Controls: View Mode Switcher + Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Interactive View Switcher Pill */}
          <div className="flex items-center p-0.5 sm:p-1 bg-slate-800/90 rounded-xl sm:rounded-2xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveView('stage')}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeView === 'stage'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white'
                }`}
              title="Classroom Stage"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Classroom Stage</span>
            </button>

            <button
              onClick={() => setActiveView('whiteboard')}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${activeView === 'whiteboard'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
                }`}
              title="Whiteboard"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Whiteboard</span>
              {tutorActiveTab === 'whiteboard' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
            <span>⏱️ {formatElapsed(elapsedSeconds)}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onLeave}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl flex items-center gap-1 shadow-md shadow-red-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave Class</span>
            <span className="sm:hidden">Leave</span>
          </button>
        </div>
      </header>

      {/* Main Classroom Viewport */}
      <div className="flex-1 flex relative overflow-hidden bg-slate-950">
        {/* VIEW A: CLASSROOM STAGE (Multi-Participant Interactive Grid) */}
        {activeView === 'stage' && (
          <div className="flex-1 p-2 sm:p-4 flex flex-col justify-center items-center overflow-hidden relative">
            <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 items-stretch justify-center">
              {/* Tile 1: Tutor / Instructor Primary Tile */}
              <div
                className={`bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${isTutorSpeaking
                    ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/20 shadow-2xl'
                    : 'border border-slate-800'
                  }`}
              >
                {tutorTrack ? (
                  <VideoTrack trackRef={tutorTrack} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4 sm:p-6 flex flex-col items-center justify-center">
                    <div
                      className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-2 sm:mb-4 shadow-xl transition-all ${isTutorSpeaking
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/50 scale-110 shadow-emerald-500/50'
                          : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                        }`}
                    >
                      <span className="text-2xl sm:text-4xl font-bold">
                        {tutorDisplayName[0]?.toUpperCase() || 'T'}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1">{tutorDisplayName}</h3>
                    <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-blue-950/70 text-blue-400 border border-blue-800/60 rounded-full text-[10px] sm:text-xs font-semibold">
                      <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Instructor (Host)</span>
                    </div>
                  </div>
                )}

                {/* Tutor Bottom Status Pill */}
                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2 border border-white/10 text-white">
                  <span className={`w-2 h-2 rounded-full ${isTutorSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="truncate max-w-[120px] sm:max-w-none">{tutorDisplayName} (Instructor)</span>

                  {isTutorSpeaking && (
                    <div className="flex items-end gap-0.5 h-3 ml-0.5">
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-3" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1.5" />
                    </div>
                  )}
                </div>

                {/* Whiteboard Available Banner if Tutor is on Whiteboard */}
                {tutorActiveTab === 'whiteboard' && (
                  <button
                    onClick={() => setActiveView('whiteboard')}
                    className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-purple-600 hover:bg-purple-500 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-lg shadow-purple-600/40 flex items-center gap-1 sm:gap-1.5 animate-bounce cursor-pointer border border-purple-400/40"
                  >
                    <PenTool className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Whiteboard Live</span>
                  </button>
                )}
              </div>

              {/* Tile 2: Local Student (You) Tile */}
              <div
                className={`bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${isHandRaised
                    ? 'border-2 border-amber-500 ring-4 ring-amber-500/30 shadow-amber-500/20 shadow-2xl'
                    : isLocalSpeaking
                      ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/20 shadow-2xl'
                      : 'border border-slate-800'
                  }`}
              >
                {/* Hand Raised Floating Badge */}
                {isHandRaised && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-amber-500 text-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse z-10">
                    <span>✋</span>
                    <span>Hand Raised</span>
                  </div>
                )}

                {isCameraEnabled && localTrack ? (
                  <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4 sm:p-6 flex flex-col items-center justify-center">
                    <div
                      className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-2 sm:mb-4 shadow-xl transition-all ${isLocalSpeaking
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/50 scale-110'
                          : 'bg-slate-800 border border-slate-700 text-slate-200'
                        }`}
                    >
                      <span className="text-2xl sm:text-4xl font-bold">
                        {(localParticipant.name || 'S')[0]?.toUpperCase() || 'Y'}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                      {localParticipant.name || 'You'}
                    </h3>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Student (You)</span>
                  </div>
                )}

                {/* Local Student Bottom Status Pill */}
                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2 border border-white/10 text-white">
                  <span className={`w-2 h-2 rounded-full ${isMicrophoneEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  <span className="truncate max-w-[120px] sm:max-w-none">{localParticipant.name || 'You'} (Student)</span>
                  {isMicrophoneEnabled ? (
                    <Mic className="w-3 h-3 text-emerald-400 ml-0.5" />
                  ) : (
                    <MicOff className="w-3 h-3 text-red-400 ml-0.5" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: DIGITAL WHITEBOARD STAGE (Synchronized Live from Tutor) */}
        {activeView === 'whiteboard' && (
          <div className="flex-1 p-0 sm:p-2 md:p-4 flex flex-col items-center justify-center overflow-hidden relative">
            <div
              className={`w-full h-full max-h-full sm:max-h-[84vh] rounded-none sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative border-0 sm:border flex flex-col items-center justify-center transition-all ${remoteBoardTheme === 'dark' ? 'bg-[#090d16] border-slate-800' : 'bg-[#f8fafc] border-slate-300'
                }`}
            >
              {/* Subtle Grid Pattern */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    remoteBoardTheme === 'dark'
                      ? 'radial-gradient(circle, #334155 1px, transparent 1px)'
                      : 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Whiteboard Top Status Badge */}
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-slate-700/80 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-slate-200 shadow-lg">
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                <PenTool className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Tutor Live Whiteboard • Real-Time Synchronized</span>
                <span className="sm:hidden">Tutor Board (Live)</span>
              </div>

              {/* Synchronized Whiteboard Display */}
              {remoteWhiteboardUrl ? (
                <img
                  src={remoteWhiteboardUrl}
                  alt="Tutor Digital Whiteboard"
                  className="w-full h-full object-contain relative z-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 z-10 max-w-sm">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-3 sm:mb-4">
                    <PenTool className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-1">
                    Whiteboard Ready & Active
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                    Live notes, diagrams, and explanations drawn by the tutor will appear here instantly.
                  </p>
                </div>
              )}

              {/* Floating Tutor PiP in Whiteboard Corner */}
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-28 sm:w-48 md:w-56 aspect-video bg-slate-900 rounded-lg sm:rounded-2xl overflow-hidden border sm:border-2 border-slate-700 shadow-2xl z-20 flex items-center justify-center pointer-events-none">
                {tutorTrack ? (
                  <VideoTrack trackRef={tutorTrack} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1.5 sm:p-2">
                    <div
                      className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-1 text-xs sm:text-sm font-bold ${isTutorSpeaking ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' : 'bg-blue-600 text-white'
                        }`}
                    >
                      {tutorDisplayName[0]?.toUpperCase() || 'T'}
                    </div>
                    <p className="text-[9px] sm:text-[11px] font-bold text-white truncate max-w-[100px] sm:max-w-[150px]">
                      {tutorDisplayName}
                    </p>
                  </div>
                )}
                <div className="absolute bottom-0.5 sm:bottom-1.5 left-1 sm:left-2 bg-black/70 px-1.5 py-0.2 sm:py-0.5 rounded text-[8px] sm:text-[10px] text-white flex items-center gap-1 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${isTutorSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{tutorDisplayName}</span>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Attendees Drawer (Mobile Full Sheet Overlay, Desktop Side Drawer) */}
        {showAttendees && (
          <div className="fixed sm:relative inset-y-0 right-0 w-full sm:w-80 bg-slate-900/98 sm:bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col z-40 sm:z-30 transition-all duration-300 shadow-2xl">
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  Class Participants ({remoteParticipants.length + 1})
                </h3>
              </div>
              <button
                onClick={() => setShowAttendees(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {/* Tutor Row */}
              <div className="flex items-center justify-between p-2.5 bg-blue-950/40 border border-blue-800/60 rounded-xl">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                    {tutorDisplayName[0]?.toUpperCase() || 'T'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{tutorDisplayName}</p>
                    <span className="text-[10px] text-blue-400 font-semibold">Instructor (Host)</span>
                  </div>
                </div>
                <span className="text-xs">🎤</span>
              </div>

              {/* Local Participant (Me) */}
              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                    {(localParticipant.name || 'Y')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {localParticipant.name || 'You'} (Student)
                    </p>
                    <span className="text-[10px] text-slate-400">Online</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  {isMicrophoneEnabled ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  {isCameraEnabled ? (
                    <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Other Remote Attendees (Academic Managers & Classmates) */}
              {otherRemoteParticipants.map((p) => {
                const role = getParticipantRole(p);
                const isAcademic = role === 'Academic Manager';
                return (
                  <div
                    key={p.identity}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isAcademic
                        ? 'bg-purple-950/40 border-purple-800/60 shadow-sm shadow-purple-950/20'
                        : 'bg-slate-800/40 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAcademic
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {(p.name || (isAcademic ? 'A' : 'P'))[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-slate-200">{p.name || p.identity}</p>
                          {isAcademic && (
                            <span className="px-1.5 py-0.2 bg-purple-950/80 text-purple-300 border border-purple-600/70 text-[9px] font-bold rounded">
                              Academic Manager
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] ${
                            isAcademic ? 'text-purple-300 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {isAcademic ? 'Academic Manager (Observer)' : 'Classmate'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs">{p.isMicrophoneEnabled ? '🎤' : '🔇'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="h-14 sm:h-18 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between sm:justify-center px-2 sm:px-6 gap-1 sm:gap-3 z-30 shrink-0">
        {/* Mic Toggle */}
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled, {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000,
            channelCount: 1
          })}
          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer ${isMicrophoneEnabled
              ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 shadow-md'
              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            }`}
          title={isMicrophoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicrophoneEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer ${isCameraEnabled
              ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 shadow-md'
              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            }`}
          title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraEnabled ? <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <div className="h-6 sm:h-8 w-px bg-slate-800 mx-0.5 sm:mx-1" />

        {/* Switch View Toggle */}
        <button
          onClick={() => setActiveView((prev) => (prev === 'stage' ? 'whiteboard' : 'stage'))}
          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${activeView === 'whiteboard'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
        >
          {activeView === 'whiteboard' ? <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          <span className="sm:hidden">{activeView === 'whiteboard' ? 'Stage' : 'Board'}</span>
          <span className="hidden sm:inline">{activeView === 'whiteboard' ? 'Video Stage' : 'Whiteboard'}</span>
        </button>

        {/* Raise Hand Button */}
        <button
          onClick={toggleRaiseHand}
          className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${isHandRaised
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
        >
          <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="sm:hidden">✋</span>
          <span className="hidden sm:inline">{isHandRaised ? 'Hand Raised ✋' : 'Raise Hand'}</span>
        </button>

        {/* Toggle Attendees */}
        <button
          onClick={() => setShowAttendees(!showAttendees)}
          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${showAttendees
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          title="Class participants"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="ml-1 text-[10px] sm:text-xs font-semibold text-slate-300">
            {remoteParticipants.length + 1}
          </span>
        </button>
      </div>
    </div>
  );
};

// Main Student Live Classroom Wrapper Component
// Main Student Live Classroom Wrapper Component
export const StudentLiveClassRoomPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeLiveClass, setActiveLiveClass] = useState<LiveClass | null>(null);
  const [lastExpiredClass, setLastExpiredClass] = useState<LiveClass | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClass[]>([]);
  const [joinData, setJoinData] = useState<JoinLiveClassResponse | null>(null);
  const [waitingStatus, setWaitingStatus] = useState<'IDLE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const roomOptions = React.useMemo(() => ({
    audioCaptureDefaults: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 48000,
      channelCount: 1
    },
    publishDefaults: {
      audioPreset: {
        maxBitrate: 64000
      },
      dtx: false,
      red: true
    }
  }), []);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = (classId: string) => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getJoinStatus(classId);
        if (res.status === 'APPROVED') {
          stopPolling();
          setWaitingStatus('APPROVED');
          toast.success('🎉 Tutor admitted you to the live class!');
          const response = await joinLiveClass(classId);
          setJoinData(response);
        } else if (res.status === 'REJECTED') {
          stopPolling();
          setWaitingStatus('REJECTED');
          toast.error('Tutor declined admission.');
        }
      } catch (err) {
        // silent retry
      }
    }, 2500);
  };

  const checkStatusOnce = async (classId: string) => {
    try {
      const res = await getJoinStatus(classId);
      if (res.status === 'APPROVED') {
        stopPolling();
        setWaitingStatus('APPROVED');
        toast.success('🎉 Tutor admitted you to the live class!');
        const response = await joinLiveClass(classId);
        setJoinData(response);
      } else if (res.status === 'REJECTED') {
        stopPolling();
        setWaitingStatus('REJECTED');
        toast.error('Tutor declined admission.');
      } else {
        toast('Still waiting for tutor approval...');
      }
    } catch (err) {
      toast.error('Failed to check status');
    }
  };

  const fetchBatchClasses = async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const classes = await getLiveClasses({ batch_id: batchId });
      const nowMs = Date.now();

      // Check if there is an active LIVE class or currently in-session scheduled class
      const live = classes.find((c) =>
        c.status === 'LIVE' ||
        (c.status === 'SCHEDULED' &&
          nowMs >= new Date(c.scheduled_start).getTime() &&
          nowMs <= new Date(c.scheduled_end).getTime())
      );
      if (live) {
        setActiveLiveClass(live);
        setLastExpiredClass(null);

        // Send knock / request admission
        const reqRes = await requestJoinLiveClass(live.id);
        if (reqRes.status === 'APPROVED') {
          setWaitingStatus('APPROVED');
          const response = await joinLiveClass(live.id);
          setJoinData(response);
        } else if (reqRes.status === 'REJECTED') {
          setWaitingStatus('REJECTED');
        } else {
          setWaitingStatus('PENDING');
          startPolling(live.id);
        }
      } else {
        setActiveLiveClass(null);
        setJoinData(null);
        setWaitingStatus('IDLE');
        stopPolling();

        const mostRecentExpired = classes
          .filter((c) => nowMs > new Date(c.scheduled_end).getTime())
          .sort((a, b) => new Date(b.scheduled_end).getTime() - new Date(a.scheduled_end).getTime())[0] || null;
        setLastExpiredClass(mostRecentExpired);

        // Filter scheduled upcoming classes
        const upcoming = classes
          .filter((c) => c.status === 'SCHEDULED' && nowMs <= new Date(c.scheduled_end).getTime())
          .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
        setUpcomingClasses(upcoming);
      }
    } catch (err: unknown) {
      console.error('Error fetching live class state', err);
      const msg = err instanceof Error ? err.message : 'Failed to connect to live class';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchClasses();
    return () => {
      stopPolling();
    };
  }, [batchId]);

  const handleLeaveClass = () => {
    stopPolling();
    navigate(`/class/${batchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <Radio className="w-6 h-6 text-blue-400 absolute inset-0 m-auto" />
        </div>
        <h2 className="text-lg font-bold tracking-wide">Connecting to Live Classroom...</h2>
        <p className="text-xs text-slate-400 mt-1">Configuring audio & video channels</p>
      </div>
    );
  }

  // Waiting Room: Knock sent, waiting for tutor approval
  if (activeLiveClass && waitingStatus === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 sm:p-6 font-sans">
        <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Radar Animation */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center relative">
              <span className="w-14 h-14 rounded-full bg-amber-500/20 animate-ping absolute" />
              <Clock className="w-8 h-8 text-amber-400 relative z-10" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/70 border border-amber-800/80 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Waiting Room
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
            Waiting for Tutor to Admit You
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            The tutor has been notified that you are waiting. You will automatically enter the classroom as soon as the tutor approves.
          </p>

          {/* Class details card */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Class Session:</span>
              <span className="font-bold text-white truncate max-w-[200px]">{activeLiveClass.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Batch:</span>
              <span className="font-semibold text-blue-300 truncate max-w-[200px]">{activeLiveClass.batch?.batch_name || 'Enrolled Batch'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tutor:</span>
              <span className="font-semibold text-indigo-300">{activeLiveClass.tutor?.full_name || 'Assigned Tutor'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Admission Status:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Knock Sent • Awaiting Approval
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLeaveClass}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Leave Waiting Room
            </button>
            <button
              onClick={() => checkStatusOnce(activeLiveClass.id)}
              className="py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admission Declined Screen
  if (activeLiveClass && waitingStatus === 'REJECTED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Admission Declined</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The tutor has declined your request to join this live classroom session.
          </p>
          <button
            onClick={handleLeaveClass}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  // Active Live Class Session found & Approved -> Render LiveKit Studio
  if (activeLiveClass && joinData) {
    return (
      <LiveKitRoom
        serverUrl={joinData.livekitUrl}
        token={joinData.token}
        connect={true}
        video={false}
        audio={false}
        options={roomOptions}
        onDisconnected={handleLeaveClass}
        data-lk-theme="default"
      >
        <ClassroomStage liveClass={activeLiveClass} onLeave={handleLeaveClass} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    );
  }

  // No active LIVE class currently
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Bar */}
      <div className="h-16 px-6 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/class/${batchId}`)}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Class Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm">Live Class Portal</span>
          </div>
        </div>

        <button
          onClick={fetchBatchClasses}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Empty / Upcoming State View */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Radio className="w-10 h-10 animate-pulse text-blue-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">No Live Class In Session</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your teacher has not started a live stream right now. Live classes will automatically activate here once your tutor launches the studio.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Concluded Class Notification if recent */}
          {lastExpiredClass && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Session Concluded ({formatISTTime(lastExpiredClass.scheduled_end)})
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  CLOSED
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {lastExpiredClass.title}
              </h3>
              <p className="text-xs text-slate-400">
                Live classroom entry concluded at {formatISTTime(lastExpiredClass.scheduled_end)}. Admission is closed strictly based on the Asia/Kolkata schedule. Auto-recorded lecture will be available in the archive.
              </p>
            </div>
          )}

          {/* Upcoming Class Card if available */}
          {upcomingClasses.length > 0 ? (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Next Scheduled Lecture
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  SCHEDULED
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {upcomingClasses[0].title}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                {upcomingClasses[0].description || 'Live interactive coaching session with syllabus coverage.'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(upcomingClasses[0].scheduled_start).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {formatISTTime(upcomingClasses[0].scheduled_start)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl mb-6 text-xs text-slate-500">
              No upcoming scheduled classes found for this batch. Check back soon or visit recordings.
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/class/${batchId}/recordings`)}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Watch Past Recordings</span>
            </button>
            <button
              onClick={fetchBatchClasses}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLiveClassRoomPage;
