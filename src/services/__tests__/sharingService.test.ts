import {SharingService, SharingOptions} from '../sharingService';
import Linking from 'react-native/Libraries/Linking/Linking';

// Mock dependencies are handled in jest.setup.js

describe('SharingService', () => {
  const mockFilePath = '/mock/sticker.png';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailablePlatforms', () => {
    it('returns list of supported platforms', () => {
      const platforms = SharingService.getAvailablePlatforms();

      expect(platforms).toHaveLength(8);
      expect(platforms.map(p => p.id)).toEqual([
        'whatsapp',
        'instagram',
        'telegram',
        'twitter',
        'facebook',
        'messenger',
        'snapchat',
        'discord',
      ]);
      
      platforms.forEach(platform => {
        expect(platform).toHaveProperty('name');
        expect(platform).toHaveProperty('icon');
        expect(platform).toHaveProperty('color');
        expect(platform.available).toBe(true);
      });
    });
  });

  describe('shareToSpecificPlatform', () => {
    it('shares to WhatsApp successfully', async () => {
      const mockShare = require('react-native-share');
      mockShare.shareSingle.mockResolvedValue(true);

      const result = await SharingService.shareToSpecificPlatform(
        mockFilePath,
        'whatsapp',
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('whatsapp');
      expect(mockShare.shareSingle).toHaveBeenCalledWith(
        expect.objectContaining({
          social: mockShare.Social.WHATSAPP,
          url: `file://${mockFilePath}`,
        }),
      );
    });

    it('shares to Instagram successfully', async () => {
      const mockShare = require('react-native-share');
      mockShare.shareSingle.mockResolvedValue(true);

      const result = await SharingService.shareToSpecificPlatform(
        mockFilePath,
        'instagram',
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('instagram');
      expect(mockShare.shareSingle).toHaveBeenCalledWith(
        expect.objectContaining({
          social: mockShare.Social.INSTAGRAM,
          backgroundImage: `file://${mockFilePath}`,
        }),
      );
    });

    it('shares to Twitter with hashtags', async () => {
      const mockShare = require('react-native-share');
      mockShare.shareSingle.mockResolvedValue(true);

      const result = await SharingService.shareToSpecificPlatform(
        mockFilePath,
        'twitter',
      );

      expect(result.success).toBe(true);
      expect(result.platform).toBe('twitter');
      expect(mockShare.shareSingle).toHaveBeenCalledWith(
        expect.objectContaining({
          social: mockShare.Social.TWITTER,
          hashtags: ['AISticker', 'StickerGenerator'],
        }),
      );
    });

    it('handles sharing errors gracefully', async () => {
      const mockShare = require('react-native-share');
      mockShare.shareSingle.mockRejectedValue(new Error('Sharing failed'));

      const result = await SharingService.shareToSpecificPlatform(
        mockFilePath,
        'whatsapp',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to share to WhatsApp');
    });

    it('handles unsupported platform', async () => {
      const result = await SharingService.shareToSpecificPlatform(
        mockFilePath,
        'unsupported-platform',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Platform unsupported-platform not supported');
    });

    it('uses custom sharing options', async () => {
      const mockShare = require('react-native-share');
      mockShare.shareSingle.mockResolvedValue(true);

      const customOptions: SharingOptions = {
        title: 'Custom Title',
        message: 'Custom Message',
      };

      await SharingService.shareToSpecificPlatform(
        mockFilePath,
        'whatsapp',
        customOptions,
      );

      expect(mockShare.shareSingle).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Title',
          message: 'Custom Message',
        }),
      );
    });
  });

  describe('openShareDialog', () => {
    it('opens generic share dialog successfully', async () => {
      const mockShare = require('react-native-share');
      mockShare.open.mockResolvedValue({app: 'com.example.app'});

      const result = await SharingService.openShareDialog(mockFilePath);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('com.example.app');
      expect(mockShare.open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `file://${mockFilePath}`,
          type: 'image/png',
        }),
      );
    });

    it('handles user cancellation', async () => {
      const mockShare = require('react-native-share');
      mockShare.open.mockRejectedValue(new Error('User did not share'));

      const result = await SharingService.openShareDialog(mockFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User cancelled sharing');
    });

    it('handles sharing errors', async () => {
      const mockShare = require('react-native-share');
      mockShare.open.mockRejectedValue(new Error('Network error'));

      const result = await SharingService.openShareDialog(mockFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('uses custom options', async () => {
      const mockShare = require('react-native-share');
      mockShare.open.mockResolvedValue({app: 'com.example.app'});

      const customOptions: SharingOptions = {
        title: 'Custom Share Title',
        message: 'Custom Share Message',
        type: 'image/jpeg',
      };

      await SharingService.openShareDialog(mockFilePath, customOptions);

      expect(mockShare.open).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Share Title',
          message: 'Custom Share Message',
          type: 'image/jpeg',
        }),
      );
    });
  });

  describe('saveToGallery', () => {
    it('saves to gallery successfully', async () => {
      const mockCameraRoll = require('@react-native-camera-roll/camera-roll');
      mockCameraRoll.save.mockResolvedValue(true);

      const result = await SharingService.saveToGallery(mockFilePath);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('gallery');
      expect(mockCameraRoll.save).toHaveBeenCalledWith(mockFilePath, {
        type: 'photo',
      });
    });

    it('handles save errors', async () => {
      const mockCameraRoll = require('@react-native-camera-roll/camera-roll');
      mockCameraRoll.save.mockRejectedValue(new Error('Permission denied'));

      const result = await SharingService.saveToGallery(mockFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('isPlatformAvailable', () => {
    it('checks platform availability using URL schemes', async () => {
      const mockLinking = Linking as jest.Mocked<typeof Linking>;
      mockLinking.canOpenURL = jest.fn().mockResolvedValue(true);

      const isAvailable = await SharingService.isPlatformAvailable('whatsapp');

      expect(isAvailable).toBe(true);
      expect(mockLinking.canOpenURL).toHaveBeenCalledWith('whatsapp://');
    });

    it('returns false for unavailable platforms', async () => {
      const mockLinking = Linking as jest.Mocked<typeof Linking>;
      mockLinking.canOpenURL = jest.fn().mockResolvedValue(false);

      const isAvailable = await SharingService.isPlatformAvailable('instagram');

      expect(isAvailable).toBe(false);
      expect(mockLinking.canOpenURL).toHaveBeenCalledWith('instagram://');
    });

    it('returns false for unsupported platforms', async () => {
      const isAvailable = await SharingService.isPlatformAvailable('unknown');

      expect(isAvailable).toBe(false);
    });

    it('handles URL checking errors', async () => {
      const mockLinking = Linking as jest.Mocked<typeof Linking>;
      mockLinking.canOpenURL = jest.fn().mockRejectedValue(new Error('URL check failed'));

      const isAvailable = await SharingService.isPlatformAvailable('whatsapp');

      expect(isAvailable).toBe(false);
    });
  });

  describe('createShareableLink', () => {
    it('returns null for now (not implemented)', async () => {
      const link = await SharingService.createShareableLink(mockFilePath);

      expect(link).toBeNull();
    });

    it('logs creation parameters', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await SharingService.createShareableLink(mockFilePath, 48);

      expect(consoleSpy).toHaveBeenCalledWith('Creating shareable link for:', mockFilePath);
      expect(consoleSpy).toHaveBeenCalledWith('Link will expire in:', 48, 'hours');

      consoleSpy.mockRestore();
    });
  });

  describe('trackSharingEvent', () => {
    it('logs sharing events for analytics', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await SharingService.trackSharingEvent('whatsapp', true, 'ai-generated');

      expect(consoleSpy).toHaveBeenCalledWith('Tracking sharing event:', {
        platform: 'whatsapp',
        success: true,
        stickerType: 'ai-generated',
        timestamp: expect.any(String),
      });

      consoleSpy.mockRestore();
    });

    it('handles tracking errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Tracking failed');
      });

      await SharingService.trackSharingEvent('instagram', false);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error tracking sharing event:', expect.any(Error));

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});