import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function AICoachCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-base text-fitverse-dark">AI Fitness Coach</h3>
      </div>

      {/* Robot Avatar + Speech Bubble Container */}
      <div className="flex items-center gap-4 my-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fitverse-lavender to-[#E4D1F7] flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-purple-100">
          <img
            src="/assets/ai_coach_robot.svg"
            alt="AI Coach Robot"
            className="w-full h-full object-contain p-1"
          />
        </div>

        {/* Speech Bubble */}
        <div className="flex-1 bg-[#FAF6FD] border border-[#F0E6F7] rounded-2xl p-3.5 relative text-xs font-medium text-fitverse-dark leading-relaxed">
          <div className="absolute -left-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-[#FAF6FD] border-b-[6px] border-b-transparent"></div>
          You're doing great! Try a 10-minute yoga session today to move closer to your weekly goal. 💪
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-3">
        <button
          onClick={() => navigate('/assistant')}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-fitverse-purple to-[#8F52C6] hover:from-[#9D66D4] hover:to-[#7E3EB6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all group cursor-pointer"
        >
          <span>Chat with AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
