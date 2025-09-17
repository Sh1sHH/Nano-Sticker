import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {COLORS} from '@/utils/constants';
import {AnimatedMessage} from './AnimatedMessage';
import {ProgressIndicator} from './ProgressIndicator';

interface AIProcessingAnimationProps {
  isProcessing: boolean;
  progress?: number;
  currentStep?: string;
  style?: any;
}

const {width: screenWidth} = Dimensions.get('window');

const PROCESSING_MESSAGES = [
  'Creating your masterpiece...',
  'Adding artistic touches...',
  'Bringing colors to life...',
  'Applying AI magic...',
  'Perfecting the details...',
  'Almost ready...',
];

const PROCESSING_STEPS = [
  'Analyzing your image',
  'Applying artistic style',
  'Generating emotions',
  'Optimizing for stickers',
  'Finalizing results',
];

export const AIProcessingAnimation: React.FC<AIProcessingAnimationProps> = ({
  isProcessing,
  progress = 0,
  currentStep,
  style,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({length: 6}, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (isProcessing) {
      // Pulse animation for main container
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotation animation for AI brain
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      ).start();

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Particle animations
      particleAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000 + index * 200,
            useNativeDriver: true,
          })
        ).start();
      });

      // Step progression
      const stepInterval = setInterval(() => {
        setCurrentStepIndex((prev) => 
          prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev
        );
      }, 3000);

      return () => clearInterval(stepInterval);
    } else {
      // Reset animations
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      waveAnim.setValue(0);
      particleAnims.forEach(anim => anim.setValue(0));
      setCurrentStepIndex(0);
    }
  }, [isProcessing, pulseAnim, rotateAnim, waveAnim, particleAnims]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  if (!isProcessing) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{scale: pulseAnim}]},
        style,
      ]}>
      {/* AI Brain Animation */}
      <View style={styles.brainContainer}>
        <Animated.View
          style={[
            styles.brain,
            {transform: [{rotate: spin}]},
          ]}>
          <Text style={styles.brainEmoji}>🧠</Text>
        </Animated.View>
        
        {/* Floating particles */}
        {particleAnims.map((anim, index) => {
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -30],
          });
          
          const opacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 0],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  transform: [
                    {translateY},
                    {
                      translateX: Math.cos(index * 60 * Math.PI / 180) * 40,
                    },
                  ],
                  opacity,
                  left: '50%',
                  top: '50%',
                },
              ]}>
              <Text style={styles.particleEmoji}>✨</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Animated Messages */}
      <View style={styles.messageContainer}>
        <AnimatedMessage
          messages={PROCESSING_MESSAGES}
          interval={2500}
          textStyle={styles.processingMessage}
        />
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator
        progress={progress}
        message="Processing with AI..."
        showGlow={true}
        animated={true}
      />

      {/* Current Step Indicator */}
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>Current Step:</Text>
        <Animated.View
          style={[
            styles.currentStep,
            {transform: [{translateY: waveTranslate}]},
          ]}>
          <Text style={styles.stepText}>
            {currentStep || PROCESSING_STEPS[currentStepIndex]}
          </Text>
        </Animated.View>
      </View>

      {/* Step Progress Dots */}
      <View style={styles.dotsContainer}>
        {PROCESSING_STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index <= currentStepIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  brainContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  brain: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  brainEmoji: {
    fontSize: 40,
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleEmoji: {
    fontSize: 16,
  },
  messageContainer: {
    marginBottom: 30,
    minHeight: 50,
    justifyContent: 'center',
  },
  processingMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stepsContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  currentStep: {
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[300],
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    transform: [{scale: 1.2}],
  },
});