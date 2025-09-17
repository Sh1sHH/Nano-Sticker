import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';
import {MLKitSegmentationComponent} from '@/components';

type SegmentationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Segmentation'
>;

type SegmentationScreenRouteProp = RouteProp<
  RootStackParamList,
  'Segmentation'
>;

interface Props {
  navigation: SegmentationScreenNavigationProp;
  route: SegmentationScreenRouteProp;
}

const SegmentationScreen: React.FC<Props> = ({navigation, route}) => {
  const {imageUri} = route.params;
  const {setSegmentedImageUri} = useAppStore();

  const handleSegmentationComplete = (segmentedImageUri: string) => {
    setSegmentedImageUri(segmentedImageUri);
    navigation.navigate('StyleSelection', {segmentedImageUri});
  };

  const handleSegmentationError = (error: string) => {
    console.error('Segmentation failed:', error);
    // Could show an alert or error screen here
  };

  const handleManualEditingRequested = () => {
    // This is handled internally by the MLKitSegmentationComponent
    // by showing the ManualEditingComponent
  };

  return (
    <SafeAreaView style={styles.container}>
      <MLKitSegmentationComponent
        imageUri={imageUri}
        onSegmentationComplete={handleSegmentationComplete}
        onSegmentationError={handleSegmentationError}
        onManualEditingRequested={handleManualEditingRequested}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

export default SegmentationScreen;