import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {
  ExportFormat,
  ExportOptions,
  ExportResult,
  WhatsAppStickerPack,
  WhatsAppSticker,
} from '@/types';

export class ExportService {
  private static readonly WHATSAPP_STICKER_SIZE = 512;
  private static readonly MAX_STICKER_FILE_SIZE = 100 * 1024; // 100KB
  private static readonly TRAY_IMAGE_SIZE = 96;

  /**
   * Export a sticker with the specified options
   */
  static async exportSticker(
    stickerUri: string,
    options: ExportOptions,
  ): Promise<ExportResult> {
    try {
      // Resize image according to format requirements
      const resizedUri = await this.resizeImageForFormat(
        stickerUri,
        options.format,
      );

      // Generate unique filename
      const fileName = this.generateUniqueFileName(options.format);
      const documentsPath = RNFS.DocumentDirectoryPath;
      const filePath = `${documentsPath}/${fileName}`;

      // Copy resized image to final location
      await RNFS.copyFile(resizedUri, filePath);

      let packId: string | undefined;

      // Handle WhatsApp-specific processing
      if (options.format.type === 'whatsapp') {
        const isValid = await this.validateWhatsAppSticker(filePath);
        if (!isValid) {
          throw new Error('Sticker does not meet WhatsApp requirements');
        }

        const stickerPack = await this.createWhatsAppStickerPack(
          filePath,
          options.whatsappPackName || 'My Stickers',
        );

        packId = stickerPack.identifier;

        // Save pack metadata
        const packMetadataPath = `${documentsPath}/sticker_pack_${stickerPack.identifier}.json`;
        await RNFS.writeFile(
          packMetadataPath,
          JSON.stringify(stickerPack, null, 2),
        );
      }

      // Save to gallery if requested
      if (options.saveToGallery) {
        await this.saveToGallery(filePath);
      }

      // Share immediately if requested
      if (options.shareImmediately) {
        await this.shareSticker(filePath, options.format);
      }

      return {
        success: true,
        filePath,
        packId,
      };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Resize image according to format specifications
   */
  private static async resizeImageForFormat(
    sourceUri: string,
    format: ExportFormat,
  ): Promise<string> {
    const ImageResizer = require('@bam.tech/react-native-image-resizer');

    const resizeFormat =
      format.type === 'whatsapp' ? 'WEBP' : format.type.toUpperCase();
    const quality = format.quality || (format.type === 'png' ? 100 : 85);

    try {
      const resizedImage = await ImageResizer.createResizedImage(
        sourceUri,
        format.size?.width || this.WHATSAPP_STICKER_SIZE,
        format.size?.height || this.WHATSAPP_STICKER_SIZE,
        resizeFormat,
        quality,
        0, // rotation
        undefined, // outputPath
        false, // keepMeta
        {
          mode: 'contain',
          onlyScaleDown: false,
        },
      );

      return resizedImage.uri;
    } catch (error) {
      console.error('Error resizing image:', error);
      throw new Error('Failed to resize image for export');
    }
  }

  /**
   * Generate unique filename for export
   */
  private static generateUniqueFileName(format: ExportFormat): string {
    const timestamp = Date.now();
    const extension = format.type === 'whatsapp' ? 'webp' : format.type;
    return `sticker_${timestamp}.${extension}`;
  }

  /**
   * Validate WhatsApp sticker requirements
   */
  private static async validateWhatsAppSticker(
    filePath: string,
  ): Promise<boolean> {
    try {
      const stats = await RNFS.stat(filePath);
      if (stats.size > this.MAX_STICKER_FILE_SIZE) {
        throw new Error(
          `Sticker file size (${Math.round(
            stats.size / 1024,
          )}KB) exceeds WhatsApp limit (100KB)`,
        );
      }
      return true;
    } catch (error) {
      console.error('WhatsApp sticker validation failed:', error);
      return false;
    }
  }

  /**
   * Create WhatsApp sticker pack metadata
   */
  private static async createWhatsAppStickerPack(
    stickerPath: string,
    packName: string,
  ): Promise<WhatsAppStickerPack> {
    const packId = `pack_${Date.now()}`;
    const trayImagePath = await this.createTrayImage(stickerPath);

    const stickerPack: WhatsAppStickerPack = {
      identifier: packId,
      name: packName,
      publisher: 'AI Sticker Generator',
      trayImageFile: trayImagePath,
      publisherEmail: 'support@aistickergenerator.com',
      stickers: [
        {
          imageFile: stickerPath,
          emojis: ['😊', '🎨'], // Default emojis
        },
      ],
    };

    return stickerPack;
  }

  /**
   * Create tray image for WhatsApp sticker pack
   */
  private static async createTrayImage(stickerPath: string): Promise<string> {
    const ImageResizer = require('@bam.tech/react-native-image-resizer');

    try {
      const trayImage = await ImageResizer.createResizedImage(
        stickerPath,
        this.TRAY_IMAGE_SIZE,
        this.TRAY_IMAGE_SIZE,
        'PNG',
        100,
        0,
        undefined,
        false,
        {
          mode: 'contain',
          onlyScaleDown: false,
        },
      );

      return trayImage.uri;
    } catch (error) {
      console.error('Error creating tray image:', error);
      throw new Error('Failed to create tray image');
    }
  }

  /**
   * Save sticker to device gallery
   */
  private static async saveToGallery(filePath: string): Promise<boolean> {
    try {
      const CameraRoll = require('@react-native-camera-roll/camera-roll');
      await CameraRoll.save(filePath, {type: 'photo'});
      return true;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return false;
    }
  }

  /**
   * Share sticker using native sharing
   */
  private static async shareSticker(
    filePath: string,
    format: ExportFormat,
  ): Promise<void> {
    const shareOptions = {
      title: 'Share your AI-generated sticker',
      message: 'Check out this awesome sticker I created!',
      url: `file://${filePath}`,
      type:
        format.type === 'png'
          ? 'image/png'
          : format.type === 'jpeg'
          ? 'image/jpeg'
          : 'image/webp',
    };

    try {
      await Share.open(shareOptions);
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing sticker:', error);
        throw error;
      }
    }
  }

  /**
   * Get available export formats
   */
  static getAvailableFormats(): ExportFormat[] {
    return [
      {type: 'png', size: {width: 512, height: 512}},
      {type: 'jpeg', quality: 90, size: {width: 512, height: 512}},
      {type: 'webp', quality: 85, size: {width: 512, height: 512}},
      {type: 'whatsapp', size: {width: 512, height: 512}},
    ];
  }

  /**
   * Get WhatsApp sticker requirements info
   */
  static getWhatsAppRequirements() {
    return {
      maxFileSize: this.MAX_STICKER_FILE_SIZE,
      requiredSize: this.WHATSAPP_STICKER_SIZE,
      format: 'WEBP',
      trayImageSize: this.TRAY_IMAGE_SIZE,
    };
  }
}