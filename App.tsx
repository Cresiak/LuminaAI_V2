
import React, { useState, useCallback, useEffect } from 'react';
import { EnhancedImage, ProcessingStatus, EnhancementQuality } from './types';
import DropZone from './components/DropZone';
import ImageCard from './components/ImageCard';
import ComparisonModal from './components/ComparisonModal';
import { enhanceImage } from './services/gemini';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [images, setImages] = useState<EnhancedImage[]>([]);
  const [activeImage, setActiveImage] = useState<EnhancedImage | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [shouldProcess, setShouldProcess] = useState(false);
  const [quality, setQuality] = useState<EnhancementQuality>(EnhancementQuality.MEDIUM);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const onFilesAdded = (files: File[]) => {
    const newImages: EnhancedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      status: ProcessingStatus.IDLE,
      progress: 0
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) URL.revokeObjectURL(target.originalUrl);
      return prev.filter(img => img.id !== id);
    });
  };

  const handleRun = () => {
    if (images.some(img => img.status === ProcessingStatus.IDLE)) {
      setShouldProcess(true);
    }
  };

  const handleDownloadAll = async () => {
    const completedImages = images.filter(img => img.status === ProcessingStatus.COMPLETED && img.enhancedUrl);
    if (completedImages.length === 0) return;

    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      for (const img of completedImages) {
        // Fetch the data URL and convert to blob
        const response = await fetch(img.enhancedUrl!);
        const blob = await response.blob();
        zip.file(`enhanced_${img.name}`, blob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `lumina_batch_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating zip archive:', error);
      alert('Failed to create download archive. Please try again.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const fileToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });
  };

  const processNextInQueue = useCallback(async () => {
    const nextToProcess = images.find(img => img.status === ProcessingStatus.IDLE);
    
    if (!nextToProcess) {
      setIsProcessingQueue(false);
      setShouldProcess(false);
      return;
    }

    setIsProcessingQueue(true);

    setImages(prev => prev.map(img => 
      img.id === nextToProcess.id 
        ? { ...img, status: ProcessingStatus.PROCESSING } 
        : img
    ));

    try {
      const base64 = await fileToBase64(nextToProcess.originalUrl);
      const mimeType = base64.split(';')[0].split(':')[1] || 'image/jpeg';
      
      const enhancedUrl = await enhanceImage(base64, mimeType, quality);

      setImages(prev => prev.map(img => 
        img.id === nextToProcess.id 
          ? { ...img, status: ProcessingStatus.COMPLETED, enhancedUrl } 
          : img
      ));
    } catch (error: any) {
      setImages(prev => prev.map(img => 
        img.id === nextToProcess.id 
          ? { ...img, status: ProcessingStatus.FAILED, error: error.message } 
          : img
      ));
    } finally {
      setTimeout(() => setIsProcessingQueue(false), 500);
    }
  }, [images, quality]);

  useEffect(() => {
    const idleCount = images.filter(img => img.status === ProcessingStatus.IDLE).length;
    if (shouldProcess && idleCount > 0 && !isProcessingQueue) {
      processNextInQueue();
    } else if (idleCount === 0 && isProcessingQueue === false) {
      setShouldProcess(false);
    }
  }, [images, isProcessingQueue, processNextInQueue, shouldProcess]);

  const idleImages = images.filter(img => img.status === ProcessingStatus.IDLE);
  const completedImagesCount = images.filter(img => img.status === ProcessingStatus.COMPLETED).length;
  const isAnyProcessing = images.some(img => img.status === ProcessingStatus.PROCESSING || img.status === ProcessingStatus.UPLOADING);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">LUMINA <span className="text-blue-400">AI</span></h1>
              <p className="text-slate-400 text-sm font-medium">Identity-Safe Photo Enhancement</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-slate-800 rounded-xl px-4 py-2 border border-slate-700">
               <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-0.5">Focus</span>
               <span className="text-sm font-semibold text-blue-400">Natural Expression</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col gap-8">
        
        {/* Intro Section */}
        <section className="text-center md:text-left max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-3">Keep Your Smile, Fix the Light.</h2>
          <p className="text-slate-400 leading-relaxed">
            Hệ thống AI của chúng tôi được tối ưu để <b>giữ nguyên 100% biểu cảm và gương mặt</b>. Chúng tôi chỉ tập trung vào việc phục hồi ánh sáng từ vùng tối (ngược sáng) và cân bằng màu sắc mà không làm thay đổi danh tính của bạn.
          </p>
        </section>

        {/* Drop Zone */}
        <section>
          <DropZone onFilesAdded={onFilesAdded} isProcessing={isAnyProcessing} />
        </section>

        {/* Action Bar & Results Grid */}
        <section className="flex-1 flex flex-col">
          <div className="flex flex-col xl:flex-row items-center justify-between mb-8 gap-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
            <div className="flex items-center gap-3">
               <h3 className="text-lg font-bold text-white">Your Workspace</h3>
               {images.length > 0 && (
                 <span className="bg-slate-700 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                   {images.length} TOTAL
                 </span>
               )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
              {/* Quality Selector */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
                <span className="text-[10px] font-black text-slate-500 uppercase px-3 tracking-widest hidden sm:block">Quality</span>
                <div className="flex gap-1 flex-1 sm:flex-initial">
                  {[EnhancementQuality.LOW, EnhancementQuality.MEDIUM, EnhancementQuality.HIGH].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      disabled={shouldProcess}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        quality === q
                          ? q === EnhancementQuality.HIGH 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/20'
                            : 'bg-slate-700 text-white'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                      } ${shouldProcess ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {idleImages.length > 0 && (
                  <button
                    onClick={handleRun}
                    disabled={shouldProcess}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xl shadow-blue-600/20 active:scale-95 ${
                      shouldProcess 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-600/40'
                    }`}
                  >
                    {shouldProcess ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.95l.003.203V5h3.8a1 1 0 01.123 1.992L16 7h-3.8v3.8a1 1 0 01-1.992.123L10.2 10.8V7H6.4a1 1 0 01-.123-1.992L6.3 5h3.8V1.2a1 1 0 011.2-.153zM16.707 15.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 22.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                        Run ({idleImages.length})
                      </>
                    )}
                  </button>
                )}

                {completedImagesCount > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={isDownloadingAll}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 ${isDownloadingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isDownloadingAll ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                        Zipping...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download All ({completedImagesCount})
                      </>
                    )}
                  </button>
                )}

                {images.length > 0 && (
                  <button 
                    onClick={() => {
                      setImages([]);
                      setShouldProcess(false);
                    }}
                    className="px-4 py-3 text-slate-500 hover:text-red-400 text-sm font-semibold transition-colors flex items-center gap-1 bg-slate-800/30 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-900/20 rounded-[2.5rem] border-2 border-slate-800/50 border-dashed">
              <div className="text-slate-800 mb-6 opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-28 h-28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500 text-xl font-medium">No photos in the queue</p>
              <p className="text-slate-600 text-sm mt-2">Add images above to prepare for enhancement</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {images.map(img => (
                <ImageCard 
                  key={img.id} 
                  image={img} 
                  onView={setActiveImage} 
                  onRemove={removeImage}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Comparison Modal Overlay */}
      {activeImage && (
        <ComparisonModal 
          image={activeImage} 
          onClose={() => setActiveImage(null)} 
        />
      )}

      {/* Footer */}
      <footer className="p-8 border-t border-slate-800 text-center bg-slate-950 mt-auto">
        <p className="text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} Lumina AI Photo Lab. Powered by Gemini. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default App;