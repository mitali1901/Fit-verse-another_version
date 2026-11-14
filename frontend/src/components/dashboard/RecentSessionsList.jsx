import React from 'react';
import { Flower2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_RECENT = [
  {
    _id: "s1",
    pose_name: "Tree Pose",
    date: "Jan 20, 2025",
    duration_formatted: "5 min",
    score: 92,
    icon: "🧘"
  },
  {
    _id: "s2",
    pose_name: "Warrior Pose",
    date: "Jan 18, 2025",
    duration_formatted: "6 min",
    score: 85,
    icon: "🤺"
  },
  {
    _id: "s3",
    pose_name: "Downward Dog",
    date: "Jan 16, 2025",
    duration_formatted: "5 min",
    score: 88,
    icon: "🐕"
  }
];

export default function RecentSessionsList({ sessions = DEFAULT_RECENT }) {
  const navigate = useNavigate();
  const displaySessions = (sessions && sessions.length > 0) ? sessions.slice(0, 3) : DEFAULT_RECENT;

  return (
    <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
            <Flower2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-fitverse-dark">Recent Yoga Sessions</h3>
        </div>
        <button
          onClick={() => navigate('/studio')}
          className="text-xs font-bold text-fitverse-purple hover:text-fitverse-purple-hover flex items-center gap-1 group transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Sessions Items */}
      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {displaySessions.map((session, index) => {
          const score = session.score || 85;
          return (
            <div
              key={session._id || index}
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF6FD] transition-colors border border-transparent hover:border-[#F2E8FA]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fitverse-lavender flex items-center justify-center text-lg shadow-xs">
                  {session.icon || "🧘"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-fitverse-dark">{session.pose_name}</h4>
                  <p className="text-[11px] text-fitverse-muted">
                    {session.date || "Recent"} · {session.duration_formatted || `${Math.round((session.duration || 300) / 60)} min`}
                  </p>
                </div>
              </div>

              {/* Percentage Green Badge */}
              <div className="px-2.5 py-1 rounded-full bg-fitverse-mint text-fitverse-green-success font-black text-xs">
                {score}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

