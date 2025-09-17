import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {COLORS, CREDIT_COSTS} from '@/utils/constants';

interface CreditUsageNotificationProps {
  visible: boolean;
  onClose: () => void;
  onPurchasePress?: () => void;
  creditsUsed: number;
  remainingCredits: number;
  action: string;
  showPurchaseOption?: boolean;
}

export const CreditUsageNotification: React.FC<CreditUsageNotificationProps> = ({
  visible,
  onClose,
  onPurchasePress,
  creditsUsed,
  remainingCredits,
  action,
  showPurchaseOption = false,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 3 seconds if not showing purchase option
      if (!showPurchaseOption) {
        const timer = setTimeout(() => {
          handleClose();
        }, 3000);

        return () => clearTimeout(timer);
      }
    } else {
      slideAnim.setValue(-100);
      fadeAnim.setValue(0);
    }
  }, [visible, showPurchaseOption, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getNotificationStyle = () => {
    if (remainingCredits === 0) {
      return {
        backgroundColor: COLORS.error + '15',
        borderColor: COLORS.error,
      };
    } else if (remainingCredits <= 5) {
      return {
        backgroundColor: COLORS.warning + '15',
        borderColor: COLORS.warning,
      };
    } else {
      return {
        backgroundColor: COLORS.success + '15',
        borderColor: COLORS.success,
      };
    }
  };

  const getIcon = () => {
    if (remainingCredits === 0) return '🚫';
    if (remainingCredits <= 5) return '⚠️';
    return '✅';
  };

  const getMessage = () => {
    if (remainingCredits === 0) {
      return `You've used ${creditsUsed} credits for ${action}. No credits remaining.`;
    } else if (remainingCredits <= 5) {
      return `Used ${creditsUsed} credits for ${action}. Only ${remainingCredits} credits left!`;
    } else {
      return `Used ${creditsUsed} credits for ${action}. ${remainingCredits} credits remaining.`;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.notification,
            getNotificationStyle(),
            {
              transform: [{translateY: slideAnim}],
              opacity: fadeAnim,
            },
          ]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.icon}>{getIcon()}</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Credit Update</Text>
              <Text style={styles.message}>{getMessage()}</Text>
            </View>
          </View>

          {showPurchaseOption && (remainingCredits === 0 || remainingCredits <= 5) && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={onPurchasePress}>
                <Text style={styles.purchaseButtonText}>
                  {remainingCredits === 0 ? 'Buy Credits' : 'Get More Credits'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  notification: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 24,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});