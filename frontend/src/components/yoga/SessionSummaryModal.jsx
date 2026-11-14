import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, Clock, CheckCircle2, TrendingUp, X, Sparkles, Loader2 } from 'lucide-react';

export default function SessionSummaryModal({
  isOpen,
  onClose,
  sessionStats,
  selectedPose,
  onSaveSession,
  onSuccessNavigate
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSavedSuccess(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore confetti error
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSaveSession) {
        await onSaveSession();
      }
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccessNavigate) {
          onSuccessNavigate();
        }
      }, 1200);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const mins = Math.floor((sessionStats?.duration || 156) / 60);
  const secs = (sessionStats?.duration || 156) % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const avgScore = sessionStats?.averageScore || 78;
  const bestScore = sessionStats?.bestScore || 84;
  const corrections = sessionStats?.correctionCount || 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-[#F0E6F7] shadow-2xl max-w-md w-full p-6 space-y-5 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy / Lotus Header */}
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-fitverse-mint to-[#C2E8BA] flex items-center justify-center shadow-md">
          <Award className="w-8 h-8 text-fitverse-green-success" />
        </div>

        <div>
          <h3 className="text-2xl font-black text-fitverse-dark tracking-tight">Session Complete!</h3>
          <p className="text-xs text-fitverse-muted mt-1">
            Fantastic effort practicing {selectedPose?.name || "Warrior II Pose"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 bg-[#FCFAFD] p-4 rounded-2xl border border-[#F2E8FA]">
          <div className="space-y-1">
            <div className="flex items-center justify-center text-fitverse-muted">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-semibold text-fitverse-muted">Duration</p>
            <h4 className="text-base font-black text-fitverse-dark font-['Outfit']">{timeFormatted}</h4>
          </div>

          <div className="space-y-1 border-x border-[#F2E8FA]">
            <div className="flex items-center justify-center text-fitverse-green-success">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-semibold text-fitverse-muted">Avg. Score</p>
            <h4 className="text-base font-black text-fitverse-green-success font-['Outfit']">{avgScore}%</h4>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center text-fitverse-purple">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-semibold text-fitverse-muted">Best Score</p>
            <h4 className="text-base font-black text-fitverse-purple font-['Outfit']">{bestScore}%</h4>
          </div>
        </div>

        {/* Motivational Tip */}
        <div className="text-left bg-fitverse-lavender/50 border border-fitverse-lavender p-3.5 rounded-2xl text-xs text-fitverse-dark">
          <p className="font-semibold text-fitverse-purple flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Coach Feedback
          </p>
          <p className="text-fitverse-muted">
            Your arm extension was steady! In your next session, focus on holding the 90° front knee bend for deeper hip strengthening.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving || savedSuccess}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              savedSuccess
                ? "bg-fitverse-green-success text-white"
                : "bg-gradient-to-r from-fitverse-purple to-[#8F52C6] hover:from-[#9B64CB] hover:to-[#8145B7] text-white"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Progress Tracker...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>Save Session & Return to Home</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

