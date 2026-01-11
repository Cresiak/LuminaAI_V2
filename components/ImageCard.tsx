
import React from 'react';
import { EnhancedImage, ProcessingStatus } from '../types';

interface ImageCardProps {
  image: EnhancedImage;
  onView: (img: EnhancedImage) => void;
  onRemove: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onView, onRemove, onToggleSelect }) => {
  const isDone = image.status === ProcessingStatus.COMPLETED;
  const isFailed = image.status === ProcessingStatus.FAILED;
  const isWorking = image.status === ProcessingStatus.PROCESSING || image.status === ProcessingStatus.UPLOADING;
  const isSelected = !!image.selected;

  return (
    <div className={`relative group bg-slate-800 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
      isSelected ? 'border-blue-500 ring-4 ring-blue-500/20' : 
      isFailed ? 'border-red-900/50' : 
      isDone ? 'border-green-900/30' : 'border-slate-700'
    }`}>
      {/* Selection Checkbox */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(image.id);
        }}
        className={`absolute top-2 left-2 z-30 w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
          isSelected 
            ? 'bg-blue-500 border-blue-500 text-white' 
            : 'bg-black/40 border-white/30 text-transparent hover:border-white'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Thumbnail Area */}
      <div className="aspect-square bg-slate-900 relative">
        <img 
          src={isDone ? image.enhancedUrl : image.originalUrl} 
          alt={image.name} 
          className={`w-full h-full object-cover transition-opacity duration-500 ${isWorking ? 'opacity-40 grayscale' : 'opacity-100'}`}
        />
        
        {/* Overlay for Progress */}
        {isWorking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">
              Enhancing...
            </p>
          </div>
        )}

        {/* View/Action Overlay */}
        {isDone && !isWorking && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-10">
             <button 
               onClick={() => onView(image)}
               className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition-transform"
             >
               View Result
             </button>
             <button 
               onClick={() => onRemove(image.id)}
               className="text-slate-400 hover:text-white text-xs underline"
             >
               Remove
             </button>
          </div>
        )}

        {/* Error State Overlay */}
        {isFailed && (
          <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center p-4 text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <p className="text-[10px] text-red-200 uppercase font-bold mb-1">Failed</p>
             <button 
               onClick={() => onRemove(image.id)}
               className="text-[10px] text-red-400/80 hover:text-red-300 underline mt-2"
             >
               Remove
             </button>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3 bg-slate-800/80">
        <h4 className="text-sm font-medium text-slate-200 truncate">{image.name}</h4>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isDone ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-slate-500'
          }`}>
            {image.status === ProcessingStatus.COMPLETED ? 'Enhanced' : image.status.toLowerCase()}
          </span>
          {isDone && (
             <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
