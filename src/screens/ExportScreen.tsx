import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import Share, {ShareOptions, ShareSingleOptions} from 'react-native-share';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';

type ExportScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Export'
>;

type ExportScreenRouteProp = RouteProp<RootStackParamList, 'Export'>;

interface Props {
  navigation: ExportScreenNavigationProp;
  route: ExportScreenRouteProp;
}

const ExportScreen: React.FC<Props> = ({navigation, route}) => {
  const {finalImageUri} = route.params;
  const {resetStickerCreation} = useAppStore();

  const handleSaveToGallery = async () => {
    try {
      // TODO: Implement save to gallery functionality
      Alert.alert('Success', 'Sticker saved to gallery!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save sticker to gallery');
    }
  };

  const handleShareToWhatsApp = async () => {
    try {
      const shareOptions: ShareSingleOptions = {
        title: 'Share Sticker',
        url: finalImageUri,
        social: Share.Social.WHATSAPP as any,
      };
      await Share.shareSingle(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'Failed to share to WhatsApp');
    }
  };

  const handleShareGeneral = async () => {
    try {
      const shareOptions: ShareOptions = {
        title: 'Check out my AI-generated sticker!',
        url: finalImageUri,
      };
      await Share.open(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'Failed to share sticker');
    }
  };

  const handleCreateAnother = () => {
    resetStickerCreation();
    navigation.navigate('PhotoSelection');
  };

  const handleGoHome = () => {
    resetStickerCreation();
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Sticker is Ready!</Text>
        <Text style={styles.subtitle}>
          Save or share your amazing AI-generated sticker
        </Text>

        <View style={styles.stickerContainer}>
          {finalImageUri && (
            <Image 
              source={{uri: finalImageUri}} 
              style={styles.stickerImage} 
            />
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSaveToGallery}>
            <Text style={styles.actionIcon}>💾</Text>
            <Text style={styles.actionText}>Save to Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareToWhatsApp}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Share to WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareGeneral}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCreateAnother}>
            <Text style={styles.secondaryButtonText}>Create Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoHome}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  stickerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stickerImage: {
    width: 250,
    height: 250,
    borderRadius: 16,
    resizeMode: 'cover',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExportScreen;