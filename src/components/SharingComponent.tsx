import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  SharingService,
  SharingPlatform,
  SharingResult,
  SharingOptions,
} from '@/services/sharingService';

interface SharingComponentProps {
  filePath: string;
  onSharingComplete: (result: SharingResult) => void;
  onCancel: () => void;
  customMessage?: string;
  customTitle?: string;
}

const {width} = Dimensions.get('window');
const PLATFORM_ITEM_WIDTH = (width - 60) / 4; // 4 items per row with margins

export const SharingComponent: React.FC<SharingComponentProps> = ({
  filePath,
  onSharingComplete,
  onCancel,
  customMessage,
  customTitle,
}) => {
  const [platforms, setPlatforms] = useState<SharingPlatform[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);

  useEffect(() => {
    loadAvailablePlatforms();
  }, []);

  const loadAvailablePlatforms = async () => {
    try {
      const availablePlatforms = SharingService.getAvailablePlatforms();
      
      // Check which platforms are actually installed
      const platformsWithAvailability = await Promise.all(
        availablePlatforms.map(async platform => ({
          ...platform,
          available: await SharingService.isPlatformAvailable(platform.id),
        })),
      );
      
      setPlatforms(platformsWithAvailability);
    } catch (error) {
      console.error('Error loading platforms:', error);
      setPlatforms(SharingService.getAvailablePlatforms());
    }
  };

  const handlePlatformShare = async (platformId: string) => {
    try {
      setIsSharing(true);
      setSharingPlatform(platformId);

      const options: SharingOptions = {
        title: customTitle || 'Check out my AI-generated sticker!',
        message: customMessage || 'I created this awesome sticker using AI. What do you think?',
      };

      const result = await SharingService.shareToSpecificPlatform(
        filePath,
        platformId,
        options,
      );

      // Track sharing event
      await SharingService.trackSharingEvent(
        platformId,
        result.success,
        'ai-generated',
      );

      if (result.success) {
        Alert.alert(
          'Shared Successfully',
          `Your sticker has been shared to ${getPlatformName(platformId)}!`,
          [
            {
              text: 'OK',
              onPress: () => onSharingComplete(result),
            },
          ],
        );
      } else {
        Alert.alert(
          'Sharing Failed',
          result.error || 'Failed to share sticker',
          [
            {
              text: 'Try Again',
              onPress: () => handlePlatformShare(platformId),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error sharing to platform:', error);
      Alert.alert(
        'Sharing Error',
        'An unexpected error occurred while sharing',
        [
          {
            text: 'OK',
            onPress: () => onSharingComplete({success: false, error: 'Sharing failed'}),
          },
        ],
      );
    } finally {
      setIsSharing(false);
      setSharingPlatform(null);
    }
  };

  const handleGenericShare = async () => {
    try {
      setIsSharing(true);
      setSharingPlatform('generic');

      const options: SharingOptions = {
        title: customTitle || 'Check out my AI-generated sticker!',
        message: customMessage || 'I created this awesome sticker using AI. What do you think?',
      };

      const result = await SharingService.openShareDialog(filePath, options);

      // Track sharing event
      await SharingService.trackSharingEvent(
        result.platform || 'generic',
        result.success,
        'ai-generated',
      );

      onSharingComplete(result);
    } catch (error) {
      console.error('Error opening share dialog:', error);
      onSharingComplete({
        success: false,
        error: 'Failed to open share dialog',
      });
    } finally {
      setIsSharing(false);
      setSharingPlatform(null);
    }
  };

  const handleSaveToGallery = async () => {
    try {
      setIsSharing(true);
      setSharingPlatform('gallery');

      const result = await SharingService.saveToGallery(filePath);

      if (result.success) {
        Alert.alert(
          'Saved Successfully',
          'Your sticker has been saved to your photo gallery!',
          [
            {
              text: 'OK',
              onPress: () => onSharingComplete(result),
            },
          ],
        );
      } else {
        Alert.alert(
          'Save Failed',
          result.error || 'Failed to save sticker to gallery',
          [
            {
              text: 'Try Again',
              onPress: handleSaveToGallery,
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert(
        'Save Error',
        'An unexpected error occurred while saving',
        [
          {
            text: 'OK',
            onPress: () => onSharingComplete({success: false, error: 'Save failed'}),
          },
        ],
      );
    } finally {
      setIsSharing(false);
      setSharingPlatform(null);
    }
  };

  const getPlatformName = (platformId: string): string => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || platformId;
  };

  const renderPlatformButton = (platform: SharingPlatform) => {
    const isCurrentlySharing = isSharing && sharingPlatform === platform.id;
    
    return (
      <TouchableOpacity
        key={platform.id}
        style={[
          styles.platformButton,
          !platform.available && styles.disabledPlatform,
          isCurrentlySharing && styles.sharingPlatform,
        ]}
        onPress={() => handlePlatformShare(platform.id)}
        disabled={!platform.available || isSharing}>
        {isCurrentlySharing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.platformIcon}>{platform.icon}</Text>
        )}
        <Text
          style={[
            styles.platformName,
            !platform.available && styles.disabledText,
          ]}>
          {platform.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Your Sticker</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                isSharing && sharingPlatform === 'gallery' && styles.sharingPlatform,
              ]}
              onPress={handleSaveToGallery}
              disabled={isSharing}>
              {isSharing && sharingPlatform === 'gallery' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.quickActionIcon}>💾</Text>
              )}
              <Text style={styles.quickActionText}>Save to Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionButton,
                isSharing && sharingPlatform === 'generic' && styles.sharingPlatform,
              ]}
              onPress={handleGenericShare}
              disabled={isSharing}>
              {isSharing && sharingPlatform === 'generic' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.quickActionIcon}>📤</Text>
              )}
              <Text style={styles.quickActionText}>More Options</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share to Apps</Text>
          <View style={styles.platformGrid}>
            {platforms.map(renderPlatformButton)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.tipTitle}>💡 Sharing Tips</Text>
          <Text style={styles.tipText}>
            • WhatsApp: Perfect for sending stickers in chats{'\n'}
            • Instagram: Share to your story or send as DM{'\n'}
            • Telegram: Great for sticker packs and groups{'\n'}
            • Save to Gallery: Keep your stickers for later use
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  platformButton: {
    width: PLATFORM_ITEM_WIDTH,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  disabledPlatform: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  sharingPlatform: {
    backgroundColor: '#007AFF',
  },
  platformIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});