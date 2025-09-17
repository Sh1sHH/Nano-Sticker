import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import {COLORS, CREDIT_COSTS} from '@/utils/constants';

interface InsufficientCreditsModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchasePress: () => void;
  requiredCredits: number;
  currentCredits: number;
  action: string;
}

export const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({
  visible,
  onClose,
  onPurchasePress,
  requiredCredits,
  currentCredits,
  action,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const creditsNeeded = requiredCredits - currentCredits;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}>
      <Animated.View
        style={[
          styles.overlay,
          {opacity: fadeAnim},
        ]}>
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <View style={styles.header}>
            <Text style={styles.icon}>💳</Text>
            <Text style={styles.title}>Not Enough Credits</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              You need <Text style={styles.highlight}>{requiredCredits} credits</Text> to {action}, 
              but you only have <Text style={styles.highlight}>{currentCredits} credits</Text>.
            </Text>

            <View style={styles.creditInfo}>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Required:</Text>
                <Text style={styles.creditValue}>{requiredCredits} credits</Text>
              </View>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Current:</Text>
                <Text style={styles.creditValue}>{currentCredits} credits</Text>
              </View>
              <View style={[styles.creditRow, styles.needRow]}>
                <Text style={styles.creditLabel}>Need:</Text>
                <Text style={[styles.creditValue, styles.needValue]}>
                  {creditsNeeded} more credits
                </Text>
              </View>
            </View>

            <View style={styles.benefits}>
              <Text style={styles.benefitsTitle}>Get credits to:</Text>
              <Text style={styles.benefitItem}>• Generate unlimited stickers</Text>
              <Text style={styles.benefitItem}>• Access all artistic styles</Text>
              <Text style={styles.benefitItem}>• Use premium effects</Text>
              <Text style={styles.benefitItem}>• Support app development</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={onPurchasePress}>
              <Text style={styles.purchaseButtonText}>Buy Credits</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  message: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  highlight: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  creditInfo: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  needRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  creditLabel: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  creditValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  needValue: {
    color: COLORS.error,
  },
  benefits: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  actions: {
    padding: 24,
    paddingTop: 0,
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
  },
});