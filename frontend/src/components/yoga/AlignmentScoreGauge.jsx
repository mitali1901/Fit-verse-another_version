import React from 'react';

export default function AlignmentScoreGauge({
  score = 78,
  statusText = "Good Alignment"
}) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const isGood = safeScore >= 70;

  // Semi-circle SVG calculation
  // Radius = 50, Arc length for 180 degrees = PI * 50 ≈ 157.08
  const radius = 50;
  const semiCircumference = Math.PI * radius;
  const strokeOffset = semiCircumference - (safeScore / 100) * semiCircumference;

  return (
    <div className="bg-white rounded-3xl border border-[#F0E6F7] p-5 shadow-card flex flex-col items-center justify-between">
      <h3 className="font-bold text-sm text-fitverse-dark self-start">Alignment Score</h3>

      {/* Semi-circular Gauge */}
      <div className="relative w-28 h-20 flex items-center justify-center my-1">
        <svg className="w-28 h-28 -rotate-180 transform overflow-visible" viewBox="0 0 120 120">
          {/* Background Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#E9F6E8"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${semiCircumference} ${semiCircumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={isGood ? "#22C55E" : "#F59E0B"}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${semiCircumference} ${semiCircumference}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Score Display */}
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-end">
          <span className={`text-xl font-black font-['Outfit'] tracking-tight ${isGood ? 'text-fitverse-green-success' : 'text-amber-500'}`}>
            {safeScore}%
          </span>
        </div>
      </div>

      {/* Status Label */}
      <div className="mt-1">
        <span className={`text-xs font-bold ${isGood ? 'text-fitverse-green-success' : 'text-amber-600'}`}>
          {statusText || (isGood ? "Good Alignment" : "Needs Improvement")}
        </span>
      </div>
    </div>
  );
}

