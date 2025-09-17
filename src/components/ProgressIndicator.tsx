import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {COLORS} from '@/utils/constants';

interface ProgressIndicatorProps {
  progress: number; // 0 to 1
  message?: string;
  showPercentage?: boolean;
  animated?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showGlow?: boolean;
}

const {width: screenWidth} = Dimensions.get('window');

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message,
  showPercentage = true,
  animated = true,
  color = COLORS.primary,
  backgroundColor = COLORS.gray[200],
  height = 8,
  showGlow = true,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (showGlow && progress > 0) {
        // Glow effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      progressAnim.setValue(progress);
      fadeAnim.setValue(1);
    }
  }, [progress, animated, showGlow, progressAnim, glowAnim, fadeAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
      {message && <Text style={styles.message}>{message}</Text>}
      
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor,
              height,
            },
          ]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: color,
                height,
              },
            ]}
          />
          {showGlow && progress > 0 && (
            <Animated.View
              style={[
                styles.progressGlow,
                {
                  width: progressWidth,
                  backgroundColor: color,
                  height,
                  opacity: glowOpacity,
                },
              ]}
            />
          )}
        </View>
        
        {showPercentage && (
          <Text style={styles.percentage}>
            {Math.round(progress * 100)}%
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  message: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressGlow: {
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  percentage: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
    marginLeft: 12,
    minWidth: 35,
    textAlign: 'right',
  },
});