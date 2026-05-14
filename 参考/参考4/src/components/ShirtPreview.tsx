import React from 'react';
import { CollarType, DesignState } from '../types';
import { PATTERNS } from '../data/mockData';

interface Props {
  design: DesignState;
  view?: 'front' | 'back';
}

export const ShirtPreview: React.FC<Props> = ({ design, view = 'front' }) => {
  const selectedPattern = PATTERNS.find(p => p.id === design.patternId) || PATTERNS[0];
  
  // Pattern scaling based on design state
  const patternScale = design.patternSize * 100;

  return (
    <div className="relative w-full aspect-square flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full max-w-[400px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="shirtPattern"
            patternUnits="userSpaceOnUse"
            width={patternScale}
            height={patternScale}
          >
            <image
              href={selectedPattern.url}
              x="0"
              y="0"
              width={patternScale}
              height={patternScale}
              preserveAspectRatio="xMidYMid slice"
              opacity={design.patternDensity}
            />
          </pattern>
        </defs>

        {/* Body of the shirt */}
        <path
          d="M100,80 L300,80 L320,380 L80,380 Z"
          fill={design.baseColor}
        />
        <path
          d="M100,80 L300,80 L320,380 L80,380 Z"
          fill="url(#shirtPattern)"
        />

        {/* Sleeves */}
        <path
          d="M100,80 L40,150 L60,180 L100,140 Z"
          fill={design.baseColor}
        />
        <path
          d="M100,80 L40,150 L60,180 L100,140 Z"
          fill="url(#shirtPattern)"
        />
        
        <path
          d="M300,80 L360,150 L340,180 L300,140 Z"
          fill={design.baseColor}
        />
        <path
          d="M300,80 L360,150 L340,180 L300,140 Z"
          fill="url(#shirtPattern)"
        />

        {/* Collar */}
        {design.collar === CollarType.STANDARD && (
          <path
            d="M150,80 Q200,60 250,80 L230,100 Q200,90 170,100 Z"
            fill={design.accentColor || design.baseColor}
            stroke="#000"
            strokeWidth="0.5"
          />
        )}
        {design.collar === CollarType.MAO && (
          <path
            d="M170,80 Q200,75 230,80 L230,95 Q200,90 170,95 Z"
            fill={design.accentColor || design.baseColor}
            stroke="#000"
            strokeWidth="0.5"
          />
        )}
        
        {/* Placket / Buttons */}
        <line x1="200" y1="100" x2="200" y2="380" stroke="#000" strokeWidth="1" opacity="0.3" />
        <circle cx="200" cy="140" r="3" fill="#fff" stroke="#000" strokeWidth="0.5" />
        <circle cx="200" cy="180" r="3" fill="#fff" stroke="#000" strokeWidth="0.5" />
        <circle cx="200" cy="220" r="3" fill="#fff" stroke="#000" strokeWidth="0.5" />
        <circle cx="200" cy="260" r="3" fill="#fff" stroke="#000" strokeWidth="0.5" />
        <circle cx="200" cy="300" r="3" fill="#fff" stroke="#000" strokeWidth="0.5" />

        {/* Logo */}
        {design.logoPosition === 'left-chest' && (
          <rect x="230" y="140" width="15" height="15" fill="#333" rx="2" />
        )}

        {/* Labels */}
        <text x="200" y="30" textAnchor="middle" className="text-[10px] font-mono fill-gray-400 uppercase tracking-widest">
          {view.toUpperCase()} VIEW
        </text>
      </svg>
    </div>
  );
};
