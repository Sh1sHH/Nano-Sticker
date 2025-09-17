import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';
import {COLORS} from '@/utils/constants';
import {CreditDisplay} from '@/components/CreditDisplay';
import {LoadingSpinner} from '@/components/LoadingSpinner';
import {ScreenTransition} from '@/components/ScreenTransition';

type CreditPurchaseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreditPurchase'
>;

type CreditPurchaseScreenRouteProp = RouteProp<
  RootStackParamList,
  'CreditPurchase'
>;

interface Props {
  navigation: CreditPurchaseScreenNavigationProp;
  route: CreditPurchaseScreenRouteProp;
}

interface CreditPackage {
  id: string;
  credits: number;
  price: string;
  originalPrice?: string;
  popular?: boolean;
  bonus?: number;
  description: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    credits: 10,
    price: '$2.99',
    description: 'Perfect for trying out the app',
  },
  {
    id: 'popular',
    credits: 50,
    price: '$9.99',
    originalPrice: '$14.99',
    popular: true,
    bonus: 10,
    description: 'Most popular choice',
  },
  {
    id: 'pro',
    credits: 100,
    price: '$17.99',
    originalPrice: '$29.99',
    bonus: 25,
    description: 'Best value for power users',
  },
  {
    id: 'ultimate',
    credits: 250,
    price: '$39.99',
    originalPrice: '$74.99',
    bonus: 75,
    description: 'Maximum savings',
  },
];

const CreditPurchaseScreen: React.FC<Props> = ({navigation}) => {
  const {credits, setCredits} = useAppStore();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a credit package');
      return;
    }

    const packageData = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    if (!packageData) return;

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate total credits (base + bonus)
      const totalCredits = packageData.credits + (packageData.bonus || 0);
      
      // Update credits in store
      setCredits(credits + totalCredits);

      Alert.alert(
        'Purchase Successful!',
        `You've received ${totalCredits} credits. Happy creating!`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your payment. Please try again.',
        [
          {text: 'OK'},
          {text: 'Retry', onPress: handlePurchase},
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPackage = (pkg: CreditPackage) => {
    const isSelected = selectedPackage === pkg.id;
    const totalCredits = pkg.credits + (pkg.bonus || 0);

    return (
      <TouchableOpacity
        key={pkg.id}
        style={[
          styles.packageContainer,
          isSelected && styles.selectedPackage,
          pkg.popular && styles.popularPackage,
        ]}
        onPress={() => handlePackageSelect(pkg.id)}>
        
        {pkg.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <Text style={styles.creditsAmount}>{totalCredits}</Text>
          <Text style={styles.creditsLabel}>Credits</Text>
          {pkg.bonus && (
            <Text style={styles.bonusText}>+{pkg.bonus} bonus!</Text>
          )}
        </View>

        <View style={styles.packagePricing}>
          <Text style={styles.price}>{pkg.price}</Text>
          {pkg.originalPrice && (
            <Text style={styles.originalPrice}>{pkg.originalPrice}</Text>
          )}
        </View>

        <Text style={styles.packageDescription}>{pkg.description}</Text>

        <View style={styles.packageDetails}>
          <Text style={styles.detailText}>
            ${(parseFloat(pkg.price.replace('$', '')) / totalCredits).toFixed(2)} per credit
          </Text>
          {pkg.originalPrice && (
            <Text style={styles.savingsText}>
              Save {Math.round((1 - parseFloat(pkg.price.replace('$', '')) / parseFloat(pkg.originalPrice.replace('$', ''))) * 100)}%
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenTransition type="slideUp" duration={500}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Get More Credits</Text>
            <Text style={styles.subtitle}>
              Continue creating amazing stickers with AI
            </Text>
          </View>

          <CreditDisplay
            credits={credits}
            size="large"
            showWarning={false}
            style={styles.currentCredits}
          />

          <View style={styles.packagesContainer}>
            <Text style={styles.packagesTitle}>Choose Your Package</Text>
            {CREDIT_PACKAGES.map(renderPackage)}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Why Credits?</Text>
            <Text style={styles.infoItem}>• Each sticker generation uses 1 credit</Text>
            <Text style={styles.infoItem}>• Credits never expire</Text>
            <Text style={styles.infoItem}>• Premium effects included</Text>
            <Text style={styles.infoItem}>• Support continued development</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              !selectedPackage && styles.disabledButton,
            ]}
            onPress={handlePurchase}
            disabled={!selectedPackage || isProcessing}>
            {isProcessing ? (
              <LoadingSpinner
                size="small"
                color={COLORS.white}
                message="Processing..."
              />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {selectedPackage
                  ? `Purchase ${CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price}`
                  : 'Select a Package'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </ScreenTransition>
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
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  currentCredits: {
    margin: 20,
  },
  packagesContainer: {
    padding: 20,
  },
  packagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  packageContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    position: 'relative',
  },
  selectedPackage: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  popularPackage: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '05',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  creditsLabel: {
    fontSize: 16,
    color: COLORS.secondary,
    marginTop: 4,
  },
  bonusText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 4,
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.secondary,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  packageDetails: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  savingsText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
    backgroundColor: COLORS.white,
    margin: 20,
    borderRadius: 12,
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
  footer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: COLORS.gray[300],
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