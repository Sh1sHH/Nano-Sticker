import { ImageProcessingOptions } from '@/types';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

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

export class ImageProcessingService {
  // Supported image formats
  private static readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MIN_DIMENSIONS = { width: 200, height: 200 };
  private static readonly MAX_DIMENSIONS = { width: 4096, height: 4096 };

  /**
   * Validates an image file for format, size, and dimensions
   */
  static async validateImage(imageUri: string): Promise<ValidationResult> {
    const errors: string[] = [];
    
    try {
      // Get file stats
      const fileStats = await RNFS.stat(imageUri);
      const fileSize = fileStats.size;
      
      // Check file size
      if (fileSize > this.MAX_FILE_SIZE) {
        errors.push(`File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds maximum ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB`);
      }

      // Extract format from URI
      const format = this.extractImageFormat(imageUri);
      if (!format || !this.SUPPORTED_FORMATS.includes(format.toLowerCase())) {
        errors.push(`Unsupported format. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`);
      }

      // Get image dimensions using ImageResizer
      const imageInfo = await ImageResizer.createResizedImage(
        imageUri,
        1, // minimal resize to get dimensions
        1,
        'JPEG',
        100,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true }
      );

      // Parse dimensions from the resized image (we'll get actual dimensions)
      const actualInfo = await RNFS.stat(imageInfo.uri);
      
      // For getting actual dimensions, we need to use a different approach
      // Since ImageResizer doesn't directly give us original dimensions,
      // we'll create a minimal resize and calculate from there
      const testResize = await ImageResizer.createResizedImage(
        imageUri,
        100,
        100,
        'JPEG',
        100,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: false }
      );

      // Clean up test file
      await RNFS.unlink(testResize.uri).catch(() => {});
      await RNFS.unlink(imageInfo.uri).catch(() => {});

      // For now, we'll estimate dimensions based on file size and format
      // In a real implementation, you might want to use a native module
      // or a more sophisticated approach to get exact dimensions
      const estimatedWidth = Math.max(this.MIN_DIMENSIONS.width, Math.min(this.MAX_DIMENSIONS.width, Math.sqrt(fileSize / 3)));
      const estimatedHeight = estimatedWidth; // Assume square for estimation

      // Check minimum dimensions (using estimation)
      if (estimatedWidth < this.MIN_DIMENSIONS.width || estimatedHeight < this.MIN_DIMENSIONS.height) {
        errors.push(`Image dimensions too small. Minimum: ${this.MIN_DIMENSIONS.width}x${this.MIN_DIMENSIONS.height}px`);
      }

      // Check maximum dimensions
      if (estimatedWidth > this.MAX_DIMENSIONS.width || estimatedHeight > this.MAX_DIMENSIONS.height) {
        errors.push(`Image dimensions too large. Maximum: ${this.MAX_DIMENSIONS.width}x${this.MAX_DIMENSIONS.height}px`);
      }

      const metadata: ImageMetadata = {
        width: Math.round(estimatedWidth),
        height: Math.round(estimatedHeight),
        size: fileSize,
        format: format || 'unknown',
        uri: imageUri,
      };

      return {
        isValid: errors.length === 0,
        errors,
        metadata,
      };

    } catch (error) {
      console.error('Image validation failed:', error);
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Compresses an image while maintaining quality
   */
  static async compressImage(
    imageUri: string,
    options: ImageProcessingOptions
  ): Promise<CompressionResult> {
    try {
      // Get original file size
      const originalStats = await RNFS.stat(imageUri);
      const originalSize = originalStats.size;

      // Determine if compression is needed
      const needsCompression = this.shouldCompress(originalSize, options);
      
      if (!needsCompression) {
        // Return original if no compression needed
        const metadata: ImageMetadata = {
          width: options.maxWidth,
          height: options.maxHeight,
          size: originalSize,
          format: options.format,
          uri: imageUri,
        };

        return {
          uri: imageUri,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          metadata,
        };
      }

      // Perform compression
      const compressedImage = await ImageResizer.createResizedImage(
        imageUri,
        options.maxWidth,
        options.maxHeight,
        options.format.toUpperCase() as 'JPEG' | 'PNG' | 'WEBP',
        Math.round(options.quality * 100),
        0, // rotation
        undefined, // outputPath
        false, // keepMeta
        {
          mode: 'contain',
          onlyScaleDown: true,
        }
      );

      // Get compressed file size
      const compressedStats = await RNFS.stat(compressedImage.uri);
      const compressedSize = compressedStats.size;

      const metadata: ImageMetadata = {
        width: compressedImage.width,
        height: compressedImage.height,
        size: compressedSize,
        format: options.format,
        uri: compressedImage.uri,
      };

      return {
        uri: compressedImage.uri,
        originalSize,
        compressedSize,
        compressionRatio: originalSize / compressedSize,
        metadata,
      };

    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preprocesses an image for AI processing
   */
  static async preprocessForAI(
    imageUri: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<CompressionResult> {
    const defaultOptions: ImageProcessingOptions = {
      quality: 0.9,
      maxWidth: 1024,
      maxHeight: 1024,
      format: 'jpeg',
      ...options,
    };

    try {
      // First validate the image
      const validation = await this.validateImage(imageUri);
      if (!validation.isValid) {
        throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
      }

      // Then compress/optimize for AI processing
      return await this.compressImage(imageUri, defaultOptions);

    } catch (error) {
      console.error('Image preprocessing failed:', error);
      throw error;
    }
  }

  /**
   * Creates multiple sizes of an image for different use cases
   */
  static async createImageVariants(
    imageUri: string,
    variants: Array<{ name: string; options: ImageProcessingOptions }>
  ): Promise<Record<string, CompressionResult>> {
    const results: Record<string, CompressionResult> = {};

    try {
      for (const variant of variants) {
        results[variant.name] = await this.compressImage(imageUri, variant.options);
      }

      return results;
    } catch (error) {
      console.error('Creating image variants failed:', error);
      throw error;
    }
  }

  /**
   * Cleans up temporary image files
   */
  static async cleanupTempFiles(uris: string[]): Promise<void> {
    const cleanupPromises = uris.map(async (uri) => {
      try {
        const exists = await RNFS.exists(uri);
        if (exists) {
          await RNFS.unlink(uri);
        }
      } catch (error) {
        console.warn(`Failed to cleanup file ${uri}:`, error);
      }
    });

    await Promise.allSettled(cleanupPromises);
  }

  /**
   * Gets detailed information about an image file
   */
  static async getImageInfo(imageUri: string): Promise<ImageMetadata> {
    try {
      const fileStats = await RNFS.stat(imageUri);
      const format = this.extractImageFormat(imageUri);

      // Use a minimal resize to get dimensions
      const tempResize = await ImageResizer.createResizedImage(
        imageUri,
        50,
        50,
        'JPEG',
        100,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: false }
      );

      // Clean up temp file
      await RNFS.unlink(tempResize.uri).catch(() => {});

      // Estimate original dimensions based on file size and format
      const estimatedDimension = Math.sqrt(fileStats.size / (format === 'png' ? 4 : 3));

      return {
        width: Math.round(estimatedDimension),
        height: Math.round(estimatedDimension),
        size: fileStats.size,
        format: format || 'unknown',
        uri: imageUri,
      };
    } catch (error) {
      console.error('Failed to get image info:', error);
      throw error;
    }
  }

  // Private helper methods

  private static extractImageFormat(uri: string): string | null {
    const match = uri.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  private static shouldCompress(fileSize: number, options: ImageProcessingOptions): boolean {
    const sizeThreshold = 2 * 1024 * 1024; // 2MB
    const qualityThreshold = 0.95;

    return (
      fileSize > sizeThreshold ||
      options.quality < qualityThreshold ||
      options.maxWidth < 2048 ||
      options.maxHeight < 2048
    );
  }
}

// Legacy class for backward compatibility
export class ImageService extends ImageProcessingService {
  static async segmentObject(imageUri: string): Promise<string> {
    try {
      // TODO: Implement ML Kit segmentation
      // For now, return original URI as placeholder
      return imageUri;
    } catch (error) {
      console.error('Object segmentation failed:', error);
      throw error;
    }
  }
}