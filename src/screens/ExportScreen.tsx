import React, {useState} from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';
import {StickerExportComponent, SharingComponent} from '@/components';
import {useAppStore} from '@/stores/appStore';
import {ExportResult} from '@/types';
import {SharingResult} from '@/services/sharingService';

interface ExportScreenProps {
  navigation: any;
}

type ScreenMode = 'export' | 'sharing';

export const ExportScreen: React.FC<ExportScreenProps> = ({navigation}) => {
  const {processedImageUri, resetStickerCreation} = useAppStore();
  const [screenMode, setScreenMode] = useState<ScreenMode>('export');
  const [exportedFilePath, setExportedFilePath] = useState<string | null>(null);

  const handleExportComplete = (result: ExportResult) => {
    if (result.success && result.filePath) {
      // Export successful, show sharing options
      setExportedFilePath(result.filePath);
      setScreenMode('sharing');
    } else {
      // Handle export error - could show retry options
      console.error('Export failed:', result.error);
      // For now, just go back to effects screen
      navigation.goBack();
    }
  };

  const handleSharingComplete = (result: SharingResult) => {
    // Sharing complete (success or failure), reset and go home
    resetStickerCreation();
    navigation.navigate('Home');
  };

  const handleCancel = () => {
    if (screenMode === 'sharing') {
      // Go back to export screen
      setScreenMode('export');
    } else {
      // Go back to effects screen
      navigation.goBack();
    }
  };

  if (!processedImageUri) {
    // If no processed image, navigate back to home
    navigation.navigate('Home');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {screenMode === 'export' ? (
          <StickerExportComponent
            stickerUri={processedImageUri}
            onExportComplete={handleExportComplete}
            onCancel={handleCancel}
          />
        ) : (
          <SharingComponent
            filePath={exportedFilePath!}
            onSharingComplete={handleSharingComplete}
            onCancel={handleCancel}
            customTitle="Share your amazing AI sticker!"
            customMessage="I just created this awesome sticker using AI. Check it out!"
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});