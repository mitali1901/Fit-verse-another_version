import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, Loader2, Video, CheckCircle2 } from 'lucide-react';
import { getPoseLandmarker } from '../../utils/poseDetection';
import { evaluatePose } from '../../utils/poseEvaluation';
import { drawPoseSkeleton } from '../../utils/correctionRenderer';

/**
 * StudioVideoView
 * 
 * Reliable webcam & pose detection component:
 * 1. Automatically requests camera permission on mount with timeout protection.
 * 2. Distinct lifecycle states: 'requesting' | 'initializing' | 'loading_model' | 'active' | 'error' | 'idle'.
 * 3. Graceful constraint fallback (ideal 720p -> basic video).
 * 4. Separate handling for NotAllowedError, NotFoundError, NotReadableError, OverconstrainedError, and timeouts.
 * 5. Stable callbacks via useRef to prevent React StrictMode duplicate camera teardown cycles.
 * 6. Live green/red skeleton overlay rendered on HTML5 canvas matching real-time user movements.
 */
export default function StudioVideoView({
  selectedPose,
  onEvaluationUpdate,
  isSessionActive,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationFrameId = useRef(null);

  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);

  // Keep latest props in refs to avoid restarting inference on prop changes
  const onEvaluationUpdateRef = useRef(onEvaluationUpdate);
  onEvaluationUpdateRef.current = onEvaluationUpdate;
  const selectedPoseRef = useRef(selectedPose);
  selectedPoseRef.current = selectedPose;

  // Status states: 'requesting' | 'initializing' | 'loading_model' | 'active' | 'error' | 'idle'
  const [cameraStatus, setCameraStatus] = useState('requesting');
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  // ── Stop Camera & Cleanup ────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    if (isMountedRef.current) {
      setCameraStatus('idle');
    }
  }, []);

  // ── Main Inference Loop ──────────────────────────────────────────────────
  const startInferenceLoop = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    let lastTimestamp = 0;

    function renderFrame() {
      if (!isMountedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const landmarker = landmarkerRef.current;

      if (canvas && container && video) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');

        // Only process frames when video has playable data and is playing
        if (video.readyState >= 2 && video.videoWidth > 0 && !video.paused) {
          let landmarks = null;

          if (landmarker) {
            try {
              const now = performance.now();
              const timestampMs = Math.max(now, lastTimestamp + 1);
              lastTimestamp = timestampMs;
              const results = landmarker.detectForVideo(video, timestampMs);
              if (results?.landmarks?.length > 0) {
                landmarks = results.landmarks[0];
              }
            } catch (err) {
              // Frame dropped or transient skip
            }
          }

          if (landmarks && landmarks.length > 0) {
            const currentPose = selectedPoseRef.current;
            const evalResult = evaluatePose(currentPose?.id || 'warrior_ii', landmarks);
            drawPoseSkeleton(ctx, landmarks, evalResult, width, height);

            if (onEvaluationUpdateRef.current) {
              onEvaluationUpdateRef.current(evalResult);
            }
          } else {
            ctx.clearRect(0, 0, width, height);
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(renderFrame);
    }

    animationFrameId.current = requestAnimationFrame(renderFrame);
  }, []);

  // ── Start Camera Pipeline ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    // Reset error state and clean up previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus('requesting');
    setErrorMessage(null);
    setErrorDetails(null);

    // 1. Check browser mediaDevices API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Camera access is not supported by your browser.");
      setErrorDetails("Please open FitVerse in Google Chrome, Microsoft Edge, or Firefox.");
      setCameraStatus('error');
      isInitializingRef.current = false;
      return;
    }

    // 2. Request userMedia with timeout protection
    let stream = null;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('CAMERA_TIMEOUT')), 12000);
      });

      const getStream = async () => {
        try {
          // Attempt optimal 720p constraints first
          return await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (constraintErr) {
          console.warn("[FitVerse Camera] Ideal constraints failed, falling back to basic video:", constraintErr);
          // Fallback to basic unconstrained video
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      };

      stream = await Promise.race([getStream(), timeoutPromise]);
    } catch (err) {
      console.error("[FitVerse Camera] getUserMedia error:", err);
      if (!isMountedRef.current) {
        isInitializingRef.current = false;
        return;
      }

      let msg = "Could not access camera.";
      let details = "Please ensure your webcam is connected and enabled.";

      if (err.message === 'CAMERA_TIMEOUT') {
        msg = "Camera permission request timed out.";
        details = "Please look at the camera/lock icon in your browser address bar and grant camera access, then click 'Retry Camera'.";
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Camera permission was denied.";
        details = "Click the camera or lock icon in your address bar, set Camera to 'Allow', and click 'Retry Camera'.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No webcam device was found.";
        details = "Please connect a webcam to your computer and click 'Retry Camera'.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = "Camera is currently in use by another app.";
        details = "Close other applications (like Zoom, Teams, or other browser tabs) using the camera, then click 'Retry Camera'.";
      } else if (err.name === 'OverconstrainedError') {
        msg = "Requested camera resolution is not supported.";
        details = "Your camera does not support the requested video mode.";
      } else if (err.name === 'AbortError') {
        msg = "Camera initialization was aborted.";
        details = "The request was interrupted. Please click 'Retry Camera'.";
      } else if (err.name === 'SecurityError') {
        msg = "Camera access blocked by browser security policy.";
        details = "Webcam access requires a secure origin (HTTPS or localhost).";
      } else if (err.message) {
        msg = err.message;
      }

      setErrorMessage(msg);
      setErrorDetails(details);
      setCameraStatus('error');
      isInitializingRef.current = false;
      return;
    }

    if (!isMountedRef.current) {
      stream.getTracks().forEach(t => t.stop());
      isInitializingRef.current = false;
      return;
    }

    streamRef.current = stream;

    // 3. Attach stream to video element
    setCameraStatus('initializing');
    const video = videoRef.current;
    if (!video) {
      setErrorMessage("Video display element is not ready.");
      setCameraStatus('error');
      isInitializingRef.current = false;
      return;
    }

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    // 4. Wait for metadata & start video playback
    try {
      await new Promise((resolve) => {
        if (video.readyState >= 1 && video.videoWidth > 0) {
          return resolve();
        }
        const timer = setTimeout(() => {
          cleanup();
          resolve(); // Continue even if event fired earlier
        }, 4000);
        const onLoaded = () => {
          cleanup();
          resolve();
        };
        function cleanup() {
          clearTimeout(timer);
          video.removeEventListener('loadedmetadata', onLoaded);
        }
        video.addEventListener('loadedmetadata', onLoaded);
      });

      try {
        await video.play();
      } catch (playErr) {
        // Autoplay may be allowed on user interaction
      }

      // Ensure videoWidth and videoHeight are positive
      if (video.videoWidth === 0) {
        await new Promise((resolve) => {
          const poll = setInterval(() => {
            if (video.videoWidth > 0) {
              clearInterval(poll);
              resolve();
            }
          }, 50);
          setTimeout(() => { clearInterval(poll); resolve(); }, 3000);
        });
      }
    } catch (playErr) {
      console.warn("[FitVerse Camera] Playback warning:", playErr);
    }

    if (!isMountedRef.current) {
      isInitializingRef.current = false;
      return;
    }

    // 5. Load MediaPipe Pose Landmarker
    setCameraStatus('loading_model');
    try {
      const lm = await getPoseLandmarker();
      if (!isMountedRef.current) {
        isInitializingRef.current = false;
        return;
      }

      if (!lm) {
        throw new Error("Could not initialize MediaPipe Pose Landmarker model.");
      }
      landmarkerRef.current = lm;
    } catch (modelErr) {
      console.error("[FitVerse Vision] Model load error:", modelErr);
      if (!isMountedRef.current) {
        isInitializingRef.current = false;
        return;
      }
      setErrorMessage("Could not load AI Pose Landmarker model.");
      setErrorDetails("Please check your internet connection to download MediaPipe models.");
      setCameraStatus('error');
      isInitializingRef.current = false;
      return;
    }

    // 6. Camera & Model ready!
    if (isMountedRef.current) {
      setCameraStatus('active');
      isInitializingRef.current = false;
      startInferenceLoop();
    }
  }, [startInferenceLoop]);

  // ── Auto-start camera ONCE on mount ──────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, []); // Run on mount only!

  // ── Render ───────────────────────────────────────────────────────────────
  const poseName = selectedPose?.name || 'Warrior II Pose';

  return (
    <div className="flex flex-col space-y-3">
      {/* Main Camera Container */}
      <div
        ref={containerRef}
        className="relative w-full bg-[#1a1224] rounded-3xl overflow-hidden border-2 border-[#EADDF5] select-none"
        style={{ aspectRatio: '16/10' }}
      >
        {/* ── LIVE VIDEO ELEMENT ── */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            cameraStatus === 'active' || cameraStatus === 'loading_model' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* ── CANVAS OVERLAY (Real-time Green & Red Skeleton Overlay) ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* ── 1. REQUESTING STATE: Waiting for browser permission ── */}
        {cameraStatus === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#1a1224] to-[#2d1b4a] z-20 p-6 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-fitverse-lavender/20 flex items-center justify-center border-2 border-fitverse-purple/40">
              <Loader2 className="w-8 h-8 text-fitverse-purple animate-spin" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <p className="text-white font-bold text-base">Requesting Camera Permission...</p>
              <p className="text-white/60 text-xs leading-relaxed">
                Please click <strong className="text-white">Allow</strong> in your browser prompt (top address bar) to enable live pose tracking.
              </p>
            </div>
          </div>
        )}

        {/* ── 2. INITIALIZING STATE: Video stream starting ── */}
        {cameraStatus === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1a1224] to-[#2d1b4a] z-20 text-center animate-in fade-in duration-150">
            <Loader2 className="w-8 h-8 text-fitverse-purple animate-spin" />
            <p className="text-white font-bold text-sm">Initializing Camera Feed...</p>
          </div>
        )}

        {/* ── 3. LOADING MODEL STATE: Floating bottom badge while video is live ── */}
        {cameraStatus === 'loading_model' && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/75 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-fitverse-purple" />
            <span>Loading AI Pose Model...</span>
          </div>
        )}

        {/* ── 4. ERROR STATE: Clear error explanation with Retry button ── */}
        {cameraStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#1a1224] to-[#2d1b4a] z-20 p-6 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center border-2 border-red-500/40">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <p className="text-white font-bold text-base">{errorMessage || "Camera Access Error"}</p>
              <p className="text-red-300/80 text-xs leading-relaxed">{errorDetails}</p>
            </div>
            <button
              onClick={startCamera}
              className="mt-1 px-5 py-2.5 rounded-xl bg-fitverse-purple hover:bg-[#9256C8] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* ── 5. IDLE STATE: Camera off placeholder ── */}
        {cameraStatus === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-[#1a1224] to-[#2d1b4a] z-20 p-6 text-center animate-in fade-in duration-150">
            <div className="w-20 h-20 rounded-full bg-fitverse-lavender/20 flex items-center justify-center border-2 border-fitverse-purple/30">
              <CameraOff className="w-10 h-10 text-fitverse-purple/60" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <p className="text-white font-bold text-base">Camera is Off</p>
              <p className="text-white/50 text-xs leading-relaxed">
                Click below to start live pose detection for <span className="text-fitverse-purple font-semibold">{poseName}</span>.
              </p>
            </div>
            <button
              onClick={startCamera}
              className="px-6 py-3 rounded-2xl bg-fitverse-purple hover:bg-[#9256C8] text-white text-sm font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          </div>
        )}

        {/* ── 6. ACTIVE STATE: Live Badges ── */}
        {cameraStatus === 'active' && (
          <>
            {/* Top-left: Live Pose Detection active pill */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-md">
              <span className="w-2 h-2 rounded-full bg-fitverse-green-success animate-pulse"></span>
              <span>Live Pose Detection</span>
            </div>

            {/* Top-right: Quick stop camera button */}
            <button
              onClick={stopCamera}
              title="Stop Camera"
              className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white transition-all cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Controls & Legend */}
      <div className="flex items-center justify-between gap-4 py-2.5 px-4 rounded-2xl bg-white border border-[#F0E6F7] shadow-xs">
        {/* Alignment Legend */}
        <div className="flex items-center gap-5 text-xs font-semibold text-fitverse-dark">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fitverse-green-success inline-block"></span>
            <span>= Aligned (Correct)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fitverse-error inline-block"></span>
            <span>= Needs Correction</span>
          </div>
        </div>

        {/* Camera Toggle Button */}
        {cameraStatus === 'active' ? (
          <button
            onClick={stopCamera}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-fitverse-error hover:bg-red-600 transition-colors cursor-pointer"
          >
            <CameraOff className="w-3.5 h-3.5" />
            <span>Stop Camera</span>
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={cameraStatus === 'requesting' || cameraStatus === 'initializing'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-fitverse-purple hover:bg-[#9256C8] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{cameraStatus === 'error' ? 'Retry Camera' : 'Start Camera'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
