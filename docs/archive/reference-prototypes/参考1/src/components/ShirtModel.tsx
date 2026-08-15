import React from 'react';

interface ShirtModelProps {
  color?: string;
  patternDensity?: number;
  patternSize?: number;
  collarStyle?: string;
  className?: string;
}

export const ShirtModel: React.FC<ShirtModelProps> = ({
  color = "#ffffff",
  patternDensity = 50,
  patternSize = 50,
  collarStyle = "regular",
  className = ""
}) => {
  // Simplified SVG shirt representation
  return (
    <svg 
      viewBox="0 0 400 500" 
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern 
          id="shirtPattern" 
          x="0" y="0" 
          width={patternSize} 
          height={patternSize} 
          patternUnits="userSpaceOnUse"
        >
          {/* Mock pattern based on density */}
          <circle cx="10" cy="10" r={patternDensity / 15} fill="rgba(0,0,0,0.1)" />
          <path d="M20,20 Q30,10 40,20" stroke="rgba(0,0,0,0.05)" fill="none" strokeWidth="2" />
        </pattern>
      </defs>

      {/* Shirt body */}
      <path 
        d="M100,50 L300,50 L380,150 L340,180 L300,140 L300,450 L100,450 L100,140 L60,180 L20,150 Z" 
        fill={color}
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Pattern overlay */}
      <path 
        d="M100,50 L300,50 L380,150 L340,180 L300,140 L300,450 L100,450 L100,140 L60,180 L20,150 Z" 
        fill="url(#shirtPattern)"
      />

      {/* Collar */}
      {collarStyle === "regular" ? (
        <path d="M150,50 L200,80 L250,50" fill="none" stroke="#333" strokeWidth="2" />
      ) : (
        <path d="M150,50 L170,100 L230,100 L250,50" fill="none" stroke="#333" strokeWidth="2" />
      )}

      {/* Buttons */}
      <circle cx="200" cy="150" r="4" fill="#333" />
      <circle cx="200" cy="220" r="4" fill="#333" />
      <circle cx="200" cy="290" r="4" fill="#333" />
      <circle cx="200" cy="360" r="4" fill="#333" />
    </svg>
  );
};
