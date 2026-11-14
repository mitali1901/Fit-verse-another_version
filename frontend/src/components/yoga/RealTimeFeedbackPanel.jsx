import React from 'react';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RealTimeFeedbackPanel({ feedbackList = [] }) {
  const displayItems = feedbackList && feedbackList.length > 0 ? feedbackList : [
    { id: "front_knee", text: "Adjust your front knee.", passed: false, isWarning: true },
    { id: "arms", text: "Keep your arms parallel to the floor.", passed: true, isWarning: false },
    { id: "back", text: "Keep your back straight.", passed: true, isWarning: false },
    { id: "stance", text: "Maintain a stable stance.", passed: true, isWarning: false }
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#F0E6F7] p-5 shadow-card flex flex-col justify-between">
      {/* Title */}
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-7 h-7 rounded-lg bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
          <Target className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-sm text-fitverse-dark">Real-time Feedback</h3>
      </div>

      {/* Dynamic Feedback Items List */}
      <div className="space-y-2 flex-1">
        {displayItems.map((item, idx) => {
          if (item.isWarning || !item.passed) {
            return (
              <div
                key={item.id || idx}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FEECEC] border border-[#FCD2D2] text-fitverse-error animate-in fade-in duration-200"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-fitverse-error shrink-0"></div>
                <span className="text-xs font-bold leading-tight">{item.text}</span>
              </div>
            );
          }

          return (
            <div
              key={item.id || idx}
              className="flex items-center gap-2.5 p-2 rounded-xl text-fitverse-dark hover:bg-gray-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-fitverse-green-success shrink-0" />
              <span className="text-xs font-semibold leading-tight">{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

