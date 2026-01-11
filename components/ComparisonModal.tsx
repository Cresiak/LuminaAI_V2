
import React, { useState } from 'react';
import { EnhancedImage } from '../types';

interface ComparisonModalProps {
  image: EnhancedImage;
  onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ image, onClose }) => {
  const [sliderPos, setSliderPos] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(Number(e.target.value));
  };

  const handleDownload = () => {
    if (!image.enhancedUrl) return;
    const link = document.createElement('a');
    link.href = image.enhancedUrl;
    link.download = `lumina_enhanced_${image.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-6xl bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white truncate max-w-xs">{image.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">AI Enhanced</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save Image
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Comparison Area */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center min-h-[60vh] p-4 lg:p-8">
          <div className="relative w-full h-full flex items-center justify-center select-none group">
            
            {/* Base: Enhanced Image */}
            <img 
              src={image.enhancedUrl} 
              alt="Enhanced" 
              className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-sm"
            />
            
            {/* Top: Original Image with Clip-Path */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img 
                src={image.originalUrl} 
                alt="Original" 
                className="max-w-full max-h-[70vh] object-contain rounded-sm"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              />
            </div>

            {/* Labels - positioned relative to the image bounds if possible, but absolute center-relative is safer */}
            <div className="absolute top-8 left-8 flex flex-col items-start gap-1 pointer-events-none z-20">
              <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg border border-white/10">Original</span>
            </div>
            <div className="absolute top-8 right-8 flex flex-col items-end gap-1 pointer-events-none z-20">
              <span className="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg border border-blue-400/20">Enhanced</span>
            </div>

            {/* Slider Control UI */}
            <div 
              className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-300"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="h-full w-0.5 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.4)] border-[6px] border-slate-900 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7l-5 5m0 0l5 5m-5-5h18m-5-5l5 5m0 0l-5 5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* The actual range input for interaction */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="0.1"
              value={sliderPos} 
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm font-medium">Slide to reveal the AI-powered color and detail enhancements</p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
