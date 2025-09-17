import { performance } from 'perf_hooks';
import { compressImage, validateImage, processImageForAI } from '../../services/imageService';

// Mock react-native modules for performance testing
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  stat: jest.fn(),
  exists: jest.fn(),
  unlink: jest.fn(),
  copyFile: jest.fn(),
  writeFile: jest.fn(),
  DocumentDirectoryPath: '/mock/documents',
}));

describe('Image Processing Performance Tests', () => {
  const createMockImage = (size: number) => ({
    uri: `file://test-image-${size}.jpg`,
    width: Math.sqrt(size),
    height: Math.sqrt(size),
    fileSize: size,
    type: 'image/jpeg',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compress large images within acceptable time limits', async () => {
    const largeImage = createMockImage(5 * 1024 * 1024); // 5MB image
    const compressedImage = createMockImage(1 * 1024 * 1024); // 1MB result

    const { createResizedImage } = require('@bam.tech/react-native-image-resizer');
    createResizedImage.mockResolvedValue({
      uri: compressedImage.uri,
      width: compressedImage.width,
      height: compressedImage.height,
      size: compressedImage.fileSize,
    });

    const startTime = performance.now();
    
    const result = await compressImage(largeImage, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Should complete within 2 seconds
    expect(processingTime).toBeLessThan(2000);
    expect(result.fileSize).toBeLessThan(largeImage.fileSize);
    expect(createResizedImage).toHaveBeenCalledWith(
      largeImage.uri,
      1024,
      1024,
      'JPEG',
      80,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );
  });

  it('should validate images efficiently for different sizes', async () => {
    const testImages = [
      createMockImage(100 * 1024), // 100KB
      createMockImage(1 * 1024 * 1024), // 1MB
      createMockImage(5 * 1024 * 1024), // 5MB
      createMockImage(10 * 1024 * 1024), // 10MB
    ];

    const { stat } = require('react-native-fs');
    stat.mockResolvedValue({ size: 1024 * 1024 });

    const validationTimes: number[] = [];

    for (const image of testImages) {
      const startTime = performance.now();
      
      const isValid = await validateImage(image);
      
      const endTime = performance.now();
      validationTimes.push(endTime - startTime);

      expect(isValid).toBe(true);
    }

    // All validations should complete within 100ms
    validationTimes.forEach(time => {
      expect(time).toBeLessThan(100);
    });

    // Average validation time should be under 50ms
    const averageTime = validationTimes.reduce((sum, time) => sum + time, 0) / validationTimes.length;
    expect(averageTime).toBeLessThan(50);
  });

  it('should process images for AI within performance benchmarks', async () => {
    const testImage = createMockImage(2 * 1024 * 1024); // 2MB image
    const processedImage = createMockImage(1 * 1024 * 1024); // 1MB result

    const { createResizedImage } = require('@bam.tech/react-native-image-resizer');
    createResizedImage.mockResolvedValue({
      uri: processedImage.uri,
      width: 512,
      height: 512,
      size: processedImage.fileSize,
    });

    const startTime = performance.now();
    
    const result = await processImageForAI(testImage);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // AI preprocessing should complete within 1.5 seconds
    expect(processingTime).toBeLessThan(1500);
    
    // Result should meet AI requirements
    expect(result.width).toBeLessThanOrEqual(512);
    expect(result.height).toBeLessThanOrEqual(512);
    expect(result.fileSize).toBeLessThan(testImage.fileSize);
  });

  it('should handle batch image processing efficiently', async () => {
    const batchImages = Array.from({ length: 5 }, (_, i) => 
      createMockImage((i + 1) * 1024 * 1024) // 1MB to 5MB images
    );

    const { createResizedImage } = require('@bam.tech/react-native-image-resizer');
    createResizedImage.mockImplementation((uri) => 
      Promise.resolve({
        uri: uri.replace('.jpg', '-compressed.jpg'),
        width: 512,
        height: 512,
        size: 500 * 1024, // 500KB result
      })
    );

    const startTime = performance.now();
    
    const results = await Promise.all(
      batchImages.map(image => compressImage(image, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.7,
      }))
    );
    
    const endTime = performance.now();
    const totalProcessingTime = endTime - startTime;

    // Batch processing should complete within 5 seconds
    expect(totalProcessingTime).toBeLessThan(5000);
    expect(results).toHaveLength(5);
    
    // All results should be compressed
    results.forEach((result, index) => {
      expect(result.fileSize).toBeLessThan(batchImages[index].fileSize);
    });
  });

  it('should maintain memory efficiency during processing', async () => {
    const largeImages = Array.from({ length: 10 }, (_, i) => 
      createMockImage(3 * 1024 * 1024) // 3MB images
    );

    const { createResizedImage } = require('@bam.tech/react-native-image-resizer');
    createResizedImage.mockImplementation(() => 
      Promise.resolve({
        uri: 'file://compressed.jpg',
        width: 512,
        height: 512,
        size: 300 * 1024, // 300KB result
      })
    );

    // Process images sequentially to test memory management
    const processingTimes: number[] = [];
    
    for (let i = 0; i < largeImages.length; i++) {
      const startTime = performance.now();
      
      await compressImage(largeImages[i], {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
      });
      
      const endTime = performance.now();
      processingTimes.push(endTime - startTime);
    }

    // Processing times should remain consistent (no memory leaks)
    const firstHalf = processingTimes.slice(0, 5);
    const secondHalf = processingTimes.slice(5);
    
    const firstHalfAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    
    // Second half shouldn't be significantly slower (within 50% variance)
    expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
  });

  it('should handle concurrent image processing without degradation', async () => {
    const concurrentImages = Array.from({ length: 3 }, (_, i) => 
      createMockImage(2 * 1024 * 1024) // 2MB images
    );

    const { createResizedImage } = require('@bam.tech/react-native-image-resizer');
    createResizedImage.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            uri: 'file://concurrent-compressed.jpg',
            width: 512,
            height: 512,
            size: 400 * 1024, // 400KB result
          });
        }, 200); // Simulate processing time
      })
    );

    const startTime = performance.now();
    
    // Process all images concurrently
    const results = await Promise.all(
      concurrentImages.map(image => compressImage(image, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
      }))
    );
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Concurrent processing should be faster than sequential
    // (3 images * 200ms + overhead should be < 800ms)
    expect(totalTime).toBeLessThan(800);
    expect(results).toHaveLength(3);
  });
});