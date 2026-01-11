
import React from 'react';
import { EnhancedImage } from '../types';

interface ErrorModalProps {
  image: EnhancedImage;
  onClose: () => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ image, onClose, onRetry, onRemove }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Enhancement Failed</h3>
              <p className="text-slate-400 text-sm truncate max-w-[240px]">{image.name}</p>
            </div>
          </div>
          
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6">
            <p className="text-slate-300 text-sm leading-relaxed">
              {image.error || "An unexpected error occurred while processing your image. This might be due to connection issues or file constraints."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onRetry(image.id)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              Retry Enhancement
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onRemove(image.id)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
              >
                Remove
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-transparent border border-slate-700 text-slate-400 hover:text-white font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
