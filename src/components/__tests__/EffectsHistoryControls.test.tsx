import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {EffectsHistoryControls} from '../EffectsHistoryControls';

// Mock the app store
const mockUndoEffect = jest.fn();
const mockRedoEffect = jest.fn();
const mockCanUndo = jest.fn();
const mockCanRedo = jest.fn();

jest.mock('@/stores/appStore', () => ({
  useAppStore: () => ({
    undoEffect: mockUndoEffect,
    redoEffect: mockRedoEffect,
    canUndo: mockCanUndo,
    canRedo: mockCanRedo,
    effectsHistory: [
      {effects: [], timestamp: 1000},
      {effects: [{type: 'border', config: {color: '#000', width: 2}}], timestamp: 2000},
      {effects: [{type: 'border', config: {color: '#000', width: 2}}, {type: 'shadow', config: {blur: 4}}], timestamp: 3000},
    ],
    currentHistoryIndex: 1,
  }),
}));

describe('EffectsHistoryControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    mockCanUndo.mockReturnValue(true);
    mockCanRedo.mockReturnValue(true);
    
    render(<EffectsHistoryControls />);
  });

  it('displays correct history information', () => {
    mockCanUndo.mockReturnValue(true);
    mockCanRedo.mockReturnValue(true);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    expect(getByText('History: 2/3')).toBeTruthy();
  });

  it('renders undo and redo buttons', () => {
    mockCanUndo.mockReturnValue(true);
    mockCanRedo.mockReturnValue(true);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    expect(getByText('↶ Undo')).toBeTruthy();
    expect(getByText('↷ Redo')).toBeTruthy();
  });

  it('calls undoEffect when undo button is pressed', () => {
    mockCanUndo.mockReturnValue(true);
    mockCanRedo.mockReturnValue(false);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    fireEvent.press(getByText('↶ Undo'));
    
    expect(mockUndoEffect).toHaveBeenCalledTimes(1);
  });

  it('calls redoEffect when redo button is pressed', () => {
    mockCanUndo.mockReturnValue(false);
    mockCanRedo.mockReturnValue(true);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    fireEvent.press(getByText('↷ Redo'));
    
    expect(mockRedoEffect).toHaveBeenCalledTimes(1);
  });

  it('disables undo button when cannot undo', () => {
    mockCanUndo.mockReturnValue(false);
    mockCanRedo.mockReturnValue(true);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    const undoButton = getByText('↶ Undo').parent;
    expect(undoButton?.props.accessibilityState?.disabled).toBe(true);
  });

  it('disables redo button when cannot redo', () => {
    mockCanUndo.mockReturnValue(true);
    mockCanRedo.mockReturnValue(false);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    const redoButton = getByText('↷ Redo').parent;
    expect(redoButton?.props.accessibilityState?.disabled).toBe(true);
  });

  it('does not call undoEffect when undo button is disabled', () => {
    mockCanUndo.mockReturnValue(false);
    mockCanRedo.mockReturnValue(true);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    fireEvent.press(getByText('↶ Undo'));
    
    expect(mockUndoEffect).not.toHaveBeenCalled();
  });

  it('does not call redoEffect when redo button is disabled', () => {
    mockCanUndo.mockReturnValue(true);
    mockCanRedo.mockReturnValue(false);
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    fireEvent.press(getByText('↷ Redo'));
    
    expect(mockRedoEffect).not.toHaveBeenCalled();
  });

  it('handles empty history correctly', () => {
    mockCanUndo.mockReturnValue(false);
    mockCanRedo.mockReturnValue(false);
    
    // Mock empty history
    jest.doMock('@/stores/appStore', () => ({
      useAppStore: () => ({
        undoEffect: mockUndoEffect,
        redoEffect: mockRedoEffect,
        canUndo: mockCanUndo,
        canRedo: mockCanRedo,
        effectsHistory: [{effects: [], timestamp: 1000}],
        currentHistoryIndex: 0,
      }),
    }));
    
    const {getByText} = render(<EffectsHistoryControls />);
    
    expect(getByText('History: 1/1')).toBeTruthy();
  });
});