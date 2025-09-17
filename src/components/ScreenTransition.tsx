import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {COLORS} from '@/utils/constants';

interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'slideUp';
  duration?: number;
  delay?: number;
  style?: any;
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'fade',
  duration = 500,
  delay = 0,
  style,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(animValue, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [animValue, duration, delay]);

  const getAnimatedStyle = () => {
    switch (type) {
      case 'fade':
        return {
          opacity: animValue,
        };
      
      case 'slide':
        return {
          opacity: animValue,
          transform: [
            {
              translateX: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [screenWidth, 0],
              }),
            },
          ],
        };
      
      case 'slideUp':
        return {
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        };
      
      case 'scale':
        return {
          opacity: animValue,
          transform: [
            {
              scale: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };
      
      default:
        return {opacity: animValue};
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getAnimatedStyle(),
        style,
      ]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});