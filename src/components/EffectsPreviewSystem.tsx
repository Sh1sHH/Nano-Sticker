import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {SkiaEffectsComponent} from './SkiaEffectsComponent';
import {EffectsControlPanel} from './EffectsControlPanel';
import {EffectsHistoryControls} from './EffectsHistoryControls';
import {useAppStore} from '@/stores/appStore';
import {StickerEffect} from '@/types';

interface EffectsPreviewSystemProps {
  imageUri: string;
  onSave?: () => void;
  onExport?: () => void;
}

export const EffectsPreviewSystem: React.FC<EffectsPreviewSystemProps> = ({
  imageUri,
  onSave,
  onExport,
}) => {
  const {
    appliedEffects,
    addEffect,
    removeEffect,
    clearEffects,
  } = useAppStore();

  const [previewEffect, setPreviewEffect] = useState<StickerEffect | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Combine applied effects with preview effect for real-time preview
  const effectsToRender = isPreviewMode && previewEffect 
    ? [...appliedEffects, previewEffect]
    : appliedEffects;

  const handleAddEffect = useCallback((effect: StickerEffect) => {
    // Limit to 5 effects maximum
    if (appliedEffects.length >= 5) {
      Alert.alert(
        'Effect Limit Reached',
        'You can apply a maximum of 5 effects to your sticker.',
        [{text: 'OK'}]
      );
      return;
    }
    
    addEffect(effect);
    setPreviewEffect(null);
    setIsPreviewMode(false);
  }, [appliedEffects.length, addEffect]);

  const handleRemoveEffect = useCallback((index: number) => {
    removeEffect(index);
  }, [removeEffect]);

  const handlePreviewEffect = useCallback((effect: StickerEffect) => {
    setPreviewEffect(effect);
    setIsPreviewMode(true);
  }, []);

  const handleCancelPreview = useCallback(() => {
    setPreviewEffect(null);
    setIsPreviewMode(false);
  }, []);

  const handleApplyPreview = useCallback(() => {
    if (previewEffect) {
      handleAddEffect(previewEffect);
    }
  }, [previewEffect, handleAddEffect]);

  const handleClearAllEffects = useCallback(() => {
    if (appliedEffects.length === 0) return;
    
    Alert.alert(
      'Clear All Effects',
      'Are you sure you want to remove all applied effects?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Clear All', style: 'destructive', onPress: clearEffects},
      ]
    );
  }, [appliedEffects.length, clearEffects]);

  return (
    <View style={styles.container}>
      {/* Preview Area */}
      <View style={styles.previewContainer}>
        <SkiaEffectsComponent
          imageUri={imageUri}
          effects={effectsToRender}
          width={280}
          height={280}
        />
        
        {/* Preview Mode Indicator */}
        {isPreviewMode && (
          <View style={styles.previewIndicator}>
            <Text style={styles.previewText}>Preview Mode</Text>
          </View>
        )}
      </View>

      {/* History Controls */}
      <EffectsHistoryControls />

      {/* Preview Controls */}
      {isPreviewMode && (
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={[styles.previewButton, styles.cancelButton]}
            onPress={handleCancelPreview}
          >
            <Text style={styles.previewButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.previewButton, styles.applyButton]}
            onPress={handleApplyPreview}
          >
            <Text style={styles.previewButtonText}>Apply Effect</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Effects Control Panel */}
      <EffectsControlPanel
        onAddEffect={handleAddEffect}
        onRemoveEffect={handleRemoveEffect}
        appliedEffects={appliedEffects}
        onPreviewEffect={handlePreviewEffect}
      />

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearAllEffects}
          disabled={appliedEffects.length === 0}
        >
          <Text style={[
            styles.actionButtonText,
            appliedEffects.length === 0 && styles.disabledText
          ]}>
            Clear All
          </Text>
        </TouchableOpacity>

        {onSave && (
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={onSave}
          >
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
        )}

        {onExport && (
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={onExport}
          >
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Effects Summary */}
      {appliedEffects.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>
            Applied Effects: {appliedEffects.length}/5
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {appliedEffects.map((effect, index) => (
              <View key={index} style={styles.summaryChip}>
                <Text style={styles.summaryChipText}>
                  {effect.type.charAt(0).toUpperCase() + effect.type.slice(1)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  previewIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#212529',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  previewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  applyButton: {
    backgroundColor: '#28a745',
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
  exportButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#adb5bd',
  },
  summaryContainer: {
    margin: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  summaryChip: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  summaryChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
});