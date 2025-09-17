import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/App';
import {useAppStore} from '@/stores/appStore';
import {StickerEffect} from '@/types';

type EditingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Editing'
>;

type EditingScreenRouteProp = RouteProp<RootStackParamList, 'Editing'>;

interface Props {
  navigation: EditingScreenNavigationProp;
  route: EditingScreenRouteProp;
}

const EFFECT_OPTIONS = [
  {
    id: 'border-black',
    name: 'Black Border',
    type: 'border' as const,
    config: {color: '#000000', width: 4},
    icon: '⚫',
  },
  {
    id: 'border-white',
    name: 'White Border',
    type: 'border' as const,
    config: {color: '#ffffff', width: 4},
    icon: '⚪',
  },
  {
    id: 'shadow-soft',
    name: 'Soft Shadow',
    type: 'shadow' as const,
    config: {color: '#00000040', blur: 8, offset: {x: 2, y: 2}},
    icon: '🌫️',
  },
  {
    id: 'glow-blue',
    name: 'Blue Glow',
    type: 'glow' as const,
    config: {color: '#3b82f6', blur: 12},
    icon: '💙',
  },
];

const EditingScreen: React.FC<Props> = ({navigation, route}) => {
  const {processedImageUri} = route.params;
  const {appliedEffects, addEffect, removeEffect} = useAppStore();
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);

  const handleEffectToggle = (effectOption: typeof EFFECT_OPTIONS[0]) => {
    const isSelected = selectedEffects.includes(effectOption.id);
    
    if (isSelected) {
      // Remove effect
      setSelectedEffects(prev => prev.filter(id => id !== effectOption.id));
      const effectIndex = appliedEffects.findIndex(
        effect => effect.type === effectOption.type
      );
      if (effectIndex !== -1) {
        removeEffect(effectIndex);
      }
    } else {
      // Add effect
      setSelectedEffects(prev => [...prev, effectOption.id]);
      const effect: StickerEffect = {
        type: effectOption.type,
        config: effectOption.config,
      };
      addEffect(effect);
    }
  };

  const handleContinue = () => {
    navigation.navigate('Export', {finalImageUri: processedImageUri});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Effects</Text>
        <Text style={styles.subtitle}>
          Customize your sticker with borders and effects
        </Text>

        <View style={styles.previewContainer}>
          {processedImageUri && (
            <Image 
              source={{uri: processedImageUri}} 
              style={styles.previewImage} 
            />
          )}
        </View>

        <ScrollView 
          style={styles.effectsContainer}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.effectsTitle}>Available Effects</Text>
          
          {EFFECT_OPTIONS.map((effect) => (
            <TouchableOpacity
              key={effect.id}
              style={[
                styles.effectCard,
                selectedEffects.includes(effect.id) && styles.selectedEffectCard,
              ]}
              onPress={() => handleEffectToggle(effect)}>
              <Text style={styles.effectIcon}>{effect.icon}</Text>
              <Text style={styles.effectName}>{effect.name}</Text>
              {selectedEffects.includes(effect.id) && (
                <Text style={styles.selectedIndicator}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleContinue}>
            <Text style={styles.skipButtonText}>Skip Effects</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  effectsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  effectsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  effectCard: {
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEffectCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  effectIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  effectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  selectedIndicator: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditingScreen;