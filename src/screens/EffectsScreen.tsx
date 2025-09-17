import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import {EffectsPreviewSystem} from '@/components/EffectsPreviewSystem';
import {useAppStore} from '@/stores/appStore';

export const EffectsScreen: React.FC = () => {
  const {processedImageUri} = useAppStore();

  const handleSaveSticker = () => {
    // This would typically save the sticker with effects applied
    Alert.alert(
      'Save Sticker',
      'Your sticker with effects has been saved!',
      [{text: 'OK'}]
    );
  };

  const handleExportSticker = () => {
    // This would typically export the sticker for sharing
    Alert.alert(
      'Export Sticker',
      'Your sticker is ready for export!',
      [{text: 'OK'}]
    );
  };

  if (!processedImageUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No processed image available</Text>
          <Text style={styles.errorSubtext}>
            Please complete the AI processing step first
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Effects</Text>
          <Text style={styles.subtitle}>
            Enhance your sticker with borders, shadows, and glows
          </Text>
        </View>

        {/* Effects Preview System */}
        <EffectsPreviewSystem
          imageUri={processedImageUri}
          onSave={handleSaveSticker}
          onExport={handleExportSticker}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});