import {create} from 'zustand';
import {User, ArtisticStyle, StickerEffect} from '@/types';

interface EffectsHistoryState {
  effects: StickerEffect[];
  timestamp: number;
}

interface AppState {
  // User state
  user: User | null;
  credits: number;
  
  // Current sticker creation state
  selectedImageUri: string | null;
  segmentedImageUri: string | null;
  selectedStyle: ArtisticStyle | null;
  processedImageUri: string | null;
  appliedEffects: StickerEffect[];
  
  // Effects history for undo/redo
  effectsHistory: EffectsHistoryState[];
  currentHistoryIndex: number;
  
  // UI state
  isLoading: boolean;
  loadingMessage: string;
  
  // Actions
  setUser: (user: User | null) => void;
  setCredits: (credits: number) => void;
  setSelectedImageUri: (uri: string | null) => void;
  setSegmentedImageUri: (uri: string | null) => void;
  setSelectedStyle: (style: ArtisticStyle | null) => void;
  setProcessedImageUri: (uri: string | null) => void;
  addEffect: (effect: StickerEffect) => void;
  removeEffect: (index: number) => void;
  clearEffects: () => void;
  undoEffect: () => void;
  redoEffect: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setLoading: (loading: boolean, message?: string) => void;
  resetStickerCreation: () => void;
}

const saveToHistory = (state: AppState, newEffects: StickerEffect[]) => {
  const newHistoryState: EffectsHistoryState = {
    effects: [...newEffects],
    timestamp: Date.now(),
  };
  
  // Remove any history after current index (when adding new state after undo)
  const newHistory = state.effectsHistory.slice(0, state.currentHistoryIndex + 1);
  newHistory.push(newHistoryState);
  
  // Limit history to 20 states to prevent memory issues
  const limitedHistory = newHistory.slice(-20);
  
  return {
    appliedEffects: newEffects,
    effectsHistory: limitedHistory,
    currentHistoryIndex: limitedHistory.length - 1,
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  credits: 0,
  selectedImageUri: null,
  segmentedImageUri: null,
  selectedStyle: null,
  processedImageUri: null,
  appliedEffects: [],
  effectsHistory: [{effects: [], timestamp: Date.now()}],
  currentHistoryIndex: 0,
  isLoading: false,
  loadingMessage: '',
  
  // Actions
  setUser: (user) => set({user}),
  setCredits: (credits) => set({credits}),
  setSelectedImageUri: (selectedImageUri) => set({selectedImageUri}),
  setSegmentedImageUri: (segmentedImageUri) => set({segmentedImageUri}),
  setSelectedStyle: (selectedStyle) => set({selectedStyle}),
  setProcessedImageUri: (processedImageUri) => set({processedImageUri}),
  
  addEffect: (effect) => 
    set((state) => {
      const newEffects = [...state.appliedEffects, effect];
      return saveToHistory(state, newEffects);
    }),
    
  removeEffect: (index) => 
    set((state) => {
      const newEffects = state.appliedEffects.filter((_, i) => i !== index);
      return saveToHistory(state, newEffects);
    }),
    
  clearEffects: () => 
    set((state) => saveToHistory(state, [])),
  
  undoEffect: () => 
    set((state) => {
      if (state.currentHistoryIndex > 0) {
        const newIndex = state.currentHistoryIndex - 1;
        const previousState = state.effectsHistory[newIndex];
        return {
          appliedEffects: [...previousState.effects],
          currentHistoryIndex: newIndex,
        };
      }
      return state;
    }),
  
  redoEffect: () => 
    set((state) => {
      if (state.currentHistoryIndex < state.effectsHistory.length - 1) {
        const newIndex = state.currentHistoryIndex + 1;
        const nextState = state.effectsHistory[newIndex];
        return {
          appliedEffects: [...nextState.effects],
          currentHistoryIndex: newIndex,
        };
      }
      return state;
    }),
  
  canUndo: () => {
    const state = get();
    return state.currentHistoryIndex > 0;
  },
  
  canRedo: () => {
    const state = get();
    return state.currentHistoryIndex < state.effectsHistory.length - 1;
  },
  
  setLoading: (isLoading, loadingMessage = '') => 
    set({isLoading, loadingMessage}),
    
  resetStickerCreation: () => 
    set({
      selectedImageUri: null,
      segmentedImageUri: null,
      selectedStyle: null,
      processedImageUri: null,
      appliedEffects: [],
      effectsHistory: [{effects: [], timestamp: Date.now()}],
      currentHistoryIndex: 0,
      isLoading: false,
      loadingMessage: '',
    }),
}));