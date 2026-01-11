
import React from 'react';
import { EnhancedImage, ProcessingStatus } from '../types';

interface ImageCardProps {
  image: EnhancedImage;
  onView: (img: EnhancedImage) => void;
  onRemove: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onView, onRemove }) => {
  const isDone = image.status === ProcessingStatus.COMPLETED;
  const isFailed = image.status === ProcessingStatus.FAILED;
  const isWorking = image.status === ProcessingStatus.PROCESSING || image.status === ProcessingStatus.UPLOADING;

  return (
    <div className={`relative group bg-slate-800 rounded-xl overflow-hidden border-2 transition-all ${
      isFailed ? 'border-red-900/50' : isDone ? 'border-green-900/30' : 'border-slate-700'
    }`}>
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
        {isDone && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
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

        {/* Error State */}
        {isFailed && (
          <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center p-4 text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <p className="text-[10px] text-red-200 uppercase font-bold truncate w-full">Error</p>
             <button 
               onClick={() => onRemove(image.id)}
               className="mt-2 text-red-400 hover:text-white text-xs"
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
