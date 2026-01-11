
import React, { useState } from 'react';
import { EnhancedImage, ImageVersion } from '../types';

interface ComparisonModalProps {
  image: EnhancedImage;
  onClose: () => void;
  onRevert: (imageId: string, versionId: string) => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ image, onClose, onRevert }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [showHistory, setShowHistory] = useState(false);

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
      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white truncate max-w-xs">{image.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">AI Enhanced</span>
              {image.history.length > 0 && (
                <span className="text-slate-500 text-[10px] font-bold uppercase">Version {image.history.length + 1}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border ${
                showHistory ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History ({image.history.length})
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save Active
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

        {/* Main Content Area: Viewer + History Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Comparison Area */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-4 lg:p-8">
            <div className="relative w-full h-full flex items-center justify-center select-none group">
              
              {/* Base: Enhanced Image */}
              <img 
                src={image.enhancedUrl} 
                alt="Enhanced" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
              />
              
              {/* Top: Original Image with Clip-Path */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img 
                  src={image.originalUrl} 
                  alt="Original" 
                  className="max-w-full max-h-full object-contain rounded-sm"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                />
              </div>

              {/* Labels */}
              <div className="absolute top-8 left-8 flex flex-col items-start gap-1 pointer-events-none z-20">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg border border-white/10">Original</span>
              </div>
              <div className="absolute top-8 right-8 flex flex-col items-end gap-1 pointer-events-none z-20">
                <span className="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg border border-blue-400/20">Current Enhanced</span>
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

              {/* Range Input for interaction */}
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

          {/* History Sidebar */}
          {showHistory && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Version History</h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                {image.history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-slate-600 text-xs font-medium uppercase tracking-widest">No previous versions</p>
                  </div>
                ) : (
                  [...image.history].reverse().map((version, index) => (
                    <div key={version.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all group">
                      <div className="aspect-video relative overflow-hidden bg-slate-950">
                        <img src={version.url} alt={`Version ${image.history.length - index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button 
                             onClick={() => onRevert(image.id, version.id)}
                             className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-xl"
                           >
                             Restore This
                           </button>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-slate-300 backdrop-blur-sm">
                          V{image.history.length - index}
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-widest">
                          {new Date(version.timestamp).toLocaleTimeString()} · {version.quality}
                        </p>
                        <p className="text-xs text-slate-300 line-clamp-2 italic">
                          "{version.prompt || 'Auto enhance'}"
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm font-medium">Slide to compare. Use the history panel to browse and revert to previous enhancement attempts.</p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
