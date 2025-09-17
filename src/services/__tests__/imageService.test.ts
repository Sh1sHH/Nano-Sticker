import { ImageProcessingService, ImageService } from '../imageService';
import { ImageProcessingOptions } from '@/types';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

// Mock dependencies
jest.mock('@bam.tech/react-native-image-resizer');
jest.mock('react-native-fs');

const mockImageResizer = ImageResizer as jest.Mocked<typeof ImageResizer>;
const mockRNFS = RNFS as jest.Mocked<typeof RNFS>;

describe('ImageProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImage', () => {
    const mockImageUri = 'file://test-image.jpg';

    beforeEach(() => {
      // Default mock responses
      mockRNFS.stat.mockResolvedValue({
        size: 1024 * 1024, // 1MB
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        ctime: new Date(),
        mode: 0,
        originalFilepath: mockImageUri,
      });

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://resized-image.jpg',
        width: 800,
        height: 600,
        size: 500 * 1024,
      });

      mockRNFS.unlink.mockResolvedValue();
    });

    it('should validate a valid image successfully', async () => {
      const result = await ImageProcessingService.validateImage(mockImageUri);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.format).toBe('jpg');
    });

    it('should reject images that are too large', async () => {
      mockRNFS.stat.mockResolvedValue({
        size: 15 * 1024 * 1024, // 15MB
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        ctime: new Date(),
        mode: 0,
        originalFilepath: mockImageUri,
      });

      const result = await ImageProcessingService.validateImage(mockImageUri);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceeds maximum'))).toBe(true);
    });

    it('should reject unsupported image formats', async () => {
      const bmpImageUri = 'file://test-image.bmp';
      
      const result = await ImageProcessingService.validateImage(bmpImageUri);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Unsupported format'))).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      mockRNFS.stat.mockRejectedValue(new Error('File not found'));

      const result = await ImageProcessingService.validateImage(mockImageUri);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Validation failed'))).toBe(true);
    });
  });

  describe('compressImage', () => {
    const mockImageUri = 'file://test-image.jpg';
    const mockOptions: ImageProcessingOptions = {
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      format: 'jpeg',
    };

    beforeEach(() => {
      mockRNFS.stat
        .mockResolvedValueOnce({
          size: 2 * 1024 * 1024, // 2MB original
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          ctime: new Date(),
          mode: 0,
          originalFilepath: mockImageUri,
        })
        .mockResolvedValueOnce({
          size: 1 * 1024 * 1024, // 1MB compressed
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          ctime: new Date(),
          mode: 0,
          originalFilepath: 'file://compressed-image.jpg',
        });

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://compressed-image.jpg',
        width: 1024,
        height: 768,
        size: 1 * 1024 * 1024,
      });
    });

    it('should compress an image successfully', async () => {
      const result = await ImageProcessingService.compressImage(mockImageUri, mockOptions);

      expect(result.uri).toBe('file://compressed-image.jpg');
      expect(result.originalSize).toBe(2 * 1024 * 1024);
      expect(result.compressedSize).toBe(1 * 1024 * 1024);
      expect(result.compressionRatio).toBe(2);
      expect(result.metadata.width).toBe(1024);
      expect(result.metadata.height).toBe(768);
    });

    it('should return original image if compression is not needed', async () => {
      // Mock small file that doesn't need compression
      mockRNFS.stat.mockResolvedValueOnce({
        size: 500 * 1024, // 500KB
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        ctime: new Date(),
        mode: 0,
        originalFilepath: mockImageUri,
      });

      // Create options that won't trigger compression
      const noCompressionOptions: ImageProcessingOptions = {
        quality: 1.0, // High quality
        maxWidth: 4000, // Large dimensions
        maxHeight: 4000,
        format: 'jpeg',
      };

      const result = await ImageProcessingService.compressImage(mockImageUri, noCompressionOptions);

      expect(result.uri).toBe(mockImageUri);
      expect(result.compressionRatio).toBe(1);
    });

    it('should handle compression errors', async () => {
      mockImageResizer.createResizedImage.mockRejectedValue(new Error('Compression failed'));

      await expect(
        ImageProcessingService.compressImage(mockImageUri, mockOptions)
      ).rejects.toThrow('Image compression failed');
    });
  });

  describe('preprocessForAI', () => {
    const mockImageUri = 'file://test-image.jpg';

    beforeEach(() => {
      // Mock successful validation
      mockRNFS.stat.mockResolvedValue({
        size: 1024 * 1024,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        ctime: new Date(),
        mode: 0,
        originalFilepath: mockImageUri,
      });

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://processed-image.jpg',
        width: 1024,
        height: 1024,
        size: 800 * 1024,
      });

      mockRNFS.unlink.mockResolvedValue();
    });

    it('should preprocess image for AI with default options', async () => {
      const result = await ImageProcessingService.preprocessForAI(mockImageUri);

      expect(result.uri).toBe('file://processed-image.jpg');
      expect(result.metadata.width).toBe(1024);
      expect(result.metadata.height).toBe(1024);
    });

    it('should preprocess image with custom options', async () => {
      const customOptions = {
        quality: 0.9,
        maxWidth: 512,
        maxHeight: 512,
        format: 'png' as const,
      };

      const result = await ImageProcessingService.preprocessForAI(mockImageUri, customOptions);

      expect(mockImageResizer.createResizedImage).toHaveBeenCalledWith(
        mockImageUri,
        512,
        512,
        'PNG',
        90,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true }
      );
    });

    it('should throw error if validation fails', async () => {
      // Mock validation failure
      mockRNFS.stat.mockResolvedValue({
        size: 15 * 1024 * 1024, // Too large
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        ctime: new Date(),
        mode: 0,
        originalFilepath: mockImageUri,
      });

      await expect(
        ImageProcessingService.preprocessForAI(mockImageUri)
      ).rejects.toThrow('Image validation failed');
    });
  });

  describe('createImageVariants', () => {
    const mockImageUri = 'file://test-image.jpg';
    const variants = [
      {
        name: 'thumbnail',
        options: { quality: 0.7, maxWidth: 200, maxHeight: 200, format: 'jpeg' as const },
      },
      {
        name: 'medium',
        options: { quality: 0.8, maxWidth: 800, maxHeight: 800, format: 'jpeg' as const },
      },
    ];

    beforeEach(() => {
      mockRNFS.stat
        .mockResolvedValueOnce({ size: 2 * 1024 * 1024 } as any) // Original
        .mockResolvedValueOnce({ size: 100 * 1024 } as any) // Thumbnail
        .mockResolvedValueOnce({ size: 2 * 1024 * 1024 } as any) // Original again
        .mockResolvedValueOnce({ size: 500 * 1024 } as any); // Medium

      mockImageResizer.createResizedImage
        .mockResolvedValueOnce({
          uri: 'file://thumbnail.jpg',
          width: 200,
          height: 200,
          size: 100 * 1024,
        })
        .mockResolvedValueOnce({
          uri: 'file://medium.jpg',
          width: 800,
          height: 800,
          size: 500 * 1024,
        });
    });

    it('should create multiple image variants', async () => {
      const results = await ImageProcessingService.createImageVariants(mockImageUri, variants);

      expect(results).toHaveProperty('thumbnail');
      expect(results).toHaveProperty('medium');
      expect(results.thumbnail.uri).toBe('file://thumbnail.jpg');
      expect(results.medium.uri).toBe('file://medium.jpg');
    });
  });

  describe('cleanupTempFiles', () => {
    const tempFiles = ['file://temp1.jpg', 'file://temp2.jpg', 'file://nonexistent.jpg'];

    it('should cleanup existing temporary files', async () => {
      mockRNFS.exists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      mockRNFS.unlink.mockResolvedValue();

      await ImageProcessingService.cleanupTempFiles(tempFiles);

      expect(mockRNFS.unlink).toHaveBeenCalledTimes(2);
      expect(mockRNFS.unlink).toHaveBeenCalledWith('file://temp1.jpg');
      expect(mockRNFS.unlink).toHaveBeenCalledWith('file://temp2.jpg');
    });

    it('should handle cleanup errors gracefully', async () => {
      mockRNFS.exists.mockResolvedValue(true);
      mockRNFS.unlink.mockRejectedValue(new Error('Permission denied'));

      // Should not throw
      await expect(
        ImageProcessingService.cleanupTempFiles(tempFiles)
      ).resolves.toBeUndefined();
    });
  });

  describe('getImageInfo', () => {
    const mockImageUri = 'file://test-image.png';

    beforeEach(() => {
      mockRNFS.stat.mockResolvedValue({
        size: 1024 * 1024,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        ctime: new Date(),
        mode: 0,
        originalFilepath: mockImageUri,
      });

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://temp-resize.jpg',
        width: 50,
        height: 50,
        size: 10 * 1024,
      });

      mockRNFS.unlink.mockResolvedValue();
    });

    it('should get image information', async () => {
      const info = await ImageProcessingService.getImageInfo(mockImageUri);

      expect(info.format).toBe('png');
      expect(info.size).toBe(1024 * 1024);
      expect(info.uri).toBe(mockImageUri);
      expect(typeof info.width).toBe('number');
      expect(typeof info.height).toBe('number');
    });

    it('should handle errors when getting image info', async () => {
      mockRNFS.stat.mockRejectedValue(new Error('File not accessible'));

      await expect(
        ImageProcessingService.getImageInfo(mockImageUri)
      ).rejects.toThrow('File not accessible');
    });
  });
});

describe('ImageService (Legacy)', () => {
  it('should extend ImageProcessingService', () => {
    expect(ImageService.validateImage).toBeDefined();
    expect(ImageService.compressImage).toBeDefined();
    expect(ImageService.preprocessForAI).toBeDefined();
  });

  it('should have segmentObject method', async () => {
    const result = await ImageService.segmentObject('file://test.jpg');
    expect(result).toBe('file://test.jpg');
  });
});