import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SelfieSegmentation from 'react-native-image-selfie-segmentation';
import ManualEditingComponent from './ManualEditingComponent';

interface MLKitSegmentationComponentProps {
  imageUri: string;
  onSegmentationComplete: (segmentedImageUri: string) => void;
  onSegmentationError: (error: string) => void;
  onManualEditingRequested: () => void;
}

interface SegmentationResult {
  success: boolean;
  segmentedImageUri?: string;
  error?: string;
}

const MLKitSegmentationComponent: React.FC<MLKitSegmentationComponentProps> = ({
  imageUri,
  onSegmentationComplete,
  onSegmentationError,
  onManualEditingRequested,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [segmentedImageUri, setSegmentedImageUri] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showManualEditing, setShowManualEditing] = useState(false);

  const segmentObject = useCallback(async (): Promise<SegmentationResult> => {
    try {
      setIsProcessing(true);
      
      // Use the selfie segmentation library to perform object segmentation
      // The library only has replaceBackground method, so we'll use a transparent background
      const transparentBackground = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent PNG
      
      const result = await SelfieSegmentation.replaceBackground(
        imageUri,
        transparentBackground,
        1024 // Max size
      );

      if (result) {
        return {
          success: true,
          segmentedImageUri: result,
        };
      } else {
        return {
          success: false,
          error: 'Segmentation failed - no result returned',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown segmentation error',
      };
    } finally {
      setIsProcessing(false);
    }
  }, [imageUri]);

  const extractForeground = useCallback(async () => {
    const result = await segmentObject();
    
    if (result.success && result.segmentedImageUri) {
      setSegmentedImageUri(result.segmentedImageUri);
      setShowPreview(true);
    } else {
      onSegmentationError(result.error || 'Segmentation failed');
    }
  }, [segmentObject, onSegmentationError]);

  const createTransparentBackground = useCallback(() => {
    // This is handled automatically by the segmentation library
    // The segmented image already has a transparent background
    if (segmentedImageUri) {
      onSegmentationComplete(segmentedImageUri);
    }
  }, [segmentedImageUri, onSegmentationComplete]);

  const provideManualEditingTools = useCallback(() => {
    setShowManualEditing(true);
  }, []);

  const handleManualEditingComplete = useCallback((editedImageUri: string) => {
    setShowManualEditing(false);
    onSegmentationComplete(editedImageUri);
  }, [onSegmentationComplete]);

  const handleManualEditingCancel = useCallback(() => {
    setShowManualEditing(false);
  }, []);

  const handleSegmentationStart = useCallback(() => {
    extractForeground();
  }, [extractForeground]);

  const handleAcceptSegmentation = useCallback(() => {
    createTransparentBackground();
  }, [createTransparentBackground]);

  const handleRetrySegmentation = useCallback(() => {
    setSegmentedImageUri(null);
    setShowPreview(false);
    extractForeground();
  }, [extractForeground]);

  if (showManualEditing) {
    return (
      <ManualEditingComponent
        imageUri={imageUri}
        onEditingComplete={handleManualEditingComplete}
        onEditingCancel={handleManualEditingCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Object Segmentation</Text>
      
      {/* Original Image Preview */}
      <View style={styles.imageContainer}>
        <Text style={styles.label}>Original Image:</Text>
        <Image source={{ uri: imageUri }} style={styles.image} />
      </View>

      {/* Segmented Image Preview */}
      {showPreview && segmentedImageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.label}>Segmented Image:</Text>
          <Image source={{ uri: segmentedImageUri }} style={styles.image} />
        </View>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Segmenting object...</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!showPreview && !isProcessing && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSegmentationStart}
          >
            <Text style={styles.primaryButtonText}>Start Segmentation</Text>
          </TouchableOpacity>
        )}

        {showPreview && !isProcessing && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAcceptSegmentation}
            >
              <Text style={styles.primaryButtonText}>Accept Result</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleRetrySegmentation}
            >
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={provideManualEditingTools}
            >
              <Text style={styles.secondaryButtonText}>Manual Edit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MLKitSegmentationComponent;