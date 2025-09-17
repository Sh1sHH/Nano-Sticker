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

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {credits} = useAppStore();

  const handleCreateSticker = () => {
    navigation.navigate('PhotoSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AI Sticker Generator</Text>
        <Text style={styles.subtitle}>
          Transform your photos into amazing stickers with AI
        </Text>
        
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsText}>
            Credits: {credits}
          </Text>
        </View>

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
    backgroundColor: '#f8fafc',
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
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  creditsContainer: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 40,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3730a3',
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  featuresContainer: {
    alignItems: 'flex-start',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 5,
  },
});

export default HomeScreen;