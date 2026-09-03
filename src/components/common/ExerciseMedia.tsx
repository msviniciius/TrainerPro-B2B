import React, { useState } from 'react';
import { Activity, Dumbbell } from 'lucide-react';
import { getExerciseGifUrl, getExerciseFallbackGifUrl } from '../../utils/exerciseMedia';

interface ExerciseMediaProps {
  exerciseId: string;
  name: string;
  muscle?: string;
  equipment?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
  showBadges?: boolean;
}

export const ExerciseMedia: React.FC<ExerciseMediaProps> = ({
  exerciseId,
  name,
  muscle,
  equipment,
  className = '',
  aspectRatio = 'video',
  showBadges = true,
}) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const sources = [
    getExerciseGifUrl(exerciseId),
    getExerciseFallbackGifUrl(exerciseId),
  ];

  const handleImageError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : '';

  return (
    <div className={`relative w-full h-full bg-[#0b1326] overflow-hidden flex items-center justify-center ${aspectClass} ${className}`}>
      {!hasError ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-[#0f172a] animate-pulse flex flex-col items-center justify-center p-3 text-center">
              <Activity className="w-5 h-5 text-[#4edea3]/40 animate-spin" />
            </div>
          )}
          <img
            src={sources[srcIndex]}
            alt={name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#131b2e] to-[#0b1326] flex flex-col items-center justify-center p-3 text-center border border-[#3c4a42]/20">
          <div className="w-9 h-9 rounded-xl bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center mb-1.5 shadow-sm">
            <Dumbbell className="w-4 h-4 text-[#4edea3]" />
          </div>
          <p className="text-[11px] font-bold text-[#dae2fd] line-clamp-1 leading-tight">{name}</p>
          {muscle && (
            <span className="text-[9px] font-mono-metric text-[#4edea3] mt-0.5">{muscle}</span>
          )}
        </div>
      )}

      {showBadges && (
        <>
          {muscle && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0b1326]/85 backdrop-blur-sm font-mono-metric text-[9px] text-[#4edea3] font-bold uppercase tracking-wide border border-[#3c4a42]/30 pointer-events-none">
              {muscle}
            </span>
          )}
          {equipment && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-[#0b1326]/85 backdrop-blur-sm text-[#bbcabf] font-mono-metric text-[9px] border border-[#3c4a42]/30 pointer-events-none">
              {equipment}
            </span>
          )}
        </>
      )}
    </div>
  );
};
