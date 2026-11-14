import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomeBanner({ userName = "User" }) {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F4EAFB] via-[#EFE2F9] to-[#E9DAF5] border border-[#E9D6F7] p-7 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-card min-h-[180px]">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#DEC5F0] opacity-20 translate-x-20 -translate-y-20 pointer-events-none" />
      <div className="absolute bottom-0 right-32 w-32 h-32 rounded-full bg-[#C9A0DC] opacity-15 translate-y-10 pointer-events-none" />

      {/* Left Text & CTA */}
      <div className="z-10 max-w-sm space-y-3">
        <div className="flex items-center gap-2 text-fitverse-purple">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wide uppercase">AI Yoga & Fitness</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-fitverse-dark tracking-tight leading-tight">
          Hello, <span className="text-fitverse-purple">{userName}</span>! 👋
        </h2>
        <p className="text-fitverse-muted text-sm md:text-base font-medium leading-relaxed">
          Stay consistent, stay healthier with FitVerse.
        </p>
        <div className="pt-1">
          <button
            onClick={() => navigate('/studio')}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-fitverse-purple to-[#9256C8] hover:from-[#9B64CB] hover:to-[#8145B7] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Start Yoga Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Yoga Practice Image */}
      <div className="relative mt-6 md:mt-0 flex items-center justify-center shrink-0">
        <div
          className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 aspect-square rounded-2xl overflow-hidden shadow-sm border border-[#E9D6F7] p-1.5 flex items-center justify-center select-none"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <img
            src="/assets/fitverse_yoga_home.webp"
            alt="Yoga Practice"
            className="w-full h-full object-contain rounded-xl select-none"
          />
        </div>
      </div>
    </div>
  );
}
