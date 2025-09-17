import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import {COLORS} from '@/utils/constants';

interface AnimatedMessageProps {
  messages: string[];
  interval?: number;
  style?: any;
  textStyle?: any;
  showDots?: boolean;
  fadeTransition?: boolean;
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({
  messages,
  interval = 2000,
  style,
  textStyle,
  showDots = true,
  fadeTransition = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dots, setDots] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (messages.length <= 1) return;

    const messageInterval = setInterval(() => {
      if (fadeTransition) {
        // Fade out current message
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Change message
          setCurrentIndex((prev) => (prev + 1) % messages.length);
          
          // Fade in new message
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      } else {
        // Slide transition
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setCurrentIndex((prev) => (prev + 1) % messages.length);
          slideAnim.setValue(20);
          
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }
    }, interval);

    return () => clearInterval(messageInterval);
  }, [messages, interval, fadeTransition, fadeAnim, slideAnim]);

  useEffect(() => {
    if (!showDots) return;

    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, [showDots]);

  if (messages.length === 0) return null;

  const currentMessage = messages[currentIndex];

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.messageContainer,
          fadeTransition && {opacity: fadeAnim},
          !fadeTransition && {transform: [{translateY: slideAnim}]},
        ]}>
        <Text style={[styles.message, textStyle]}>
          {currentMessage}
          {showDots && (
            <Text style={styles.dots}>{dots}</Text>
          )}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  dots: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});