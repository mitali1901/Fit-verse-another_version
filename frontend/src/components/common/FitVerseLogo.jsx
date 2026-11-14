import React from 'react';

/**
 * FitVerseLogo
 * Official brand identity component using the user-provided FitVerse lotus logo.
 * Preserves original image proportions without distortion.
 */
export default function FitVerseLogo({
  size = 'md',
  showText = true,
  showSubtitle = true,
  subtitle = 'AI Yoga & Fitness Companion',
  className = '',
  iconOnly = false,
}) {
  // Sizing definitions preserving exact lotus proportions (259:219 aspect ratio)
  const sizeMap = {
    xs: {
      img: 'h-6 w-auto max-w-[28px]',
      container: 'p-1 rounded-lg',
      fitText: 'text-lg',
      verseText: 'text-lg',
      subText: 'text-[9px]',
    },
    sm: {
      img: 'h-8 w-auto max-w-[38px]',
      container: 'p-1 rounded-xl',
      fitText: 'text-xl',
      verseText: 'text-xl',
      subText: 'text-[10px]',
    },
    md: {
      img: 'h-10 w-auto max-w-[48px]',
      container: 'p-1.5 rounded-2xl',
      fitText: 'text-2xl',
      verseText: 'text-2xl',
      subText: 'text-[11px]',
    },
    lg: {
      img: 'h-14 w-auto max-w-[66px]',
      container: 'p-2 rounded-2xl',
      fitText: 'text-3xl',
      verseText: 'text-3xl',
      subText: 'text-xs',
    },
    xl: {
      img: 'h-18 w-auto max-w-[86px]',
      container: 'p-2.5 rounded-3xl',
      fitText: 'text-4xl',
      verseText: 'text-4xl',
      subText: 'text-sm',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const lotusMark = (
    <div
      className={`bg-gradient-to-tr from-[#F8F1FD] via-[#F1E4FA] to-[#EBD7F8] flex items-center justify-center shrink-0 shadow-sm border border-[#E9D6F7] ${currentSize.container}`}
    >
      <img
        src="/assets/fitverse_lotus.png"
        alt="FitVerse Official Lotus Logo"
        className={`${currentSize.img} object-contain select-none transition-transform duration-300 hover:scale-105`}
        style={{ aspectRatio: '259 / 219' }}
      />
    </div>
  );

  if (iconOnly || !showText) {
    return <div className={`inline-flex items-center ${className}`}>{lotusMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {lotusMark}
      <div className="flex flex-col justify-center">
        <div className="flex items-center leading-none tracking-tight">
          <span
            className={`font-black text-fitverse-dark ${currentSize.fitText}`}
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Fit
          </span>
          <span
            className={`font-black bg-gradient-to-r from-fitverse-purple via-[#9658CE] to-[#7E3EB6] bg-clip-text text-transparent ${currentSize.verseText}`}
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Verse
          </span>
        </div>
        {showSubtitle && subtitle && (
          <p className={`font-medium text-fitverse-muted tracking-tight mt-1 leading-tight ${currentSize.subText}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
