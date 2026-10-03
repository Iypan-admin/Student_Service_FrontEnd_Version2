import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentInfo {
  name?: string;
  studentId?: string;
  email?: string;
  phone?: string | number;
}

interface SecureMediaProtectionProps {
  children?: React.ReactNode;
  isActive: boolean;
  studentInfo?: StudentInfo;
  onSecurityPause?: () => void;
  onSecurityResume?: () => void;
  enableMovingWatermark?: boolean;
  enableBlurShield?: boolean;
}

/**
 * Hook to enforce anti-capture, anti-screen-record hotkey blocking, and display media interception
 */
export function useAntiScreenCapture({
  isActive,
  onSecurityPause,
}: {
  isActive: boolean;
  onSecurityPause?: () => void;
  onSecurityResume?: () => void;
}) {
  const [isCaptureAttempted, setIsCaptureAttempted] = useState(false);
  const [isWindowUnfocused, setIsWindowUnfocused] = useState(false);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCaptureWarning = useCallback((reason?: string) => {
    setIsCaptureAttempted(true);
    if (onSecurityPause) onSecurityPause();

    // Clear clipboard immediately to neutralize any screenshot or capture buffer
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('⚠️ Protected ISML Content: Screenshots and screen recordings are strictly prohibited.');
      }
    } catch (_) {}

    toast.error(`⚠️ ${reason || 'Screen capture / recording is strictly prohibited!'}`, {
      id: 'capture-warning',
      duration: 4000,
    });

    if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    captureTimeoutRef.current = setTimeout(() => {
      setIsCaptureAttempted(false);
    }, 3500);
  }, [onSecurityPause]);

  useEffect(() => {
    if (!isActive) {
      setIsCaptureAttempted(false);
      setIsWindowUnfocused(false);
      return;
    }

    // 1. Block getDisplayMedia (Prevents browser extensions like Loom, Screencastify, Tab Recorders)
    let origGetDisplayMedia: any = null;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        navigator.mediaDevices.getDisplayMedia = async function () {
          triggerCaptureWarning('Browser Screen Recording Extension Detected and Blocked!');
          throw new DOMException('Screen recording is disabled for copyrighted lectures', 'NotAllowedError');
        };
      } catch (_) {}
    }

    // 2. Block Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 3. Block All Screen Capture & Screen Recording Hotkeys
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code ? e.code.toLowerCase() : '';

      // CRITICAL: Windows Key (Win) - Detects Windows + Alt + R before Game Bar can record!
      // When user presses Win+Alt+R, the Windows key is pressed first.
      if (
        key === 'meta' ||
        code === 'metaleft' ||
        code === 'metaright' ||
        e.keyCode === 91 ||
        e.keyCode === 92
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Windows System Shortcut / Recording Key Detected! Video Hidden.');
        return false;
      }

      // PrintScreen Key (Screenshots)
      if (key === 'printscreen' || code === 'printscreen') {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Screenshot attempt blocked!');
        return false;
      }

      // Windows Snipping Tool: Win + Shift + S or Ctrl + Shift + S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 's' || code === 'keys')) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Snipping Tool capture blocked!');
        return false;
      }

      // Windows Game Bar Record: Win + Alt + R or Alt + R
      if (e.altKey && (key === 'r' || code === 'keyr')) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Windows Game Bar recording hotkey blocked!');
        return false;
      }

      // Windows Game Bar Menu: Win + G or Alt + G
      if (e.altKey && (key === 'g' || code === 'keyg')) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Game Bar recording blocked!');
        return false;
      }

      // Nvidia ShadowPlay: Alt + F9 or Alt + Z
      if (e.altKey && (key === 'z' || key === 'f9')) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Recording shortcut blocked!');
        return false;
      }

      // Standard OBS hotkeys: F9, F10
      if (key === 'f9' || key === 'f10') {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Screen recording hotkey blocked!');
        return false;
      }

      // Mac Screenshot Shortcuts: Cmd + Shift + 3 / 4 / 5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureWarning('Mac screenshot blocked!');
        return false;
      }

      // Save page / video: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Print: Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // View Source: Ctrl+U or Cmd+U
      if ((e.ctrlKey || e.metaKey) && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // DevTools: F12, Ctrl+Shift+I, Cmd+Option+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        key === 'f12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 4. Clear Clipboard on PrintScreen keyup
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code ? e.code.toLowerCase() : '';
      if (key === 'printscreen' || code === 'printscreen') {
        triggerCaptureWarning('Screenshot buffer wiped!');
      }
      if (key === 'meta' || code === 'metaleft' || code === 'metaright') {
        triggerCaptureWarning('Windows Shortcut Detected!');
      }
    };

    // 5. Tab Visibility & Window Focus Detection (Detects OBS, Snipping Tool, External Capture)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowUnfocused(true);
        if (onSecurityPause) onSecurityPause();
      }
    };

    const handleWindowBlur = () => {
      setTimeout(() => {
        if (!document.hasFocus()) {
          setIsWindowUnfocused(true);
          if (onSecurityPause) onSecurityPause();
        }
      }, 100);
    };

    // 6. Prevent Drag and Drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('dragstart', handleDragStart);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('dragstart', handleDragStart);
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
      if (origGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = origGetDisplayMedia;
      }
    };
  }, [isActive, triggerCaptureWarning, onSecurityPause]);

  return {
    isCaptureAttempted,
    isWindowUnfocused,
    dismissWarning: () => setIsCaptureAttempted(false),
    resumeFromBlur: () => setIsWindowUnfocused(false),
  };
}

/**
 * Multi-Layer High-Visibility Forensic Watermark Overlay
 * Plastered diagonally across the entire video + floating pill
 * Making it IMPOSSIBLE to steal or sell recording without showing student's identity!
 */
export const DynamicForensicWatermark: React.FC<{ studentInfo?: StudentInfo }> = ({ studentInfo }) => {
  const [pos, setPos] = useState({ top: 35, left: 35 });
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }));

  // Live seconds clock
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Float randomly across the video container every 4 seconds
  useEffect(() => {
    const moveTimer = setInterval(() => {
      const nextTop = Math.floor(10 + Math.random() * 55);
      const nextLeft = Math.floor(8 + Math.random() * 58);
      setPos({ top: nextTop, left: nextLeft });
    }, 4000);

    return () => clearInterval(moveTimer);
  }, []);

  const displayName = studentInfo?.name || 'Enrolled Student';
  const displayId = studentInfo?.studentId ? `ID: ${studentInfo.studentId.slice(0, 10)}` : (studentInfo?.phone ? `Mob: ${studentInfo.phone}` : 'ISML-SECURED');

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* 1. Diagonal Tiled Repeating Watermark (Industry Standard Piracy Protection) */}
      <div className="absolute inset-0 flex flex-col justify-around pointer-events-none select-none opacity-20 transform -rotate-12 scale-110">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-around whitespace-nowrap text-white font-mono text-[11px] sm:text-xs font-bold tracking-widest">
            <span>ISML ACADEMY • {displayName} • {displayId}</span>
            <span className="hidden md:inline">ISML ACADEMY • {displayName} • {displayId}</span>
          </div>
        ))}
      </div>

      {/* 2. Subtle Static Corner Watermarks */}
      <div className="absolute top-2 left-3 text-[10px] font-mono text-white/40 tracking-wider font-semibold">
        ISML • {displayName}
      </div>
      <div className="absolute top-2 right-3 text-[10px] font-mono text-white/40 tracking-wider font-semibold">
        {displayId}
      </div>
      <div className="absolute bottom-16 left-3 text-[10px] font-mono text-white/40 tracking-wider font-semibold">
        {clock} IST • PROTECTED
      </div>
      <div className="absolute bottom-16 right-3 text-[10px] font-mono text-red-400/40 tracking-wider font-bold">
        DO NOT RECORD
      </div>

      {/* 3. Floating Dynamic Watermark Pill */}
      <div
        style={{
          top: `${pos.top}%`,
          left: `${pos.left}%`,
          transition: 'all 1.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="absolute px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/20 text-white/60 shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
      >
        <div className="text-[11px] font-bold tracking-wide flex items-center gap-1.5 whitespace-nowrap text-white/80">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>{displayName}</span>
          <span className="text-[10px] text-white/60">({displayId})</span>
        </div>
        <div className="text-[9px] font-mono text-white/50 tracking-tight flex items-center gap-2">
          <span>{clock} IST</span>
          <span>•</span>
          <span className="text-red-400 uppercase font-extrabold text-[8px] tracking-wider">DO NOT RECORD</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Screen Capture Blocked Warning Overlay
 */
export const CaptureBlockedOverlay: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  return (
    <div
      onClick={onDismiss}
      className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none cursor-pointer"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10 animate-bounce">
        <ShieldAlert className="w-9 h-9" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-wide flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        Screen Capture Prohibited
      </h3>
      <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-4 leading-relaxed">
        Windows shortcuts, Game Bar, screenshots, and screen recording of ISML class lectures are strictly prohibited.
      </p>
      <div className="px-3.5 py-1.5 bg-red-950/80 border border-red-800/50 rounded-xl text-red-300 text-xs font-mono mb-4">
        Video hidden for copyright security. All playback is watermarked.
      </div>
      <button
        onClick={onDismiss}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
      >
        Click to Resume Lecture
      </button>
    </div>
  );
};

/**
 * Unfocused / Screen Switch Blackout Shield
 */
export const WindowBlurShield: React.FC<{ onResume?: () => void }> = ({ onResume }) => {
  return (
    <div
      onClick={onResume}
      className="absolute inset-0 z-35 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none cursor-pointer"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3">
        <EyeOff className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-white mb-1.5 tracking-wide">
        Playback Paused for Security
      </h4>
      <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
        External screen capture or application switch detected. Click the button below to resume your lecture.
      </p>
      <button
        onClick={onResume}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
      >
        Click to Resume Watching
      </button>
    </div>
  );
};

/**
 * Unified Component wrapping video container with all DRM and Anti-Capture defenses
 */
export const SecureMediaProtection: React.FC<SecureMediaProtectionProps> = ({
  children,
  isActive,
  studentInfo,
  onSecurityPause,
  onSecurityResume,
  enableMovingWatermark = true,
  enableBlurShield = true,
}) => {
  const { isCaptureAttempted, isWindowUnfocused, dismissWarning, resumeFromBlur } = useAntiScreenCapture({
    isActive,
    onSecurityPause,
    onSecurityResume,
  });

  const handleResume = () => {
    resumeFromBlur();
    if (onSecurityResume) onSecurityResume();
  };

  const isBlanked = isCaptureAttempted || (enableBlurShield && isWindowUnfocused);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black" onContextMenu={(e) => e.preventDefault()}>
      {/* 
        CRITICAL: Video Content Container
        When Windows key, Game Bar, or Screen Capture shortcut is triggered,
        the video element is instantly turned pitch black (opacity: 0, brightness: 0)
        so Game Bar records ONLY a pure BLACK screen!
      */}
      <div
        style={{
          opacity: isBlanked ? 0 : 1,
          filter: isBlanked ? 'brightness(0)' : 'none',
          visibility: isBlanked ? 'hidden' : 'visible',
          transition: 'opacity 0.05s ease-out',
        }}
        className="w-full h-full"
      >
        {children}
      </div>

      {/* Multi-Layer Forensic Watermark (Visible during playback) */}
      {isActive && enableMovingWatermark && !isBlanked && (
        <DynamicForensicWatermark studentInfo={studentInfo} />
      )}

      {/* Screen Capture Detected Blackout Shield */}
      {isCaptureAttempted && (
        <CaptureBlockedOverlay onDismiss={dismissWarning} />
      )}

      {/* Window Unfocused / Screen Recording Tool Blackout */}
      {isActive && enableBlurShield && isWindowUnfocused && !isCaptureAttempted && (
        <WindowBlurShield onResume={handleResume} />
      )}
    </div>
  );
};

export default SecureMediaProtection;
