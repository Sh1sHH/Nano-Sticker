import {ExportService} from '../exportService';
import {ExportFormat, ExportOptions} from '@/types';

// Mock dependencies are handled in jest.setup.js

describe('ExportService', () => {
  const mockStickerUri = 'file://mock/sticker.png';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportSticker', () => {
    it('exports PNG format successfully', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');
      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://mock/resized.png',
      });
      mockRNFS.copyFile.mockResolvedValue(true);
      const mockCameraRoll = require('@react-native-camera-roll/camera-roll');
      mockCameraRoll.save.mockResolvedValue(true);

      const options: ExportOptions = {
        format: {type: 'png', size: {width: 512, height: 512}},
        saveToGallery: true,
        shareImmediately: false,
      };

      const result = await ExportService.exportSticker(mockStickerUri, options);

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('/mock/documents/sticker_');
      expect(result.filePath).toContain('.png');
      expect(mockImageResizer.createResizedImage).toHaveBeenCalledWith(
        mockStickerUri,
        512,
        512,
        'PNG',
        100,
        0,
        undefined,
        false,
        {mode: 'contain', onlyScaleDown: false},
      );
      expect(mockCameraRoll.save).toHaveBeenCalled();
    });

    it('exports JPEG format with quality settings', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://mock/resized.jpg',
      });
      mockRNFS.copyFile.mockResolvedValue(true);

      const options: ExportOptions = {
        format: {type: 'jpeg', quality: 90, size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: false,
      };

      const result = await ExportService.exportSticker(mockStickerUri, options);

      expect(result.success).toBe(true);
      expect(mockImageResizer.createResizedImage).toHaveBeenCalledWith(
        mockStickerUri,
        512,
        512,
        'JPEG',
        90,
        0,
        undefined,
        false,
        {mode: 'contain', onlyScaleDown: false},
      );
    });

    it('exports WhatsApp format with pack creation', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');

      mockImageResizer.createResizedImage
        .mockResolvedValueOnce({uri: 'file://mock/resized.webp'})
        .mockResolvedValueOnce({uri: 'file://mock/tray.png'});
      mockRNFS.copyFile.mockResolvedValue(true);
      mockRNFS.stat.mockResolvedValue({size: 50000}); // Under 100KB limit
      mockRNFS.writeFile.mockResolvedValue(true);

      const options: ExportOptions = {
        format: {type: 'whatsapp', size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: false,
        whatsappPackName: 'Test Pack',
      };

      const result = await ExportService.exportSticker(mockStickerUri, options);

      expect(result.success).toBe(true);
      expect(result.packId).toBeDefined();
      expect(mockImageResizer.createResizedImage).toHaveBeenCalledTimes(2); // Main sticker + tray image
      expect(mockRNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('sticker_pack_'),
        expect.stringContaining('"name": "Test Pack"'),
      );
    });

    it('validates WhatsApp sticker size and rejects oversized files', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://mock/resized.webp',
      });
      mockRNFS.copyFile.mockResolvedValue(true);
      mockRNFS.stat.mockResolvedValue({size: 150000}); // Over 100KB limit

      const options: ExportOptions = {
        format: {type: 'whatsapp', size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: false,
      };

      const result = await ExportService.exportSticker(mockStickerUri, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('WhatsApp requirements');
    });

    it('shares sticker when shareImmediately is true', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');
      const mockShare = require('react-native-share');

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://mock/resized.png',
      });
      mockRNFS.copyFile.mockResolvedValue(true);
      mockShare.open.mockResolvedValue(true);

      const options: ExportOptions = {
        format: {type: 'png', size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: true,
      };

      const result = await ExportService.exportSticker(mockStickerUri, options);

      expect(result.success).toBe(true);
      expect(mockShare.open).toHaveBeenCalledWith({
        title: 'Share your AI-generated sticker',
        message: 'Check out this awesome sticker I created!',
        url: expect.stringContaining('file://'),
        type: 'image/png',
      });
    });

    it('handles export errors gracefully', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      mockImageResizer.createResizedImage.mockRejectedValue(
        new Error('Resize failed'),
      );

      const options: ExportOptions = {
        format: {type: 'png', size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: false,
      };

      const result = await ExportService.exportSticker(mockStickerUri, options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to resize image for export');
    });

    it('ignores user cancellation during sharing', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');
      const mockShare = require('react-native-share');

      mockImageResizer.createResizedImage.mockResolvedValue({
        uri: 'file://mock/resized.png',
      });
      mockRNFS.copyFile.mockResolvedValue(true);
      mockShare.open.mockRejectedValue(new Error('User did not share'));

      const options: ExportOptions = {
        format: {type: 'png', size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: true,
      };

      const result = await ExportService.exportSticker(mockStickerUri, options);

      expect(result.success).toBe(true); // Should still succeed even if user cancels sharing
    });
  });

  describe('getAvailableFormats', () => {
    it('returns all supported export formats', () => {
      const formats = ExportService.getAvailableFormats();

      expect(formats).toHaveLength(4);
      expect(formats.map(f => f.type)).toEqual([
        'png',
        'jpeg',
        'webp',
        'whatsapp',
      ]);
      expect(formats.every(f => f.size?.width === 512)).toBe(true);
      expect(formats.every(f => f.size?.height === 512)).toBe(true);
    });
  });

  describe('getWhatsAppRequirements', () => {
    it('returns WhatsApp sticker requirements', () => {
      const requirements = ExportService.getWhatsAppRequirements();

      expect(requirements).toEqual({
        maxFileSize: 100 * 1024,
        requiredSize: 512,
        format: 'WEBP',
        trayImageSize: 96,
      });
    });
  });

  describe('WhatsApp sticker pack creation', () => {
    it('creates valid sticker pack metadata', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');

      mockImageResizer.createResizedImage
        .mockResolvedValueOnce({uri: 'file://mock/resized.webp'})
        .mockResolvedValueOnce({uri: 'file://mock/tray.png'});
      mockRNFS.copyFile.mockResolvedValue(true);
      mockRNFS.stat.mockResolvedValue({size: 50000});
      mockRNFS.writeFile.mockResolvedValue(true);

      const options: ExportOptions = {
        format: {type: 'whatsapp', size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: false,
        whatsappPackName: 'Custom Pack Name',
      };

      await ExportService.exportSticker(mockStickerUri, options);

      const writeFileCall = mockRNFS.writeFile.mock.calls[0];
      const packMetadata = JSON.parse(writeFileCall[1]);

      expect(packMetadata).toMatchObject({
        name: 'Custom Pack Name',
        publisher: 'AI Sticker Generator',
        publisherEmail: 'support@aistickergenerator.com',
        stickers: [
          {
            emojis: ['😊', '🎨'],
          },
        ],
      });
      expect(packMetadata.identifier).toMatch(/^pack_\d+$/);
    });

    it('creates tray image with correct dimensions', async () => {
      const mockImageResizer = require('@bam.tech/react-native-image-resizer');
      const mockRNFS = require('react-native-fs');

      mockImageResizer.createResizedImage
        .mockResolvedValueOnce({uri: 'file://mock/resized.webp'})
        .mockResolvedValueOnce({uri: 'file://mock/tray.png'});
      mockRNFS.copyFile.mockResolvedValue(true);
      mockRNFS.stat.mockResolvedValue({size: 50000});
      mockRNFS.writeFile.mockResolvedValue(true);

      const options: ExportOptions = {
        format: {type: 'whatsapp', size: {width: 512, height: 512}},
        saveToGallery: false,
        shareImmediately: false,
      };

      await ExportService.exportSticker(mockStickerUri, options);

      // Check that tray image was created with correct dimensions
      expect(mockImageResizer.createResizedImage).toHaveBeenCalledWith(
        expect.stringContaining('/mock/documents/sticker_'),
        96,
        96,
        'PNG',
        100,
        0,
        undefined,
        false,
        {mode: 'contain', onlyScaleDown: false},
      );
    });
  });
});