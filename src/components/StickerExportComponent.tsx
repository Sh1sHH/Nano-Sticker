import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import {
  ExportFormat,
  ExportOptions,
  ExportResult,
  WhatsAppStickerPack,
  WhatsAppSticker,
} from '@/types';

interface StickerExportComponentProps {
  stickerUri: string;
  onExportComplete: (result: ExportResult) => void;
  onCancel: () => void;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {type: 'png', size: {width: 512, height: 512}},
  {type: 'jpeg', quality: 90, size: {width: 512, height: 512}},
  {type: 'webp', quality: 85, size: {width: 512, height: 512}},
  {type: 'whatsapp', size: {width: 512, height: 512}},
];

const WHATSAPP_STICKER_SIZE = 512;
const MAX_STICKER_FILE_SIZE = 100 * 1024; // 100KB limit for WhatsApp

export const StickerExportComponent: React.FC<StickerExportComponentProps> = ({
  stickerUri,
  onExportComplete,
  onCancel,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    EXPORT_FORMATS[0],
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: EXPORT_FORMATS[0],
    saveToGallery: true,
    shareImmediately: false,
  });

  const generateUniqueFileName = (format: ExportFormat): string => {
    const timestamp = Date.now();
    const extension = format.type === 'whatsapp' ? 'webp' : format.type;
    return `sticker_${timestamp}.${extension}`;
  };

  const resizeImageForFormat = async (
    sourceUri: string,
    format: ExportFormat,
  ): Promise<string> => {
    const ImageResizer = require('@bam.tech/react-native-image-resizer');
    
    const resizeFormat = format.type === 'whatsapp' ? 'WEBP' : format.type.toUpperCase();
    const quality = format.quality || (format.type === 'png' ? 100 : 85);
    
    try {
      const resizedImage = await ImageResizer.createResizedImage(
        sourceUri,
        format.size?.width || WHATSAPP_STICKER_SIZE,
        format.size?.height || WHATSAPP_STICKER_SIZE,
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
  };

  const validateWhatsAppSticker = async (filePath: string): Promise<boolean> => {
    try {
      const stats = await RNFS.stat(filePath);
      if (stats.size > MAX_STICKER_FILE_SIZE) {
        throw new Error(
          `Sticker file size (${Math.round(stats.size / 1024)}KB) exceeds WhatsApp limit (100KB)`,
        );
      }
      return true;
    } catch (error) {
      console.error('WhatsApp sticker validation failed:', error);
      return false;
    }
  };

  const createWhatsAppStickerPack = async (
    stickerPath: string,
    packName: string = 'My Stickers',
  ): Promise<WhatsAppStickerPack> => {
    const packId = `pack_${Date.now()}`;
    const trayImagePath = await createTrayImage(stickerPath);
    
    const stickerPack: WhatsAppStickerPack = {
      identifier: packId,
      name: packName,
      publisher: 'AI Sticker Generator',
      trayImageFile: trayImagePath,
      publisherEmail: 'support@aistickergenerator.com',
      stickers: [
        {
          imageFile: stickerPath,
          emojis: ['😊', '🎨'], // Default emojis, could be customized
        },
      ],
    };
    
    return stickerPack;
  };

  const createTrayImage = async (stickerPath: string): Promise<string> => {
    // Create a smaller version for the tray (96x96 pixels)
    const ImageResizer = require('@bam.tech/react-native-image-resizer');
    
    try {
      const trayImage = await ImageResizer.createResizedImage(
        stickerPath,
        96,
        96,
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
  };

  const saveToGallery = async (filePath: string): Promise<boolean> => {
    try {
      const CameraRoll = require('@react-native-camera-roll/camera-roll');
      await CameraRoll.save(filePath, {type: 'photo'});
      return true;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return false;
    }
  };

  const shareSticker = async (filePath: string, format: ExportFormat) => {
    const shareOptions = {
      title: 'Share your AI-generated sticker',
      message: 'Check out this awesome sticker I created!',
      url: `file://${filePath}`,
      type: format.type === 'png' ? 'image/png' : 
            format.type === 'jpeg' ? 'image/jpeg' : 
            'image/webp',
    };

    try {
      await Share.open(shareOptions);
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing sticker:', error);
        throw error;
      }
    }
  };

  const exportSticker = async (): Promise<ExportResult> => {
    try {
      setIsExporting(true);
      
      // Resize image according to selected format
      const resizedUri = await resizeImageForFormat(stickerUri, selectedFormat);
      
      // Generate file path
      const fileName = generateUniqueFileName(selectedFormat);
      const documentsPath = RNFS.DocumentDirectoryPath;
      const filePath = `${documentsPath}/${fileName}`;
      
      // Copy resized image to final location
      await RNFS.copyFile(resizedUri, filePath);
      
      // Special handling for WhatsApp format
      if (selectedFormat.type === 'whatsapp') {
        const isValid = await validateWhatsAppSticker(filePath);
        if (!isValid) {
          throw new Error('Sticker does not meet WhatsApp requirements');
        }
        
        const stickerPack = await createWhatsAppStickerPack(
          filePath,
          exportOptions.whatsappPackName,
        );
        
        // Save pack metadata
        const packMetadataPath = `${documentsPath}/sticker_pack_${stickerPack.identifier}.json`;
        await RNFS.writeFile(packMetadataPath, JSON.stringify(stickerPack, null, 2));
      }
      
      // Save to gallery if requested
      if (exportOptions.saveToGallery) {
        await saveToGallery(filePath);
      }
      
      // Share immediately if requested
      if (exportOptions.shareImmediately) {
        await shareSticker(filePath, selectedFormat);
      }
      
      return {
        success: true,
        filePath,
        packId: selectedFormat.type === 'whatsapp' ? `pack_${Date.now()}` : undefined,
      };
      
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    const result = await exportSticker();
    
    if (result.success) {
      Alert.alert(
        'Export Successful',
        `Sticker exported successfully${exportOptions.saveToGallery ? ' and saved to gallery' : ''}!`,
        [
          {
            text: 'OK',
            onPress: () => onExportComplete(result),
          },
        ],
      );
    } else {
      Alert.alert(
        'Export Failed',
        result.error || 'An error occurred during export',
        [
          {
            text: 'OK',
            onPress: () => onExportComplete(result),
          },
        ],
      );
    }
  };

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({
      ...prev,
      ...updates,
      format: selectedFormat,
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Export Sticker</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          {EXPORT_FORMATS.map((format, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.formatOption,
                selectedFormat.type === format.type && styles.selectedFormat,
              ]}
              onPress={() => {
                setSelectedFormat(format);
                updateExportOptions({format});
              }}>
              <Text style={styles.formatText}>
                {format.type.toUpperCase()}
                {format.type === 'whatsapp' && ' (Sticker Pack)'}
              </Text>
              <Text style={styles.formatDetails}>
                {format.size?.width}x{format.size?.height}
                {format.quality && ` • Quality: ${format.quality}%`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() =>
              updateExportOptions({saveToGallery: !exportOptions.saveToGallery})
            }>
            <Text style={styles.optionText}>Save to Gallery</Text>
            <View
              style={[
                styles.checkbox,
                exportOptions.saveToGallery && styles.checkedBox,
              ]}>
              {exportOptions.saveToGallery && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() =>
              updateExportOptions({
                shareImmediately: !exportOptions.shareImmediately,
              })
            }>
            <Text style={styles.optionText}>Share Immediately</Text>
            <View
              style={[
                styles.checkbox,
                exportOptions.shareImmediately && styles.checkedBox,
              ]}>
              {exportOptions.shareImmediately && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {selectedFormat.type === 'whatsapp' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WhatsApp Pack Name</Text>
            <Text style={styles.whatsappNote}>
              Your sticker will be packaged for WhatsApp with optimized size and format.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.disabledButton]}
          onPress={handleExport}
          disabled={isExporting}>
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.exportButtonText}>
              Export {selectedFormat.type.toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  formatOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFormat: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  formatText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  formatDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  whatsappNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});