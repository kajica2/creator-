import React from 'react';
import { SphereData } from '../types';

interface SphereProps {
  data: SphereData;
  onClick: (data: SphereData) => void;
  isEven: boolean;
  isSelected: boolean;
  isAnimating: boolean;
  animationDelay: number;
}

const Sphere: React.FC<SphereProps> = ({ data, onClick, isEven, isSelected, isAnimating, animationDelay }) => {
  const alignmentClass = isEven ? 'md:self-start' : 'md:self-end';
  const textAlignmentClass = isEven ? 'md:text-left' : 'md:text-right';

  const animationStateClasses = isAnimating
    ? 'opacity-100 translate-y-0 md:translate-x-0'
    : `opacity-0 translate-y-10 md:translate-y-0 ${isEven ? 'md:-translate-x-full' : 'md:translate-x-full'}`;

  return (
    <div
      className={`w-full flex justify-center items-center my-4 md:w-1/2 ${alignmentClass} transition-all duration-1000 ease-out ${animationStateClasses}`}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      <div className={`flex items-center gap-4 w-full max-w-sm ${isEven ? 'flex-row' : 'flex-row-reverse md:flex-row-reverse'}`}>
        <button
          onClick={() => onClick(data)}
          className={`relative flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-full ${data.color} ${data.shadowColor} shadow-xl flex justify-center items-center cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white/50 ${isSelected ? 'scale-110 shadow-2xl' : ''}`}
          aria-label={`Open details for ${data.name}`}
        >
          {data.id === 9 && (
            <div className="absolute inset-0 rounded-full animate-pulse bg-white/30"></div>
          )}
        </button>
        <div className={`text-white text-center ${textAlignmentClass}`}>
          <h3 className="text-xl md:text-2xl font-serif font-bold">{data.name}</h3>
          <p className="text-sm md:text-base text-gray-300">{data.description}</p>
        </div>
      </div>
    </div>
  );
};

export default Sphere;
