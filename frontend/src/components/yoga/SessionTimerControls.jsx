import React from 'react';
import { Clock, Play, Pause, Square, Upload } from 'lucide-react';

export default function SessionTimerControls({
  sessionSeconds = 156, // 02:36
  targetSeconds = 300,  // 05:00
  isActive = false,
  isPaused = false,
  onStart,
  onPause,
  onEnd,
  onOpenUpload
}) {
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Timers Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Session Time */}
        <div className="bg-white rounded-2xl border border-[#F0E6F7] p-3.5 flex items-center gap-3 shadow-card">
          <div className="w-9 h-9 rounded-xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-fitverse-muted">Session Time</p>
            <h4 className="text-xl font-black text-fitverse-dark tracking-tight font-['Outfit']">
              {formatTime(sessionSeconds)}
            </h4>
          </div>
        </div>

        {/* Target Time */}
        <div className="bg-white rounded-2xl border border-[#F0E6F7] p-3.5 flex items-center gap-3 shadow-card">
          <div className="w-9 h-9 rounded-xl bg-fitverse-mint flex items-center justify-center text-fitverse-green-success">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-fitverse-muted">Target Time</p>
            <h4 className="text-xl font-black text-fitverse-dark tracking-tight font-['Outfit']">
              {formatTime(targetSeconds)}
            </h4>
          </div>
        </div>
      </div>

      {/* Buttons Row matching reference image */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Start / Resume */}
        <button
          onClick={onStart}
          className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isActive && !isPaused
              ? "bg-[#E9F7E8] text-fitverse-green-success cursor-default"
              : "bg-fitverse-green hover:bg-[#97cf89] text-fitverse-dark font-black"
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isActive && isPaused ? "Resume" : "Start Session"}</span>
        </button>

        {/* Pause */}
        <button
          onClick={onPause}
          disabled={!isActive}
          className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
            isActive
              ? "bg-fitverse-lavender hover:bg-[#E8D4F7] text-fitverse-purple border-fitverse-purple/30"
              : "bg-gray-100 text-gray-400 border-transparent cursor-not-allowed"
          }`}
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
          <span>Pause</span>
        </button>

        {/* End Session */}
        <button
          onClick={onEnd}
          disabled={!isActive && sessionSeconds === 0}
          className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
            isActive || sessionSeconds > 0
              ? "bg-white hover:bg-red-50 text-fitverse-purple hover:text-fitverse-error border-[#E8D4F7] hover:border-red-200"
              : "bg-gray-100 text-gray-400 border-transparent cursor-not-allowed"
          }`}
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>End Session</span>
        </button>

        {/* Upload Photo */}
        <button
          onClick={onOpenUpload}
          className="py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 bg-white hover:bg-[#FAF5FD] text-fitverse-purple border border-[#E8D4F7] transition-all shadow-xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Photo</span>
        </button>
      </div>
    </div>
  );
}

