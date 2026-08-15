import React from 'react';
import { CollarType, LogoPosition } from '../types';

interface ShirtPreviewProps {
  color: string;
  patternUrl?: string;
  patternScale?: number;
  patternOpacity?: number;
  collarType: CollarType;
  logoPosition: LogoPosition;
  buttonType: string;
  className?: string;
}

export const ShirtPreview: React.FC<ShirtPreviewProps> = ({
  color,
  patternUrl,
  patternScale = 1,
  patternOpacity = 1,
  collarType,
  logoPosition,
  buttonType,
  className
}) => {
  // Simplified shirt path for a short-sleeve button-down
  const shirtPath = "M 100,50 L 150,50 L 180,80 L 180,150 L 150,150 L 150,300 L 50,300 L 50,150 L 20,150 L 20,80 L 50,50 Z";
  
  // More detailed paths
  const bodyPath = "M 100 80 L 300 80 C 310 80 320 85 330 95 L 380 145 C 390 155 390 170 380 180 L 340 220 L 340 500 L 60 500 L 60 220 L 20 180 C 10 170 10 155 20 145 L 70 95 C 80 85 90 80 100 80 Z";
  const collarPath = collarType === 'OpenCollar' 
    ? "M 160 80 L 200 120 L 240 80" 
    : "M 140 80 L 200 60 L 260 80 L 200 100 Z";
  
  const sleeveLeft = "M 100 80 L 20 180 L 60 220 L 100 180 Z";
  const sleeveRight = "M 300 80 L 380 180 L 340 220 L 300 180 Z";
  
  const buttonPath = (y: number) => `M 195 ${y} A 5 5 0 1 0 205 ${y} A 5 5 0 1 0 195 ${y}`;

  return (
    <div className={`relative aspect-square flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden ${className}`}>
      <svg viewBox="0 0 400 550" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="shirtPattern" x="0" y="0" width={100 * patternScale} height={100 * patternScale} patternUnits="userSpaceOnUse">
             <image href={patternUrl || "https://www.transparenttextures.com/patterns/fabric.png"} x="0" y="0" width={100 * patternScale} height={100 * patternScale} />
          </pattern>
          <mask id="shirtMask">
            <path d={bodyPath} fill="white" />
          </mask>
        </defs>

        {/* Shadow layer */}
        <path d={bodyPath} fill="black" opacity="0.1" transform="translate(4,4)" />

        {/* Base Color */}
        <path d={bodyPath} fill={color} />

        {/* Pattern Layer */}
        <path d={bodyPath} fill="url(#shirtPattern)" opacity={patternOpacity} />

        {/* Details: Placket */}
        <rect x="195" y="100" width="10" height="400" fill="rgba(0,0,0,0.1)" />

        {/* Buttons */}
        <g fill={buttonType === 'Wood' ? '#8B4513' : buttonType === 'Pearl' ? '#F5F5F5' : '#333'}>
          <circle cx="200" cy="150" r="4" />
          <circle cx="200" cy="220" r="4" />
          <circle cx="200" cy="290" r="4" />
          <circle cx="200" cy="360" r="4" />
          <circle cx="200" cy="430" r="4" />
        </g>

        {/* Collar */}
        <path d={collarPath} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        {collarType === 'ButtonDown' && (
           <g fill="white">
             <circle cx="150" cy="95" r="1.5" />
             <circle cx="250" cy="95" r="1.5" />
           </g>
        )}

        {/* Logo */}
        {logoPosition === 'Chest' && (
          <rect x="130" y="170" width="15" height="15" rx="2" fill="rgba(255,255,255,0.4)" stroke="rgba(0,0,0,0.2)" />
        )}
        {logoPosition === 'Sleeve' && (
          <rect x="30" y="160" width="12" height="12" rx="2" fill="rgba(255,255,255,0.4)" stroke="rgba(0,0,0,0.2)" />
        )}

        {/* Outlines and Folds */}
        <path d={bodyPath} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
        <path d="M 100 180 Q 200 190 300 180" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
};
