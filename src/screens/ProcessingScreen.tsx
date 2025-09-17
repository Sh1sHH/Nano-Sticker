import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';
import {AIService} from '@/services/aiService';
import {EMOTIONS} from '@/utils/constants';
import {GeneratedSticker} from '@/types';

type ProcessingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Processing'
>;

type ProcessingScreenRouteProp = RouteProp<RootStackParamList, 'Processing'>;

interface Props {
  navigation: ProcessingScreenNavigationProp;
  route: ProcessingScreenRouteProp;
}

const LOADING_MESSAGES = [
  'Creating your masterpiece...',
  'Adding artistic touches...',
  'Bringing colors to life...',
  'Applying AI magic...',
  'Almost ready...',
];

const ProcessingScreen: React.FC<Props> = ({navigation, route}) => {
  const {imageUri, style} = route.params;
  const {selectedImageUri, selectedStyle} = useAppStore();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [generatedStickers, setGeneratedStickers] = useState<GeneratedSticker[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startProcessing();
  }, []);

  const startProcessing = async () => {
    if (!selectedImageUri || !selectedStyle) {
      setError('Missing image or style selection');
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Initialize loading states for all emotions
    const initialStickers: GeneratedSticker[] = EMOTIONS.map(emotion => ({
      emotion: emotion.key,
      imageUrl: null,
      isLoading: true
    }));
    setGeneratedStickers(initialStickers);

    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 15000,
      useNativeDriver: false,
    }).start();

    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2000);

    try {
      // Convert image URI to base64 (simplified - in real app would handle properly)
      const imageData = selectedImageUri.split(',')[1] || selectedImageUri;
      const mimeType = 'image/jpeg';
      
      // Generate stickers for all emotions
      const emotionKeys = EMOTIONS.map(e => e.key);
      const results = await AIService.generateMultipleStickers(
        imageData,
        mimeType,
        selectedStyle.id,
        emotionKeys
      );
      
      setGeneratedStickers(results);
      clearInterval(messageInterval);
      
      // Navigate to results after a short delay
      setTimeout(() => {
        navigation.navigate('Editing', {processedImageUri: imageUri});
      }, 1000);
      
    } catch (error: any) {
      clearInterval(messageInterval);
      console.error('AI processing failed:', error);
      setError(error.message || 'AI processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    startProcessing();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Creating Your Stickers</Text>
        
        {isProcessing && (
          <>
            <View style={styles.animationContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingMessage}>
                {LOADING_MESSAGES[currentMessageIndex]}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>Processing with AI...</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>What's happening?</Text>
              <Text style={styles.infoItem}>• Analyzing your image</Text>
              <Text style={styles.infoItem}>• Applying {selectedStyle?.name || style} style</Text>
              <Text style={styles.infoItem}>• Generating 8 different emotions</Text>
              <Text style={styles.infoItem}>• Optimizing for sticker use</Text>
            </View>
          </>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {generatedStickers.length > 0 && (
          <View style={styles.stickerGrid}>
            <Text style={styles.gridTitle}>Generated Stickers</Text>
            <View style={styles.grid}>
              {generatedStickers.map((sticker, index) => {
                const emotion = EMOTIONS.find(e => e.key === sticker.emotion);
                return (
                  <View key={index} style={styles.stickerItem}>
                    {sticker.isLoading ? (
                      <View style={styles.loadingSticker}>
                        <ActivityIndicator size="small" color="#6366f1" />
                        <Text style={styles.emotionLabel}>
                          {emotion?.tr || sticker.emotion}
                        </Text>
                      </View>
                    ) : sticker.imageUrl ? (
                      <View style={styles.completedSticker}>
                        <Image 
                          source={{uri: sticker.imageUrl}} 
                          style={styles.stickerImage}
                        />
                        <Text style={styles.emotionLabel}>
                          {emotion?.tr || sticker.emotion}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.failedSticker}>
                        <Text style={styles.failedText}>❌</Text>
                        <Text style={styles.emotionLabel}>
                          {emotion?.tr || sticker.emotion}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
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
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 40,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingMessage: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  stickerGrid: {
    width: '100%',
    marginTop: 20,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stickerItem: {
    width: '23%',
    aspectRatio: 1,
    marginBottom: 12,
  },
  loadingSticker: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  completedSticker: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  failedSticker: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  stickerImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
  },
  emotionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    paddingVertical: 4,
  },
  failedText: {
    fontSize: 20,
    marginBottom: 4,
  },
});

export default ProcessingScreen;