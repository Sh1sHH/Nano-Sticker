import {create} from 'zustand';
import {User, ArtisticStyle, StickerEffect} from '@/types';

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
  setLoading: (loading: boolean, message?: string) => void;
  resetStickerCreation: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  credits: 0,
  selectedImageUri: null,
  segmentedImageUri: null,
  selectedStyle: null,
  processedImageUri: null,
  appliedEffects: [],
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
    set((state) => ({
      appliedEffects: [...state.appliedEffects, effect]
    })),
    
  removeEffect: (index) => 
    set((state) => ({
      appliedEffects: state.appliedEffects.filter((_, i) => i !== index)
    })),
    
  clearEffects: () => set({appliedEffects: []}),
  
  setLoading: (isLoading, loadingMessage = '') => 
    set({isLoading, loadingMessage}),
    
  resetStickerCreation: () => 
    set({
      selectedImageUri: null,
      segmentedImageUri: null,
      selectedStyle: null,
      processedImageUri: null,
      appliedEffects: [],
      isLoading: false,
      loadingMessage: '',
    }),
}));