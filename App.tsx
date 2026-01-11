
import React, { useState, useCallback, useEffect } from 'react';
import { EnhancedImage, ProcessingStatus, EnhancementQuality, ImageVersion, IntegrityMode, ExportResolution } from './types';
import DropZone from './components/DropZone';
import ImageCard from './components/ImageCard';
import ComparisonModal from './components/ComparisonModal';
import ErrorModal from './components/ErrorModal';
import { enhanceImage } from './services/gemini';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [images, setImages] = useState<EnhancedImage[]>([]);
  const [activeImage, setActiveImage] = useState<EnhancedImage | null>(null);
  const [errorImage, setErrorImage] = useState<EnhancedImage | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [shouldProcess, setShouldProcess] = useState(false);
  const [quality, setQuality] = useState<EnhancementQuality>(EnhancementQuality.MEDIUM);
  const [integrityMode, setIntegrityMode] = useState<IntegrityMode>(IntegrityMode.EXPRESSION);
  const [exportRes, setExportRes] = useState<ExportResolution>(ExportResolution.FHD);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const onFilesAdded = (files: File[]) => {
    const newImages: EnhancedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      status: ProcessingStatus.IDLE,
      progress: 0,
      selected: false,
      history: []
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        target.history.forEach(v => URL.revokeObjectURL(v.url));
        if (target.enhancedUrl) URL.revokeObjectURL(target.enhancedUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const toggleSelect = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, selected: !img.selected } : img
    ));
  };

  const clearSelection = () => {
    setImages(prev => prev.map(img => ({ ...img, selected: false })));
  };

  const handleRun = async () => {
    // Check if Pro model is needed (for 2K, 4K, 8K)
    const needsPro = exportRes !== ExportResolution.FHD;
    if (needsPro) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // After opening, we proceed assuming success or at least allowing user to try again
      }
    }

    const selectedImages = images.filter(img => img.selected);
    if (selectedImages.length > 0) {
      setImages(prev => prev.map(img => 
        img.selected ? { ...img, status: ProcessingStatus.IDLE, selected: false } : img
      ));
      setShouldProcess(true);
    } else if (images.some(img => img.status === ProcessingStatus.IDLE)) {
      setShouldProcess(true);
    }
  };

  const handleRevertToVersion = (imageId: string, versionId: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== imageId) return img;
      
      const versionIndex = img.history.findIndex(v => v.id === versionId);
      if (versionIndex === -1) return img;
      
      const versionToRestore = img.history[versionIndex];
      const currentAsVersion: ImageVersion = {
        id: Math.random().toString(36).substring(7),
        url: img.enhancedUrl!,
        timestamp: Date.now(),
        quality: quality,
        mode: integrityMode,
        resolution: exportRes,
        prompt: "Previous active state"
      };

      const newHistory = [...img.history.slice(0, versionIndex), ...img.history.slice(versionIndex + 1), currentAsVersion];

      const updated = {
        ...img,
        enhancedUrl: versionToRestore.url,
        history: newHistory
      };
      
      if (activeImage?.id === img.id) setActiveImage(updated);
      return updated;
    }));
  };

  const handleDownloadAll = async () => {
    const completedImages = images.filter(img => img.status === ProcessingStatus.COMPLETED && img.enhancedUrl);
    if (completedImages.length === 0) return;

    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      for (const img of completedImages) {
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
      
      const enhancedUrl = await enhanceImage(base64, mimeType, quality, integrityMode, exportRes, customPrompt);

      setImages(prev => prev.map(img => {
        if (img.id !== nextToProcess.id) return img;

        const newHistory = [...img.history];
        if (img.enhancedUrl) {
          newHistory.push({
            id: Math.random().toString(36).substring(7),
            url: img.enhancedUrl,
            timestamp: Date.now(),
            quality: quality,
            mode: integrityMode,
            resolution: exportRes,
            prompt: customPrompt || 'Auto enhancement'
          });
        }

        return { 
          ...img, 
          status: ProcessingStatus.COMPLETED, 
          enhancedUrl, 
          selected: false,
          history: newHistory
        };
      }));
    } catch (error: any) {
      if (error.message === 'API_KEY_ERROR') {
        (window as any).aistudio.openSelectKey();
      }
      setImages(prev => prev.map(img => 
        img.id === nextToProcess.id 
          ? { ...img, status: ProcessingStatus.FAILED, error: error.message } 
          : img
      ));
    } finally {
      setTimeout(() => setIsProcessingQueue(false), 200);
    }
  }, [images, quality, integrityMode, exportRes, customPrompt]);

  useEffect(() => {
    const idleCount = images.filter(img => img.status === ProcessingStatus.IDLE).length;
    if (shouldProcess && idleCount > 0 && !isProcessingQueue) {
      processNextInQueue();
    } else if (idleCount === 0 && isProcessingQueue === false) {
      setShouldProcess(false);
    }
  }, [images, isProcessingQueue, processNextInQueue, shouldProcess]);

  const idleImagesCount = images.filter(img => img.status === ProcessingStatus.IDLE).length;
  const selectedCount = images.filter(img => img.selected).length;
  const completedImagesCount = images.filter(img => img.status === ProcessingStatus.COMPLETED).length;
  const isAnyProcessing = images.some(img => img.status === ProcessingStatus.PROCESSING || img.status === ProcessingStatus.UPLOADING);

  const getIntegrityLabel = (mode: IntegrityMode) => {
    switch(mode) {
      case IntegrityMode.EXPRESSION: return "Expressions Locked";
      case IntegrityMode.GEOMETRY: return "Structure Protected";
      case IntegrityMode.TEXTURE: return "Texture Preserved";
      case IntegrityMode.COLOR_ONLY: return "Color Focus";
      default: return "Locked";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">LUMINA <span className="text-blue-400">AI</span></h1>
              <div className="flex flex-col">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-none">Technical Preservation Engine</p>
                <p className="text-blue-400/60 text-[10px] font-medium mt-1">by Luu Tho</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-slate-800/80 rounded-xl px-4 py-2 border border-slate-700/50 backdrop-blur-sm shadow-xl">
               <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-0.5">Active Safeguard</span>
               <span className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                 {getIntegrityLabel(integrityMode)}
               </span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col gap-8">
        <section className="text-center md:text-left max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-3">Professional Restoration, Zero Hallucinations.</h2>
          <p className="text-slate-400 leading-relaxed">
            Hệ thống AI của chúng tôi hiện hỗ trợ nhiều chế độ <b>Integrity Mode</b> nâng cao và tùy chọn độ phân giải lên đến <b>8K</b>.
          </p>
        </section>

        <section>
          <DropZone onFilesAdded={onFilesAdded} isProcessing={isAnyProcessing} />
        </section>

        <section className="flex-1 flex flex-col">
          <div className="flex flex-col xl:flex-row items-stretch justify-between mb-8 gap-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 shadow-2xl">
            <div className="flex flex-col gap-4 flex-1">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">Workspace</h3>
                    {images.length > 0 && (
                      <span className="bg-slate-700 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                        {images.length} TOTAL
                      </span>
                    )}
                  </div>
                  {selectedCount > 0 && (
                    <button 
                      onClick={clearSelection}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest"
                    >
                      Deselect ({selectedCount})
                    </button>
                  )}
               </div>
               
               <div className="relative group">
                 <textarea
                   value={customPrompt}
                   onChange={(e) => setCustomPrompt(e.target.value)}
                   placeholder={selectedCount > 0 
                     ? "Instructions for selected items..."
                     : `Instructions for new uploads... Mode: ${integrityMode} is active.`}
                   className={`w-full h-24 bg-slate-950 border rounded-xl p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none transition-all resize-none shadow-inner ${
                     selectedCount > 0 ? 'border-blue-500/40 focus:border-blue-500' : 'border-slate-800 focus:border-blue-500/50'
                   }`}
                   disabled={shouldProcess}
                 />
               </div>
            </div>

            <div className="flex flex-col sm:flex-row xl:flex-col items-center xl:items-end gap-6 w-full xl:w-auto self-end">
              
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                 <span className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest self-start xl:self-end">Resolution Target</span>
                 <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                   {Object.values(ExportResolution).map((r) => (
                      <button
                        key={r}
                        onClick={() => setExportRes(r)}
                        disabled={shouldProcess}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                          exportRes === r
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        } ${shouldProcess ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {r}
                      </button>
                   ))}
                 </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                 <span className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest self-start xl:self-end">Integrity Mode</span>
                 <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                   {Object.values(IntegrityMode).map((m) => (
                      <button
                        key={m}
                        onClick={() => setIntegrityMode(m)}
                        disabled={shouldProcess}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                          integrityMode === m
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        } ${shouldProcess ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {m.replace('_', ' ')}
                      </button>
                   ))}
                 </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {(idleImagesCount > 0 || selectedCount > 0) && (
                  <button
                    onClick={handleRun}
                    disabled={shouldProcess}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xl active:scale-95 ${
                      shouldProcess 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                      : selectedCount > 0 
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-green-600/40'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-600/40'
                    }`}
                  >
                    {shouldProcess ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                        Working...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.95l.003.203V5h3.8a1 1 0 01.123 1.992L16 7h-3.8v3.8a1 1 0 01-1.992.123L10.2 10.8V7H6.4a1 1 0 01-.123-1.992L6.3 5h3.8V1.2a1 1 0 011.2-.153z" />
                        </svg>
                        {selectedCount > 0 ? `Apply to Selection (${selectedCount})` : `Start Enhancement (${idleImagesCount})`}
                      </>
                    )}
                  </button>
                )}

                {completedImagesCount > 0 && !shouldProcess && (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export All ({completedImagesCount})
                      </>
                    )}
                  </button>
                )}

                {images.length > 0 && !shouldProcess && (
                  <button 
                    onClick={() => {
                      setImages([]);
                      setShouldProcess(false);
                      setCustomPrompt('');
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
              <p className="text-slate-500 text-xl font-medium">Safe Mode Active</p>
              <p className="text-slate-600 text-sm mt-2">High resolutions (2K+) require a paid Gemini API key.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {images.map(img => (
                <ImageCard 
                  key={img.id} 
                  image={img} 
                  onView={setActiveImage} 
                  onRemove={removeImage}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {activeImage && (
        <ComparisonModal 
          image={activeImage} 
          onClose={() => setActiveImage(null)} 
          onRevert={handleRevertToVersion}
        />
      )}

      {errorImage && (
        <ErrorModal
          image={errorImage}
          onClose={() => setErrorImage(null)}
          onRetry={(id) => {
             setErrorImage(null);
             setImages(prev => prev.map(img => img.id === id ? { ...img, status: ProcessingStatus.IDLE } : img));
             setShouldProcess(true);
          }}
          onRemove={(id) => {
            removeImage(id);
            setErrorImage(null);
          }}
        />
      )}

      <footer className="p-8 border-t border-slate-800 text-center bg-slate-950 mt-auto">
        <div className="max-w-7xl mx-auto">
          <p className="text-white font-bold text-sm mb-2">Developed by Luu Tho</p>
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} Lumina AI Integrity Lab. Powered by Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
