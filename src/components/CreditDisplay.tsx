import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {COLORS, CREDIT_COSTS} from '@/utils/constants';

interface CreditDisplayProps {
  credits: number;
  showPurchaseButton?: boolean;
  onPurchasePress?: () => void;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  showWarning?: boolean;
  warningThreshold?: number;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  credits,
  showPurchaseButton = false,
  onPurchasePress,
  size = 'medium',
  animated = true,
  showWarning = true,
  warningThreshold = 5,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isLowCredits = credits <= warningThreshold;
  const isOutOfCredits = credits === 0;

  useEffect(() => {
    if (animated) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Pulse animation for low credits warning
      if (isLowCredits && showWarning) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
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
      } else {
        pulseAnim.setValue(1);
      }
    }
  }, [credits, isLowCredits, animated, showWarning, pulseAnim, fadeAnim]);

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (size === 'small') baseStyle.push(styles.smallContainer);
    if (size === 'large') baseStyle.push(styles.largeContainer);
    
    if (isOutOfCredits) {
      baseStyle.push(styles.outOfCreditsContainer);
    } else if (isLowCredits && showWarning) {
      baseStyle.push(styles.lowCreditsContainer);
    } else {
      baseStyle.push(styles.normalContainer);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.creditsText];
    
    if (size === 'small') baseStyle.push(styles.smallText);
    if (size === 'large') baseStyle.push(styles.largeText);
    
    if (isOutOfCredits) {
      baseStyle.push(styles.outOfCreditsText);
    } else if (isLowCredits && showWarning) {
      baseStyle.push(styles.lowCreditsText);
    } else {
      baseStyle.push(styles.normalText);
    }
    
    return baseStyle;
  };

  const getCreditIcon = () => {
    if (isOutOfCredits) return '💳';
    if (isLowCredits) return '⚠️';
    return '✨';
  };

  const getStatusMessage = () => {
    if (isOutOfCredits) return 'No credits remaining';
    if (isLowCredits) return 'Low credits';
    return `${credits} credits`;
  };

  return (
    <Animated.View
      style={[
        getContainerStyle(),
        animated && {
          opacity: fadeAnim,
          transform: [{scale: isLowCredits && showWarning ? pulseAnim : 1}],
        },
      ]}>
      <View style={styles.creditInfo}>
        <Text style={styles.icon}>{getCreditIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={getTextStyle()}>
            {getStatusMessage()}
          </Text>
          {size !== 'small' && (
            <Text style={styles.costInfo}>
              1 credit per sticker generation
            </Text>
          )}
        </View>
      </View>
      
      {showPurchaseButton && (isLowCredits || isOutOfCredits) && (
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={onPurchasePress}>
          <Text style={styles.purchaseButtonText}>
            {isOutOfCredits ? 'Buy Credits' : 'Get More'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  largeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  normalContainer: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  lowCreditsContainer: {
    backgroundColor: COLORS.warning + '15',
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
  },
  outOfCreditsContainer: {
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error + '50',
  },
  creditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  normalText: {
    color: COLORS.primary,
  },
  lowCreditsText: {
    color: COLORS.warning,
  },
  outOfCreditsText: {
    color: COLORS.error,
  },
  costInfo: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});