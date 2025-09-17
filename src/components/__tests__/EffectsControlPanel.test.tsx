import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {EffectsControlPanel} from '../EffectsControlPanel';
import {StickerEffect} from '@/types';

// Mock the Slider component
jest.mock('@react-native-community/slider', () => {
  const {View} = require('react-native');
  return ({onValueChange, value, ...props}: any) => (
    <View testID="slider" {...props} />
  );
});

describe('EffectsControlPanel', () => {
  const mockOnAddEffect = jest.fn();
  const mockOnRemoveEffect = jest.fn();
  
  const mockAppliedEffects: StickerEffect[] = [
    {
      type: 'border',
      config: {color: '#000000', width: 2},
    },
    {
      type: 'shadow',
      config: {color: 'rgba(0,0,0,0.3)', blur: 4, offset: {x: 2, y: 2}},
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );
  });

  it('renders all effect tabs', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    expect(getByText('Border')).toBeTruthy();
    expect(getByText('Shadow')).toBeTruthy();
    expect(getByText('Glow')).toBeTruthy();
  });

  it('switches between tabs correctly', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    // Click on Shadow tab
    fireEvent.press(getByText('Shadow'));
    
    // Should show shadow presets
    expect(getByText('Soft Shadow')).toBeTruthy();
    expect(getByText('Hard Shadow')).toBeTruthy();
    expect(getByText('Colored Shadow')).toBeTruthy();

    // Click on Glow tab
    fireEvent.press(getByText('Glow'));
    
    // Should show glow presets
    expect(getByText('White Glow')).toBeTruthy();
    expect(getByText('Blue Glow')).toBeTruthy();
    expect(getByText('Rainbow Glow')).toBeTruthy();
  });

  it('calls onAddEffect when preset button is pressed', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    // Press a border preset
    fireEvent.press(getByText('Thin Black'));

    expect(mockOnAddEffect).toHaveBeenCalledWith({
      type: 'border',
      config: {color: '#000000', width: 2},
    });
  });

  it('displays applied effects', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={mockAppliedEffects}
      />
    );

    expect(getByText('Applied Effects:')).toBeTruthy();
    expect(getByText('border ×')).toBeTruthy();
    expect(getByText('shadow ×')).toBeTruthy();
  });

  it('calls onRemoveEffect when applied effect chip is pressed', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={mockAppliedEffects}
      />
    );

    // Press the first applied effect chip
    fireEvent.press(getByText('border ×'));

    expect(mockOnRemoveEffect).toHaveBeenCalledWith(0);
  });

  it('shows custom controls for border tab', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    expect(getByText(/Border Width:/)).toBeTruthy();
    expect(getByText('Apply Custom Border')).toBeTruthy();
  });

  it('shows custom controls for shadow tab', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    // Switch to shadow tab
    fireEvent.press(getByText('Shadow'));

    expect(getByText(/Shadow Blur:/)).toBeTruthy();
    expect(getByText('Apply Custom Shadow')).toBeTruthy();
  });

  it('shows custom controls for glow tab', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    // Switch to glow tab
    fireEvent.press(getByText('Glow'));

    expect(getByText(/Glow Intensity:/)).toBeTruthy();
    expect(getByText('Apply Custom Glow')).toBeTruthy();
  });

  it('applies custom border effect', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    fireEvent.press(getByText('Apply Custom Border'));

    expect(mockOnAddEffect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'border',
        config: expect.objectContaining({
          width: expect.any(Number),
        }),
      })
    );
  });

  it('applies custom shadow effect', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    // Switch to shadow tab
    fireEvent.press(getByText('Shadow'));
    fireEvent.press(getByText('Apply Custom Shadow'));

    expect(mockOnAddEffect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'shadow',
        config: expect.objectContaining({
          blur: expect.any(Number),
          color: 'rgba(0,0,0,0.4)',
          offset: {x: 2, y: 2},
        }),
      })
    );
  });

  it('applies custom glow effect', () => {
    const {getByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    // Switch to glow tab
    fireEvent.press(getByText('Glow'));
    fireEvent.press(getByText('Apply Custom Glow'));

    expect(mockOnAddEffect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'glow',
        config: expect.objectContaining({
          blur: expect.any(Number),
          color: '#ffffff',
          width: 8,
        }),
      })
    );
  });

  it('does not show applied effects section when no effects are applied', () => {
    const {queryByText} = render(
      <EffectsControlPanel
        onAddEffect={mockOnAddEffect}
        onRemoveEffect={mockOnRemoveEffect}
        appliedEffects={[]}
      />
    );

    expect(queryByText('Applied Effects:')).toBeFalsy();
  });
});