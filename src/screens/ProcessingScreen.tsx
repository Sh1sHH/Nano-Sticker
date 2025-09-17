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
import {EMOTIONS, COLORS} from '@/utils/constants';
import {GeneratedSticker} from '@/types';
import {AIProcessingAnimation} from '@/components/AIProcessingAnimation';
import {ScreenTransition} from '@/components/ScreenTransition';
import {CreditUsageNotification} from '@/components/CreditUsageNotification';
import {useCreditManagement} from '@/hooks/useCreditManagement';

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
  
  const {
    deductStickerGenerationCredit,
    showUsageNotification,
    lastUsage,
    hideUsageNotification,
  } = useCreditManagement();

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
      // Deduct credits for sticker generation
      const creditResult = deductStickerGenerationCredit();
      if (!creditResult.success) {
        setError(creditResult.error || 'Insufficient credits');
        return;
      }

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
      <ScreenTransition type="slideUp" duration={600}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Creating Your Stickers</Text>
          
          {isProcessing && (
            <>
              <AIProcessingAnimation
                isProcessing={isProcessing}
                progress={progress._value || 0}
                style={styles.processingAnimation}
              />

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
      </ScreenTransition>

      <CreditUsageNotification
        visible={showUsageNotification}
        onClose={hideUsageNotification}
        onPurchasePress={() => {
          hideUsageNotification();
          navigation.navigate('CreditPurchase');
        }}
        creditsUsed={lastUsage?.creditsUsed || 0}
        remainingCredits={lastUsage?.remainingCredits || 0}
        action={lastUsage?.action || ''}
        showPurchaseOption={lastUsage?.remainingCredits === 0 || (lastUsage?.remainingCredits || 0) <= 5}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 40,
  },
  processingAnimation: {
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: COLORS.white,
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
    color: COLORS.black,
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: COLORS.secondary,
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
    color: COLORS.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  stickerGrid: {
    width: '100%',
    marginTop: 20,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
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
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
  },
  completedSticker: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    color: COLORS.gray[700],
    textAlign: 'center',
    paddingVertical: 4,
  },
  failedText: {
    fontSize: 20,
    marginBottom: 4,
  },
});

export default ProcessingScreen;