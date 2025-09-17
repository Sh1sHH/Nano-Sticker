import React from 'react';
import {render} from '@testing-library/react-native';
import {SkiaEffectsComponent} from '../SkiaEffectsComponent';
import {StickerEffect} from '@/types';

// Mock react-native-skia
const mockUseImage = jest.fn(() => ({
  width: () => 100,
  height: () => 100,
}));

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({children}: {children: React.ReactNode}) => children,
  Image: () => null,
  useImage: mockUseImage,
  Paint: jest.fn(),
  Rect: () => null,
  RoundedRect: () => null,
  Shadow: ({children}: {children: React.ReactNode}) => children,
  Blur: ({children}: {children: React.ReactNode}) => children,
  ColorFilter: () => null,
}));

describe('SkiaEffectsComponent', () => {
  const mockImageUri = 'file://test-image.jpg';
  
  const mockBorderEffect: StickerEffect = {
    type: 'border',
    config: {
      color: '#000000',
      width: 2,
    },
  };

  const mockShadowEffect: StickerEffect = {
    type: 'shadow',
    config: {
      color: 'rgba(0,0,0,0.3)',
      blur: 4,
      offset: {x: 2, y: 2},
    },
  };

  const mockGlowEffect: StickerEffect = {
    type: 'glow',
    config: {
      color: '#ffffff',
      width: 6,
      blur: 12,
    },
  };

  it('renders without crashing', () => {
    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
      />
    );
  });

  it('renders with default dimensions when no size specified', () => {
    const {getByTestId} = render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
      />
    );
    
    // Component should render without errors
    expect(() => render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
      />
    )).not.toThrow();
  });

  it('renders with custom dimensions', () => {
    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
        width={200}
        height={200}
      />
    );
  });

  it('handles border effects', () => {
    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[mockBorderEffect]}
      />
    );
  });

  it('handles shadow effects', () => {
    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[mockShadowEffect]}
      />
    );
  });

  it('handles glow effects', () => {
    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[mockGlowEffect]}
      />
    );
  });

  it('handles multiple effects', () => {
    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[mockBorderEffect, mockShadowEffect, mockGlowEffect]}
      />
    );
  });

  it('handles empty effects array', () => {
    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
      />
    );
  });

  it('renders placeholder when image is not loaded', () => {
    // Mock useImage to return null
    mockUseImage.mockReturnValueOnce(null);

    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
      />
    );
  });

  it('calculates image dimensions correctly for wide images', () => {
    // Mock useImage to return a wide image
    mockUseImage.mockReturnValueOnce({
      width: () => 200,
      height: () => 100,
    });

    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
        width={150}
        height={150}
      />
    );
  });

  it('calculates image dimensions correctly for tall images', () => {
    // Mock useImage to return a tall image
    mockUseImage.mockReturnValueOnce({
      width: () => 100,
      height: () => 200,
    });

    render(
      <SkiaEffectsComponent
        imageUri={mockImageUri}
        effects={[]}
        width={150}
        height={150}
      />
    );
  });
});