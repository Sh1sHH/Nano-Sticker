import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useAppStore} from '@/stores/appStore';

export const EffectsHistoryControls: React.FC = () => {
  const {
    undoEffect,
    redoEffect,
    canUndo,
    canRedo,
    effectsHistory,
    currentHistoryIndex,
  } = useAppStore();

  const canUndoEffect = canUndo();
  const canRedoEffect = canRedo();

  return (
    <View style={styles.container}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyText}>
          History: {currentHistoryIndex + 1}/{effectsHistory.length}
        </Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, !canUndoEffect && styles.disabledButton]}
          onPress={undoEffect}
          disabled={!canUndoEffect}
        >
          <Text style={[styles.buttonText, !canUndoEffect && styles.disabledText]}>
            ↶ Undo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !canRedoEffect && styles.disabledButton]}
          onPress={redoEffect}
          disabled={!canRedoEffect}
        >
          <Text style={[styles.buttonText, !canRedoEffect && styles.disabledText]}>
            ↷ Redo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledText: {
    color: '#adb5bd',
  },
});