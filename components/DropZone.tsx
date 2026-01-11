
import React, { useRef, useState } from 'react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  isProcessing: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    // Fixed: Cast the array from FileList to File[] to ensure the 'type' property is recognized by TypeScript
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesAdded(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fixed: Cast the array from FileList to File[] to ensure the 'type' property is recognized by TypeScript
      const files = (Array.from(e.target.files) as File[]).filter(file => 
        file.type.startsWith('image/')
      );
      onFilesAdded(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
        isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple
        accept="image/*"
      />
      
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="p-4 bg-slate-700/50 rounded-full text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Drop images here</h3>
          <p className="text-slate-400 mt-1">or click to browse from your device</p>
        </div>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Supports JPG, PNG, WEBP</p>
      </div>
    </div>
  );
};

export default DropZone;
