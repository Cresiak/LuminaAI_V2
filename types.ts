
export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum EnhancementQuality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum IntegrityMode {
  EXPRESSION = 'EXPRESSION',
  GEOMETRY = 'GEOMETRY',
  TEXTURE = 'TEXTURE',
  COLOR_ONLY = 'COLOR_ONLY'
}

export enum ExportResolution {
  FHD = 'FHD', // 1K
  K2 = '2K',   // 2K
  K4 = '4K',   // 4K
  K8 = '8K'    // 4K + Super Detail prompt
}

export interface ImageVersion {
  id: string;
  url: string;
  timestamp: number;
  prompt?: string;
  quality: EnhancementQuality;
  mode: IntegrityMode;
  resolution: ExportResolution;
}

export interface EnhancedImage {
  id: string;
  name: string;
  originalUrl: string;
  enhancedUrl?: string;
  status: ProcessingStatus;
  error?: string;
  progress: number;
  selected?: boolean;
  history: ImageVersion[];
}
