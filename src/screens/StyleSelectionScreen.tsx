import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';
import {ArtisticStyle} from '@/types';
import {STYLE_OPTIONS} from '@/data/styleOptions';

type StyleSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StyleSelection'
>;

type StyleSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'StyleSelection'
>;

interface Props {
  navigation: StyleSelectionScreenNavigationProp;
  route: StyleSelectionScreenRouteProp;
}

const {width: screenWidth} = Dimensions.get('window');

const StyleSelectionScreen: React.FC<Props> = ({navigation, route}) => {
  const {segmentedImageUri} = route.params;
  const {setSelectedStyle} = useAppStore();
  const [selectedStyleId, setSelectedStyleId] = useState<string>('pop-art');
  const [stylesWithRotation, setStylesWithRotation] = useState<ArtisticStyle[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Add random rotation to styles like in web version
    const initialStyles = STYLE_OPTIONS.map(style => ({
      ...style,
      rotation: Math.random() * 12 - 6 // Random rotation between -6 and 6 degrees
    }));
    setStylesWithRotation(initialStyles);
    
    // Set default selected style
    const defaultStyle = initialStyles.find(s => s.id === 'pop-art');
    if (defaultStyle) {
      setSelectedStyle(defaultStyle);
    }
  }, [setSelectedStyle]);

  const handleStyleSelect = (style: ArtisticStyle) => {
    setSelectedStyleId(style.id);
    setSelectedStyle(style);
  };

  const handleContinue = () => {
    navigation.navigate('Processing', {
      imageUri: segmentedImageUri,
      style: selectedStyleId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Style</Text>
        <Text style={styles.subtitle}>
          Select an artistic style for your sticker
        </Text>

        <ScrollView 
          ref={scrollViewRef}
          horizontal
          style={styles.stylesContainer} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stylesContent}>
          {stylesWithRotation.map((style, index) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                {
                  transform: [
                    {rotate: `${style.rotation || 0}deg`},
                    {translateY: index % 2 === 0 ? 0 : 20}
                  ]
                }
              ]}
              onPress={() => handleStyleSelect(style)}>
              <View style={styles.styleImageContainer}>
                <Image 
                  source={{
                    uri: selectedStyleId === style.id && style.selectedImage 
                      ? style.selectedImage 
                      : style.previewImage
                  }}
                  style={styles.styleImage}
                  resizeMode="contain"
                />
                <Text style={[
                  styles.styleName,
                  selectedStyleId === style.id && styles.selectedStyleName
                ]}>
                  {style.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedStyleId && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Generate Sticker</Text>
          </TouchableOpacity>
        )}
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
  stylesContainer: {
    height: 300,
    marginBottom: 20,
  },
  stylesContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  styleCard: {
    marginHorizontal: 10,
    alignItems: 'center',
  },
  styleImageContainer: {
    width: 180,
    alignItems: 'center',
  },
  styleImage: {
    width: 180,
    height: 180,
    marginBottom: 8,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedStyleName: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  continueButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default StyleSelectionScreen;