import React, {useEffect, useRef} from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import {COLORS} from '@/utils/constants';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  animated?: boolean;
  showPulse?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  color = COLORS.primary,
  animated = true,
  showPulse = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Continuous rotation for custom spinner
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    if (showPulse) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, showPulse, fadeAnim, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        animated && {opacity: fadeAnim},
        showPulse && {transform: [{scale: pulseAnim}]},
      ]}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
        {animated && (
          <Animated.View
            style={[
              styles.customSpinner,
              {
                transform: [{rotate: spin}],
                borderColor: `${color}20`,
                borderTopColor: color,
              },
            ]}
          />
        )}
      </View>
      {message && (
        <Animated.Text
          style={[
            styles.message,
            animated && {opacity: fadeAnim},
          ]}>
          {message}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinnerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSpinner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3,
    borderRadius: 20,
    borderStyle: 'solid',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});