import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';
import {CreditDisplay} from '@/components/CreditDisplay';
import {COLORS} from '@/utils/constants';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {credits} = useAppStore();

  const handleCreateSticker = () => {
    navigation.navigate('PhotoSelection');
  };

  const handlePurchaseCredits = () => {
    navigation.navigate('CreditPurchase');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AI Sticker Generator</Text>
        <Text style={styles.subtitle}>
          Transform your photos into amazing stickers with AI
        </Text>
        
        <CreditDisplay
          credits={credits}
          size="large"
          showPurchaseButton={true}
          onPurchasePress={handlePurchaseCredits}
          style={styles.creditsContainer}
        />

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateSticker}>
          <Text style={styles.createButtonText}>Create Sticker</Text>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.featureItem}>• Automatic object detection</Text>
          <Text style={styles.featureItem}>• Multiple artistic styles</Text>
          <Text style={styles.featureItem}>• Custom effects and borders</Text>
          <Text style={styles.featureItem}>• WhatsApp integration</Text>
        </View>
      </View>
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
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  creditsContainer: {
    marginBottom: 40,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  featuresContainer: {
    alignItems: 'flex-start',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 10,
  },
  featureItem: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 5,
  },
});

export default HomeScreen;