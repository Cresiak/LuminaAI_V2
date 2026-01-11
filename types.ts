
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

export interface EnhancedImage {
  id: string;
  name: string;
  originalUrl: string;
  enhancedUrl?: string;
  status: ProcessingStatus;
  error?: string;
  progress: number;
}
