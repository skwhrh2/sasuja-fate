import React from 'react';

interface SasujaLogoProps {
  className?: string;
  size?: number;
}

export const SasujaLogo: React.FC<SasujaLogoProps> = ({ className = "w-10 h-10", size = 40 }) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]"
      >
        <defs>
          <linearGradient id="goldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id="goldInner" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Base Circle with Dark Slate Gradient */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGlow)" stroke="url(#goldOuter)" strokeWidth="2.5" />
        
        {/* Inner Decorative Ring */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#goldInner)" strokeWidth="1" strokeDasharray="2 3" opacity="0.8" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="url(#goldOuter)" strokeWidth="1" opacity="0.6" />

        {/* 8 Trigrams (팔괘 Symbols Outer Ring) */}
        {/* Top: 건 ☰ */}
        <g stroke="url(#goldOuter)" strokeWidth="1.5" strokeLinecap="round">
          <line x1="43" y1="16" x2="57" y2="16" />
          <line x1="43" y1="18.5" x2="57" y2="18.5" />
          <line x1="43" y1="21" x2="57" y2="21" />

          {/* Bottom: 곤 ☷ */}
          <line x1="43" y1="79" x2="48.5" y2="79" /><line x1="51.5" y1="79" x2="57" y2="79" />
          <line x1="43" y1="81.5" x2="48.5" y2="81.5" /><line x1="51.5" y1="81.5" x2="57" y2="81.5" />
          <line x1="43" y1="84" x2="48.5" y2="84" /><line x1="51.5" y1="84" x2="57" y2="84" />

          {/* Left: 감 ☵ */}
          <line x1="16" y1="47.5" x2="21.5" y2="47.5" /><line x1="24.5" y1="47.5" x2="30" y2="47.5" />
          <line x1="16" y1="50" x2="30" y2="50" />
          <line x1="16" y1="52.5" x2="21.5" y2="52.5" /><line x1="24.5" y1="52.5" x2="30" y2="52.5" />

          {/* Right: 리 ☲ */}
          <line x1="70" y1="47.5" x2="84" y2="47.5" />
          <line x1="70" y1="50" x2="75.5" y2="50" /><line x1="78.5" y1="50" x2="84" y2="50" />
          <line x1="70" y1="52.5" x2="84" y2="52.5" />
        </g>

        {/* Center Taegeuk (태극 / Yin-Yang Lotus Emblem) */}
        <g transform="translate(50,50)">
          {/* S-curve Taegeuk */}
          <path
            d="M 0,-18 A 18 18 0 0 1 0,18 A 9 9 0 0 1 0,0 A 9 9 0 0 0 0,-18 Z"
            fill="url(#goldOuter)"
          />
          <path
            d="M 0,18 A 18 18 0 0 1 0,-18 A 9 9 0 0 1 0,0 A 9 9 0 0 0 0,18 Z"
            fill="#020617"
            stroke="url(#goldInner)"
            strokeWidth="0.8"
          />
          {/* Small Yin/Yang dots */}
          <circle cx="0" cy="-9" r="2.5" fill="#020617" />
          <circle cx="0" cy="9" r="2.5" fill="url(#goldInner)" />

          {/* Lotus Petal Embellishments (Oriental Craft) */}
          <path
            d="M 0,-24 C -6,-20 -10,-12 0,0 C 10,-12 6,-20 0,-24 Z"
            fill="url(#goldInner)"
            opacity="0.3"
          />
        </g>

        {/* Four Corner Stars / Sparkles */}
        <circle cx="22" cy="22" r="1.5" fill="url(#goldInner)" />
        <circle cx="78" cy="22" r="1.5" fill="url(#goldInner)" />
        <circle cx="22" cy="78" r="1.5" fill="url(#goldInner)" />
        <circle cx="78" cy="78" r="1.5" fill="url(#goldInner)" />
      </svg>
    </div>
  );
};
