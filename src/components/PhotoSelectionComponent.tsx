import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
  ImagePickerOptions,
} from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { ImageProcessingOptions } from '@/types';
import { ImageProcessingService } from '@/services/imageService';

interface PhotoSelectionComponentProps {
  onImageSelected: (imageUri: string) => void;
  onError: (error: string) => void;
  processingOptions?: ImageProcessingOptions;
}

interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  needsCompression?: boolean;
}

const PhotoSelectionComponent: React.FC<PhotoSelectionComponentProps> = ({
  onImageSelected,
  onError,
  processingOptions = {
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    format: 'jpeg',
  },
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Supported image formats
  const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MIN_DIMENSIONS = { width: 200, height: 200 };

  const validateImage = (asset: any): ImageValidationResult => {
    if (!asset) {
      return { isValid: false, error: 'No image selected' };
    }

    // Check file size
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      return { isValid: false, error: 'Image file is too large (max 10MB)' };
    }

    // Check dimensions
    if (asset.width && asset.height) {
      if (asset.width < MIN_DIMENSIONS.width || asset.height < MIN_DIMENSIONS.height) {
        return {
          isValid: false,
          error: `Image is too small (minimum ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px)`,
        };
      }
    }

    // Check format
    if (asset.fileName) {
      const extension = asset.fileName.split('.').pop()?.toLowerCase();
      if (extension && !SUPPORTED_FORMATS.includes(extension)) {
        return {
          isValid: false,
          error: `Unsupported format. Please use: ${SUPPORTED_FORMATS.join(', ')}`,
        };
      }
    }

    // Check if compression is needed
    const needsCompression = 
      (asset.width && asset.width > processingOptions.maxWidth) ||
      (asset.height && asset.height > processingOptions.maxHeight) ||
      (asset.fileSize && asset.fileSize > 2 * 1024 * 1024); // 2MB threshold

    return { isValid: true, needsCompression };
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    setIsLoading(false);

    if (response.didCancel) {
      return;
    }

    if (response.errorMessage) {
      onError(`Image selection failed: ${response.errorMessage}`);
      return;
    }

    if (!response.assets || response.assets.length === 0) {
      onError('No image was selected');
      return;
    }

    const asset = response.assets[0];
    
    if (!asset.uri) {
      onError('Image URI is not available');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the new ImageProcessingService for validation and preprocessing
      const validation = await ImageProcessingService.validateImage(asset.uri);
      
      if (!validation.isValid) {
        onError(validation.errors.join(', '));
        return;
      }

      // Check if compression is needed based on validation metadata
      if (validation.metadata) {
        const needsCompression = 
          validation.metadata.size > 2 * 1024 * 1024 || // > 2MB
          validation.metadata.width > processingOptions.maxWidth ||
          validation.metadata.height > processingOptions.maxHeight;

        if (needsCompression) {
          // Compress the image
          const compressionResult = await ImageProcessingService.compressImage(asset.uri, processingOptions);
          onImageSelected(compressionResult.uri);
        } else {
          // Use original image
          onImageSelected(asset.uri);
        }
      } else {
        // Fallback to original validation logic
        const basicValidation = validateImage(asset);
        if (!basicValidation.isValid) {
          onError(basicValidation.error || 'Invalid image');
          return;
        }
        onImageSelected(asset.uri);
      }
    } catch (error) {
      onError(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        return result === RESULTS.GRANTED;
      } else {
        // Android 13+ uses different permissions
        const permission = Number(Platform.Version) >= 33 
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        
        const result = await request(permission);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const selectFromGallery = async () => {
    setIsLoading(true);
    
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      setIsLoading(false);
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to select images.',
        [{ text: 'OK' }]
      );
      return;
    }

    const options: ImagePickerOptions = {
      mediaType: 'photo' as MediaType,
      quality: processingOptions.quality,
      maxWidth: processingOptions.maxWidth,
      maxHeight: processingOptions.maxHeight,
      includeBase64: false,
      includeExtra: true,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const captureFromCamera = async () => {
    setIsLoading(true);
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setIsLoading(false);
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    const options: ImagePickerOptions = {
      mediaType: 'photo' as MediaType,
      quality: processingOptions.quality,
      maxWidth: processingOptions.maxWidth,
      maxHeight: processingOptions.maxHeight,
      includeBase64: false,
      includeExtra: true,
    };

    launchCamera(options, handleImageResponse);
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, isLoading && styles.disabledButton]}
          onPress={selectFromGallery}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : (
            <>
              <Text style={styles.optionIcon}>📷</Text>
              <Text style={styles.optionTitle}>Gallery</Text>
              <Text style={styles.optionSubtitle}>Choose from your photos</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, isLoading && styles.disabledButton]}
          onPress={captureFromCamera}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : (
            <>
              <Text style={styles.optionIcon}>📸</Text>
              <Text style={styles.optionTitle}>Camera</Text>
              <Text style={styles.optionSubtitle}>Take a new photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for best results:</Text>
        <Text style={styles.tipItem}>• Use clear, well-lit photos</Text>
        <Text style={styles.tipItem}>• Avoid cluttered backgrounds</Text>
        <Text style={styles.tipItem}>• Make sure the subject is visible</Text>
        <Text style={styles.tipItem}>• Minimum size: {MIN_DIMENSIONS.width}x{MIN_DIMENSIONS.height}px</Text>
        <Text style={styles.tipItem}>• Maximum file size: 10MB</Text>
        <Text style={styles.tipItem}>• Supported formats: {SUPPORTED_FORMATS.join(', ')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  optionsContainer: {
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  tipsContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
  },
});

export default PhotoSelectionComponent;