export interface User {
  id: string;
  email: string;
  credits: number;
  subscriptionStatus: 'free' | 'premium';
  subscriptionExpiry?: Date;
}

export interface Sticker {
  id: string;
  userId: string;
  originalImageUrl: string;
  processedImageUrl: string;
  styleUsed: string;
  createdAt: Date;
  metadata: {
    processingTime: number;
    imageSize: { width: number; height: number };
    effects: string[];
  };
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'consumption' | 'refund';
  amount: number;
  description: string;
  timestamp: Date;
  relatedStickerIds?: string[];
}

export interface AIProcessingRequest {
  id: string;
  userId: string;
  imageData: Buffer;
  stylePrompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  vertexAIRequestId?: string;
  processingStartTime: Date;
  processingEndTime?: Date;
  resultImageUrl?: string;
  errorMessage?: string;
}

export interface ArtisticStyle {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  selectedImage?: string;
  prompt: string;
  rotation?: number;
}

export interface Emotion {
  key: string;
  en: string;
  tr: string;
}

export interface GeneratedSticker {
  emotion: string;
  imageUrl: string | null;
  isLoading: boolean;
  error?: string;
}

export interface AIPromptConfig {
  forceCharacter: string;
  forceWhiteBackground: string;
  skinTonePersistence: string;
  colorPalletPersistence: string;
}

export interface ImageProcessingOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  uri: string;
}

export interface CompressionResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  metadata: ImageMetadata;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: ImageMetadata;
}

export interface StickerEffect {
  type: 'border' | 'shadow' | 'glow';
  config: {
    color?: string;
    width?: number;
    blur?: number;
    offset?: { x: number; y: number };
  };
}

export interface ExportFormat {
  type: 'png' | 'jpeg' | 'webp' | 'whatsapp';
  quality?: number;
  size?: { width: number; height: number };
}

export interface WhatsAppStickerPack {
  identifier: string;
  name: string;
  publisher: string;
  trayImageFile: string;
  publisherEmail?: string;
  publisherWebsite?: string;
  privacyPolicyWebsite?: string;
  licenseAgreementWebsite?: string;
  stickers: WhatsAppSticker[];
}

export interface WhatsAppSticker {
  imageFile: string;
  emojis: string[];
}

export interface ExportOptions {
  format: ExportFormat;
  saveToGallery: boolean;
  shareImmediately: boolean;
  whatsappPackName?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  packId?: string;
}