import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';

type SegmentationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Segmentation'
>;

type SegmentationScreenRouteProp = RouteProp<
  RootStackParamList,
  'Segmentation'
>;

interface Props {
  navigation: SegmentationScreenNavigationProp;
  route: SegmentationScreenRouteProp;
}

const SegmentationScreen: React.FC<Props> = ({navigation, route}) => {
  const {imageUri} = route.params;
  const {setSegmentedImageUri} = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [segmentedUri, setSegmentedUri] = useState<string | null>(null);

  useEffect(() => {
    performSegmentation();
  }, []);

  const performSegmentation = async () => {
    setIsProcessing(true);
    
    try {
      // TODO: Implement ML Kit segmentation
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock segmented image (in real implementation, this would be the ML Kit result)
      const mockSegmentedUri = imageUri; // Placeholder
      setSegmentedUri(mockSegmentedUri);
      setSegmentedImageUri(mockSegmentedUri);
    } catch (error) {
      console.error('Segmentation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (segmentedUri) {
      navigation.navigate('StyleSelection', {segmentedImageUri: segmentedUri});
    }
  };

  const handleRetry = () => {
    performSegmentation();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Object Detection</Text>
        <Text style={styles.subtitle}>
          Automatically detecting and cutting out the main object
        </Text>

        <View style={styles.imageContainer}>
          {imageUri && (
            <Image source={{uri: imageUri}} style={styles.image} />
          )}
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>

        {!isProcessing && segmentedUri && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>✅ Object detected successfully!</Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isProcessing && !segmentedUri && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Could not detect object automatically
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  resultText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SegmentationScreen;