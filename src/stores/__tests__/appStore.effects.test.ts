import {useAppStore} from '../appStore';
import {StickerEffect} from '@/types';

// Mock zustand
jest.mock('zustand', () => ({
  create: (fn: any) => {
    const store = fn(() => {}, () => store);
    return store;
  },
}));

describe('AppStore Effects Management', () => {
  let store: ReturnType<typeof useAppStore>;

  const mockBorderEffect: StickerEffect = {
    type: 'border',
    config: {color: '#000000', width: 2},
  };

  const mockShadowEffect: StickerEffect = {
    type: 'shadow',
    config: {color: 'rgba(0,0,0,0.3)', blur: 4, offset: {x: 2, y: 2}},
  };

  const mockGlowEffect: StickerEffect = {
    type: 'glow',
    config: {color: '#ffffff', width: 6, blur: 12},
  };

  beforeEach(() => {
    store = useAppStore;
    // Reset store to initial state
    store.resetStickerCreation();
  });

  describe('Effect Operations', () => {
    it('should add effects correctly', () => {
      expect(store.appliedEffects).toHaveLength(0);
      
      store.addEffect(mockBorderEffect);
      expect(store.appliedEffects).toHaveLength(1);
      expect(store.appliedEffects[0]).toEqual(mockBorderEffect);
      
      store.addEffect(mockShadowEffect);
      expect(store.appliedEffects).toHaveLength(2);
      expect(store.appliedEffects[1]).toEqual(mockShadowEffect);
    });

    it('should remove effects correctly', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      store.addEffect(mockGlowEffect);
      
      expect(store.appliedEffects).toHaveLength(3);
      
      store.removeEffect(1); // Remove shadow effect
      expect(store.appliedEffects).toHaveLength(2);
      expect(store.appliedEffects[0]).toEqual(mockBorderEffect);
      expect(store.appliedEffects[1]).toEqual(mockGlowEffect);
    });

    it('should clear all effects', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      
      expect(store.appliedEffects).toHaveLength(2);
      
      store.clearEffects();
      expect(store.appliedEffects).toHaveLength(0);
    });
  });

  describe('History Management', () => {
    it('should initialize with empty history state', () => {
      expect(store.effectsHistory).toHaveLength(1);
      expect(store.effectsHistory[0].effects).toHaveLength(0);
      expect(store.currentHistoryIndex).toBe(0);
    });

    it('should save history when adding effects', () => {
      store.addEffect(mockBorderEffect);
      
      expect(store.effectsHistory).toHaveLength(2);
      expect(store.currentHistoryIndex).toBe(1);
      expect(store.effectsHistory[1].effects).toHaveLength(1);
      expect(store.effectsHistory[1].effects[0]).toEqual(mockBorderEffect);
    });

    it('should save history when removing effects', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      
      expect(store.effectsHistory).toHaveLength(3);
      
      store.removeEffect(0);
      
      expect(store.effectsHistory).toHaveLength(4);
      expect(store.currentHistoryIndex).toBe(3);
      expect(store.effectsHistory[3].effects).toHaveLength(1);
      expect(store.effectsHistory[3].effects[0]).toEqual(mockShadowEffect);
    });

    it('should save history when clearing effects', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      
      store.clearEffects();
      
      expect(store.effectsHistory).toHaveLength(4);
      expect(store.currentHistoryIndex).toBe(3);
      expect(store.effectsHistory[3].effects).toHaveLength(0);
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should undo effects correctly', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      
      expect(store.appliedEffects).toHaveLength(2);
      expect(store.canUndo()).toBe(true);
      
      store.undoEffect();
      
      expect(store.appliedEffects).toHaveLength(1);
      expect(store.appliedEffects[0]).toEqual(mockBorderEffect);
      expect(store.currentHistoryIndex).toBe(1);
    });

    it('should redo effects correctly', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      store.undoEffect();
      
      expect(store.appliedEffects).toHaveLength(1);
      expect(store.canRedo()).toBe(true);
      
      store.redoEffect();
      
      expect(store.appliedEffects).toHaveLength(2);
      expect(store.appliedEffects[1]).toEqual(mockShadowEffect);
      expect(store.currentHistoryIndex).toBe(2);
    });

    it('should handle undo/redo boundaries correctly', () => {
      // Test undo at beginning
      expect(store.canUndo()).toBe(false);
      store.undoEffect(); // Should not change anything
      expect(store.appliedEffects).toHaveLength(0);
      expect(store.currentHistoryIndex).toBe(0);
      
      // Add effects and test redo at end
      store.addEffect(mockBorderEffect);
      expect(store.canRedo()).toBe(false);
      store.redoEffect(); // Should not change anything
      expect(store.appliedEffects).toHaveLength(1);
      expect(store.currentHistoryIndex).toBe(1);
    });

    it('should clear future history when adding new effects after undo', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      store.addEffect(mockGlowEffect);
      
      expect(store.effectsHistory).toHaveLength(4);
      
      // Undo twice
      store.undoEffect();
      store.undoEffect();
      
      expect(store.currentHistoryIndex).toBe(1);
      expect(store.appliedEffects).toHaveLength(1);
      
      // Add new effect - should clear future history
      const newEffect: StickerEffect = {
        type: 'border',
        config: {color: '#ff0000', width: 3},
      };
      
      store.addEffect(newEffect);
      
      expect(store.effectsHistory).toHaveLength(3); // Initial + border + new effect
      expect(store.currentHistoryIndex).toBe(2);
      expect(store.appliedEffects).toHaveLength(2);
      expect(store.appliedEffects[1]).toEqual(newEffect);
    });
  });

  describe('History Limits', () => {
    it('should limit history to 20 states', () => {
      // Add 25 effects to test history limit
      for (let i = 0; i < 25; i++) {
        const effect: StickerEffect = {
          type: 'border',
          config: {color: `#${i.toString(16).padStart(6, '0')}`, width: i + 1},
        };
        store.addEffect(effect);
      }
      
      expect(store.effectsHistory.length).toBeLessThanOrEqual(20);
      expect(store.currentHistoryIndex).toBe(store.effectsHistory.length - 1);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset effects and history correctly', () => {
      store.addEffect(mockBorderEffect);
      store.addEffect(mockShadowEffect);
      store.undoEffect();
      
      expect(store.appliedEffects).toHaveLength(1);
      expect(store.effectsHistory.length).toBeGreaterThan(1);
      
      store.resetStickerCreation();
      
      expect(store.appliedEffects).toHaveLength(0);
      expect(store.effectsHistory).toHaveLength(1);
      expect(store.effectsHistory[0].effects).toHaveLength(0);
      expect(store.currentHistoryIndex).toBe(0);
    });
  });
});