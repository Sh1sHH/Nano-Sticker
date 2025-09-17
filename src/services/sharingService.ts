import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import {Platform} from 'react-native';
import Linking from 'react-native/Libraries/Linking/Linking';

export interface SharingPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

export interface SharingOptions {
  title?: string;
  message?: string;
  url?: string;
  type?: string;
  subject?: string;
  excludedActivityTypes?: string[];
}

export interface SharingResult {
  success: boolean;
  platform?: string;
  error?: string;
}

export class SharingService {
  private static readonly SUPPORTED_PLATFORMS: SharingPlatform[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      available: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: '#E4405F',
      available: true,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      color: '#0088CC',
      available: true,
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      available: true,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: '#1877F2',
      available: true,
    },
    {
      id: 'messenger',
      name: 'Messenger',
      icon: '💬',
      color: '#0084FF',
      available: true,
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      icon: '👻',
      color: '#FFFC00',
      available: true,
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      color: '#5865F2',
      available: true,
    },
  ];

  /**
   * Get list of available sharing platforms
   */
  static getAvailablePlatforms(): SharingPlatform[] {
    return this.SUPPORTED_PLATFORMS.filter(platform => platform.available);
  }

  /**
   * Share sticker to a specific platform
   */
  static async shareToSpecificPlatform(
    filePath: string,
    platformId: string,
    options: SharingOptions = {},
  ): Promise<SharingResult> {
    try {
      const platform = this.SUPPORTED_PLATFORMS.find(p => p.id === platformId);
      if (!platform) {
        throw new Error(`Platform ${platformId} not supported`);
      }

      const shareOptions = this.buildShareOptions(filePath, platformId, options);

      switch (platformId) {
        case 'whatsapp':
          return await this.shareToWhatsApp(shareOptions);
        case 'instagram':
          return await this.shareToInstagram(shareOptions);
        case 'telegram':
          return await this.shareToTelegram(shareOptions);
        case 'twitter':
          return await this.shareToTwitter(shareOptions);
        case 'facebook':
          return await this.shareToFacebook(shareOptions);
        case 'messenger':
          return await this.shareToMessenger(shareOptions);
        case 'snapchat':
          return await this.shareToSnapchat(shareOptions);
        case 'discord':
          return await this.shareToDiscord(shareOptions);
        default:
          return await this.shareGeneric(shareOptions, platformId);
      }
    } catch (error) {
      console.error(`Error sharing to ${platformId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sharing failed',
      };
    }
  }

  /**
   * Open generic share dialog with all available options
   */
  static async openShareDialog(
    filePath: string,
    options: SharingOptions = {},
  ): Promise<SharingResult> {
    try {
      const shareOptions = {
        title: options.title || 'Share your AI-generated sticker',
        message: options.message || 'Check out this awesome sticker I created!',
        url: `file://${filePath}`,
        type: options.type || 'image/png',
        subject: options.subject,
        excludedActivityTypes: options.excludedActivityTypes || [],
      };

      const result = await Share.open(shareOptions);
      
      return {
        success: true,
        platform: result.app || 'unknown',
      };
    } catch (error) {
      if (error.message === 'User did not share') {
        return {
          success: false,
          error: 'User cancelled sharing',
        };
      }
      
      console.error('Error opening share dialog:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sharing failed',
      };
    }
  }

  /**
   * Save sticker to device gallery
   */
  static async saveToGallery(filePath: string): Promise<SharingResult> {
    try {
      const CameraRoll = require('@react-native-camera-roll/camera-roll');
      await CameraRoll.save(filePath, {type: 'photo'});
      
      return {
        success: true,
        platform: 'gallery',
      };
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save to gallery',
      };
    }
  }

  /**
   * Check if a specific platform app is installed
   */
  static async isPlatformAvailable(platformId: string): Promise<boolean> {
    try {
      const urlSchemes: Record<string, string> = {
        whatsapp: 'whatsapp://',
        instagram: 'instagram://',
        telegram: 'tg://',
        twitter: 'twitter://',
        facebook: 'fb://',
        messenger: 'fb-messenger://',
        snapchat: 'snapchat://',
        discord: 'discord://',
      };

      const scheme = urlSchemes[platformId];
      if (!scheme) return false;

      return await Linking.canOpenURL(scheme);
    } catch (error) {
      console.error(`Error checking platform availability for ${platformId}:`, error);
      return false;
    }
  }

  /**
   * Build share options for specific platform
   */
  private static buildShareOptions(
    filePath: string,
    platformId: string,
    options: SharingOptions,
  ): any {
    const baseOptions = {
      title: options.title || 'Share your AI-generated sticker',
      message: options.message || 'Check out this awesome sticker I created!',
      url: `file://${filePath}`,
      type: options.type || 'image/png',
    };

    // Platform-specific customizations
    switch (platformId) {
      case 'whatsapp':
        return {
          ...baseOptions,
          social: Share.Social.WHATSAPP,
          whatsAppNumber: '', // Can be customized
        };
      case 'instagram':
        return {
          ...baseOptions,
          social: Share.Social.INSTAGRAM,
          backgroundImage: `file://${filePath}`,
        };
      case 'telegram':
        return {
          ...baseOptions,
          social: Share.Social.TELEGRAM,
        };
      case 'twitter':
        return {
          ...baseOptions,
          social: Share.Social.TWITTER,
          hashtags: ['AISticker', 'StickerGenerator'],
        };
      case 'facebook':
        return {
          ...baseOptions,
          social: Share.Social.FACEBOOK,
        };
      case 'messenger':
        return {
          ...baseOptions,
          social: Share.Social.MESSENGER,
        };
      default:
        return baseOptions;
    }
  }

  /**
   * Share to WhatsApp
   */
  private static async shareToWhatsApp(options: any): Promise<SharingResult> {
    try {
      await Share.shareSingle(options);
      return {success: true, platform: 'whatsapp'};
    } catch (error) {
      throw new Error('Failed to share to WhatsApp');
    }
  }

  /**
   * Share to Instagram Stories
   */
  private static async shareToInstagram(options: any): Promise<SharingResult> {
    try {
      await Share.shareSingle(options);
      return {success: true, platform: 'instagram'};
    } catch (error) {
      throw new Error('Failed to share to Instagram');
    }
  }

  /**
   * Share to Telegram
   */
  private static async shareToTelegram(options: any): Promise<SharingResult> {
    try {
      await Share.shareSingle(options);
      return {success: true, platform: 'telegram'};
    } catch (error) {
      throw new Error('Failed to share to Telegram');
    }
  }

  /**
   * Share to Twitter
   */
  private static async shareToTwitter(options: any): Promise<SharingResult> {
    try {
      await Share.shareSingle(options);
      return {success: true, platform: 'twitter'};
    } catch (error) {
      throw new Error('Failed to share to Twitter');
    }
  }

  /**
   * Share to Facebook
   */
  private static async shareToFacebook(options: any): Promise<SharingResult> {
    try {
      await Share.shareSingle(options);
      return {success: true, platform: 'facebook'};
    } catch (error) {
      throw new Error('Failed to share to Facebook');
    }
  }

  /**
   * Share to Messenger
   */
  private static async shareToMessenger(options: any): Promise<SharingResult> {
    try {
      await Share.shareSingle(options);
      return {success: true, platform: 'messenger'};
    } catch (error) {
      throw new Error('Failed to share to Messenger');
    }
  }

  /**
   * Share to Snapchat
   */
  private static async shareToSnapchat(options: any): Promise<SharingResult> {
    try {
      // Snapchat requires special handling
      await Share.open({
        url: options.url,
        type: options.type,
        title: options.title,
      });
      return {success: true, platform: 'snapchat'};
    } catch (error) {
      throw new Error('Failed to share to Snapchat');
    }
  }

  /**
   * Share to Discord
   */
  private static async shareToDiscord(options: any): Promise<SharingResult> {
    try {
      await Share.open({
        url: options.url,
        type: options.type,
        title: options.title,
        message: options.message,
      });
      return {success: true, platform: 'discord'};
    } catch (error) {
      throw new Error('Failed to share to Discord');
    }
  }

  /**
   * Generic sharing fallback
   */
  private static async shareGeneric(
    options: any,
    platformId: string,
  ): Promise<SharingResult> {
    try {
      await Share.open(options);
      return {success: true, platform: platformId};
    } catch (error) {
      throw new Error(`Failed to share to ${platformId}`);
    }
  }

  /**
   * Create shareable link for sticker (if using cloud storage)
   */
  static async createShareableLink(
    filePath: string,
    expirationHours: number = 24,
  ): Promise<string | null> {
    try {
      // This would typically upload to cloud storage and return a shareable URL
      // For now, we'll return null as this requires backend integration
      console.log('Creating shareable link for:', filePath);
      console.log('Link will expire in:', expirationHours, 'hours');
      
      // TODO: Implement cloud storage upload and link generation
      return null;
    } catch (error) {
      console.error('Error creating shareable link:', error);
      return null;
    }
  }

  /**
   * Get sharing analytics (for tracking which platforms are most used)
   */
  static async trackSharingEvent(
    platform: string,
    success: boolean,
    stickerType?: string,
  ): Promise<void> {
    try {
      // This would typically send analytics to a backend service
      console.log('Tracking sharing event:', {
        platform,
        success,
        stickerType,
        timestamp: new Date().toISOString(),
      });
      
      // TODO: Implement analytics tracking
    } catch (error) {
      console.error('Error tracking sharing event:', error);
    }
  }
}