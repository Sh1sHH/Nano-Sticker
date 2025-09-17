import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {StickerEffect} from '@/types';

interface EffectsControlPanelProps {
  onAddEffect: (effect: StickerEffect) => void;
  onRemoveEffect: (index: number) => void;
  appliedEffects: StickerEffect[];
  onPreviewEffect?: (effect: StickerEffect) => void;
}

interface EffectPreset {
  name: string;
  effect: StickerEffect;
}

const BORDER_PRESETS: EffectPreset[] = [
  {
    name: 'Thin Black',
    effect: {
      type: 'border',
      config: {color: '#000000', width: 2},
    },
  },
  {
    name: 'Thick White',
    effect: {
      type: 'border',
      config: {color: '#ffffff', width: 6},
    },
  },
  {
    name: 'Colorful',
    effect: {
      type: 'border',
      config: {color: '#ff6b6b', width: 4},
    },
  },
];

const SHADOW_PRESETS: EffectPreset[] = [
  {
    name: 'Soft Shadow',
    effect: {
      type: 'shadow',
      config: {
        color: 'rgba(0,0,0,0.3)',
        blur: 8,
        offset: {x: 2, y: 2},
      },
    },
  },
  {
    name: 'Hard Shadow',
    effect: {
      type: 'shadow',
      config: {
        color: 'rgba(0,0,0,0.6)',
        blur: 2,
        offset: {x: 4, y: 4},
      },
    },
  },
  {
    name: 'Colored Shadow',
    effect: {
      type: 'shadow',
      config: {
        color: 'rgba(255,107,107,0.4)',
        blur: 12,
        offset: {x: 3, y: 3},
      },
    },
  },
];

const GLOW_PRESETS: EffectPreset[] = [
  {
    name: 'White Glow',
    effect: {
      type: 'glow',
      config: {
        color: '#ffffff',
        width: 6,
        blur: 12,
      },
    },
  },
  {
    name: 'Blue Glow',
    effect: {
      type: 'glow',
      config: {
        color: '#4dabf7',
        width: 8,
        blur: 16,
      },
    },
  },
  {
    name: 'Rainbow Glow',
    effect: {
      type: 'glow',
      config: {
        color: '#ff6b6b',
        width: 10,
        blur: 20,
      },
    },
  },
];

export const EffectsControlPanel: React.FC<EffectsControlPanelProps> = ({
  onAddEffect,
  onRemoveEffect,
  appliedEffects,
  onPreviewEffect,
}) => {
  const [activeTab, setActiveTab] = useState<'border' | 'shadow' | 'glow'>('border');
  const [customEffect, setCustomEffect] = useState<StickerEffect>({
    type: 'border',
    config: {color: '#000000', width: 2},
  });

  const renderPresetButton = (preset: EffectPreset, index: number) => (
    <View key={index} style={styles.presetButtonContainer}>
      <TouchableOpacity
        style={styles.presetButton}
        onPress={() => onAddEffect(preset.effect)}
      >
        <Text style={styles.presetButtonText}>{preset.name}</Text>
      </TouchableOpacity>
      {onPreviewEffect && (
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => onPreviewEffect(preset.effect)}
        >
          <Text style={styles.previewButtonText}>👁</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCustomControls = () => {
    switch (activeTab) {
      case 'border':
        return (
          <View style={styles.customControls}>
            <Text style={styles.controlLabel}>Border Width: {customEffect.config.width}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              value={customEffect.config.width || 2}
              onValueChange={(width) =>
                setCustomEffect({
                  ...customEffect,
                  config: {...customEffect.config, width: Math.round(width)},
                })
              }
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => onAddEffect(customEffect)}
            >
              <Text style={styles.applyButtonText}>Apply Custom Border</Text>
            </TouchableOpacity>
          </View>
        );

      case 'shadow':
        return (
          <View style={styles.customControls}>
            <Text style={styles.controlLabel}>Shadow Blur: {customEffect.config.blur}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={20}
              value={customEffect.config.blur || 4}
              onValueChange={(blur) =>
                setCustomEffect({
                  ...customEffect,
                  config: {...customEffect.config, blur: Math.round(blur)},
                })
              }
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() =>
                onAddEffect({
                  type: 'shadow',
                  config: {
                    color: 'rgba(0,0,0,0.4)',
                    blur: customEffect.config.blur || 4,
                    offset: {x: 2, y: 2},
                  },
                })
              }
            >
              <Text style={styles.applyButtonText}>Apply Custom Shadow</Text>
            </TouchableOpacity>
          </View>
        );

      case 'glow':
        return (
          <View style={styles.customControls}>
            <Text style={styles.controlLabel}>Glow Intensity: {customEffect.config.blur}</Text>
            <Slider
              style={styles.slider}
              minimumValue={4}
              maximumValue={30}
              value={customEffect.config.blur || 12}
              onValueChange={(blur) =>
                setCustomEffect({
                  ...customEffect,
                  config: {...customEffect.config, blur: Math.round(blur)},
                })
              }
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() =>
                onAddEffect({
                  type: 'glow',
                  config: {
                    color: '#ffffff',
                    width: 8,
                    blur: customEffect.config.blur || 12,
                  },
                })
              }
            >
              <Text style={styles.applyButtonText}>Apply Custom Glow</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  const getPresets = () => {
    switch (activeTab) {
      case 'border':
        return BORDER_PRESETS;
      case 'shadow':
        return SHADOW_PRESETS;
      case 'glow':
        return GLOW_PRESETS;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['border', 'shadow', 'glow'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsContainer}>
        {getPresets().map(renderPresetButton)}
      </ScrollView>

      {/* Custom Controls */}
      {renderCustomControls()}

      {/* Applied Effects */}
      {appliedEffects.length > 0 && (
        <View style={styles.appliedEffectsContainer}>
          <Text style={styles.appliedEffectsTitle}>Applied Effects:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {appliedEffects.map((effect, index) => (
              <TouchableOpacity
                key={index}
                style={styles.appliedEffectChip}
                onPress={() => onRemoveEffect(index)}
              >
                <Text style={styles.appliedEffectText}>
                  {effect.type} ×
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeTabText: {
    color: '#495057',
  },
  presetsContainer: {
    marginBottom: 16,
  },
  presetButtonContainer: {
    marginRight: 8,
    alignItems: 'center',
  },
  presetButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 4,
  },
  presetButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  previewButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 10,
  },
  customControls: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 12,
  },
  applyButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedEffectsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingTop: 12,
  },
  appliedEffectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  appliedEffectChip: {
    backgroundColor: '#dc3545',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  appliedEffectText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});