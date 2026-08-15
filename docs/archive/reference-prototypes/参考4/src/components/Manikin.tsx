import React from 'react';
import { UserMeasurements } from '../types';

interface Props {
  measurements: UserMeasurements;
  shirtChest: number;
}

export const Manikin: React.FC<Props> = ({ measurements, shirtChest }) => {
  // Simple scaling logic for visualization
  const baseWidth = 80;
  const chestWidth = (measurements.chest / 100) * 80;
  const shoulderWidth = (measurements.shoulder / 50) * 90;
  const shirtVizWidth = (shirtChest / 100) * 85;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[300px] h-[400px] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-dashed border-gray-300">
        <svg viewBox="0 0 200 300" className="w-full h-full">
          {/* Head */}
          <circle cx="100" cy="40" r="15" fill="#e0e0e0" />
          
          {/* Human Body (Simple) */}
          <path
            d={`M${100 - shoulderWidth/2},70 L${100 + shoulderWidth/2},70 L${100 + chestWidth/2},150 L${100 - chestWidth/2},150 Z`}
            fill="#d0d0d0"
          />
          <rect x={100 - chestWidth/2} y="150" width={chestWidth} height="100" fill="#d0d0d0" />

          {/* Shirt Overlay (Semi-transparent) */}
          <path
            d={`M${100 - shoulderWidth/2 - 5},65 L${100 + shoulderWidth/2 + 5},65 L${100 + shirtVizWidth/2},155 L${100 + shirtVizWidth/2},260 L${100 - shirtVizWidth/2},260 L${100 - shirtVizWidth/2},155 Z`}
            fill="rgba(59, 130, 246, 0.4)"
            stroke="rgb(37, 99, 235)"
            strokeWidth="1"
            className="transition-all duration-500 ease-in-out"
          />
          
          {/* Dimension Lines (Chest) */}
          <line x1={100 - shirtVizWidth/2} y1="140" x2={100 + shirtVizWidth/2} y2="140" stroke="#f43f5e" strokeWidth="1" />
          <text x="100" y="135" textAnchor="middle" className="text-[8px] fill-[#f43f5e] font-mono">
            FIT: {Math.round(shirtChest - measurements.chest)}cm EASE
          </text>
        </svg>
      </div>
      <p className="mt-4 text-xs text-gray-500 font-medium uppercase tracking-tighter">
        Sizing Visualization (Ease Check)
      </p>
    </div>
  );
};
